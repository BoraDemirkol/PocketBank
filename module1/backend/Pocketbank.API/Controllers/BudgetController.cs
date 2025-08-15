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
[Route("api/budgets")]
[Authorize]
[EnableCors("AllowFrontend")] // Enable CORS for this controller
public class BudgetController : ControllerBase
{
    private readonly IDatabaseService _databaseService;
    private readonly ILogger<BudgetController> _logger;

    public BudgetController(IDatabaseService databaseService, ILogger<BudgetController> logger)
    {
        _databaseService = databaseService ?? throw new ArgumentNullException(nameof(databaseService));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    }

    [HttpGet]
    public async Task<IActionResult> GetBudgets()
    {
        string? userId = null;
        
        try
        {
            userId = User.FindFirst("sub")?.Value ?? User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            
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

            try
            {
                var budgets = await _databaseService.ExecuteWithRetryAsync(async connection =>
                {
                    const string query = @"
                        SELECT id, user_id, name, amount, period, start_date, created_at
                        FROM budgets
                        WHERE user_id = @userId::uuid
                        ORDER BY created_at DESC";

                    using var command = new NpgsqlCommand(query, connection);
                    command.CommandTimeout = 30;
                    command.Parameters.AddWithValue("@userId", userGuid);

                    var budgetList = new List<Budget>();
                    using var reader = await command.ExecuteReaderAsync();
                    
                    while (await reader.ReadAsync())
                    {
                        budgetList.Add(new Budget
                        {
                            Id = reader["id"].ToString() ?? "",
                            UserId = reader["user_id"].ToString() ?? "",
                            Name = reader["name"].ToString() ?? "",
                            Amount = Convert.ToDecimal(reader["amount"]),
                            Period = reader["period"].ToString() ?? "",
                            StartDate = Convert.ToDateTime(reader["start_date"]).Date,
                            CreatedAt = Convert.ToDateTime(reader["created_at"])
                        });
                    }

                    return budgetList;
                });

                return Ok(budgets);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Database error in GetBudgets for user: {UserId}", userId);
                return StatusCode(500, "Database error occurred. Please try again.");
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error in GetBudgets for user: {UserId}", userId);
            return StatusCode(500, "Internal server error");
        }
    }

    [HttpPost]
    public async Task<IActionResult> CreateBudget([FromBody] Budget budget)
    {
        try
        {
            if (budget == null)
            {
                return BadRequest("Request body is required");
            }

            // Validate input
            var validationResults = new List<ValidationResult>();
            var validationContext = new ValidationContext(budget);
            if (!Validator.TryValidateObject(budget, validationContext, validationResults, true))
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

            // Validate period
            var validPeriods = new[] { "daily", "weekly", "monthly", "yearly" };
            if (string.IsNullOrEmpty(budget.Period) || !validPeriods.Contains(budget.Period.ToLower()))
            {
                return BadRequest("Invalid period. Must be one of: daily, weekly, monthly, yearly");
            }

            var result = await _databaseService.ExecuteWithRetryAsync(async connection =>
            {
                const string query = @"
                    INSERT INTO budgets (id, user_id, name, amount, period, start_date, created_at)
                    VALUES (@id, @userId, @name, @amount, @period, @startDate, @createdAt)
                    RETURNING id";

                using var command = new NpgsqlCommand(query, connection);
                command.Parameters.AddWithValue("@id", Guid.NewGuid());
                command.Parameters.AddWithValue("@userId", userGuid);
                command.Parameters.AddWithValue("@name", budget.Name);
                command.Parameters.AddWithValue("@amount", budget.Amount);
                command.Parameters.AddWithValue("@period", budget.Period);
                command.Parameters.AddWithValue("@startDate", budget.StartDate.Date);
                command.Parameters.AddWithValue("@createdAt", DateTime.UtcNow);

                var newId = await command.ExecuteScalarAsync();
                budget.Id = newId?.ToString() ?? "";
                budget.UserId = userId;

                _logger.LogInformation("Budget created successfully for user: {UserId}, BudgetId: {BudgetId}", userId, budget.Id);
                return true;
            });

            return Ok(new { Message = "Budget created successfully", Budget = budget });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating budget for user");
            return StatusCode(500, "Internal server error");
        }
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteBudget(string id)
    {
        try
        {
            if (string.IsNullOrEmpty(id))
            {
                return BadRequest("Budget ID is required");
            }

            var userId = User.FindFirst("sub")?.Value ?? User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            
            if (string.IsNullOrEmpty(userId))
            {
                _logger.LogWarning("User ID not found in token");
                return Unauthorized("User ID not found in token");
            }

            if (!Guid.TryParse(id, out var budgetId))
            {
                _logger.LogWarning("Invalid budget ID format: {BudgetId}", id);
                return BadRequest($"Invalid budget ID format: {id}");
            }
            
            if (!Guid.TryParse(userId, out var userGuid))
            {
                _logger.LogWarning("Invalid user ID format: {UserId}", userId);
                return BadRequest($"Invalid user ID format: {userId}");
            }

            var rowsAffected = await _databaseService.ExecuteWithRetryAsync(async connection =>
            {
                const string query = @"
                    DELETE FROM budgets 
                    WHERE id = @id AND user_id = @userId::uuid";

                using var command = new NpgsqlCommand(query, connection);
                command.Parameters.AddWithValue("@id", budgetId);
                command.Parameters.AddWithValue("@userId", userGuid);

                return await command.ExecuteNonQueryAsync();
            });
            
            if (rowsAffected > 0)
            {
                _logger.LogInformation("Budget deleted successfully. BudgetId: {BudgetId}, UserId: {UserId}", budgetId, userId);
                return Ok(new { Message = "Budget deleted successfully" });
            }
            else
            {
                _logger.LogWarning("Budget not found or not authorized. BudgetId: {BudgetId}, UserId: {UserId}", budgetId, userId);
                return NotFound("Budget not found or not authorized");
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting budget");
            return StatusCode(500, "Internal server error");
        }
    }
}
