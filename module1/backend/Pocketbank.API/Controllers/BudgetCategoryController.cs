using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using Pocketbank.API.Models;
using Pocketbank.API.Services;
using Npgsql;
using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Cors;
using System.Collections.Generic;
using System.Linq;

namespace Pocketbank.API.Controllers;

[ApiController]
[Route("api/budget-categories")]
[Authorize]
[EnableCors("AllowFrontend")] // Enable CORS for this controller
public class BudgetCategoryController : ControllerBase
{
    private readonly IDatabaseService _databaseService;
    private readonly ILogger<BudgetCategoryController> _logger;

    public BudgetCategoryController(IDatabaseService databaseService, ILogger<BudgetCategoryController> logger)
    {
        _databaseService = databaseService ?? throw new ArgumentNullException(nameof(databaseService));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    }

    [HttpGet("budget/{budgetId}")]
    public async Task<IActionResult> GetBudgetCategories(string budgetId)
    {
        try
        {
            if (string.IsNullOrEmpty(budgetId))
            {
                return BadRequest("Budget ID is required");
            }

            var userId = User.FindFirst("sub")?.Value ?? User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            
            if (string.IsNullOrEmpty(userId))
            {
                _logger.LogWarning("User ID not found in token");
                return Unauthorized("User ID not found in token");
            }

            if (!Guid.TryParse(budgetId, out var budgetGuid))
            {
                _logger.LogWarning("Invalid budget ID format: {BudgetId}", budgetId);
                return BadRequest($"Invalid budget ID format: {budgetId}");
            }

            if (!Guid.TryParse(userId, out var userGuid))
            {
                _logger.LogWarning("Invalid user ID format: {UserId}", userId);
                return BadRequest($"Invalid user ID format: {userId}");
            }

            var budgetCategories = await _databaseService.ExecuteWithRetryAsync(async connection =>
            {
                const string query = @"
                    SELECT bc.id, bc.budget_id, bc.category_id, bc.limit_amount, bc.created_at,
                           c.name as category_name, c.icon as category_icon, c.color as category_color
                    FROM budget_categories bc
                    INNER JOIN categories c ON bc.category_id = c.id
                    INNER JOIN budgets b ON bc.budget_id = b.id
                    WHERE bc.budget_id = @budgetId::uuid AND b.user_id = @userId::uuid
                    ORDER BY bc.created_at DESC";

                using var command = new NpgsqlCommand(query, connection);
                command.Parameters.AddWithValue("@budgetId", budgetGuid);
                command.Parameters.AddWithValue("@userId", userGuid);

                var budgetCategoryList = new List<object>();
                using var reader = await command.ExecuteReaderAsync();
                
                while (await reader.ReadAsync())
                {
                    budgetCategoryList.Add(new
                    {
                        Id = reader["id"].ToString(),
                        BudgetId = reader["budget_id"].ToString(),
                        CategoryId = reader["category_id"].ToString(),
                        LimitAmount = Convert.ToInt64(reader["limit_amount"]),
                        CreatedAt = Convert.ToDateTime(reader["created_at"]),
                        CategoryName = reader["category_name"].ToString(),
                        CategoryIcon = reader["category_icon"].ToString(),
                        CategoryColor = reader["category_color"].ToString()
                    });
                }

                return budgetCategoryList;
            });

            return Ok(budgetCategories);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching budget categories for budget: {BudgetId}", budgetId);
            return StatusCode(500, "Internal server error");
        }
    }

