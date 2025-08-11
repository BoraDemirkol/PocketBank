using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Pocketbank.API.Data;
using Pocketbank.API.Models;
using Pocketbank.API.Dtos;
using Pocketbank.API.Services;

namespace Pocketbank.API.Controllers
{
    [ApiController]
    [Route("api/account/{accountId}/transaction")]
    public class TransactionController : ControllerBase
    {
        private readonly AppDbContext _context;

        public TransactionController(AppDbContext context)
        {
            _context = context;
        }

        // GET: /api/account/{accountId}/transaction
        [HttpGet]
        public async Task<IActionResult> GetAll(Guid accountId)
        {
            var transactions = await _context.Transactions
                .Where(t => t.AccountId == accountId)
                .OrderByDescending(t => t.Date)
                .ToListAsync();

            return Ok(transactions);
        }

        // GET: /api/account/{accountId}/transaction/statement?start=...&end=...
        [HttpGet("statement")]
        public async Task<IActionResult> GetStatement(Guid accountId, DateTime? start, DateTime? end)
        {
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

        // GET: /api/account/{accountId}/transaction/extractPdf?start=...&end=...
        [HttpGet("extractPdf")]
        public async Task<IActionResult> GetExtractPdf(Guid accountId, DateTime start, DateTime end)
        {
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

        // GET: /api/account/{accountId}/transaction/balance?currency=USD
        [HttpGet("balance")]
        public async Task<IActionResult> GetAccountBalance(Guid accountId, string? currency = "TRY")
        {
            var account = await _context.Accounts.FindAsync(accountId);
            if (account == null)
                return NotFound("Hesap bulunamadı.");

            var balance = account.Balance;
            var originalCurrency = account.Currency;

            if (!CurrencyConverter.IsSupported(currency))
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
