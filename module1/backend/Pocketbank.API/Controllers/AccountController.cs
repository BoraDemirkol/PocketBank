<<<<<<< HEAD
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using Pocketbank.API.Services;
using Pocketbank.API.Models;

namespace Pocketbank.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class AccountController : ControllerBase
{
    private readonly UserService _userService;
    private readonly ILogger<AccountController> _logger;

    public AccountController(UserService userService, ILogger<AccountController> logger)
    {
        _userService = userService;
        _logger = logger;
    }

    [HttpGet("profile")]
    public async Task<IActionResult> GetProfile()
    {
        _logger.LogInformation("GetProfile endpoint called");
        
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        var email = User.FindFirst(ClaimTypes.Email)?.Value;
        
        _logger.LogInformation("Extracted from token - UserId: {UserId}, Email: {Email}", userId ?? "NULL", email ?? "NULL");
        
        if (string.IsNullOrEmpty(userId) && string.IsNullOrEmpty(email))
        {
            _logger.LogWarning("Neither user ID nor email found in token");
            return Unauthorized("User identification not found in token");
        }

        User? user = null;
        
        // Safe approach: Try ID first, fallback to email
        if (!string.IsNullOrEmpty(userId))
        {
            _logger.LogInformation("Searching for user with ID: {UserId}", userId);
            user = await _userService.GetUserByIdAsync(userId);
        }
        
        if (user == null && !string.IsNullOrEmpty(email))
        {
            _logger.LogInformation("User not found by ID, trying email: {Email}", email);
            user = await _userService.GetUserByEmailAsync(email);
            
            if (user != null)
            {
                _logger.LogWarning("User found by email but not by ID. This indicates an ID mismatch. Email: {Email}, DB ID: {DbId}, Token ID: {TokenId}", 
                    email, user.Id, userId);
            }
        }
        
        if (user == null)
        {
            _logger.LogWarning("User profile not found for ID: {UserId} or Email: {Email}", userId, email);
            return NotFound("User profile not found");
        }

        _logger.LogInformation("User profile found: {Email}", user.Email);
        return Ok(new
        {
            UserId = user.Id,
            Email = user.Email,
            Name = user.Name,
            Surname = user.Surname,
            ProfilePictureUrl = user.ProfilePictureUrl,
            Message = "Profile data retrieved successfully"
        });
    }

    [HttpPut("profile")]
    public async Task<IActionResult> UpdateProfile([FromBody] UpdateProfileRequest request)
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        
        if (string.IsNullOrEmpty(userId))
        {
            return Unauthorized("User ID not found in token");
        }

        var success = await _userService.UpdateUserProfileAsync(userId, request);
        
        if (!success)
        {
            return BadRequest("Failed to update profile");
        }

        return Ok(new { Message = "Profile updated successfully" });
    }
    
    [HttpGet("balance")]
    public IActionResult GetBalance()
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        
        // Mock balance for now
        return Ok(new
        {
            UserId = userId,
            Balance = 1250.75m,
            Currency = "USD"
        });
=======
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Pocketbank.API.Data;
using Pocketbank.API.Models;
using Pocketbank.API.Services;

