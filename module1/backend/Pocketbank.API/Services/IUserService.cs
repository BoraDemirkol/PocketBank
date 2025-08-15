using Pocketbank.API.Models;

namespace Pocketbank.API.Services;

public interface IUserService
{
    Task<User> GetUserByIdAsync(Guid userId);
    Task<User?> GetUserByIdAsync(string userId);
    Task<User> GetUserByEmailAsync(string email);
    Task<User> CreateUserAsync(User user);
    Task<bool> UpdateUserAsync(User user);
    Task<bool> DeleteUserAsync(Guid userId);
    Task<bool> UpdateUserProfileAsync(string userId, UpdateProfileRequest request);
    Task<bool> CreateUserAsync(string userId, string email, string name = "", string surname = "");
    Task<bool> EnsureUserExistsAsync(string userId, string email, string name = "", string surname = "");
}
