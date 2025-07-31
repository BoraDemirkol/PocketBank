using Npgsql;
using Pocketbank.API.Models;

namespace Pocketbank.API.Services;

public class UserService
{
    private readonly string _connectionString;

    public UserService(IConfiguration configuration)
    {
        _connectionString = configuration.GetConnectionString("DefaultConnection") ?? throw new InvalidOperationException("Connection string not found");
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
}