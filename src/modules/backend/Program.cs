using System.Linq;
using Microsoft.EntityFrameworkCore;
using backend.Data;
using backend.Models;
using System.Text.Json;
using System.Text.Json.Serialization;
using Microsoft.Extensions.FileProviders;
using OfficeOpenXml;
using System.Text;
using backend.Services;

// Set EPPlus license for noncommercial use
ExcelPackage.License.SetNonCommercialPersonal("PocketBank Development");

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
// Learn more about configuring OpenAPI at https://aka.ms/aspnet/openapi
builder.Services.AddOpenApi();

// Add Entity Framework with PostgreSQL
builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

// Configure JSON serialization to handle circular references
builder.Services.ConfigureHttpJsonOptions(options =>
{
    options.SerializerOptions.ReferenceHandler = ReferenceHandler.IgnoreCycles;
    options.SerializerOptions.WriteIndented = true;
});

// Add CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyMethod()
              .AllowAnyHeader();
    });
});

// Add Antiforgery services
builder.Services.AddAntiforgery();

// Add Background Services
builder.Services.AddHostedService<backend.Services.RecurringTransactionService>();



var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseHttpsRedirection();
app.UseCors("AllowAll");
app.UseAntiforgery();

// Seed data for testing
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
    
    // Get test user (assume it exists)
    var testUser = await db.Users.OrderBy(u => u.CreatedAt).FirstOrDefaultAsync();
    if (testUser == null)
    {
        // If no user exists, create a simple one
        testUser = new User
        {
            Email = "test@example.com"
        };
        db.Users.Add(testUser);
        await db.SaveChangesAsync();
    }
    
    // Add default categories if not exists
    if (!db.Categories.Any())
    {
        var categories = new List<Category>
        {
            new Category { Name = "Kira", Icon = "🏠", Color = "#9c27b0", UserId = testUser.Id },
            new Category { Name = "Fatura", Icon = "💡", Color = "#ff9800", UserId = testUser.Id },
            new Category { Name = "Eğlence", Icon = "🎬", Color = "#e91e63", UserId = testUser.Id },
            new Category { Name = "Ulaşım", Icon = "🚕", Color = "#2196f3", UserId = testUser.Id },
            new Category { Name = "Market", Icon = "🛒", Color = "#4caf50", UserId = testUser.Id },
            new Category { Name = "Diğer", Icon = "📦", Color = "#607d8b", UserId = testUser.Id }
        };
        db.Categories.AddRange(categories);
        await db.SaveChangesAsync();
    }
    
    // Add test accounts if not exists
    if (!db.Accounts.Any())
    {
        var accounts = new List<Account>
        {
            new Account
            {
                AccountName = "Ana Hesap",
                AccountType = "Vadesiz",
                Balance = 10000,
                Currency = "TRY",
                UserId = testUser.Id
            },
            new Account
            {
                AccountName = "Tasarruf Hesabı",
                AccountType = "Vadeli",
                Balance = 5000,
                Currency = "TRY",
                UserId = testUser.Id
            },
            new Account
            {
                AccountName = "Kredi Kartı",
                AccountType = "Kredi Kartı",
                Balance = -1500,
                Currency = "TRY",
                UserId = testUser.Id
            }
        };
        db.Accounts.AddRange(accounts);
        await db.SaveChangesAsync();
    }
    
    // Add test transactions if not exists
    if (!db.Transactions.Any())
    {
        var categories = await db.Categories.ToListAsync();
        var accounts = await db.Accounts.ToListAsync();
        
        if (categories.Any() && accounts.Any())
        {
            var transactions = new List<Transaction>
            {
                new Transaction
                {
                    Description = "Market alışverişi",
                    Amount = -150.50m,
                    TransactionDate = DateTime.UtcNow.AddDays(-1),
                    CategoryId = categories[0].Id,
                    AccountId = accounts[0].Id
                },
                new Transaction
                {
                    Description = "Benzin",
                    Amount = -200.00m,
                    TransactionDate = DateTime.UtcNow.AddDays(-2),
                    CategoryId = categories[1].Id,
                    AccountId = accounts[0].Id
                },
                new Transaction
                {
                    Description = "Maaş",
                    Amount = 5000.00m,
                    TransactionDate = DateTime.UtcNow.AddDays(-7),
                    CategoryId = categories[3].Id,
                    AccountId = accounts[0].Id
                }
            };
            db.Transactions.AddRange(transactions);
            await db.SaveChangesAsync();
        }
    }
    
    // Add test recurring transactions if not exists
    if (!db.RecurringTransactions.Any())
    {
        var firstAccount = await db.Accounts.FirstOrDefaultAsync();
        var firstCategory = await db.Categories.FirstOrDefaultAsync();
        
        if (firstAccount != null && firstCategory != null)
        {
            var recurringTransactions = new List<RecurringTransaction>
            {
                new RecurringTransaction
                {
                    Description = "Kira Ödemesi",
                    Amount = 5000,
                    CategoryId = firstCategory.Id,
                    AccountId = firstAccount.Id,
                    UserId = testUser.Id,
                    StartDate = DateTime.UtcNow.AddDays(-30),
                    Frequency = "aylık",
                    IsIncome = false,
                    IsActive = true,
                    LastProcessed = DateTime.UtcNow.AddDays(-30)
                }
            };
            db.RecurringTransactions.AddRange(recurringTransactions);
            await db.SaveChangesAsync();
        }
    }
}

