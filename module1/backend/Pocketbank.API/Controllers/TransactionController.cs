using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Pocketbank.API.Data;
using Pocketbank.API.Models;
using System.Text;
using CsvHelper;
using System.Globalization;

namespace Pocketbank.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class TransactionController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly IWebHostEnvironment _environment;

        public TransactionController(ApplicationDbContext context, IWebHostEnvironment environment)
        {
            _context = context;
            _environment = environment;
        }

        // GET: api/transactions
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Transaction>>> GetTransactions()
        {
            return await _context.Transactions
                .Include(t => t.Category)
                .Include(t => t.Account)
                .OrderByDescending(t => t.TransactionDate)
                .ToListAsync();
        }

        // GET: api/transactions/{id}
        [HttpGet("{id}")]
        public async Task<ActionResult<Transaction>> GetTransaction(Guid id)
        {
            var transaction = await _context.Transactions
                .Include(t => t.Category)
                .Include(t => t.Account)
                .FirstOrDefaultAsync(t => t.Id == id);

            if (transaction == null)
            {
                return NotFound();
            }

            return transaction;
        }

        // POST: api/transactions
        [HttpPost]
        public async Task<ActionResult<Transaction>> CreateTransaction(Transaction transaction)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            transaction.Id = Guid.NewGuid();
            transaction.CreatedAt = DateTime.UtcNow;

            _context.Transactions.Add(transaction);
            await _context.SaveChangesAsync();

            // Reload with includes
            await _context.Entry(transaction)
                .Reference(t => t.Category)
                .LoadAsync();
            await _context.Entry(transaction)
                .Reference(t => t.Account)
                .LoadAsync();

            return CreatedAtAction(nameof(GetTransaction), new { id = transaction.Id }, transaction);
        }

        // PUT: api/transactions/{id}
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateTransaction(Guid id, Transaction transaction)
        {
            if (id != transaction.Id)
            {
                return BadRequest();
            }

            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var existingTransaction = await _context.Transactions.FindAsync(id);
            if (existingTransaction == null)
            {
                return NotFound();
            }

            existingTransaction.Amount = transaction.Amount;
            existingTransaction.CategoryId = transaction.CategoryId;
            existingTransaction.AccountId = transaction.AccountId;
            existingTransaction.TransactionDate = transaction.TransactionDate;
            existingTransaction.Description = transaction.Description;
            existingTransaction.ReceiptUrl = transaction.ReceiptUrl;
            existingTransaction.TransactionType = transaction.TransactionType;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!TransactionExists(id))
                {
                    return NotFound();
                }
                else
                {
                    throw;
                }
            }

            return NoContent();
        }

        // DELETE: api/transactions/{id}
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteTransaction(Guid id)
        {
            var transaction = await _context.Transactions.FindAsync(id);
            if (transaction == null)
            {
                return NotFound();
            }

            _context.Transactions.Remove(transaction);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        // POST: api/upload-receipt
        [HttpPost("upload-receipt")]
        public async Task<IActionResult> UploadReceipt(IFormFile file)
        {
            if (file == null || file.Length == 0)
            {
                return BadRequest("No file uploaded");
            }

            // Validate file type
            var allowedExtensions = new[] { ".jpg", ".jpeg", ".png", ".gif" };
            var fileExtension = Path.GetExtension(file.FileName).ToLowerInvariant();
            
            if (!allowedExtensions.Contains(fileExtension))
            {
                return BadRequest("Invalid file type. Only image files are allowed.");
            }

            // Generate unique filename
            var fileName = $"{Guid.NewGuid()}{fileExtension}";
            var uploadsPath = Path.Combine(_environment.WebRootPath, "uploads");
            
            // Create uploads directory if it doesn't exist
            if (!Directory.Exists(uploadsPath))
            {
                Directory.CreateDirectory(uploadsPath);
            }

            var filePath = Path.Combine(uploadsPath, fileName);

            // Save file
            using (var stream = new FileStream(filePath, FileMode.Create))
            {
                await file.CopyToAsync(stream);
            }

            // Return file URL
            var fileUrl = $"/uploads/{fileName}";
            return Ok(new { url = fileUrl });
        }

        // GET: api/export/csv
        [HttpGet("export/csv")]
        public async Task<IActionResult> ExportCsv()
        {
            var transactions = await _context.Transactions
                .Include(t => t.Category)
                .Include(t => t.Account)
                .OrderByDescending(t => t.TransactionDate)
                .ToListAsync();

            using var memoryStream = new MemoryStream();
            using var writer = new StreamWriter(memoryStream, Encoding.UTF8);
            using var csv = new CsvWriter(writer, CultureInfo.InvariantCulture);

            // Write headers
            csv.WriteField("Tarih");
            csv.WriteField("Açıklama");
            csv.WriteField("Tutar");
            csv.WriteField("Kategori");
            csv.WriteField("Hesap");
            csv.WriteField("Tür");
            csv.NextRecord();

            // Write data
            foreach (var transaction in transactions)
            {
                csv.WriteField(transaction.TransactionDate.ToString("dd.MM.yyyy"));
                csv.WriteField(transaction.Description ?? "");
                csv.WriteField(transaction.Amount.ToString("F2"));
                csv.WriteField(transaction.Category?.Name ?? "Kategori yok");
                csv.WriteField(transaction.Account?.AccountName ?? "Hesap yok");
                csv.WriteField(transaction.TransactionType ?? "Gider");
                csv.NextRecord();
            }

            writer.Flush();
            memoryStream.Position = 0;

            var fileName = $"islemler_{DateTime.Now:yyyyMMdd}.csv";
            return File(memoryStream, "text/csv", fileName);
        }

        // GET: api/export/excel
        [HttpGet("export/excel")]
        public async Task<IActionResult> ExportExcel()
        {
            var transactions = await _context.Transactions
                .Include(t => t.Category)
                .Include(t => t.Account)
                .OrderByDescending(t => t.TransactionDate)
                .ToListAsync();

            // For now, return CSV as Excel (you can implement proper Excel export using EPPlus or similar)
            using var memoryStream = new MemoryStream();
            using var writer = new StreamWriter(memoryStream, Encoding.UTF8);
            using var csv = new CsvWriter(writer, CultureInfo.InvariantCulture);

            // Write headers
            csv.WriteField("Tarih");
            csv.WriteField("Açıklama");
            csv.WriteField("Tutar");
            csv.WriteField("Kategori");
            csv.WriteField("Hesap");
            csv.WriteField("Tür");
            csv.NextRecord();

            // Write data
            foreach (var transaction in transactions)
            {
                csv.WriteField(transaction.TransactionDate.ToString("dd.MM.yyyy"));
                csv.WriteField(transaction.Description ?? "");
                csv.WriteField(transaction.Amount.ToString("F2"));
                csv.WriteField(transaction.Category?.Name ?? "Kategori yok");
                csv.WriteField(transaction.Account?.AccountName ?? "Hesap yok");
                csv.WriteField(transaction.TransactionType ?? "Gider");
                csv.NextRecord();
            }

            writer.Flush();
            memoryStream.Position = 0;

            var fileName = $"islemler_{DateTime.Now:yyyyMMdd}.xlsx";
            return File(memoryStream, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", fileName);
        }

        private bool TransactionExists(Guid id)
        {
            return _context.Transactions.Any(e => e.Id == id);
        }
    }
}
