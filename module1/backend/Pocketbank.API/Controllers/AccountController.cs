using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using Pocketbank.API.Services;
using Pocketbank.API.Models;
using Pocketbank.API.Data;

namespace Pocketbank.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AccountController : ControllerBase
{
    private readonly UserService _userService;
    private readonly AppDbContext _context;

    public AccountController(UserService userService, AppDbContext context)
    {
        _userService = userService;
        _context = context;
    }

    [HttpGet]
    public async Task<IActionResult> GetAccounts()
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        
        if (string.IsNullOrEmpty(userId))
        {
            // Test amaçlı sabit kullanıcı ID'si
            userId = "52a9688d-98ef-4541-a748-a60da44a6ba4";
        }

        var userGuid = Guid.Parse(userId);
        var accounts = await _context.Accounts
            .Where(a => a.UserId == userGuid)
            .ToListAsync();

        return Ok(accounts);
    }

    [HttpPost]
    public async Task<IActionResult> CreateAccount([FromBody] Account account)
    {
        try
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            
            if (string.IsNullOrEmpty(userId))
            {
                userId = "52a9688d-98ef-4541-a748-a60da44a6ba4";
            }

            account.Id = Guid.NewGuid();
            account.UserId = Guid.Parse(userId);
            _context.Accounts.Add(account);
            await _context.SaveChangesAsync();
            
            return CreatedAtAction(nameof(GetAccounts), new { id = account.Id }, account);
        }
        catch (Exception ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetAccountById(Guid id)
    {
        var account = await _context.Accounts.FirstOrDefaultAsync(a => a.Id == id);
        if (account == null) return NotFound();
        return Ok(account);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateAccount(Guid id, [FromBody] Account updatedAccount)
    {
        var existing = await _context.Accounts.FirstOrDefaultAsync(a => a.Id == id);
        if (existing == null) return NotFound();

        existing.AccountName = updatedAccount.AccountName;
        existing.AccountType = updatedAccount.AccountType;
        existing.Balance = updatedAccount.Balance;
        existing.Currency = updatedAccount.Currency;

        await _context.SaveChangesAsync();
        return NoContent();
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteAccount(Guid id)
    {
        var account = await _context.Accounts.FirstOrDefaultAsync(a => a.Id == id);
        if (account == null) return NotFound();
    
        _context.Accounts.Remove(account);
        await _context.SaveChangesAsync();
        return NoContent();
    }

    [HttpGet("{accountId}/transaction")]
    public async Task<IActionResult> GetAccountTransactions(Guid accountId)
    {
        var transactions = await _context.Transactions
            .Where(t => t.AccountId == accountId)
            .OrderByDescending(t => t.Date)
            .ToListAsync();

        return Ok(transactions);
    }

    [HttpGet("{accountId}/transaction/extractPdf")]
    public async Task<IActionResult> GetAccountStatementPdf(Guid accountId, [FromQuery] string start, [FromQuery] string end)
    {
        // Mock PDF generation
        var transactions = await _context.Transactions
            .Where(t => t.AccountId == accountId)
            .Where(t => t.Date >= DateTime.Parse(start) && t.Date <= DateTime.Parse(end))
            .OrderBy(t => t.Date)
            .ToListAsync();

        // Return mock PDF data
        var pdfContent = System.Text.Encoding.UTF8.GetBytes("Mock PDF content");
        return File(pdfContent, "application/pdf", $"statement-{start}-{end}.pdf");
    }
}