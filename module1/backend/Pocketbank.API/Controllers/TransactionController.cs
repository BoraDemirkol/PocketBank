using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using Pocketbank.API.Data;
using Pocketbank.API.Models;
using Pocketbank.API.Dtos;
using Pocketbank.API.Services;

namespace Pocketbank.API.Controllers
{
    [ApiController]
    [Route("api/transactions")] // Changed route to avoid conflict
    public class TransactionController : ControllerBase
    {
        private readonly AppDbContext _context;

        public TransactionController(AppDbContext context)
        {
            _context = context;
        }

            // GET: /api/transactions/{accountId}
    [HttpGet("{accountId}")]
    [Authorize]
    public async Task<IActionResult> GetAll(Guid accountId)
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        
        if (string.IsNullOrEmpty(userId))
        {
            return Unauthorized("Kullanıcı kimliği bulunamadı");
        }

        var userGuid = Guid.Parse(userId);
        
        // Önce hesabın kullanıcıya ait olup olmadığını kontrol et
        var account = await _context.Accounts
            .FirstOrDefaultAsync(a => a.Id == accountId && a.UserId == userGuid);
            
        if (account == null) return NotFound("Hesap bulunamadı");

        var transactions = await _context.Transactions
            .Where(t => t.AccountId == accountId)
            .OrderByDescending(t => t.Date)
            .ToListAsync();

        return Ok(transactions);
    }

            // GET: /api/transactions/{accountId}/statement?start=...&end=...
    [HttpGet("{accountId}/statement")]
    [Authorize]
    public async Task<IActionResult> GetStatement(Guid accountId, DateTime? start, DateTime? end)
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        
        if (string.IsNullOrEmpty(userId))
        {
            return Unauthorized("Kullanıcı kimliği bulunamadı");
        }

        var userGuid = Guid.Parse(userId);
        
        // Önce hesabın kullanıcıya ait olup olmadığını kontrol et
        var account = await _context.Accounts
            .FirstOrDefaultAsync(a => a.Id == accountId && a.UserId == userGuid);
            
        if (account == null) return NotFound("Hesap bulunamadı");

        if (start.HasValue)
            start = DateTime.SpecifyKind(start.Value, DateTimeKind.Utc);

        if (end.HasValue)
            end = DateTime.SpecifyKind(end.Value, DateTimeKind.Utc);

        var query = _context.Transactions
            .Where(t => t.AccountId == accountId);

        if (start.HasValue)
            query = query.Where(t => t.Date >= start.Value);

        if (end.HasValue)
            query = query.Where(t => t.Date <= end.Value);

        var result = await query
            .OrderByDescending(t => t.Date)
            .Select(t => new TransactionDto
            {
                Date = t.Date,
                Amount = t.Amount,
                Description = t.Description
            })
            .ToListAsync();

        return Ok(result);
    }

            // GET: /api/transactions/{accountId}/extractPdf?start=...&end=...
    [HttpGet("{accountId}/extractPdf")]
    [Authorize]
    public async Task<IActionResult> GetExtractPdf(Guid accountId, DateTime start, DateTime end)
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        
        if (string.IsNullOrEmpty(userId))
        {
            return Unauthorized("Kullanıcı kimliği bulunamadı");
        }

        var userGuid = Guid.Parse(userId);
        
        // Önce hesabın kullanıcıya ait olup olmadığını kontrol et
        var account = await _context.Accounts
            .FirstOrDefaultAsync(a => a.Id == accountId && a.UserId == userGuid);
            
        if (account == null) return NotFound("Hesap bulunamadı");

        start = DateTime.SpecifyKind(start, DateTimeKind.Utc);
        end = DateTime.SpecifyKind(end, DateTimeKind.Utc);

        if (start > end)
            return BadRequest("Başlangıç tarihi bitiş tarihinden büyük olamaz.");

        var transactions = await _context.Transactions
            .Where(t => t.AccountId == accountId && t.Date >= start && t.Date <= end)
            .OrderBy(t => t.Date)
            .ToListAsync();

        if (!transactions.Any())
            return NotFound("Bu dönemde işlem bulunamadı.");

        var pdfBytes = PdfBuilder.BuildStatementPdf(transactions, start, end);

        return File(pdfBytes, "application/pdf",
            $"ekstre-{start:yyyy-MM-dd}_to_{end:yyyy-MM-dd}.pdf");
    }

            // GET: /api/transactions/{accountId}/balance?currency=USD
    [HttpGet("{accountId}/balance")]
    [Authorize]
    public async Task<IActionResult> GetAccountBalance(Guid accountId, string? currency = "TRY")
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        
        if (string.IsNullOrEmpty(userId))
        {
            return Unauthorized("Kullanıcı kimliği bulunamadı");
        }

        var userGuid = Guid.Parse(userId);
        
        // Önce hesabın kullanıcıya ait olup olmadığını kontrol et
        var account = await _context.Accounts
            .FirstOrDefaultAsync(a => a.Id == accountId && a.UserId == userGuid);
            
        if (account == null)
            return NotFound("Hesap bulunamadı.");

        var balance = account.Balance;
        var originalCurrency = account.Currency;

        if (string.IsNullOrEmpty(currency) || !CurrencyConverter.IsSupported(currency))
            return BadRequest("Desteklenmeyen para birimi.");

        var converted = CurrencyConverter.Convert(balance, originalCurrency, currency);

        return Ok(new
        {
            accountId = account.Id,
            originalAmount = balance,
            originalCurrency,
            convertedAmount = Math.Round(converted, 2),
            targetCurrency = currency
        });
    }
    }
}
