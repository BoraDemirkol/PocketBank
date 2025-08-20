<<<<<<< HEAD
using Microsoft.EntityFrameworkCore;
using Npgsql;
using Pocketbank.API.Data;
using Pocketbank.API.Models;
using Pocketbank.API.Controllers;
using System.Text.Json;
=======
using Npgsql;
using Pocketbank.API.Models;
>>>>>>> 9100c27ce5793f4af8ad037a2cd89bdf89599a38

namespace Pocketbank.API.Services;

public class UserService
{
    private readonly string _connectionString;
<<<<<<< HEAD
    private readonly ApplicationDbContext _context;
    private readonly ILogger<UserService> _logger;

    public UserService(IConfiguration configuration, ApplicationDbContext context, ILogger<UserService> logger)
    {
        _connectionString = configuration.GetConnectionString("DefaultConnection") ?? throw new InvalidOperationException("Connection string not found");
        _context = context;
        _logger = logger;
=======

    public UserService(IConfiguration configuration)
    {
        _connectionString = configuration.GetConnectionString("DefaultConnection") ?? throw new InvalidOperationException("Connection string not found");
>>>>>>> 9100c27ce5793f4af8ad037a2cd89bdf89599a38
    }

    public async Task<User?> GetUserByIdAsync(string userId)
    {
        using var connection = new NpgsqlConnection(_connectionString);
        await connection.OpenAsync();

        const string query = @"
            SELECT id, email, name, surname, profile_picture_url, created_at
            FROM users
            WHERE id = @userId::uuid";

        using var command = new NpgsqlCommand(query, connection);
        command.Parameters.AddWithValue("@userId", userId);

        using var reader = await command.ExecuteReaderAsync();
        if (await reader.ReadAsync())
        {
            return new User
            {
                Id = Guid.Parse(reader["id"].ToString() ?? string.Empty),
                Email = reader["email"].ToString() ?? string.Empty,
                Name = reader["name"].ToString() ?? string.Empty,
                Surname = reader["surname"].ToString() ?? string.Empty,
<<<<<<< HEAD
                ProfilePictureUrl = reader["profile_picture_url"] == DBNull.Value ? null : reader["profile_picture_url"].ToString(),
                CreatedAt = reader["created_at"] == DBNull.Value ? DateTime.MinValue : Convert.ToDateTime(reader["created_at"])
=======
                ProfilePictureUrl = reader["profile_picture_url"] == DBNull.Value ? string.Empty : reader["profile_picture_url"].ToString() ?? string.Empty,
                CreatedAt = reader["created_at"] == DBNull.Value ? null : Convert.ToDateTime(reader["created_at"])
>>>>>>> 9100c27ce5793f4af8ad037a2cd89bdf89599a38
            };
        }

        return null;
    }

<<<<<<< HEAD
    public async Task<User?> GetUserByEmailAsync(string email)
    {
        using var connection = new NpgsqlConnection(_connectionString);
        await connection.OpenAsync();

        const string query = @"
            SELECT id, email, name, surname, profile_picture_url, created_at
            FROM users
            WHERE email = @email";

        using var command = new NpgsqlCommand(query, connection);
        command.Parameters.AddWithValue("@email", email);

        using var reader = await command.ExecuteReaderAsync();
        if (await reader.ReadAsync())
        {
            return new User
            {
                Id = Guid.Parse(reader["id"].ToString() ?? string.Empty),
                Email = reader["email"].ToString() ?? string.Empty,
                Name = reader["name"].ToString() ?? string.Empty,
                Surname = reader["surname"].ToString() ?? string.Empty,
                ProfilePictureUrl = reader["profile_picture_url"] == DBNull.Value ? null : reader["profile_picture_url"].ToString(),
                CreatedAt = reader["created_at"] == DBNull.Value ? DateTime.MinValue : Convert.ToDateTime(reader["created_at"])
            };
        }

        return null;
    }


=======
>>>>>>> 9100c27ce5793f4af8ad037a2cd89bdf89599a38
    public async Task<bool> UpdateUserProfileAsync(string userId, UpdateProfileRequest request)
    {
        using var connection = new NpgsqlConnection(_connectionString);
        await connection.OpenAsync();

        const string query = @"
            UPDATE users 
            SET name = @name, surname = @surname, profile_picture_url = @profilePictureUrl
            WHERE id = @userId::uuid";

        using var command = new NpgsqlCommand(query, connection);
        command.Parameters.AddWithValue("@userId", userId);
        command.Parameters.AddWithValue("@name", request.Name);
        command.Parameters.AddWithValue("@surname", request.Surname);
        command.Parameters.AddWithValue("@profilePictureUrl", request.ProfilePictureUrl ?? (object)DBNull.Value);

        var rowsAffected = await command.ExecuteNonQueryAsync();
        return rowsAffected > 0;
    }
<<<<<<< HEAD

    public async Task<bool> CreateOrUpdateUserFromAuthAsync(SupabaseUserRecord authUser)
    {
        _logger.LogInformation("CreateOrUpdateUserFromAuthAsync called with user ID: {UserId}, Email: {Email}", authUser.Id, authUser.Email);
        
        if (string.IsNullOrEmpty(authUser.Id) || string.IsNullOrEmpty(authUser.Email))
        {
            _logger.LogWarning("Invalid user data received from Supabase webhook");
            return false;
        }

        // Only proceed if email is confirmed
        if (authUser.EmailConfirmedAt == null)
        {
            _logger.LogInformation("Skipping user creation - email not confirmed yet for user {UserId}", authUser.Id);
            return true;
        }

        try
        {
            _logger.LogInformation("Starting user creation/update process for user {UserId}", authUser.Id);
            // Parse the user ID to GUID
            if (!Guid.TryParse(authUser.Id, out var userId))
            {
                _logger.LogWarning("Invalid user ID format from Supabase: {UserId}", authUser.Id);
                return false;
            }

            // Extract name and surname from metadata
            string name = "";
            string surname = "";
            
            if (authUser.RawUserMetaData.HasValue)
            {
                var metadata = authUser.RawUserMetaData.Value;
                if (metadata.TryGetProperty("name", out var nameElement))
                    name = nameElement.GetString() ?? "";
                if (metadata.TryGetProperty("surname", out var surnameElement))
                    surname = surnameElement.GetString() ?? "";
            }

            // Check if user exists in local database by ID or email (safe approach)
            _logger.LogInformation("Checking if user {UserId} exists in database", userId);
            var existingUser = await _context.Users.FirstOrDefaultAsync(u => u.Id == userId);
            var existingUserByEmail = await _context.Users.FirstOrDefaultAsync(u => u.Email == authUser.Email);
            
            if (existingUser != null)
            {
                _logger.LogInformation("User {UserId} found by ID, updating existing user", userId);
                // Update existing user found by ID (normal case)
                existingUser.Email = authUser.Email;
                existingUser.Name = name;
                existingUser.Surname = surname;

                await _context.SaveChangesAsync();
                _logger.LogInformation("Updated user {UserId} in local database", authUser.Id);
            }
            else if (existingUserByEmail != null)
            {
                _logger.LogWarning("User with email {Email} exists but with different ID. Current DB ID: {DbUserId}, Supabase ID: {SupabaseUserId}", 
                    authUser.Email, existingUserByEmail.Id, userId);
                
                // SAFE APPROACH: Just update the existing user's information but keep the original ID
                // This preserves all relationships and data
                existingUserByEmail.Name = name;
                existingUserByEmail.Surname = surname;

                await _context.SaveChangesAsync();
                _logger.LogInformation("Updated existing user by email {Email} (ID mismatch handled safely)", authUser.Email);
            }
            else
            {
                _logger.LogInformation("User {UserId} not found, creating new user", userId);
                // Create new user in local database
                var newUser = new User
                {
                    Id = userId,
                    Email = authUser.Email,
                    Name = name,
                    Surname = surname,
                    CreatedAt = DateTime.UtcNow,
                    PasswordHash = "SUPABASE_AUTH" // Password handled by Supabase
                };

                _context.Users.Add(newUser);
                await _context.SaveChangesAsync();
                _logger.LogInformation("Created new user {UserId} in local database", authUser.Id);

                // Create default account for new user
                _logger.LogInformation("Creating default account for user {UserId}", userId);
                await CreateDefaultAccountWithEFAsync(userId);
            }

            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating/updating user {UserId} from Supabase auth", authUser.Id);
            return false;
        }
    }

    private async Task CreateDefaultAccountAsync(NpgsqlConnection connection, string userId)
    {
        var accountTypes = new[] { "Vadeli", "Vadesiz", "Kredi Kartı" };
        var accountNames = new[] { "Döviz Hesabı", "Harçlik Hesabı", "Biriken Hesap" };
        var random = new Random();
        
        var randomAccountType = accountTypes[random.Next(accountTypes.Length)];
        var randomAccountName = accountNames[random.Next(accountNames.Length)];
        var randomBalance = random.Next(0, 25000);

        const string insertAccountQuery = @"
            INSERT INTO accounts (user_id, account_name, account_type, balance, currency)
            VALUES (@userId::uuid, @accountName, @accountType, @balance, 'TRY')";

        using var command = new NpgsqlCommand(insertAccountQuery, connection);
        command.Parameters.AddWithValue("@userId", userId);
        command.Parameters.AddWithValue("@accountName", randomAccountName);
        command.Parameters.AddWithValue("@accountType", randomAccountType);
        command.Parameters.AddWithValue("@balance", randomBalance);

        await command.ExecuteNonQueryAsync();
        _logger.LogInformation("Created default account for user {UserId} with balance {Balance}", userId, randomBalance);
    }

    private async Task CreateDefaultAccountWithEFAsync(Guid userId)
    {
        var accountTypes = new[] { "Vadeli", "Vadesiz", "Kredi Kartı" };
        var accountNames = new[] { "Döviz Hesabı", "Harçlik Hesabı", "Biriken Hesap" };
        var random = new Random();
        
        var randomAccountType = accountTypes[random.Next(accountTypes.Length)];
        var randomAccountName = accountNames[random.Next(accountNames.Length)];
        var randomBalance = random.Next(0, 25000);

        var account = new Account
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            AccountName = randomAccountName,
            AccountType = randomAccountType,
            Balance = randomBalance,
            Currency = "TRY",
            CreatedAt = DateTime.UtcNow
        };

        _context.Accounts.Add(account);
        await _context.SaveChangesAsync();
        _logger.LogInformation("Created default account for user {UserId} with balance {Balance}", userId, randomBalance);
    }
=======
>>>>>>> 9100c27ce5793f4af8ad037a2cd89bdf89599a38
}