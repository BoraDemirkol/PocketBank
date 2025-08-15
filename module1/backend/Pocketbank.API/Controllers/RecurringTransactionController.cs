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
using System.Text;

namespace Pocketbank.API.Controllers;

[ApiController]
[Route("api/recurring-transactions")]
[Authorize]
[EnableCors("AllowFrontend")] // Enable CORS for this controller
public class RecurringTransactionController : ControllerBase
{
    private readonly IDatabaseService _databaseService;
    private readonly ILogger<RecurringTransactionController> _logger;

    public RecurringTransactionController(IDatabaseService databaseService, ILogger<RecurringTransactionController> logger)
    {
        _databaseService = databaseService ?? throw new ArgumentNullException(nameof(databaseService));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    }

    [HttpGet]
    public async Task<IActionResult> GetRecurringTransactions()
    {
        string? userId = null;
        
        try
        {
            userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            
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
                var recurringTransactions = await _databaseService.ExecuteWithRetryAsync(async connection =>
                {
                    const string query = @"
                        SELECT rt.id, rt.user_id, rt.account_id, rt.category_id, rt.amount, rt.description, 
                               rt.start_date, rt.frequency, rt.is_income, rt.is_active, rt.created_at,
                               rt.last_processed
                        FROM recurring_transactions rt
                        WHERE rt.user_id = @userId::uuid
                        ORDER BY rt.created_at DESC";

                    using var command = new NpgsqlCommand(query, connection);
                    command.CommandTimeout = 15;
                    command.Parameters.AddWithValue("@userId", userGuid);

                    var recurringTransactionList = new List<RecurringTransaction>();
                    using var reader = await command.ExecuteReaderAsync();
                    
                    while (await reader.ReadAsync())
                    {
                        recurringTransactionList.Add(new RecurringTransaction
                        {
                            Id = reader["id"].ToString() ?? "",
                            UserId = reader["user_id"].ToString() ?? "",
                            AccountId = reader["account_id"].ToString() ?? "",
                            CategoryId = reader["category_id"].ToString() ?? "",
                            Amount = Convert.ToDecimal(reader["amount"]),
                            Description = reader["description"].ToString() ?? "",
                            StartDate = Convert.ToDateTime(reader["start_date"]).Date,
                            Frequency = reader["frequency"].ToString() ?? "",
                            IsIncome = Convert.ToBoolean(reader["is_income"]),
                            IsActive = Convert.ToBoolean(reader["is_active"]),
                            CreatedAt = Convert.ToDateTime(reader["created_at"]),
                            LastProcessed = reader["last_processed"] == DBNull.Value ? null : Convert.ToDateTime(reader["last_processed"])
                        });
                    }

                    return recurringTransactionList;
                });

                return Ok(recurringTransactions);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Database error in GetRecurringTransactions for user: {UserId}", userId);
                return StatusCode(500, "Database error occurred. Please try again.");
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error in GetRecurringTransactions for user: {UserId}", userId);
            return StatusCode(500, "Internal server error");
        }
    }

    [HttpGet("test")]
    public IActionResult TestEndpoint()
    {
        return Ok(new { 
            message = "RecurringTransactionController is working",
            timestamp = DateTime.UtcNow,
            validFrequencies = new[] { "daily", "weekly", "monthly", "yearly", "günlük", "haftalık", "aylık", "yıllık" }
        });
    }

