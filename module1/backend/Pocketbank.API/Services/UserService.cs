using Npgsql;
using Pocketbank.API.Models;
using Pocketbank.API.Controllers;
using System.Text.Json;

namespace Pocketbank.API.Services;

public class UserService
{
    private readonly string _connectionString;
    private readonly ILogger<UserService> _logger;

    public UserService(IConfiguration configuration, ILogger<UserService> logger)
    {
        _connectionString = configuration.GetConnectionString("DefaultConnection") ?? throw new InvalidOperationException("Connection string not found");
        _logger = logger;
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
                Id = reader["id"].ToString() ?? string.Empty,
                Email = reader["email"].ToString() ?? string.Empty,
                Name = reader["name"].ToString() ?? string.Empty,
                Surname = reader["surname"].ToString() ?? string.Empty,
                ProfilePictureUrl = reader["profile_picture_url"] == DBNull.Value ? null : reader["profile_picture_url"].ToString(),
                CreatedAt = reader["created_at"] == DBNull.Value ? DateTime.MinValue : Convert.ToDateTime(reader["created_at"])
            };
        }

        return null;
    }


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

    public async Task<bool> CreateOrUpdateUserFromAuthAsync(SupabaseUserRecord authUser)
    {
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
            using var connection = new NpgsqlConnection(_connectionString);
            await connection.OpenAsync();

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

            // Check if user exists
            const string checkQuery = "SELECT COUNT(*) FROM users WHERE id = @userId::uuid";
            using var checkCommand = new NpgsqlCommand(checkQuery, connection);
            checkCommand.Parameters.AddWithValue("@userId", authUser.Id);
            var userExists = Convert.ToInt32(await checkCommand.ExecuteScalarAsync()) > 0;

            if (!userExists)
            {
                // Insert new user
                const string insertQuery = @"
                    INSERT INTO users (id, email, name, surname)
                    VALUES (@userId::uuid, @email, @name, @surname)";

                using var insertCommand = new NpgsqlCommand(insertQuery, connection);
                insertCommand.Parameters.AddWithValue("@userId", authUser.Id);
                insertCommand.Parameters.AddWithValue("@email", authUser.Email);
                insertCommand.Parameters.AddWithValue("@name", name);
                insertCommand.Parameters.AddWithValue("@surname", surname);

                await insertCommand.ExecuteNonQueryAsync();
                _logger.LogInformation("Created new user {UserId} in local database", authUser.Id);

                // Create default account for new user
                await CreateDefaultAccountAsync(connection, authUser.Id);
            }
            else
            {
                // Update existing user
                const string updateQuery = @"
                    UPDATE users 
                    SET email = @email, name = @name, surname = @surname
                    WHERE id = @userId::uuid";

                using var updateCommand = new NpgsqlCommand(updateQuery, connection);
                updateCommand.Parameters.AddWithValue("@userId", authUser.Id);
                updateCommand.Parameters.AddWithValue("@email", authUser.Email);
                updateCommand.Parameters.AddWithValue("@name", name);
                updateCommand.Parameters.AddWithValue("@surname", surname);

                await updateCommand.ExecuteNonQueryAsync();
                _logger.LogInformation("Updated user {UserId} in local database", authUser.Id);
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
}