    [HttpPost]
    public async Task<IActionResult> CreateBudgetCategory([FromBody] BudgetCategory budgetCategory)
    {
        try
        {
            if (budgetCategory == null)
            {
                return BadRequest("Request body is required");
            }

            // Validate input
            var validationResults = new List<ValidationResult>();
            var validationContext = new ValidationContext(budgetCategory);
            if (!Validator.TryValidateObject(budgetCategory, validationContext, validationResults, true))
            {
                return BadRequest(validationResults.Select(v => v.ErrorMessage));
            }

            var userId = User.FindFirst("sub")?.Value ?? User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            
            if (string.IsNullOrEmpty(userId))
            {
                _logger.LogWarning("User ID not found in token");
                return Unauthorized("User ID not found in token");
            }

            if (!Guid.TryParse(userId, out var userGuid))
            {
                _logger.LogWarning("Invalid user ID format: {UserId}", userId);
                return BadRequest($"Invalid user ID format: {userId}");
            }

            if (!Guid.TryParse(budgetCategory.BudgetId, out var budgetId))
            {
                _logger.LogWarning("Invalid budget ID format: {BudgetId}", budgetCategory.BudgetId);
                return BadRequest($"Invalid budget ID format: {budgetCategory.BudgetId}");
            }
            
            if (!Guid.TryParse(budgetCategory.CategoryId, out var categoryId))
            {
                _logger.LogWarning("Invalid category ID format: {CategoryId}", budgetCategory.CategoryId);
                return BadRequest($"Invalid category ID format: {budgetCategory.CategoryId}");
            }

            var result = await _databaseService.ExecuteWithRetryAsync(async connection =>
            {
                // Start transaction for data consistency
                using var dbTransaction = await connection.BeginTransactionAsync();

                try
                {
                    // Verify that the budget and category belong to the user
                    const string verifyQuery = @"
                        SELECT COUNT(*) FROM budgets b
                        INNER JOIN categories c ON c.user_id = b.user_id
                        WHERE b.id = @budgetId::uuid AND c.id = @categoryId::uuid AND b.user_id = @userId::uuid";

                    using var verifyCommand = new NpgsqlCommand(verifyQuery, connection, dbTransaction);
                    verifyCommand.Parameters.AddWithValue("@budgetId", budgetId);
                    verifyCommand.Parameters.AddWithValue("@categoryId", categoryId);
                    verifyCommand.Parameters.AddWithValue("@userId", userGuid);

                    var count = Convert.ToInt32(await verifyCommand.ExecuteScalarAsync());
                    if (count == 0)
                    {
                        await dbTransaction.RollbackAsync();
                        _logger.LogWarning("Budget or category not found or not authorized. BudgetId: {BudgetId}, CategoryId: {CategoryId}, UserId: {UserId}", budgetId, categoryId, userId);
                        throw new InvalidOperationException("Budget or category not found or not authorized");
                    }

                    const string query = @"
                        INSERT INTO budget_categories (id, budget_id, category_id, limit, created_at)
                        VALUES (@id, @budgetId, @categoryId, @limit, @createdAt)
                        RETURNING id";

                    using var command = new NpgsqlCommand(query, connection, dbTransaction);
                    command.Parameters.AddWithValue("@id", Guid.NewGuid());
                    command.Parameters.AddWithValue("@budgetId", budgetId);
                    command.Parameters.AddWithValue("@categoryId", categoryId);
                    command.Parameters.AddWithValue("@limit", budgetCategory.Limit);
                    command.Parameters.AddWithValue("@createdAt", DateTime.UtcNow);

                    var newId = await command.ExecuteScalarAsync();
                    budgetCategory.Id = newId?.ToString() ?? "";

                    await dbTransaction.CommitAsync();

                    _logger.LogInformation("Budget category created successfully. BudgetCategoryId: {BudgetCategoryId}, BudgetId: {BudgetId}, CategoryId: {CategoryId}, UserId: {UserId}", 
                        budgetCategory.Id, budgetId, categoryId, userId);

                    return true;
                }
                catch (Exception)
                {
                    await dbTransaction.RollbackAsync();
                    throw;
                }
            });

            return Ok(new { Message = "Budget category created successfully", BudgetCategory = budgetCategory });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating budget category for user");
            return StatusCode(500, "Internal server error");
        }
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteBudgetCategory(string id)
    {
        try
        {
            if (string.IsNullOrEmpty(id))
            {
                return BadRequest("Budget category ID is required");
            }

            var userId = User.FindFirst("sub")?.Value ?? User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            
            if (string.IsNullOrEmpty(userId))
            {
                _logger.LogWarning("User ID not found in token");
                return Unauthorized("User ID not found in token");
            }

            if (!Guid.TryParse(id, out var budgetCategoryId))
            {
                _logger.LogWarning("Invalid budget category ID format: {BudgetCategoryId}", id);
                return BadRequest($"Invalid budget category ID format: {id}");
            }

            if (!Guid.TryParse(userId, out var userGuid))
            {
                _logger.LogWarning("Invalid user ID format: {UserId}", userId);
                return BadRequest($"Invalid user ID format: {userId}");
            }

            var rowsAffected = await _databaseService.ExecuteWithRetryAsync(async connection =>
            {
                const string query = @"
                    DELETE FROM budget_categories 
                    WHERE id = @id AND budget_id IN (
                        SELECT id FROM budgets WHERE user_id = @userId::uuid
                    )";

                using var command = new NpgsqlCommand(query, connection);
                command.Parameters.AddWithValue("@id", budgetCategoryId);
                command.Parameters.AddWithValue("@userId", userGuid);

                return await command.ExecuteNonQueryAsync();
            });
            
            if (rowsAffected > 0)
            {
                _logger.LogInformation("Budget category deleted successfully. BudgetCategoryId: {BudgetCategoryId}, UserId: {UserId}", budgetCategoryId, userId);
                return Ok(new { Message = "Budget category deleted successfully" });
            }
            else
            {
                _logger.LogWarning("Budget category not found or not authorized. BudgetCategoryId: {BudgetCategoryId}, UserId: {UserId}", budgetCategoryId, userId);
                return NotFound("Budget category not found or not authorized");
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting budget category");
            return StatusCode(500, "Internal server error");
        }
    }
}
