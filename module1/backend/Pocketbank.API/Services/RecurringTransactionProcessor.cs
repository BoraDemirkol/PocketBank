using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Pocketbank.API.Models;
using System;
using System.Threading;
using System.Threading.Tasks;
using System.Collections.Generic; // Added for List
using Npgsql; // Added for NpgsqlCommand and NpgsqlConnection

namespace Pocketbank.API.Services;

public class RecurringTransactionProcessor : BackgroundService, IRecurringTransactionProcessor
{
    private readonly IServiceProvider _serviceProvider;
    private readonly ILogger<RecurringTransactionProcessor> _logger;
    private readonly TimeSpan _dailyCheckTime = new TimeSpan(2, 0, 0); // 2:00 AM UTC

    public RecurringTransactionProcessor(
        IServiceProvider serviceProvider,
        ILogger<RecurringTransactionProcessor> logger)
    {
        _serviceProvider = serviceProvider;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("Recurring Transaction Processor started. Will check daily at {DailyCheckTime} UTC", _dailyCheckTime);

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                var now = DateTime.UtcNow;
                var nextRun = now.Date.Add(_dailyCheckTime);
                
                // If it's past 2 AM today, schedule for tomorrow
                if (now.TimeOfDay >= _dailyCheckTime)
                {
                    nextRun = nextRun.AddDays(1);
                }

                var delay = nextRun - now;
                _logger.LogInformation("Next recurring transaction check scheduled for {NextRun} (in {Delay:hh\\:mm\\:ss})", nextRun, delay);

                // Wait until next scheduled time
                await Task.Delay(delay, stoppingToken);

                if (stoppingToken.IsCancellationRequested)
                    break;

                // Process recurring transactions
                await ProcessRecurringTransactionsAsync();
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
            {
                _logger.LogInformation("Recurring Transaction Processor is stopping");
                break;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in Recurring Transaction Processor");
                // Wait 1 hour before retrying on error
                await Task.Delay(TimeSpan.FromHours(1), stoppingToken);
            }
        }
    }

    public async Task ProcessRecurringTransactionsAsync()
    {
        _logger.LogInformation("Starting recurring transaction processing...");

        try
        {
            using var scope = _serviceProvider.CreateScope();
            var databaseService = scope.ServiceProvider.GetRequiredService<IDatabaseService>();

            var processedCount = await databaseService.ExecuteWithRetryAsync(async connection =>
            {
                var today = DateTime.UtcNow.Date;
                var processedCount = 0;

                // Get all active recurring transactions that need processing
                const string query = @"
                    SELECT id, user_id, account_id, category_id, amount, description, 
                           start_date, frequency, is_income, is_active, last_processed
                    FROM recurring_transactions 
                    WHERE is_active = true 
                      AND start_date <= @today
                      AND (last_processed IS NULL OR last_processed < @today)";

                using var command = new NpgsqlCommand(query, connection);
                command.Parameters.AddWithValue("@today", today);

                using var reader = await command.ExecuteReaderAsync();
                var transactionsToProcess = new List<RecurringTransaction>();

                while (await reader.ReadAsync())
                {
                    var recurringTransaction = new RecurringTransaction
                    {
                        Id = SafeGetString(reader, "id"),
                        UserId = SafeGetString(reader, "user_id"),
                        AccountId = SafeGetString(reader, "account_id"),
                        CategoryId = SafeGetString(reader, "category_id"),
                        Amount = SafeGetDecimal(reader, "amount"),
                        Description = SafeGetString(reader, "description"),
                        StartDate = SafeGetDateTime(reader, "start_date"),
                        Frequency = SafeGetString(reader, "frequency"),
                        IsIncome = SafeGetBoolean(reader, "is_income"),
                        IsActive = SafeGetBoolean(reader, "is_active"),
                        LastProcessed = SafeGetNullableDateTime(reader, "last_processed")
                    };

                    transactionsToProcess.Add(recurringTransaction);
                }

                // Process each recurring transaction
                foreach (var recurringTransaction in transactionsToProcess)
                {
                    if (ShouldProcessTransaction(recurringTransaction, today))
                    {
                        await ProcessSingleRecurringTransactionAsync(connection, recurringTransaction);
                        processedCount++;
                    }
                }

                return processedCount;
            });

            _logger.LogInformation("Successfully processed {ProcessedCount} recurring transactions", processedCount);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error processing recurring transactions");
            throw;
        }
    }

    private bool ShouldProcessTransaction(RecurringTransaction transaction, DateTime today)
    {
        if (transaction.LastProcessed.HasValue && transaction.LastProcessed.Value.Date >= today)
            return false;

        var daysSinceStart = (today - transaction.StartDate).Days;

        return transaction.Frequency.ToLower() switch
        {
            "daily" => true,
            "weekly" => daysSinceStart % 7 == 0,
            "monthly" => IsMonthlyInterval(today, transaction.StartDate),
            "yearly" => IsYearlyInterval(today, transaction.StartDate),
            _ => false
        };
    }

    private bool IsMonthlyInterval(DateTime today, DateTime startDate)
    {
        return today.Day == startDate.Day && 
               today.Month != startDate.Month && 
               today.Year >= startDate.Year;
    }

    private bool IsYearlyInterval(DateTime today, DateTime startDate)
    {
        return today.Day == startDate.Day && 
               today.Month == startDate.Month && 
               today.Year > startDate.Year;
    }

    private async Task<bool> CreateTransactionFromRecurringAsync(NpgsqlConnection connection, RecurringTransaction recurring, DateTime today)
    {
        try
        {
            const string insertQuery = @"
                INSERT INTO transactions (id, account_id, category_id, amount, description, 
                                       transaction_date, transaction_type, created_at)
                VALUES (@id, @accountId, @categoryId, @amount, @description, 
                        @transactionDate, @transactionType, @createdAt)";

            using var command = new NpgsqlCommand(insertQuery, connection);
            command.Parameters.AddWithValue("@id", Guid.NewGuid());
            command.Parameters.AddWithValue("@accountId", Guid.Parse(recurring.AccountId));
            command.Parameters.AddWithValue("@categoryId", Guid.Parse(recurring.CategoryId));
            command.Parameters.AddWithValue("@amount", recurring.Amount);
            command.Parameters.AddWithValue("@description", $"Tekrarlayan: {recurring.Description}");
            command.Parameters.AddWithValue("@transactionDate", today);
            command.Parameters.AddWithValue("@transactionType", recurring.IsIncome ? "income" : "expense");
            command.Parameters.AddWithValue("@createdAt", DateTime.UtcNow);

            await command.ExecuteNonQueryAsync();
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating transaction from recurring transaction {RecurringId}", recurring.Id);
            return false;
        }
    }

    private async Task ProcessSingleRecurringTransactionAsync(NpgsqlConnection connection, RecurringTransaction recurringTransaction)
    {
        var today = DateTime.UtcNow.Date;
        
        if (await CreateTransactionFromRecurringAsync(connection, recurringTransaction, today))
        {
            // Update last processed date
            await UpdateLastProcessedAsync(connection, recurringTransaction.Id.ToString(), today);
        }
    }

    private async Task UpdateLastProcessedAsync(NpgsqlConnection connection, string recurringId, DateTime processedDate)
    {
        try
        {
            const string updateQuery = @"
                UPDATE recurring_transactions 
                SET last_processed = @processedDate 
                WHERE id = @id";

            using var command = new NpgsqlCommand(updateQuery, connection);
            command.Parameters.AddWithValue("@processedDate", processedDate);
            command.Parameters.AddWithValue("@id", recurringId);

            await command.ExecuteNonQueryAsync();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating last processed date for recurring transaction {RecurringId}", recurringId);
        }
    }

    // Helper methods for safe type conversion
    private string SafeGetString(NpgsqlDataReader reader, string columnName)
    {
        var value = reader[columnName];
        return value?.ToString() ?? string.Empty;
    }

    private decimal SafeGetDecimal(NpgsqlDataReader reader, string columnName)
    {
        var value = reader[columnName];
        if (value == null || value == DBNull.Value)
            return 0m;
        
        try
        {
            return Convert.ToDecimal(value);
        }
        catch
        {
            return 0m;
        }
    }

    private DateTime SafeGetDateTime(NpgsqlDataReader reader, string columnName)
    {
        var value = reader[columnName];
        if (value == null || value == DBNull.Value)
            return DateTime.MinValue;
        
        try
        {
            return Convert.ToDateTime(value);
        }
        catch
        {
            return DateTime.MinValue;
        }
    }

    private bool SafeGetBoolean(NpgsqlDataReader reader, string columnName)
    {
        var value = reader[columnName];
        if (value == null || value == DBNull.Value)
            return false;
        
        try
        {
            return Convert.ToBoolean(value);
        }
        catch
        {
            return false;
        }
    }

    private DateTime? SafeGetNullableDateTime(NpgsqlDataReader reader, string columnName)
    {
        var value = reader[columnName];
        if (value == null || value == DBNull.Value)
            return null;
        
        try
        {
            return Convert.ToDateTime(value);
        }
        catch
        {
            return null;
        }
    }
}
