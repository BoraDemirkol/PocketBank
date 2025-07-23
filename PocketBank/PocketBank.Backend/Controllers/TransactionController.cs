using Microsoft.AspNetCore.Mvc;
using PocketBank.Backend.Data;
using PocketBank.Backend.Models;
using Microsoft.EntityFrameworkCore;

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

    transaction.Category = category;
    _context.Transactions.Add(transaction);
    await _context.SaveChangesAsync();

    return CreatedAtAction(nameof(GetTransactions), new { id = transaction.Id }, transaction);
}
}