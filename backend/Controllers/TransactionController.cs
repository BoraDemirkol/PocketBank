using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PocketBank.Data;
using PocketBank.Models;
using PocketBank.Models.Dtos;
using PocketBank.Services;

namespace PocketBank.Controllers
{
    [ApiController]
    [Route("api/transactions")]
    public class TransactionController : ControllerBase
    {
        private readonly AppDbContext _context;

        public TransactionController(AppDbContext context)
        {
            _context = context;
        }

        // ✅ 1. Hesaba ait tüm işlemleri getir
        // GET: /api/transactions?accountId=xxx
        [HttpGet]
        public async Task<IActionResult> GetAll(Guid accountId)
        {
            var transactions = await _context.Transactions
                .Where(t => t.AccountId == accountId)
                .OrderByDescending(t => t.Date)
                .ToListAsync();

            return Ok(transactions);
        }

        // ✅ 2. DTO olarak filtreli işlem listesi (ekstre verisi)
        // GET: /api/transactions/extract?accountId=xxx&startDate=...&endDate=...
        [HttpGet("extract")]
        public async Task<IActionResult> GetExtract(Guid accountId, DateTime? startDate, DateTime? endDate)
        {
            var query = _context.Transactions
                .Where(t => t.AccountId == accountId);

            if (startDate.HasValue)
                query = query.Where(t => t.Date >= startDate.Value);

            if (endDate.HasValue)
                query = query.Where(t => t.Date <= endDate.Value);

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

        // ✅ 3. PDF ekstre
        // GET: /api/transactions/extractPdf?accountId=xxx&year=2025&month=7
        [HttpGet("extractPdf")]
        public async Task<IActionResult> GetMonthlyExtractPdf(Guid accountId, int year, int month)
        {
            var transactions = await _context.Transactions
                .Where(t => t.AccountId == accountId && t.Date.Year == year && t.Date.Month == month)
                .OrderBy(t => t.Date)
                .ToListAsync();

            if (!transactions.Any())
                return NotFound("Bu dönemde işlem bulunamadı.");

            var pdfBytes = PdfBuilder.BuildStatementPdf(transactions, year, month);

            return File(pdfBytes, "application/pdf", $"ekstre-{year}-{month}.pdf");
        }
    }
}
