using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using Pocketbank.API.Services;
using Pocketbank.API.Models;
using Npgsql;
using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Cors;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;

namespace Pocketbank.API.Controllers;

[ApiController]
[Route("api/accounts")]
[Authorize] // Enable authorization
[EnableCors("AllowFrontend")] // Enable CORS for this controller
public class AccountController : ControllerBase
{
    private readonly UserService _userService;
    private readonly IDatabaseService _databaseService;
    private readonly ILogger<AccountController> _logger;

    public AccountController(UserService userService, IDatabaseService databaseService, ILogger<AccountController> logger)
    {
        _userService = userService ?? throw new ArgumentNullException(nameof(userService));
        _databaseService = databaseService ?? throw new ArgumentNullException(nameof(databaseService));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    }

    [HttpGet("profile")]
    [EnableCors("AllowFrontend")]
    public async Task<IActionResult> GetProfile()
    {
        try
        {
            // Debug: Log all available claims to understand Supabase JWT structure
            _logger.LogInformation("=== Available Claims ===");
            foreach (var claim in User.Claims)
            {
                _logger.LogInformation($"Type: {claim.Type}, Value: {claim.Value}");
            }
            _logger.LogInformation("========================");
            
            // Supabase uses ClaimTypes.NameIdentifier for user ID
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            
            if (string.IsNullOrEmpty(userId))
            {
                _logger.LogWarning("User ID not found in token");
                return Unauthorized("User ID not found in token");
            }

            if (!Guid.TryParse(userId, out var userGuid))
            {
                _logger.LogWarning("Invalid user ID format: {UserId}", userId);
                return BadRequest("Invalid user ID format");
            }

            var user = await _userService.GetUserByIdAsync(userId);
            
            if (user == null)
            {
                // Try to get user info from claims
                var email = User.FindFirst(ClaimTypes.Email)?.Value;
                
                // Extract name and surname from user_metadata claim
                var userMetadataClaim = User.FindFirst("user_metadata")?.Value;
                string name = "", surname = "";
                
                if (!string.IsNullOrEmpty(userMetadataClaim))
                {
                    try
                    {
                        var userMetadata = System.Text.Json.JsonSerializer.Deserialize<Dictionary<string, object>>(userMetadataClaim);
                        name = userMetadata?.GetValueOrDefault("name")?.ToString() ?? "";
                        surname = userMetadata?.GetValueOrDefault("surname")?.ToString() ?? "";
                    }
                    catch (Exception ex)
                    {
                        _logger.LogError(ex, "Error parsing user_metadata");
                    }
                }
                
                if (!string.IsNullOrEmpty(email))
                {
                    _logger.LogInformation("Attempting to create user profile for {UserId} with email {Email}", userId, email);
                    
                    // Use the improved user creation method
                    var success = await _userService.EnsureUserExistsAsync(userId, email, name, surname);
                    if (success)
                    {
                        // Try to get the user again after creation
                        user = await _userService.GetUserByIdAsync(userId);
                        _logger.LogInformation("User profile created successfully for {UserId}", userId);
                    }
                    else
                    {
                        _logger.LogError("Failed to create user profile for {UserId}", userId);
                    }
                }
                
                if (user == null)
                {
                    _logger.LogWarning("User profile not found and could not be created for user: {UserId}", userId);
                    return NotFound(new { 
                        Error = "User profile not found and could not be created",
                        UserId = userId,
                        Email = email,
                        Message = "Please try again or contact support if the issue persists"
                    });
                }
            }

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
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting profile for user");
            return StatusCode(500, new { 
                Error = "Internal server error",
                Message = "An unexpected error occurred while retrieving profile data"
            });
        }
    }