    [HttpPost]
    public async Task<IActionResult> CreateRecurringTransaction([FromBody] RecurringTransaction recurringTransaction)
    {
        try
        {
            if (recurringTransaction == null)
            {
                _logger.LogWarning("Request body is null");
                return BadRequest("Request body is required");
            }

            // Log the received data for debugging
            _logger.LogInformation("Received recurring transaction data: Amount={Amount}, CategoryId={CategoryId}, AccountId={AccountId}, StartDate={StartDate}, Frequency={Frequency}, IsIncome={IsIncome}, Description={Description}", 
                recurringTransaction.Amount, recurringTransaction.CategoryId, recurringTransaction.AccountId, recurringTransaction.StartDate, recurringTransaction.Frequency, recurringTransaction.IsIncome, recurringTransaction.Description);

            // Validate input
            var validationResults = new List<ValidationResult>();
            var validationContext = new ValidationContext(recurringTransaction);
            if (!Validator.TryValidateObject(recurringTransaction, validationContext, validationResults, true))
            {
                _logger.LogWarning("Validation failed: {ValidationErrors}", string.Join(", ", validationResults.Select(v => v.ErrorMessage)));
                return BadRequest(validationResults.Select(v => v.ErrorMessage));
            }

            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            
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
            
            if (!Guid.TryParse(recurringTransaction.AccountId, out var accountId))
            {
                _logger.LogWarning("Invalid account ID format: {AccountId}", recurringTransaction.AccountId);
                return BadRequest($"Invalid account ID format: {recurringTransaction.AccountId}");
            }
            
            if (string.IsNullOrEmpty(recurringTransaction.CategoryId))
            {
                return BadRequest("Category ID is required");
            }
            
            if (!Guid.TryParse(recurringTransaction.CategoryId, out var categoryId))
            {
                _logger.LogWarning("Invalid category ID format: {CategoryId}", recurringTransaction.CategoryId);
                return BadRequest($"Invalid category ID format: {recurringTransaction.CategoryId}");
            }

            // Validate frequency
            var validFrequencies = new[] { "daily", "weekly", "monthly", "yearly", "günlük", "haftalık", "aylık", "yıllık" };
            if (string.IsNullOrEmpty(recurringTransaction.Frequency) || !validFrequencies.Contains(recurringTransaction.Frequency.ToLower()))
            {
                _logger.LogWarning("Invalid frequency received: {Frequency}", recurringTransaction.Frequency);
                return BadRequest("Invalid frequency. Must be one of: daily, weekly, monthly, yearly, günlük, haftalık, aylık, yıllık");
            }

            // Convert Turkish frequency to English for database storage
            var frequency = recurringTransaction.Frequency.ToLower() switch
            {
                "günlük" => "daily",
                "haftalık" => "weekly", 
                "aylık" => "monthly",
                "yıllık" => "yearly",
                _ => recurringTransaction.Frequency.ToLower()
            };

            _logger.LogInformation("Creating recurring transaction. Amount: {Amount}, Frequency: {OriginalFrequency} -> {ConvertedFrequency}, IsIncome: {IsIncome}", 
                recurringTransaction.Amount, recurringTransaction.Frequency, frequency, recurringTransaction.IsIncome);

            var result = await _databaseService.ExecuteWithRetryAsync(async connection =>
            {
                // Start transaction for data consistency
                using var dbTransaction = await connection.BeginTransactionAsync();

                try
                {
                    // Verify account ownership
                    const string accountCheckQuery = @"
                        SELECT COUNT(*) FROM accounts 
                        WHERE id = @accountId::uuid AND user_id = @userId::uuid";

                    using var accountCheckCommand = new NpgsqlCommand(accountCheckQuery, connection, dbTransaction);
                    accountCheckCommand.Parameters.AddWithValue("@accountId", accountId);
                    accountCheckCommand.Parameters.AddWithValue("@userId", userGuid);

                    var accountCount = Convert.ToInt32(await accountCheckCommand.ExecuteScalarAsync());
                    if (accountCount == 0)
                    {
                        await dbTransaction.RollbackAsync();
                        _logger.LogWarning("Account not found or not authorized. AccountId: {AccountId}, UserId: {UserId}", accountId, userId);
                        throw new InvalidOperationException("Account not found or not authorized");
                    }

                    // Verify category ownership
                    const string categoryCheckQuery = @"
                        SELECT COUNT(*) FROM categories 
                        WHERE id = @categoryId::uuid AND user_id = @userId::uuid";

                    using var categoryCheckCommand = new NpgsqlCommand(categoryCheckQuery, connection, dbTransaction);
                    categoryCheckCommand.Parameters.AddWithValue("@categoryId", categoryId);
                    categoryCheckCommand.Parameters.AddWithValue("@userId", userGuid);

                    var categoryCount = Convert.ToInt32(await categoryCheckCommand.ExecuteScalarAsync());
                    if (categoryCount == 0)
                    {
                        await dbTransaction.RollbackAsync();
                        _logger.LogWarning("Category not found or not authorized. CategoryId: {CategoryId}, UserId: {UserId}", categoryId, userId);
                        throw new InvalidOperationException("Category not found or not authorized");
                    }

                    const string query = @"
                        INSERT INTO recurring_transactions (id, user_id, account_id, category_id, amount, description, 
                                                           start_date, frequency, is_income, is_active, created_at)
                        VALUES (@id, @userId, @accountId, @categoryId, @amount, @description, 
                                @startDate, @frequency, @isIncome, @isActive, @createdAt)
                        RETURNING id";

                    using var command = new NpgsqlCommand(query, connection, dbTransaction);
                    command.Parameters.AddWithValue("@id", Guid.NewGuid());
                    command.Parameters.AddWithValue("@userId", userGuid);
                    command.Parameters.AddWithValue("@accountId", accountId);
                    command.Parameters.AddWithValue("@categoryId", categoryId);
                    command.Parameters.AddWithValue("@amount", recurringTransaction.Amount);
                    command.Parameters.AddWithValue("@description", recurringTransaction.Description ?? "No description");
                    command.Parameters.AddWithValue("@startDate", recurringTransaction.StartDate.ToUniversalTime());
                    command.Parameters.AddWithValue("@frequency", frequency);
                    command.Parameters.AddWithValue("@isIncome", recurringTransaction.IsIncome);
                    command.Parameters.AddWithValue("@isActive", recurringTransaction.IsActive);
                    command.Parameters.AddWithValue("@createdAt", DateTime.UtcNow);

                    var newId = await command.ExecuteScalarAsync();
                    recurringTransaction.Id = newId?.ToString() ?? "";

                    await dbTransaction.CommitAsync();

                    _logger.LogInformation("Recurring transaction created successfully. TransactionId: {TransactionId}, UserId: {UserId}", recurringTransaction.Id, userId);

                    return true;
                }
                catch (Exception)
                {
                    await dbTransaction.RollbackAsync();
                    throw;
                }
            });

            return Ok(new { Message = "Recurring transaction created successfully", RecurringTransaction = recurringTransaction });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating recurring transaction for user");
            return StatusCode(500, "Internal server error");
        }
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteRecurringTransaction(string id)
    {
        try
        {
            if (string.IsNullOrEmpty(id))
            {
                return BadRequest("Recurring transaction ID is required");
            }

            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            
            if (string.IsNullOrEmpty(userId))
            {
                _logger.LogWarning("User ID not found in token");
                return Unauthorized("User ID not found in token");
            }

            if (!Guid.TryParse(id, out var recurringTransactionId))
            {
                _logger.LogWarning("Invalid recurring transaction ID format: {TransactionId}", id);
                return BadRequest($"Invalid recurring transaction ID format: {id}");
            }
            
            if (!Guid.TryParse(userId, out var userGuid))
            {
                _logger.LogWarning("Invalid user ID format: {UserId}", userId);
                return BadRequest($"Invalid user ID format: {userId}");
            }

            var rowsAffected = await _databaseService.ExecuteWithRetryAsync(async connection =>
            {
                const string query = @"
                    DELETE FROM recurring_transactions 
                    WHERE id = @id AND user_id = @userId::uuid";

                using var command = new NpgsqlCommand(query, connection);
                command.Parameters.AddWithValue("@id", recurringTransactionId);
                command.Parameters.AddWithValue("@userId", userGuid);

                return await command.ExecuteNonQueryAsync();
            });
            
            if (rowsAffected > 0)
            {
                _logger.LogInformation("Recurring transaction deleted successfully. TransactionId: {TransactionId}, UserId: {UserId}", recurringTransactionId, userId);
                return Ok(new { Message = "Recurring transaction deleted successfully" });
            }
            else
            {
                _logger.LogWarning("Recurring transaction not found or not authorized. TransactionId: {TransactionId}, UserId: {UserId}", recurringTransactionId, userId);
                return NotFound("Recurring transaction not found or not authorized");
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting recurring transaction");
            return StatusCode(500, "Internal server error");
        }
    }
}
