using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using Pocketbank.API.Services;
using Pocketbank.API.Models;
using Pocketbank.API.Data;
using Pocketbank.API.Services;

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

    [HttpGet("test")]
    public IActionResult Test()
    {
        try
        {
            return Ok(new { message = "CORS test successful", timestamp = DateTime.UtcNow });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { error = ex.Message });
        }
    }

    [HttpGet]
    [Authorize]
    public async Task<IActionResult> GetAccounts()
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        
        if (string.IsNullOrEmpty(userId))
        {
            return Unauthorized("Kullanıcı kimliği bulunamadı");
        }

        var userGuid = Guid.Parse(userId);
        var accounts = await _context.Accounts
            .Where(a => a.UserId == userGuid)
            .ToListAsync();

        return Ok(accounts);
    }

    [HttpPost]
    [Authorize]
    public async Task<IActionResult> CreateAccount([FromBody] Account account)
    {
        try
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            
            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized("Kullanıcı kimliği bulunamadı");
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
    [Authorize]
    public async Task<IActionResult> GetAccountById(Guid id)
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        
        if (string.IsNullOrEmpty(userId))
        {
            return Unauthorized("Kullanıcı kimliği bulunamadı");
        }

        var userGuid = Guid.Parse(userId);
        var account = await _context.Accounts
            .FirstOrDefaultAsync(a => a.Id == id && a.UserId == userGuid);
            
        if (account == null) return NotFound();
        return Ok(account);
    }

    [HttpPut("{id}")]
    [Authorize]
    public async Task<IActionResult> UpdateAccount(Guid id, [FromBody] Account updatedAccount)
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        
        if (string.IsNullOrEmpty(userId))
        {
            return Unauthorized("Kullanıcı kimliği bulunamadı");
        }

        var userGuid = Guid.Parse(userId);
        var existing = await _context.Accounts
            .FirstOrDefaultAsync(a => a.Id == id && a.UserId == userGuid);
            
        if (existing == null) return NotFound();

        existing.AccountName = updatedAccount.AccountName;
        existing.AccountType = updatedAccount.AccountType;
        existing.Balance = updatedAccount.Balance;
        existing.Currency = updatedAccount.Currency;

        await _context.SaveChangesAsync();
        return NoContent();
    }

    [HttpDelete("{id}")]
    [Authorize]
    public async Task<IActionResult> DeleteAccount(Guid id)
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        
        if (string.IsNullOrEmpty(userId))
        {
            return Unauthorized("Kullanıcı kimliği bulunamadı");
        }

        var userGuid = Guid.Parse(userId);
        var account = await _context.Accounts
            .FirstOrDefaultAsync(a => a.Id == id && a.UserId == userGuid);
            
        if (account == null) return NotFound();
    
        _context.Accounts.Remove(account);
        await _context.SaveChangesAsync();
        return NoContent();
    }

    [HttpGet("{accountId}/transaction")]
    [Authorize]
    public async Task<IActionResult> GetAccountTransactions(Guid accountId)
    {
        try
        {
            Console.WriteLine($"GetAccountTransactions called with accountId: {accountId}");
            
            // Get the authenticated user's ID from the JWT token
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            
            if (string.IsNullOrEmpty(userId))
            {
                Console.WriteLine("User ID not found in token");
                return Unauthorized("Kullanıcı kimliği bulunamadı");
            }
            
            Console.WriteLine($"Using authenticated userId: {userId}");
            
            var userGuid = Guid.Parse(userId);
            Console.WriteLine($"Parsed userGuid: {userGuid}");
            
            // Önce hesabın kullanıcıya ait olup olmadığını kontrol et
            Console.WriteLine("Checking if account exists and belongs to user...");
            var account = await _context.Accounts
                .FirstOrDefaultAsync(a => a.Id == accountId && a.UserId == userGuid);
                
            if (account == null) 
            {
                Console.WriteLine("Account not found or doesn't belong to user");
                return NotFound("Hesap bulunamadı");
            }
            
            Console.WriteLine($"Account found: {account.AccountName}");

            Console.WriteLine("Fetching transactions...");
            var transactions = await _context.Transactions
                .Where(t => t.AccountId == accountId)
                .OrderByDescending(t => t.Date)
                .ToListAsync();
                
            Console.WriteLine($"Found {transactions.Count} transactions");

            return Ok(transactions);
        }
        catch (Exception ex)
        {
            // Log the exception
            Console.WriteLine($"Error in GetAccountTransactions: {ex.Message}");
            Console.WriteLine($"StackTrace: {ex.StackTrace}");
            Console.WriteLine($"Inner Exception: {ex.InnerException?.Message}");
            Console.WriteLine($"Exception Type: {ex.GetType().Name}");
            
            return StatusCode(500, new { 
                error = "İşlem geçmişi alınırken hata oluştu", 
                details = ex.Message,
                stackTrace = ex.StackTrace,
                innerException = ex.InnerException?.Message,
                exceptionType = ex.GetType().Name,
                timestamp = DateTime.UtcNow
            });
        }
    }

    [HttpGet("{accountId}/transaction/extractPdf")]
    [Authorize]
    public async Task<IActionResult> GetAccountStatementPdf(Guid accountId, [FromQuery] string start, [FromQuery] string end)
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

        // Parse dates and ensure they are UTC
        var startDate = DateTime.Parse(start);
        var endDate = DateTime.Parse(end);
        
        // Ensure dates are UTC for PostgreSQL compatibility
        if (startDate.Kind != DateTimeKind.Utc)
            startDate = DateTime.SpecifyKind(startDate, DateTimeKind.Utc);
        if (endDate.Kind != DateTimeKind.Utc)
            endDate = DateTime.SpecifyKind(endDate, DateTimeKind.Utc);

        // Get transactions for the date range
        var transactions = await _context.Transactions
            .Where(t => t.AccountId == accountId)
            .Where(t => t.Date >= startDate && t.Date <= endDate)
            .OrderBy(t => t.Date)
            .ToListAsync();

        if (!transactions.Any())
        {
            return NotFound("Bu dönemde işlem bulunamadı.");
        }

        // Generate real PDF using PdfBuilder service
        var pdfBytes = PdfBuilder.BuildStatementPdf(transactions, startDate, endDate);
        
        return File(pdfBytes, "application/pdf", $"ekstre-{startDate:yyyy-MM-dd}_to_{endDate:yyyy-MM-dd}.pdf");
    }
}