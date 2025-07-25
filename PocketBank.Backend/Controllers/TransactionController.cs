using Microsoft.AspNetCore.Mvc;
using PocketBank.Backend.Data;
using PocketBank.Backend.Models;
using Microsoft.EntityFrameworkCore;
using System.Globalization;
using CsvHelper;

namespace PocketBank.Backend.Controllers;

[ApiController]
[Route("api/[controller]")]
public class TransactionController : ControllerBase
{
private readonly AppDbContext _context;

public TransactionController(AppDbContext context)
{
    _context = context;
}

// GET: api/transaction
[HttpGet]
public async Task<ActionResult<IEnumerable<Transaction>>> GetTransactions()
{
    return await _context.Transactions
        .Include(t => t.Category)
        .ToListAsync();
}

// POST: api/transaction
[HttpPost]
public async Task<ActionResult<Transaction>> CreateTransaction(Transaction transaction)
{
    var category = await _context.Categories.FindAsync(transaction.CategoryId);
    if (category == null)
    {
        return BadRequest("Kategori bulunamadı.");
    }

    // Tarihi UTC olarak ayarla
    if (transaction.Date.Kind == DateTimeKind.Unspecified)
        transaction.Date = DateTime.SpecifyKind(transaction.Date, DateTimeKind.Utc);
    else
        transaction.Date = transaction.Date.ToUniversalTime();

    transaction.Category = category;
    _context.Transactions.Add(transaction);
    await _context.SaveChangesAsync();

    return CreatedAtAction(nameof(GetTransactions), new { id = transaction.Id }, transaction);
}

// POST: api/transaction/import-file
[HttpPost("import-file")]
public async Task<IActionResult> ImportTransactionsFile(IFormFile file)
{
    if (file == null || file.Length == 0)
        return BadRequest("Dosya yok.");
    var transactions = new List<Transaction>();
    using (var reader = new StreamReader(file.OpenReadStream()))
    using (var csv = new CsvReader(reader, CultureInfo.InvariantCulture))
    {
        var records = csv.GetRecords<dynamic>();
        foreach (var record in records)
        {
            try
            {
                var tx = new Transaction
                {
                    Amount = decimal.Parse(record.Amount),
                    Description = record.Description,
                    Date = DateTime.Parse(record.Date),
                    IsIncome = bool.Parse(record.IsIncome),
                    CategoryId = int.Parse(record.CategoryId)
                };
                transactions.Add(tx);
            }
            catch { }
        }
    }
    foreach (var tx in transactions)
    {
        var category = await _context.Categories.FindAsync(tx.CategoryId);
        if (category == null) continue;
        tx.Category = category;
        _context.Transactions.Add(tx);
    }
    var count = await _context.SaveChangesAsync();
    return Ok(new { added = count });
}

// PUT: api/transaction/{id}
[HttpPut("{id}")]
public async Task<IActionResult> UpdateTransaction(int id, Transaction updated)
{
    if (id != updated.Id)
        return BadRequest();

    var transaction = await _context.Transactions.FindAsync(id);
    if (transaction == null)
        return NotFound();

    // Tarihi UTC olarak ayarla
    if (updated.Date.Kind == DateTimeKind.Unspecified)
        transaction.Date = DateTime.SpecifyKind(updated.Date, DateTimeKind.Utc);
    else
        transaction.Date = updated.Date.ToUniversalTime();

    transaction.Amount = updated.Amount;
    transaction.Description = updated.Description;
    transaction.IsIncome = updated.IsIncome;
    transaction.CategoryId = updated.CategoryId;

    await _context.SaveChangesAsync();
    return Ok(transaction);
}

// DELETE: api/transaction/{id}
[HttpDelete("{id}")]
public async Task<IActionResult> DeleteTransaction(int id)
{
    var transaction = await _context.Transactions.FindAsync(id);
    if (transaction == null)
        return NotFound();

    _context.Transactions.Remove(transaction);
    await _context.SaveChangesAsync();
    return NoContent();
}
}