using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using backend.Data;
using backend.Models;
using Microsoft.EntityFrameworkCore;

namespace backend.Services;

public class RecurringTransactionService : BackgroundService
{
    private readonly IServiceProvider _serviceProvider;
    private readonly ILogger<RecurringTransactionService> _logger;
    private readonly TimeSpan _period = TimeSpan.FromHours(1); // Her saat kontrol et

    public RecurringTransactionService(
        IServiceProvider serviceProvider,
        ILogger<RecurringTransactionService> logger)
    {
        _serviceProvider = serviceProvider;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await ProcessRecurringTransactions();
                await Task.Delay(_period, stoppingToken);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error processing recurring transactions");
                await Task.Delay(TimeSpan.FromMinutes(5), stoppingToken); // Hata durumunda 5 dakika bekle
            }
        }
    }

    private async Task ProcessRecurringTransactions()
    {
        using var scope = _serviceProvider.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();

        // Veritabanından aktif tekrarlayan işlemleri al
        var recurringTransactions = await dbContext.RecurringTransactions
            .Include(rt => rt.Category)
            .Include(rt => rt.Account)
            .Where(rt => rt.IsActive)
            .ToListAsync();
        
        _logger.LogInformation($"Processing {recurringTransactions.Count} recurring transactions");
        
        foreach (var recurring in recurringTransactions)
        {
            var shouldCreate = ShouldCreateTransaction(recurring);
            _logger.LogInformation($"Recurring transaction '{recurring.Description}' - Should create: {shouldCreate}");
            
            if (shouldCreate)
            {
                await CreateTransactionFromRecurring(recurring, dbContext);
            }
        }
    }



    private bool ShouldCreateTransaction(RecurringTransaction recurring)
    {
        if (!recurring.IsActive) return false;

        var now = DateTime.UtcNow;
        
        // Eğer LastProcessed null ise, StartDate'den başla
        if (recurring.LastProcessed == null)
        {
            // StartDate bugün veya geçmişte ise hemen işlem oluştur
            return now.Date >= recurring.StartDate.Date;
        }
        
        var nextDue = GetNextDueDate(recurring.LastProcessed.Value, recurring.Frequency);
        return now >= nextDue;
    }

    private DateTime GetNextDueDate(DateTime lastProcessed, string frequency)
    {
        return frequency switch
        {
            "günlük" => lastProcessed.AddDays(1),
            "haftalık" => lastProcessed.AddDays(7),
            "aylık" => lastProcessed.AddMonths(1),
            "yıllık" => lastProcessed.AddYears(1),
            _ => lastProcessed.AddMonths(1)
        };
    }

    private async Task CreateTransactionFromRecurring(RecurringTransaction recurring, ApplicationDbContext dbContext)
    {
        try
        {
            // IsIncome değerine göre amount'u pozitif veya negatif yap
            var transactionAmount = recurring.IsIncome ? Math.Abs(recurring.Amount) : -Math.Abs(recurring.Amount);
            
            var transaction = new Transaction
            {
                Amount = transactionAmount,
                Description = recurring.Description,
                CategoryId = recurring.CategoryId,
                AccountId = recurring.AccountId,
                TransactionDate = DateTime.UtcNow
            };

            dbContext.Transactions.Add(transaction);
            
            // Son işlem tarihini güncelle
            recurring.LastProcessed = DateTime.UtcNow;
            
            await dbContext.SaveChangesAsync();

            _logger.LogInformation($"Created recurring transaction: {recurring.Description} - {transactionAmount} (IsIncome: {recurring.IsIncome})");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, $"Error creating recurring transaction: {recurring.Description}");
        }
    }
} 