var summaries = new[]
{
    "Freezing", "Bracing", "Chilly", "Cool", "Mild", "Warm", "Balmy", "Hot", "Sweltering", "Scorching"
};

app.MapGet("/weatherforecast", () =>
{
            var forecast =  Enumerable.Range(1, 5).Select(index =>
            new WeatherForecast
            (
                DateOnly.FromDateTime(DateTime.UtcNow.AddDays(index)),
                Random.Shared.Next(-20, 55),
                summaries[Random.Shared.Next(summaries.Length)]
            ))
            .ToArray();
    return forecast;
})
.WithName("GetWeatherForecast");



// API endpoints for PocketBank
app.MapGet("/api/transaction", async (ApplicationDbContext db) =>
{
    var transactions = await db.Transactions
        .Include(t => t.Category)
        .Include(t => t.Account)
        .OrderByDescending(t => t.TransactionDate)
        .ToListAsync();
    return Results.Ok(transactions);
})
.WithName("GetTransactions");

app.MapGet("/api/recurring-transaction", async (ApplicationDbContext db) =>
{
    var recurringTransactions = await db.RecurringTransactions
        .Include(r => r.Category)
        .Include(r => r.Account)
        .Where(r => r.IsActive)
        .OrderBy(r => r.StartDate)
        .ToListAsync();
    return Results.Ok(recurringTransactions);
})
.WithName("GetRecurringTransactions");

app.MapPost("/api/recurring-transaction", async (RecurringTransactionRequest request, ApplicationDbContext db) =>
{
    if (!Guid.TryParse(request.CategoryId, out var categoryId))
    {
        return Results.BadRequest("Invalid category ID");
    }

    if (!Guid.TryParse(request.AccountId, out var accountId))
    {
        return Results.BadRequest("Invalid account ID");
    }

    var testUser = await db.Users.FirstOrDefaultAsync();
    if (testUser == null)
    {
        return Results.BadRequest("No user found");
    }

            var startDate = DateTime.Parse(request.StartDate ?? DateTime.UtcNow.ToString("yyyy-MM-dd")).ToUniversalTime();
        
        var recurringTransaction = new RecurringTransaction
        {
            Description = request.Description ?? "Yeni Tekrarlayan İşlem",
            Amount = request.Amount,
            StartDate = startDate,
            Frequency = request.Frequency ?? "aylık",
            IsIncome = request.IsIncome,
            IsActive = request.IsActive,
            CategoryId = categoryId,
            AccountId = accountId,
            UserId = testUser.Id,
            LastProcessed = null // null bırak ki hemen işlem oluştursun
        };

    db.RecurringTransactions.Add(recurringTransaction);
    await db.SaveChangesAsync();

    // Return with included data
    var result = await db.RecurringTransactions
        .Include(r => r.Category)
        .Include(r => r.Account)
        .FirstOrDefaultAsync(r => r.Id == recurringTransaction.Id);

    return Results.Ok(result);
})
.WithName("CreateRecurringTransaction");

