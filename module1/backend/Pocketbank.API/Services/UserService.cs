using Npgsql;
using Pocketbank.API.Models;
using Microsoft.Extensions.Logging;

namespace Pocketbank.API.Services;

public class UserService : IUserService
{
    private readonly IDatabaseService _databaseService;
    private readonly ILogger<UserService> _logger;

    public UserService(IDatabaseService databaseService, ILogger<UserService> logger)
    {
        _databaseService = databaseService ?? throw new ArgumentNullException(nameof(databaseService));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    }

    public async Task<User> GetUserByIdAsync(Guid userId)
    {
        try
        {
            var user = await _databaseService.ExecuteWithRetryAsync(async connection =>
            {
                const string query = @"
                    SELECT id, email, name, surname, profile_picture_url, created_at
                    FROM users
                    WHERE id = @userId::uuid";

                using var command = new NpgsqlCommand(query, connection);
                command.CommandTimeout = 60; // Increased timeout
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
                        ProfilePictureUrl = reader["profile_picture_url"]?.ToString() ?? string.Empty,
                        CreatedAt = reader["created_at"] == DBNull.Value ? DateTime.MinValue : Convert.ToDateTime(reader["created_at"])
                    };
                }
                throw new InvalidOperationException("User not found");
            });

            return user;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting user by ID: {UserId}", userId);
            throw;
        }
    }

    public async Task<User?> GetUserByIdAsync(string userId)
    {
        try
        {
            if (!Guid.TryParse(userId, out var guidUserId))
            {
                _logger.LogWarning("Invalid user ID format: {UserId}", userId);
                return null;
            }

            return await GetUserByIdAsync(guidUserId);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting user by string ID: {UserId}", userId);
            return null;
        }
    }

    public async Task<User> GetUserByEmailAsync(string email)
    {
        try
        {
            var user = await _databaseService.ExecuteWithRetryAsync(async connection =>
            {
                const string query = @"
                    SELECT id, email, name, surname, profile_picture_url, created_at
                    FROM users
                    WHERE email = @email";

                using var command = new NpgsqlCommand(query, connection);
                command.CommandTimeout = 60;
                command.Parameters.AddWithValue("@email", email);

                using var reader = await command.ExecuteReaderAsync();
                if (await reader.ReadAsync())
                {
                    return new User
                    {
                        Id = reader["id"].ToString() ?? string.Empty,
                        Email = reader["email"].ToString() ?? string.Empty,
                        Name = reader["name"].ToString() ?? string.Empty,
                        Surname = reader["surname"].ToString() ?? string.Empty,
                        ProfilePictureUrl = reader["profile_picture_url"]?.ToString() ?? string.Empty,
                        CreatedAt = reader["created_at"] == DBNull.Value ? DateTime.MinValue : Convert.ToDateTime(reader["created_at"])
                    };
                }
                throw new InvalidOperationException("User not found");
            });

            return user;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting user by email: {Email}", email);
            throw;
        }
    }

    public async Task<User> CreateUserAsync(User user)
    {
        try
        {
            var result = await _databaseService.ExecuteWithRetryAsync(async connection =>
            {
                const string query = @"
                    INSERT INTO users (id, email, name, surname, profile_picture_url, created_at)
                    VALUES (@id::uuid, @email, @name, @surname, @profilePictureUrl, @createdAt)
                    RETURNING id";

                using var command = new NpgsqlCommand(query, connection);
                command.CommandTimeout = 60;
                command.Parameters.AddWithValue("@id", Guid.Parse(user.Id));
                command.Parameters.AddWithValue("@email", user.Email);
                command.Parameters.AddWithValue("@name", user.Name);
                command.Parameters.AddWithValue("@surname", user.Surname);
                command.Parameters.AddWithValue("@profilePictureUrl", user.ProfilePictureUrl ?? "");
                command.Parameters.AddWithValue("@createdAt", user.CreatedAt);

                var result = await command.ExecuteScalarAsync();
                return result?.ToString();
            });

            if (string.IsNullOrEmpty(result))
                throw new InvalidOperationException("Failed to create user");

            return user;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating user: {Email}", user.Email);
            throw;
        }
    }

    public async Task<bool> UpdateUserAsync(User user)
    {
        try
        {
            var result = await _databaseService.ExecuteWithRetryAsync(async connection =>
            {
                const string query = @"
                    UPDATE users 
                    SET name = @name, surname = @surname, profile_picture_url = @profilePictureUrl
                    WHERE id = @id::uuid";

                using var command = new NpgsqlCommand(query, connection);
                command.CommandTimeout = 60;
                command.Parameters.AddWithValue("@id", Guid.Parse(user.Id));
                command.Parameters.AddWithValue("@name", user.Name);
                command.Parameters.AddWithValue("@surname", user.Surname);
                command.Parameters.AddWithValue("@profilePictureUrl", user.ProfilePictureUrl ?? "");

                var rowsAffected = await command.ExecuteNonQueryAsync();
                return rowsAffected > 0;
            });

            return result;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating user: {UserId}", user.Id);
            return false;
        }
    }

    public async Task<bool> DeleteUserAsync(Guid userId)
    {
        try
        {
            var result = await _databaseService.ExecuteWithRetryAsync(async connection =>
            {
                const string query = @"
                    DELETE FROM users 
                    WHERE id = @userId::uuid";

                using var command = new NpgsqlCommand(query, connection);
                command.CommandTimeout = 60;
                command.Parameters.AddWithValue("@userId", userId);

                var rowsAffected = await command.ExecuteNonQueryAsync();
                return rowsAffected > 0;
            });

            return result;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting user: {UserId}", userId);
            return false;
        }
    }



    public async Task<bool> UpdateUserProfileAsync(string userId, UpdateProfileRequest request)
    {
        try
        {
            var result = await _databaseService.ExecuteWithRetryAsync(async connection =>
            {
                const string query = @"
                    UPDATE users 
                    SET name = @name, surname = @surname, profile_picture_url = @profilePictureUrl
                    WHERE id = @userId::uuid";

                using var command = new NpgsqlCommand(query, connection);
                command.CommandTimeout = 60; // Increased timeout
                command.Parameters.AddWithValue("@userId", Guid.Parse(userId));
                command.Parameters.AddWithValue("@name", request.Name);
                command.Parameters.AddWithValue("@surname", request.Surname);
                command.Parameters.AddWithValue("@profilePictureUrl", request.ProfilePictureUrl ?? "");

                var rowsAffected = await command.ExecuteNonQueryAsync();
                return rowsAffected > 0;
            });

            return result;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Database error in UpdateUserProfileAsync: {UserId}", userId);
            return false;
        }
    }

    public async Task<bool> CreateUserAsync(string userId, string email, string name = "", string surname = "")
    {
        try
        {
            _logger.LogInformation("Attempting to create user: {UserId}, Email: {Email}, Name: {Name}, Surname: {Surname}", 
                userId, email, name, surname);

            var result = await _databaseService.ExecuteWithRetryAsync(async connection =>
            {
                // First check if user already exists
                const string checkQuery = @"
                    SELECT COUNT(*) FROM users WHERE id = @userId::uuid";

                using var checkCommand = new NpgsqlCommand(checkQuery, connection);
                checkCommand.CommandTimeout = 60;
                checkCommand.Parameters.AddWithValue("@userId", Guid.Parse(userId));

                var existingCount = Convert.ToInt32(await checkCommand.ExecuteScalarAsync());
                
                if (existingCount > 0)
                {
                    _logger.LogInformation("User {UserId} already exists, skipping creation", userId);
                    return true; // User already exists, consider this success
                }

                // Create new user
                const string insertQuery = @"
                    INSERT INTO users (id, email, name, surname, profile_picture_url, created_at)
                    VALUES (@userId::uuid, @email, @name, @surname, @profilePictureUrl, @createdAt)";

                using var insertCommand = new NpgsqlCommand(insertQuery, connection);
                insertCommand.CommandTimeout = 60;
                insertCommand.Parameters.AddWithValue("@userId", Guid.Parse(userId));
                insertCommand.Parameters.AddWithValue("@email", email);
                insertCommand.Parameters.AddWithValue("@name", name ?? "");
                insertCommand.Parameters.AddWithValue("@surname", surname ?? "");
                insertCommand.Parameters.AddWithValue("@profilePictureUrl", "default-avatar.png");
                insertCommand.Parameters.AddWithValue("@createdAt", DateTime.UtcNow);

                var rowsAffected = await insertCommand.ExecuteNonQueryAsync();
                _logger.LogInformation("CreateUserAsync: Inserted {RowsAffected} rows for user {UserId}", rowsAffected, userId);
                return rowsAffected > 0;
            });

            if (result)
            {
                _logger.LogInformation("Successfully created user profile for {UserId}", userId);
            }
            else
            {
                _logger.LogWarning("Failed to create user profile for {UserId}", userId);
            }

            return result;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating user: {UserId}", userId);
            return false;
        }
    }

    public async Task<bool> EnsureUserExistsAsync(string userId, string email, string name = "", string surname = "")
    {
        try
        {
            // First try to get the user
            var existingUser = await GetUserByIdAsync(userId);
            if (existingUser != null)
            {
                _logger.LogInformation("User {UserId} already exists", userId);
                return true;
            }

            // If user doesn't exist, create them
            _logger.LogInformation("User {UserId} not found, creating new profile", userId);
            return await CreateUserAsync(userId, email, name, surname);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error ensuring user exists: {UserId}", userId);
            return false;
        }
    }
}