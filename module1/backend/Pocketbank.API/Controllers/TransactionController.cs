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
using System.IO;

namespace Pocketbank.API.Controllers;

[ApiController]
[Route("api/transactions")]
[Authorize] // Enable authorization
[EnableCors("AllowFrontend")] // Enable CORS for this controller
public class TransactionController : ControllerBase
{
    private readonly IDatabaseService _databaseService;
    private readonly ILogger<TransactionController> _logger;

    public TransactionController(IDatabaseService databaseService, ILogger<TransactionController> logger)
    {
        _databaseService = databaseService ?? throw new ArgumentNullException(nameof(databaseService));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    }

    [HttpGet]
    public async Task<IActionResult> GetTransactions()
    {
        string? userId = null;
        
        try
        {
            // Supabase uses ClaimTypes.NameIdentifier for user ID
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
                var transactions = await _databaseService.ExecuteWithRetryAsync(async connection =>
                {
                    const string query = @"
                        SELECT t.id, t.account_id, t.category_id, t.amount, t.transaction_date, t.description, t.created_at, t.receipt_url, t.transaction_type
                        FROM transactions t
                        INNER JOIN accounts a ON t.account_id = a.id
                        WHERE a.user_id = @userId::uuid
                        ORDER BY t.transaction_date DESC";

                    using var command = new NpgsqlCommand(query, connection);
                    command.CommandTimeout = 30;
                    command.Parameters.AddWithValue("@userId", userGuid);

                    var transactionList = new List<Transaction>();
                    using var reader = await command.ExecuteReaderAsync();
                    
                    while (await reader.ReadAsync())
                    {
                        transactionList.Add(new Transaction
                        {
                            Id = reader["id"].ToString() ?? "",
                            AccountId = reader["account_id"].ToString() ?? "",
                            CategoryId = reader["category_id"].ToString() ?? "",
                            Amount = Convert.ToDecimal(reader["amount"]),
                            TransactionDate = Convert.ToDateTime(reader["transaction_date"]).Date,
                            Description = reader["description"].ToString() ?? "",
                            CreatedAt = Convert.ToDateTime(reader["created_at"]),
                            ReceiptUrl = reader["receipt_url"] == DBNull.Value ? null : reader["receipt_url"].ToString(),
                            TransactionType = reader["transaction_type"].ToString() ?? ""
                        });
                    }
                    
                    return transactionList;
                });

                return Ok(transactions);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Database error in GetTransactions for user: {UserId}", userId);
                return StatusCode(500, "Database error occurred. Please try again.");
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error in GetTransactions for user: {UserId}", userId);
            return StatusCode(500, "Internal server error");
        }
    }

    [HttpPost]
    public async Task<IActionResult> CreateTransaction([FromBody] Transaction transaction)
    {
        string? userId = null;
        
        try
        {
            if (transaction == null)
            {
                return BadRequest("Request body is required");
            }

            // Validate input
            var validationResults = new List<ValidationResult>();
            var validationContext = new ValidationContext(transaction);
            if (!Validator.TryValidateObject(transaction, validationContext, validationResults, true))
            {
                _logger.LogWarning("Validation failed for transaction: {@ValidationResults}", validationResults);
                _logger.LogWarning("Transaction data: {@Transaction}", transaction);
                return BadRequest(validationResults.Select(v => v.ErrorMessage));
            }

            // Supabase uses ClaimTypes.NameIdentifier for user ID
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

            // Validate GUIDs before database operation
            if (!Guid.TryParse(transaction.AccountId, out var accountId))
            {
                _logger.LogWarning("Invalid account ID format: {AccountId}", transaction.AccountId);
                return BadRequest($"Invalid account ID format: {transaction.AccountId}");
            }
            
            if (!Guid.TryParse(transaction.CategoryId, out var categoryId))
            {
                _logger.LogWarning("Invalid category ID format: {CategoryId}", transaction.CategoryId);
                return BadRequest($"Invalid category ID format: {transaction.CategoryId}");
            }

            // Validate transaction type
            var validTypes = new[] { "income", "expense" };
            if (!string.IsNullOrEmpty(transaction.TransactionType) && !validTypes.Contains(transaction.TransactionType.ToLower()))
            {
                return BadRequest("Invalid transaction type. Must be 'income' or 'expense'");
            }

            try
            {
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
                            INSERT INTO transactions (id, account_id, category_id, amount, transaction_date, description, created_at, transaction_type)
                            VALUES (@id, @accountId, @categoryId, @amount, @transactionDate, @description, @createdAt, @transactionType)
                            RETURNING id";

                        using var command = new NpgsqlCommand(query, connection, dbTransaction);
                        command.Parameters.AddWithValue("@id", Guid.NewGuid());
                        command.Parameters.AddWithValue("@accountId", accountId);
                        command.Parameters.AddWithValue("@categoryId", categoryId);
                        command.Parameters.AddWithValue("@amount", transaction.Amount);
                        command.Parameters.AddWithValue("@transactionDate", transaction.TransactionDate.Date);
                        command.Parameters.AddWithValue("@description", transaction.Description ?? "");
                        command.Parameters.AddWithValue("@createdAt", DateTime.UtcNow);
                        command.Parameters.AddWithValue("@transactionType", string.IsNullOrEmpty(transaction.TransactionType) ? "expense" : transaction.TransactionType);

                        var newId = await command.ExecuteScalarAsync();
                        transaction.Id = newId?.ToString() ?? "";

                        await dbTransaction.CommitAsync();
                        return true;
                    }
                    catch (Exception)
                    {
                        await dbTransaction.RollbackAsync();
                        throw;
                    }
                });