app.MapDelete("/api/recurring-transaction/{id}", async (string id, ApplicationDbContext db) =>
{
    if (!Guid.TryParse(id, out var recurringId))
    {
        return Results.BadRequest("Invalid recurring transaction ID");
    }

    var recurringTransaction = await db.RecurringTransactions.FindAsync(recurringId);
    if (recurringTransaction == null)
    {
        return Results.NotFound("Recurring transaction not found");
    }

    db.RecurringTransactions.Remove(recurringTransaction);
    await db.SaveChangesAsync();

    return Results.Ok("Recurring transaction deleted successfully");
})
.WithName("DeleteRecurringTransaction");

app.MapPost("/api/transaction", async (TransactionRequest request, ApplicationDbContext db) =>
{
    if (!Guid.TryParse(request.CategoryId, out var categoryId))
    {
        return Results.BadRequest("Invalid category ID");
    }

    if (!Guid.TryParse(request.AccountId, out var accountId))
    {
        return Results.BadRequest("Invalid account ID");
    }

    var transaction = new Transaction
    {
        Description = request.Description ?? "Yeni İşlem",
        Amount = request.IsIncome ? Math.Abs(request.Amount) : -Math.Abs(request.Amount),
        TransactionDate = DateTime.Parse(request.Date ?? DateTime.UtcNow.ToString("yyyy-MM-dd")).ToUniversalTime(),
        CategoryId = categoryId,
        AccountId = accountId,
        ReceiptUrl = request.ReceiptUrl
    };

    db.Transactions.Add(transaction);
    await db.SaveChangesAsync();

    // Return with included data
    var result = await db.Transactions
        .Include(t => t.Category)
        .Include(t => t.Account)
        .FirstOrDefaultAsync(t => t.Id == transaction.Id);

    return Results.Ok(result);
})
.WithName("CreateTransaction");

app.MapPut("/api/transaction/{id}", async (Guid id, TransactionRequest request, ApplicationDbContext db) =>
{
    var transaction = await db.Transactions.FindAsync(id);
    
    if (transaction == null)
        return Results.NotFound();
    
    if (!Guid.TryParse(request.CategoryId, out var categoryId))
    {
        return Results.BadRequest("Invalid category ID");
    }

    if (!Guid.TryParse(request.AccountId, out var accountId))
    {
        return Results.BadRequest("Invalid account ID");
    }
    
    transaction.Description = request.Description ?? transaction.Description ?? "Yeni İşlem";
    transaction.Amount = request.IsIncome ? Math.Abs(request.Amount) : -Math.Abs(request.Amount);
    transaction.TransactionDate = DateTime.Parse(request.Date ?? transaction.TransactionDate.ToString("yyyy-MM-dd"));
    transaction.CategoryId = categoryId;
    transaction.AccountId = accountId;
    transaction.ReceiptUrl = request.ReceiptUrl ?? transaction.ReceiptUrl;
    
    await db.SaveChangesAsync();
    
    var result = await db.Transactions
        .Include(t => t.Category)
        .Include(t => t.Account)
        .FirstOrDefaultAsync(t => t.Id == id);
    
    return Results.Ok(result);
})
.WithName("UpdateTransaction");

app.MapDelete("/api/transaction/{id}", async (Guid id, ApplicationDbContext db) =>
{
    var transaction = await db.Transactions.FindAsync(id);
    
    if (transaction == null)
        return Results.NotFound();
    
    db.Transactions.Remove(transaction);
    await db.SaveChangesAsync();
    return Results.Ok();
})
.WithName("DeleteTransaction");

