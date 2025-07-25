using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.DependencyInjection;
using PocketBank.Backend.Data;
using PocketBank.Backend.Models;
using Microsoft.EntityFrameworkCore;
using System;
using System.Threading;
using System.Threading.Tasks;

public class RecurringTransactionJob : BackgroundService
{
    private readonly IServiceProvider _serviceProvider;
    public RecurringTransactionJob(IServiceProvider serviceProvider)
    {
        _serviceProvider = serviceProvider;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            using (var scope = _serviceProvider.CreateScope())
            {
                var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
                var now = DateTime.Now;
                var recurrings = await db.RecurringTransactions.Include(r => r.Category).ToListAsync();
                foreach (var rec in recurrings)
                {
                    if (rec.NextRunDate <= now)
                    {
                        db.Transactions.Add(new Transaction
                        {
                            Amount = rec.Amount,
                            Description = rec.Description,
                            Date = rec.NextRunDate,
                            IsIncome = rec.IsIncome,
                            CategoryId = rec.CategoryId
                        });
                        // Sıklığa göre NextRunDate güncelle
                        rec.NextRunDate = GetNextRunDate(rec.NextRunDate, rec.Frequency);
                    }
                }
                await db.SaveChangesAsync();
            }
            await Task.Delay(TimeSpan.FromHours(1), stoppingToken);
        }
    }

    private DateTime GetNextRunDate(DateTime current, string frequency)
    {
        return frequency switch
        {
            "günlük" => current.AddDays(1),
            "haftalık" => current.AddDays(7),
            "aylık" => current.AddMonths(1),
            "yıllık" => current.AddYears(1),
            _ => current.AddMonths(1)
        };
    }
} 