    [HttpPut("profile")]
    public async Task<IActionResult> UpdateProfile([FromBody] UpdateProfileRequest request)
    {
        try
        {
            if (request == null)
            {
                return BadRequest("Request body is required");
            }

            // Validate input
            var validationResults = new List<ValidationResult>();
            var validationContext = new ValidationContext(request);
            if (!Validator.TryValidateObject(request, validationContext, validationResults, true))
            {
                return BadRequest(validationResults.Select(v => v.ErrorMessage));
            }

            // Supabase uses ClaimTypes.NameIdentifier for user ID
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            
            if (string.IsNullOrEmpty(userId))
            {
                _logger.LogWarning("User ID not found in token");
                return Unauthorized("User ID not found in token");
            }

            if (!Guid.TryParse(userId, out var userGuid))
            {
                _logger.LogWarning("Invalid user ID format: {UserId}", userId);
                return BadRequest("Invalid user ID format");
            }

            var success = await _userService.UpdateUserProfileAsync(userId, request);
            
            if (!success)
            {
                _logger.LogWarning("Failed to update profile for user: {UserId}", userId);
                return BadRequest("Failed to update profile");
            }

            return Ok(new { Message = "Profile updated successfully" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating profile for user");
            return StatusCode(500, "Internal server error");
        }
    }

    [HttpPost("create")]
    public async Task<IActionResult> CreateUser([FromBody] CreateUserRequest request)
    {
        try
        {
            if (request == null)
            {
                return BadRequest("Request body is required");
            }

            // Validate input
            var validationResults = new List<ValidationResult>();
            var validationContext = new ValidationContext(request);
            if (!Validator.TryValidateObject(request, validationContext, validationResults, true))
            {
                return BadRequest(validationResults.Select(v => v.ErrorMessage));
            }

            // Supabase uses ClaimTypes.NameIdentifier for user ID
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            
            if (string.IsNullOrEmpty(userId))
            {
                _logger.LogWarning("User ID not found in token");
                return Unauthorized("User ID not found in token");
            }

            if (!Guid.TryParse(userId, out var userGuid))
            {
                _logger.LogWarning("Invalid user ID format: {UserId}", userId);
                return BadRequest("Invalid user ID format");
            }

            var success = await _userService.CreateUserAsync(userId, request.Email, request.Name, request.Surname);
            
            if (!success)
            {
                _logger.LogWarning("Failed to create user profile for user: {UserId}", userId);
                return BadRequest("Failed to create user profile");
            }

            return Ok(new { Message = "User profile created successfully" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating user profile");
            return StatusCode(500, "Internal server error");
        }
    }
    
    [HttpGet("balance")]
    [EnableCors("AllowFrontend")]
    public async Task<IActionResult> GetBalance()
    {
        try
        {
            // Supabase uses ClaimTypes.NameIdentifier for user ID
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            
            if (string.IsNullOrEmpty(userId))
            {
                _logger.LogWarning("User ID not found in token");
                return Unauthorized("User ID not found in token");
            }

            if (!Guid.TryParse(userId, out var userGuid))
            {
                _logger.LogWarning("Invalid user ID format: {UserId}", userId);
                return BadRequest($"Invalid user ID format: {userId}");
            }

            try
            {
                // First, try to get existing balance
                var balanceResult = await _databaseService.ExecuteWithRetryAsync(async connection =>
                {
                    const string query = @"
                        SELECT COALESCE(SUM(balance), 0) as total_balance, 
                               COALESCE(MAX(currency), 'TRY') as currency
                        FROM accounts 
                        WHERE user_id = @userId::uuid";

                    using var command = new NpgsqlCommand(query, connection);
                    command.Parameters.AddWithValue("@userId", userGuid);

                    using var reader = await command.ExecuteReaderAsync();
                    if (await reader.ReadAsync())
                    {
                        var balance = Convert.ToDecimal(reader["total_balance"]);
                        var currency = reader["currency"].ToString() ?? "TRY";

                        return new { Balance = balance, Currency = currency, HasData = true };
                    }
                    return new { Balance = 0.00m, Currency = "TRY", HasData = false };
                });

                if (balanceResult.HasData)
                {
                    return Ok(new
                    {
                        UserId = userId,
                        Balance = balanceResult.Balance,
                        Currency = balanceResult.Currency
                    });
                }

                // If no accounts found, create default accounts
                await CreateDefaultAccounts(userId);
                
                // Try to get balance again
                var retryResult = await _databaseService.ExecuteWithRetryAsync(async connection =>
                {
                    const string retryQuery = @"
                        SELECT COALESCE(SUM(balance), 0) as total_balance, 
                               COALESCE(MAX(currency), 'TRY') as currency
                        FROM accounts 
                        WHERE user_id = @userId::uuid";

                    using var retryCommand = new NpgsqlCommand(retryQuery, connection);
                    retryCommand.Parameters.AddWithValue("@userId", userGuid);
                    
                    using var retryReader = await retryCommand.ExecuteReaderAsync();
                    if (await retryReader.ReadAsync())
                    {
                        var balance = Convert.ToDecimal(retryReader["total_balance"]);
                        var currency = retryReader["currency"].ToString() ?? "TRY";

                        return new { Balance = balance, Currency = currency, HasData = true };
                    }
                    return new { Balance = 0.00m, Currency = "TRY", HasData = false };
                });

                if (retryResult.HasData)
                {
                    return Ok(new
                    {
                        UserId = userId,
                        Balance = retryResult.Balance,
                        Currency = retryResult.Currency
                    });
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting balance for user: {UserId}", userId);
            }

            return Ok(new
            {
                UserId = userId,
                Balance = 0.00m,
                Currency = "TRY"
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting balance for user");
            return StatusCode(500, "Internal server error");
        }
    }

    [HttpGet]
    public async Task<IActionResult> GetAccounts()
    {
        string? userId = null;
        
        try
        {
            // Supabase uses ClaimTypes.NameIdentifier for user ID
            userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            
            if (string.IsNullOrEmpty(userId))
            {
                _logger.LogWarning("User ID not found in token");
                return Unauthorized("User ID not found in token");
            }

            if (!Guid.TryParse(userId, out var userGuid))
            {
                _logger.LogWarning("Invalid user ID format: {UserId}", userId);
                return BadRequest($"Invalid user ID format: {userId}");
            }

            try
            {
                var accounts = await _databaseService.ExecuteWithRetryAsync(async connection =>
                {
                    const string query = @"
                        SELECT id, user_id, account_name, account_type, balance, currency, created_at
                        FROM accounts
                        WHERE user_id = @userId::uuid
                        ORDER BY created_at DESC";

                    using var command = new NpgsqlCommand(query, connection);
                    command.CommandTimeout = 30;
                    command.Parameters.AddWithValue("@userId", userGuid);

                    var accountList = new List<Account>();
                    using var reader = await command.ExecuteReaderAsync();
                    
                    while (await reader.ReadAsync())
                    {
                        accountList.Add(new Account
                        {
                            Id = reader["id"].ToString() ?? "",
                            UserId = reader["user_id"].ToString() ?? "",
                            AccountName = reader["account_name"].ToString() ?? "",
                            AccountType = reader["account_type"].ToString() ?? "",
                            Balance = Convert.ToDecimal(reader["balance"]),
                            Currency = reader["currency"].ToString() ?? "",
                            CreatedAt = Convert.ToDateTime(reader["created_at"])
                        });
                    }

                    return accountList;
                });

                // If no accounts found, create default accounts
                if (accounts.Count == 0)
                {
                    await CreateDefaultAccounts(userId);
                    return await GetAccounts(); // Call again
                }

                return Ok(accounts);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Database error in GetAccounts for user: {UserId}", userId);
                return StatusCode(500, "Database error occurred. Please try again.");
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error in GetAccounts for user: {UserId}", userId);
            return StatusCode(500, "Internal server error");
        }
    }

    [HttpGet("test-db")]
    public async Task<IActionResult> TestDatabaseConnection()
    {
        try
        {
            var result = await _databaseService.ExecuteWithRetryAsync(async connection =>
            {
                using var command = new NpgsqlCommand("SELECT 1 as test, NOW() as timestamp", connection);
                command.CommandTimeout = 30;
                
                using var reader = await command.ExecuteReaderAsync();
                if (await reader.ReadAsync())
                {
                    return new
                    {
                        Test = reader["test"],
                        Timestamp = reader["timestamp"],
                        ConnectionId = connection.ProcessID,
                        Database = connection.Database,
                        ServerVersion = connection.ServerVersion
                    };
                }
                return null;
            });

            if (result != null)
            {
                return Ok(new
                {
                    Status = "Database connection successful",
                    Data = result,
                    Message = "Database is accessible and responding"
                });
            }
            else
            {
                return BadRequest("Database query returned no results");
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Database connection test failed");
            return StatusCode(500, new
            {
                Status = "Database connection failed",
                Error = ex.Message,
                Message = "Database is not accessible"
            });
        }
    }

    [HttpGet("connection-test")]
    public async Task<IActionResult> TestConnection()
    {
        try
        {
            var result = await _databaseService.ExecuteWithRetryAsync(async connection =>
            {
                using var command = new NpgsqlCommand("SELECT 1 as test", connection);
                command.CommandTimeout = 10;
                var testResult = await command.ExecuteScalarAsync();
                return testResult;
            });

            return Ok(new { 
                message = "Database connection successful", 
                result = result,
                timestamp = DateTime.UtcNow
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Database connection test failed");
            return StatusCode(500, new { 
                message = "Database connection failed", 
                error = ex.Message,
                timestamp = DateTime.UtcNow
            });
        }
    }

    private async Task CreateDefaultAccounts(string userId)
    {
        try
        {
            if (!Guid.TryParse(userId, out var userGuid))
            {
                _logger.LogWarning("Invalid user ID format: {UserId}", userId);
                return;
            }

            await _databaseService.ExecuteWithRetryAsync(async connection =>
            {
                // Ensure user exists in the database
                await EnsureUserExists(connection, userGuid);

                var defaultAccounts = new[]
                {
                    new { AccountName = "Ana Hesap", AccountType = "checking", Balance = 0.00m, Currency = "TRY" },
                    new { AccountName = "Tasarruf Hesabı", AccountType = "savings", Balance = 0.00m, Currency = "TRY" }
                };

                const string insertQuery = @"
                    INSERT INTO accounts (id, user_id, account_name, account_type, balance, currency, created_at)
                    VALUES (@id, @userId, @accountName, @accountType, @balance, @currency, @createdAt)";

                foreach (var account in defaultAccounts)
                {
                    using var command = new NpgsqlCommand(insertQuery, connection);
                    command.Parameters.AddWithValue("@id", Guid.NewGuid());
                    command.Parameters.AddWithValue("@userId", userGuid);
                    command.Parameters.AddWithValue("@accountName", account.AccountName);
                    command.Parameters.AddWithValue("@accountType", account.AccountType);
                    command.Parameters.AddWithValue("@balance", account.Balance);
                    command.Parameters.AddWithValue("@currency", account.Currency);
                    command.Parameters.AddWithValue("@createdAt", DateTime.UtcNow);

                    await command.ExecuteNonQueryAsync();
                }

                return true;
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating default accounts for user: {UserId}", userId);
        }
    }

    private async Task EnsureUserExists(NpgsqlConnection connection, Guid userGuid)
    {
        try
        {
            // Check if user exists
            const string checkQuery = "SELECT COUNT(*) FROM users WHERE id = @userId::uuid";
            using var checkCommand = new NpgsqlCommand(checkQuery, connection);
            checkCommand.Parameters.AddWithValue("@userId", userGuid);
            
            var userCount = Convert.ToInt32(await checkCommand.ExecuteScalarAsync());
            
            if (userCount == 0)
            {
                // Get user info from claims
                var email = User.FindFirst(ClaimTypes.Email)?.Value ?? $"user_{userGuid}@example.com";
                var name = User.FindFirst("name")?.Value ?? "User";
                var surname = User.FindFirst("surname")?.Value ?? "Name";
                
                // Create user
                const string insertQuery = @"
                    INSERT INTO users (id, email, name, surname, profile_picture_url, created_at)
                    VALUES (@id, @email, @name, @surname, @profilePictureUrl, @createdAt)";
                
                using var insertCommand = new NpgsqlCommand(insertQuery, connection);
                insertCommand.Parameters.AddWithValue("@id", userGuid);
                insertCommand.Parameters.AddWithValue("@email", email);
                insertCommand.Parameters.AddWithValue("@name", name);
                insertCommand.Parameters.AddWithValue("@surname", surname);
                insertCommand.Parameters.AddWithValue("@profilePictureUrl", "default.jpg");
                insertCommand.Parameters.AddWithValue("@createdAt", DateTime.UtcNow);
                
                await insertCommand.ExecuteNonQueryAsync();
                _logger.LogInformation("User created with ID: {UserId}", userGuid);
            }
            else
            {
                _logger.LogInformation("User already exists with ID: {UserId}", userGuid);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error ensuring user exists: {UserId}", userGuid);
        }
    }
}