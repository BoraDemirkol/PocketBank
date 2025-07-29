using Microsoft.AspNetCore.Mvc;
using PocketBank.Data;
using System;
using System.Linq;



[ApiController]
[Route("api/account/{accountId}/[controller]")]
public class TransactionController : ControllerBase
{
    private readonly AppDbContext _context;

    public TransactionController(AppDbContext context)
    {
        _context = context;
    }

    // GET: /api/account/{accountId}/transaction
    [HttpGet]
    public IActionResult GetAll(Guid accountId)
    {
        var transactions = _context.Transactions
            .Where(t => t.AccountId == accountId)
            .OrderByDescending(t => t.Date)
            .ToList();

        return Ok(transactions);
    }

}