                _logger.LogInformation("Transaction created successfully. TransactionId: {TransactionId}, UserId: {UserId}", transaction.Id, userId);
                return Ok(new { Message = "Transaction created successfully", Transaction = transaction });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(ex.Message);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating transaction for user: {UserId}", userId);
            _logger.LogError("Transaction data: {@Transaction}", transaction);
            return StatusCode(500, "Internal server error");
        }
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteTransaction(string id)
    {
        try
        {
            if (string.IsNullOrEmpty(id))
            {
                return BadRequest("Transaction ID is required");
            }

            // Supabase uses ClaimTypes.NameIdentifier for user ID
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            
            if (string.IsNullOrEmpty(userId))
            {
                _logger.LogWarning("User ID not found in token");
                return Unauthorized("User ID not found in token");
            }

            if (!Guid.TryParse(id, out var transactionId))
            {
                _logger.LogWarning("Invalid transaction ID format: {TransactionId}", id);
                return BadRequest($"Invalid transaction ID format: {id}");
            }
            
            if (!Guid.TryParse(userId, out var userGuid))
            {
                _logger.LogWarning("Invalid user ID format: {UserId}", userId);
                return BadRequest($"Invalid user ID format: {userId}");
            }

            var rowsAffected = await _databaseService.ExecuteWithRetryAsync(async connection =>
            {
                const string query = @"
                    DELETE FROM transactions 
                    WHERE id = @id AND account_id IN (
                        SELECT id FROM accounts WHERE user_id = @userId::uuid
                    )";

                using var command = new NpgsqlCommand(query, connection);
                command.Parameters.AddWithValue("@id", transactionId);
                command.Parameters.AddWithValue("@userId", userGuid);

                return await command.ExecuteNonQueryAsync();
            });
            
            if (rowsAffected > 0)
            {
                _logger.LogInformation("Transaction deleted successfully. TransactionId: {TransactionId}, UserId: {UserId}", transactionId, userId);
                return Ok(new { Message = "Transaction deleted successfully" });
            }
            else
            {
                _logger.LogWarning("Transaction not found or not authorized. TransactionId: {TransactionId}, UserId: {UserId}", transactionId, userId);
                return NotFound("Transaction not found or not authorized");
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting transaction");
            return StatusCode(500, "Internal server error");
        }
    }

    [HttpPost("parse-bank-statement")]
    public async Task<IActionResult> ParseBankStatement()
    {
        try
        {
            var form = await Request.ReadFormAsync();
            var file = form.Files.FirstOrDefault();
            var bankType = form["bankType"].ToString() ?? "generic";
            
            if (file == null || file.Length == 0)
                return BadRequest("No file uploaded");
            
            if (file.Length > 10 * 1024 * 1024) // 10MB limit
                return BadRequest("File too large");
            
            var allowedExtensions = new[] { ".csv", ".txt", ".xlsx", ".xls", ".pdf" };
            var fileExtension = Path.GetExtension(file.FileName).ToLowerInvariant();
            
            if (!allowedExtensions.Contains(fileExtension))
                return BadRequest("Invalid file type. Only CSV, TXT, Excel and PDF files are supported.");
            
            var parser = new BankStatementParser();
            var transactions = parser.ParseBankStatementFromFile(file, bankType);
            
            _logger.LogInformation("Bank statement parsed successfully. File: {FileName}, BankType: {BankType}, Transactions: {Count}", 
                file.FileName, bankType, transactions.Count);
            
            return Ok(new { 
                success = true, 
                transactions = transactions,
                count = transactions.Count,
                bankType = bankType
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error parsing bank statement");
            return BadRequest($"Error parsing bank statement: {ex.Message}");
        }
    }
}