app.MapGet("/api/category", async (ApplicationDbContext db) =>
{
    var categories = await db.Categories
        .OrderBy(c => c.Name)
        .ToListAsync();
    return Results.Ok(categories);
})
.WithName("GetCategories");

app.MapGet("/api/account", async (ApplicationDbContext db) =>
{
    var accounts = await db.Accounts
        .OrderBy(a => a.AccountName)
        .ToListAsync();
    
    return Results.Ok(accounts);
})
.WithName("GetAccounts");

// Export transactions to CSV
app.MapGet("/api/export/csv", async (ApplicationDbContext db) =>
{
    var transactions = await db.Transactions
        .Include(t => t.Category)
        .Include(t => t.Account)
        .OrderByDescending(t => t.TransactionDate)
        .ToListAsync();
    
    var csv = new StringBuilder();
    csv.AppendLine("Tarih,Açıklama,Tutar,Kategori,Hesap,Gelir/Gider");
    
    foreach (var t in transactions)
    {
        var date = t.TransactionDate.ToString("yyyy-MM-dd");
        var description = t.Description?.Replace(",", ";") ?? "";
        var amount = t.Amount.ToString("F2", System.Globalization.CultureInfo.InvariantCulture);
        var category = t.Category?.Name ?? "";
        var account = t.Account?.AccountName ?? "";
        var type = t.Amount >= 0 ? "Gelir" : "Gider";
        
        csv.AppendLine($"{date},{description},{amount},{category},{account},{type}");
    }
    
    var bytes = Encoding.UTF8.GetBytes(csv.ToString());
    return Results.File(bytes, "text/csv", $"islemler_{DateTime.UtcNow:yyyyMMdd}.csv");
})
.WithName("ExportCsv");

