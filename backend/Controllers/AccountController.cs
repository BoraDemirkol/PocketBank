using Microsoft.AspNetCore.Mvc;
using PocketBank.Data;
using PocketBank.Models;
namespace PocketBank.Controllers;


[ApiController]
[Route("api/[controller]")]
public class AccountController : ControllerBase
{
    private readonly AppDbContext _context;

    public AccountController(AppDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public IActionResult GetAccounts()
    {
        // Test amaçlı sabit kullanıcı ID'si
        var testUserId = Guid.Parse("52a9688d-98ef-4541-a748-a60da44a6ba4");

        var accounts = _context.Accounts
            .Where(a => a.UserId == testUserId)
            .ToList();

        return Ok(accounts);
    }


    // POST: /api/account
    [HttpPost]
    public IActionResult CreateAccount([FromBody] Account account)
    {
        try
        {
            account.Id = Guid.NewGuid();
            _context.Accounts.Add(account);
            _context.SaveChanges();
            return CreatedAtAction(nameof(GetAccounts), new { id = account.Id }, account);
        }
        catch (Exception ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }
    [HttpGet("{id}")]
    public IActionResult GetAccountById(Guid id)
    {
        var account = _context.Accounts.FirstOrDefault(a => a.Id == id);
        if (account == null) return NotFound();
        return Ok(account);
    }



    [HttpPut("{id}")]
    public IActionResult UpdateAccount(Guid id, [FromBody] Account updatedAccount)
    {
        var existing = _context.Accounts.FirstOrDefault(a => a.Id == id);
        if (existing == null) return NotFound();

        existing.AccountName = updatedAccount.AccountName;
        existing.AccountType = updatedAccount.AccountType;
        existing.Balance = updatedAccount.Balance;
        existing.Currency = updatedAccount.Currency;
        existing.UserId = updatedAccount.UserId;

        _context.SaveChanges();
        return NoContent();
    }


    [HttpDelete("{id}")]
    public IActionResult DeleteAccount(Guid id)
    {
        var account = _context.Accounts.FirstOrDefault(a => a.Id == id);
        if (account == null) return NotFound();
    
        _context.Accounts.Remove(account);
        _context.SaveChanges();
    
        return NoContent();
    }














}