namespace Pocketbank.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AccountController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly UserService _userService;

        public AccountController(ApplicationDbContext context, UserService userService)
        {
            _context = context;
            _userService = userService;
        }

        // GET: api/accounts
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Account>>> GetAccounts()
        {
            try
            {
                if (!await _context.Database.CanConnectAsync())
                {
                    // Return mock data when database is not available
                    Console.WriteLine("Database not available, returning mock accounts data");
                    var mockAccounts = new List<Account>
                    {
                        new Account
                        {
                            Id = Guid.NewGuid(),
                            AccountName = "Ana Hesap",
                            AccountType = "Vadesiz",
                            Balance = 0,
                            Currency = "TRY",
                            CreatedAt = DateTime.UtcNow
                        },
                        new Account
                        {
                            Id = Guid.NewGuid(),
                            AccountName = "Biriken Hesap",
                            AccountType = "Vadesiz",
                            Balance = 0,
                            Currency = "TRY",
                            CreatedAt = DateTime.UtcNow
                        }
                    };
                    return Ok(mockAccounts);
                }

                return await _context.Accounts
                    .OrderBy(a => a.AccountName)
                    .ToListAsync();
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error in GetAccounts: {ex.Message}");
                return BadRequest(new { error = "Failed to retrieve accounts" });
            }
        }

        // GET: api/accounts/{id}
        [HttpGet("{id}")]
        public async Task<ActionResult<Account>> GetAccount(Guid id)
        {
            var account = await _context.Accounts.FindAsync(id);

            if (account == null)
            {
                return NotFound();
            }

            return account;
        }

        // POST: api/accounts
        [HttpPost]
        public async Task<ActionResult<Account>> CreateAccount(Account account)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            account.Id = Guid.NewGuid();
            account.CreatedAt = DateTime.UtcNow;

            _context.Accounts.Add(account);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetAccount), new { id = account.Id }, account);
        }

        // PUT: api/accounts/{id}
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateAccount(Guid id, Account account)
        {
            if (id != account.Id)
            {
                return BadRequest();
            }

            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var existingAccount = await _context.Accounts.FindAsync(id);
            if (existingAccount == null)
            {
                return NotFound();
            }

            existingAccount.AccountName = account.AccountName;
            existingAccount.AccountType = account.AccountType;
            existingAccount.Balance = account.Balance;
            existingAccount.Currency = account.Currency;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!AccountExists(id))
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

        // DELETE: api/accounts/{id}
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteAccount(Guid id)
        {
            var account = await _context.Accounts.FindAsync(id);
            if (account == null)
            {
                return NotFound();
            }

            // Check if account is used in transactions
            var hasTransactions = await _context.Transactions.AnyAsync(t => t.AccountId == id);
            if (hasTransactions)
            {
                return BadRequest("Bu hesap kullanılan işlemlerde bulunduğu için silinemez.");
            }

            _context.Accounts.Remove(account);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        // GET: api/account/health
        [HttpGet("health")]
        public async Task<ActionResult<object>> GetHealth()
        {
            try
            {
                var canConnect = await _context.Database.CanConnectAsync();
                
                return Ok(new
                {
                    status = "ok",
                    database = canConnect ? "connected" : "disconnected",
                    timestamp = DateTime.UtcNow
                });
            }
            catch (Exception ex)
            {
                return BadRequest(new { error = ex.Message });
            }
        }

        // GET: api/account/profile
        [HttpGet("profile")]
        public Task<ActionResult<object>> GetProfile()
        {
            try
            {
                // For now, return a mock profile - you'll need to implement proper user authentication
                var profile = new
                {
                    id = Guid.NewGuid().ToString(),
                    email = "user@example.com",
                    name = "Test",
                    surname = "User",
                    profilePictureUrl = "https://via.placeholder.com/150",
                    createdAt = DateTime.UtcNow
                };

                return Task.FromResult<ActionResult<object>>(Ok(profile));
            }
            catch (Exception ex)
            {
                return Task.FromResult<ActionResult<object>>(BadRequest(new { error = ex.Message }));
            }
        }

        // GET: api/account/balance
        [HttpGet("balance")]
        public async Task<ActionResult<object>> GetBalance()
        {
            try
            {
                // Get total balance from all accounts
                var totalBalance = await _context.Accounts
                    .Where(a => a.Balance.HasValue)
                    .SumAsync(a => a.Balance ?? 0);

                var balance = new
                {
                    totalBalance = totalBalance,
                    currency = "TRY",
                    lastUpdated = DateTime.UtcNow
                };

                return Ok(balance);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error in GetBalance: {ex.Message}");
                return BadRequest(new { error = ex.Message });
            }
        }

        private bool AccountExists(Guid id)
        {
            return _context.Accounts.Any(e => e.Id == id);
        }
>>>>>>> 9100c27ce5793f4af8ad037a2cd89bdf89599a38
    }
}