// Export transactions to Excel
app.MapGet("/api/export/excel", async (ApplicationDbContext db) =>
{
    var transactions = await db.Transactions
        .Include(t => t.Category)
        .Include(t => t.Account)
        .OrderByDescending(t => t.TransactionDate)
        .ToListAsync();
    
    using var package = new ExcelPackage();
    var worksheet = package.Workbook.Worksheets.Add("İşlemler");
    
    // Headers
    worksheet.Cells[1, 1].Value = "Tarih";
    worksheet.Cells[1, 2].Value = "Açıklama";
    worksheet.Cells[1, 3].Value = "Tutar";
    worksheet.Cells[1, 4].Value = "Kategori";
    worksheet.Cells[1, 5].Value = "Hesap";
    worksheet.Cells[1, 6].Value = "Gelir/Gider";
    
    // Style headers
    using (var range = worksheet.Cells[1, 1, 1, 6])
    {
        range.Style.Font.Bold = true;
        range.Style.Fill.PatternType = OfficeOpenXml.Style.ExcelFillStyle.Solid;
        range.Style.Fill.BackgroundColor.SetColor(System.Drawing.Color.LightGray);
    }
    
    // Data
    for (int i = 0; i < transactions.Count; i++)
    {
        var t = transactions[i];
        var row = i + 2;
        
        worksheet.Cells[row, 1].Value = t.TransactionDate.ToString("yyyy-MM-dd");
        worksheet.Cells[row, 2].Value = t.Description ?? "";
        worksheet.Cells[row, 3].Value = t.Amount;
        worksheet.Cells[row, 4].Value = t.Category?.Name ?? "";
        worksheet.Cells[row, 5].Value = t.Account?.AccountName ?? "";
        worksheet.Cells[row, 6].Value = t.Amount >= 0 ? "Gelir" : "Gider";
        
        // Format amount column
        worksheet.Cells[row, 3].Style.Numberformat.Format = "#,##0.00";
    }
    
    // Auto-fit columns
    worksheet.Cells.AutoFitColumns();
    
    var bytes = package.GetAsByteArray();
    return Results.File(bytes, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", $"islemler_{DateTime.UtcNow:yyyyMMdd}.xlsx");
})
.WithName("ExportExcel");

// Gelişmiş raporlama API'leri
app.MapGet("/api/reports/monthly-summary", async (ApplicationDbContext db) =>
{
    var currentMonth = DateTime.UtcNow.Month;
    var currentYear = DateTime.UtcNow.Year;
    
    var monthlyData = await db.Transactions
        .Include(t => t.Category)
        .Where(t => t.TransactionDate.Month == currentMonth && t.TransactionDate.Year == currentYear)
        .GroupBy(t => t.Category.Name)
        .Select(g => new
        {
            Category = g.Key,
            TotalAmount = g.Sum(t => t.Amount),
            TransactionCount = g.Count(),
            AverageAmount = g.Average(t => t.Amount)
        })
        .OrderByDescending(x => x.TotalAmount)
        .ToListAsync();
    
    return Results.Ok(monthlyData);
})
.WithName("MonthlySummary");

app.MapGet("/api/reports/category-breakdown", async (ApplicationDbContext db) =>
{
    var breakdown = await db.Transactions
        .Include(t => t.Category)
        .GroupBy(t => new { t.Category.Name, t.Category.Icon, t.Category.Color })
        .Select(g => new
        {
            CategoryName = g.Key.Name,
            Icon = g.Key.Icon,
            Color = g.Key.Color,
            TotalIncome = g.Where(t => t.Amount > 0).Sum(t => t.Amount),
            TotalExpense = g.Where(t => t.Amount < 0).Sum(t => Math.Abs(t.Amount)),
            TransactionCount = g.Count()
        })
        .OrderByDescending(x => x.TotalExpense)
        .ToListAsync();
    
    return Results.Ok(breakdown);
})
.WithName("CategoryBreakdown");

app.MapGet("/api/reports/trends", async (ApplicationDbContext db) =>
{
    var last6Months = Enumerable.Range(0, 6)
        .Select(i => DateTime.UtcNow.AddMonths(-i))
        .Reverse()
        .ToList();
    
    var trends = await db.Transactions
        .Where(t => t.TransactionDate >= last6Months.First())
        .GroupBy(t => new { Month = t.TransactionDate.Month, Year = t.TransactionDate.Year })
        .Select(g => new
        {
            Month = g.Key.Month,
            Year = g.Key.Year,
            TotalIncome = g.Where(t => t.Amount > 0).Sum(t => t.Amount),
            TotalExpense = g.Where(t => t.Amount < 0).Sum(t => Math.Abs(t.Amount)),
            NetAmount = g.Sum(t => t.Amount)
        })
        .OrderBy(x => x.Year).ThenBy(x => x.Month)
        .ToListAsync();
    
    return Results.Ok(trends);
})
.WithName("Trends");

// Banka hesap özeti parsing API'si
app.MapPost("/api/parse-bank-statement", async (HttpContext context) =>
{
    var form = await context.Request.ReadFormAsync();
    var file = form.Files.FirstOrDefault();
    var bankType = form["bankType"].ToString() ?? "generic";
    
    if (file == null || file.Length == 0)
        return Results.BadRequest("No file uploaded");
    
    if (file.Length > 10 * 1024 * 1024) // 10MB limit
        return Results.BadRequest("File too large");
    
    var allowedExtensions = new[] { ".csv", ".txt", ".xlsx", ".xls", ".pdf" };
    var fileExtension = Path.GetExtension(file.FileName).ToLowerInvariant();
    
    if (!allowedExtensions.Contains(fileExtension))
        return Results.BadRequest("Invalid file type. Only CSV, TXT, Excel and PDF files are supported.");
    
    try
    {
        var parser = new backend.Services.BankStatementParser();
        var transactions = parser.ParseBankStatementFromFile(file, bankType);
        
        return Results.Ok(new { 
            success = true, 
            transactions = transactions,
            count = transactions.Count,
            bankType = bankType
        });
    }
    catch (Exception ex)
    {
        return Results.BadRequest($"Error parsing bank statement: {ex.Message}");
    }
})
.DisableAntiforgery()
.WithName("ParseBankStatement");

app.MapPost("/api/account", async (AccountRequest request, ApplicationDbContext db) =>
{
    // Get the first user for now (in a real app, this would come from authentication)
    var user = await db.Users.FirstOrDefaultAsync();
    if (user == null)
    {
        return Results.BadRequest("No user found");
    }
    
    var account = new Account
    {
        AccountName = request.AccountName ?? "Yeni Hesap",
        AccountType = request.AccountType ?? "Vadesiz",
        Balance = request.Balance,
        Currency = request.Currency ?? "TRY",
        UserId = user.Id
    };
    
    db.Accounts.Add(account);
    await db.SaveChangesAsync();
    
    return Results.Ok(account);
})
.WithName("CreateAccount");

app.MapPost("/api/category", async (CategoryRequest request, ApplicationDbContext db) =>
{
    // Get the first user for now (in a real app, this would come from authentication)
    var user = await db.Users.FirstOrDefaultAsync();
    if (user == null)
    {
        return Results.BadRequest("No user found");
    }
    
    var category = new Category
    {
        Name = request.Name ?? "Yeni Kategori",
        Color = request.Color ?? "#764ba2",
        Icon = request.Icon ?? "🗂️",
        UserId = user.Id
    };
    
    db.Categories.Add(category);
    await db.SaveChangesAsync();
    
    return Results.Ok(category);
})
.WithName("CreateCategory");

app.MapDelete("/api/category/{id}", async (Guid id, ApplicationDbContext db) =>
{
    var category = await db.Categories.FindAsync(id);
    
    if (category == null)
        return Results.NotFound();
    
    db.Categories.Remove(category);
    await db.SaveChangesAsync();
    return Results.Ok();
})
.WithName("DeleteCategory");



// Excel file parsing endpoint
app.MapPost("/api/parse-excel", async (HttpContext context) =>
{
    var form = await context.Request.ReadFormAsync();
    var file = form.Files.FirstOrDefault();
    
    if (file == null || file.Length == 0)
        return Results.BadRequest("No file uploaded");
    
    if (file.Length > 10 * 1024 * 1024) // 10MB limit
        return Results.BadRequest("File too large");
    
    var allowedExtensions = new[] { ".xlsx", ".xls" };
    var fileExtension = Path.GetExtension(file.FileName).ToLowerInvariant();
    
    if (!allowedExtensions.Contains(fileExtension))
        return Results.BadRequest("Invalid file type. Only Excel files are supported.");
    
    try
    {
        using var stream = file.OpenReadStream();
        using var package = new ExcelPackage(stream);
        var worksheet = package.Workbook.Worksheets.FirstOrDefault();
        
        if (worksheet == null)
            return Results.BadRequest("No worksheet found in Excel file");
        
        var rows = new List<Dictionary<string, string>>();
        var headers = new List<string>();
        
        // Read headers (first row)
        var headerRow = worksheet.Cells[1, 1, 1, worksheet.Dimension.End.Column];
        foreach (var cell in headerRow)
        {
            headers.Add(cell.Text?.Trim() ?? "");
        }
        
        // Read data rows
        for (int row = 2; row <= worksheet.Dimension.End.Row; row++)
        {
            var rowData = new Dictionary<string, string>();
            for (int col = 1; col <= worksheet.Dimension.End.Column; col++)
            {
                var cellValue = worksheet.Cells[row, col].Text?.Trim() ?? "";
                rowData[headers[col - 1]] = cellValue;
            }
            rows.Add(rowData);
        }
        
        return Results.Ok(new { headers, rows });
    }
    catch (Exception ex)
    {
        return Results.BadRequest($"Error parsing Excel file: {ex.Message}");
    }
})
.DisableAntiforgery()
.WithName("ParseExcel");

// File upload endpoint for receipts
app.MapPost("/api/upload-receipt", async (HttpContext context) =>
{
    var form = await context.Request.ReadFormAsync();
    var file = form.Files.FirstOrDefault();
    
    if (file == null || file.Length == 0)
        return Results.BadRequest("No file uploaded");
    
    if (file.Length > 5 * 1024 * 1024) // 5MB limit
        return Results.BadRequest("File too large");
    
    var allowedExtensions = new[] { ".jpg", ".jpeg", ".png", ".gif", ".pdf" };
    var fileExtension = Path.GetExtension(file.FileName).ToLowerInvariant();
    
    if (!allowedExtensions.Contains(fileExtension))
        return Results.BadRequest("Invalid file type");
    
    // Create uploads directory if it doesn't exist
    var uploadsDir = Path.Combine(Directory.GetCurrentDirectory(), "uploads");
    if (!Directory.Exists(uploadsDir))
        Directory.CreateDirectory(uploadsDir);
    
    // Generate unique filename
    var fileName = $"{Guid.NewGuid()}{fileExtension}";
    var filePath = Path.Combine(uploadsDir, fileName);
    
    // Save file
    using (var stream = new FileStream(filePath, FileMode.Create))
    {
        await file.CopyToAsync(stream);
    }
    
    // Return the file URL
    var fileUrl = $"/uploads/{fileName}";
    return Results.Ok(new { url = fileUrl });
})
.DisableAntiforgery()
.WithName("UploadReceipt");

// Serve static files from uploads directory
app.UseStaticFiles(new StaticFileOptions
{
    FileProvider = new PhysicalFileProvider(Path.Combine(Directory.GetCurrentDirectory(), "uploads")),
    RequestPath = "/uploads"
});

// Setup database endpoint (for development only)
app.MapPost("/api/setup-database", async (ApplicationDbContext db) =>
{
    try
    {
        // Try to create the table directly (will fail if it already exists)
        await db.Database.ExecuteSqlRawAsync(@"
            CREATE TABLE IF NOT EXISTS recurring_transactions (
                id uuid NOT NULL,
                user_id uuid NOT NULL,
                account_id uuid NOT NULL,
                category_id uuid NOT NULL,
                description character varying(500) NOT NULL,
                amount numeric(18,2) NOT NULL,
                start_date timestamp with time zone NOT NULL,
                frequency character varying(20) NOT NULL,
                is_income boolean NOT NULL DEFAULT false,
                is_active boolean NOT NULL DEFAULT true,
                last_processed timestamp with time zone,
                created_at timestamp with time zone NOT NULL DEFAULT NOW(),
                CONSTRAINT ""PK_recurring_transactions"" PRIMARY KEY (id),
                CONSTRAINT ""FK_recurring_transactions_users_user_id"" FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                CONSTRAINT ""FK_recurring_transactions_accounts_account_id"" FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE,
                CONSTRAINT ""FK_recurring_transactions_categories_category_id"" FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
            )
        ");
        
        return Results.Ok("Recurring transactions table created successfully");
    }
    catch (Exception ex)
    {
        return Results.BadRequest($"Error setting up database: {ex.Message}");
    }
})
.WithName("SetupDatabase");

app.Run();

record WeatherForecast(DateOnly Date, int TemperatureC, string? Summary)
{
    public int TemperatureF => 32 + (int)(TemperatureC / 0.5556);
}

// Request models
public class TransactionRequest
{
    public decimal Amount { get; set; }
    public string? Date { get; set; }
    public string? CategoryId { get; set; }
    public string? Description { get; set; }
    public bool IsIncome { get; set; }
    public string? AccountId { get; set; }
    public string? ReceiptUrl { get; set; }
}

public class AccountRequest
{
    public string? AccountName { get; set; }
    public string? AccountType { get; set; }
    public decimal Balance { get; set; }
    public string? Currency { get; set; }
}

public class CategoryRequest
{
    public string? Name { get; set; }
    public string? Color { get; set; }
    public string? Icon { get; set; }
}

public class RecurringTransactionRequest
{
    public string? Description { get; set; }
    public decimal Amount { get; set; }
    public string? StartDate { get; set; }
    public string? Frequency { get; set; }
    public bool IsIncome { get; set; }
    public bool IsActive { get; set; }
    public string? CategoryId { get; set; }
    public string? AccountId { get; set; }
}


