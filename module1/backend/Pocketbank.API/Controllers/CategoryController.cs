using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using Pocketbank.API.Models;
using Pocketbank.API.Services;
using Npgsql;
using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Cors;
using System.Collections.Generic;
using System.Linq;

namespace Pocketbank.API.Controllers;

[ApiController]
[Route("api/categories")]
[Authorize] // Enable authorization
[EnableCors("AllowFrontend")] // Enable CORS for this controller
public class CategoryController : ControllerBase
{
    private readonly IDatabaseService _databaseService;
    private readonly ICachingService _cachingService;
    private readonly ILogger<CategoryController> _logger;

    public CategoryController(IDatabaseService databaseService, ICachingService cachingService, ILogger<CategoryController> logger)
    {
        _databaseService = databaseService ?? throw new ArgumentNullException(nameof(databaseService));
        _cachingService = cachingService ?? throw new ArgumentNullException(nameof(cachingService));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    }

    [HttpGet("test")]
    [AllowAnonymous]
    public async Task<IActionResult> TestConnection()
    {
        try
        {
            var result = await _databaseService.ExecuteWithRetryAsync(async connection =>
            {
                // Test if categories table exists
                const string testQuery = "SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'categories'";
                using var testCommand = new NpgsqlCommand(testQuery, connection);
                var tableExists = Convert.ToInt32(await testCommand.ExecuteScalarAsync());
                
                if (tableExists == 0)
                {
                    throw new InvalidOperationException("Categories table does not exist");
                }
                
                // Test if we can read from categories table
                const string readQuery = "SELECT COUNT(*) FROM categories";
                using var readCommand = new NpgsqlCommand(readQuery, connection);
                var count = Convert.ToInt32(await readCommand.ExecuteScalarAsync());
                
                return new { 
                    Message = "Database connection successful", 
                    TableExists = true, 
                    CategoriesCount = count 
                };
            });
            
            return Ok(result);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ex.Message);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Test connection error");
            return StatusCode(500, "Database error");
        }
    }

    [HttpGet]
    public async Task<IActionResult> GetCategories()
    {
        string? userId = null;
        
        try
        {
            // Get user ID from JWT token
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
                // Use enhanced caching for better performance
                var cacheKey = $"categories_{userId}";
                var categories = await _cachingService.GetOrCreateAsync(cacheKey, async () =>
                {
                    _logger.LogDebug("Cache miss for categories, fetching from database for user: {UserId}", userId);
                    
                    return await _databaseService.ExecuteWithRetryAsync(async connection =>
                    {
                        // Optimized query with better indexing support
                        const string query = @"
                            SELECT id, name, icon, color, created_at
                            FROM categories
                            WHERE user_id = @userId::uuid
                            ORDER BY name ASC";

                        using var command = new NpgsqlCommand(query, connection);
                        command.CommandTimeout = 10; // Reduced timeout for faster failure
                        command.Parameters.AddWithValue("@userId", userGuid);

                        var categoryList = new List<Category>();
                        using var reader = await command.ExecuteReaderAsync();
                        
                        while (await reader.ReadAsync())
                        {
                            categoryList.Add(new Category
                            {
                                Id = reader["id"].ToString() ?? "",
                                UserId = userId,
                                Name = reader["name"].ToString() ?? "",
                                Icon = reader["icon"].ToString() ?? "",
                                Color = reader["color"].ToString() ?? "",
                                CreatedAt = reader["created_at"] is DateTime dateTime ? dateTime : DateTime.UtcNow
                            });
                        }

                        _logger.LogDebug("Retrieved {Count} categories from database for user: {UserId}", categoryList.Count, userId);
                        return categoryList;
                    });
                }, TimeSpan.FromMinutes(10)); // Increased cache duration to 10 minutes

                // If no categories exist, create default categories asynchronously
                if (categories.Count == 0)
                {
                    _logger.LogInformation("No categories found for user: {UserId}, creating default categories", userId);
                    
                    // Create default categories in background to avoid blocking the response
                    _ = Task.Run(async () =>
                    {
                        try
                        {
                            await CreateDefaultCategories(userId);
                            // Invalidate cache after creating default categories
                            _cachingService.Remove(cacheKey);
                            _logger.LogDebug("Cache invalidated after creating default categories for user: {UserId}", userId);
                        }
                        catch (Exception ex)
                        {
                            _logger.LogError(ex, "Error creating default categories in background for user: {UserId}", userId);
                        }
                    });

                    // Return empty list immediately instead of waiting
                    return Ok(new List<Category>());
                }

                return Ok(categories);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Database error in GetCategories for user: {UserId}", userId);
                return StatusCode(500, "Database error occurred. Please try again.");
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error in GetCategories for user: {UserId}", userId);
            return StatusCode(500, "Internal server error");
        }
    }

    private async Task CreateDefaultCategories(string userId)
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

                // Check if user already has categories to avoid duplicates
                const string checkQuery = "SELECT COUNT(*) FROM categories WHERE user_id = @userId::uuid";
                using var checkCommand = new NpgsqlCommand(checkQuery, connection);
                checkCommand.Parameters.AddWithValue("@userId", userGuid);
                var existingCount = Convert.ToInt32(await checkCommand.ExecuteScalarAsync());
                
                if (existingCount > 0)
                {
                    _logger.LogInformation("User already has categories. Skipping default category creation for user: {UserId}", userId);
                    return true;
                }

                // Comprehensive, non-duplicate default categories
                var defaultCategories = new[]
                {
                    // Essential Expense Categories
                    new { Name = "Market & Gıda", Icon = "🛒", Color = "#4ECDC4", Description = "Grocery stores, supermarkets, food items" },
                    new { Name = "Restoran & Kafe", Icon = "🍽️", Color = "#FF6B6B", Description = "Restaurants, cafes, dining out" },
                    new { Name = "Ulaşım", Icon = "🚗", Color = "#45B7D1", Description = "Transportation, fuel, parking, public transit" },
                    new { Name = "Fatura & Hizmetler", Icon = "💡", Color = "#FFA726", Description = "Bills, utilities, internet, phone" },
                    new { Name = "Konut & Kira", Icon = "🏠", Color = "#8E44AD", Description = "Rent, housing, maintenance" },
                    new { Name = "Sağlık & İlaç", Icon = "💊", Color = "#E74C3C", Description = "Healthcare, medicine, medical services" },
                    new { Name = "Eğlence & Spor", Icon = "🎬", Color = "#2ECC71", Description = "Entertainment, sports, recreation" },
                    new { Name = "Eğitim & Gelişim", Icon = "📚", Color = "#9B59B6", Description = "Education, courses, books, training" },
                    new { Name = "Giyim & Kişisel Bakım", Icon = "👕", Color = "#3498DB", Description = "Clothing, personal care, beauty" },
                    new { Name = "Teknoloji & Elektronik", Icon = "💻", Color = "#34495E", Description = "Electronics, gadgets, software" },
                    new { Name = "Alışveriş & Hediye", Icon = "🛍️", Color = "#E67E22", Description = "Shopping, gifts, miscellaneous purchases" },
                    
                    // Income Categories
                    new { Name = "Maaş & Ücret", Icon = "💰", Color = "#27AE60", Description = "Salary, wages, regular income" },
                    new { Name = "Ek Gelir", Icon = "💵", Color = "#16A085", Description = "Bonus, freelance, side income" },
                    new { Name = "Yatırım Geliri", Icon = "📈", Color = "#2980B9", Description = "Investment returns, dividends" }
                };

                const string insertQuery = @"
                    INSERT INTO categories (id, user_id, name, icon, color, created_at)
                    VALUES (@id, @userId, @name, @icon, @color, @createdAt)";

                foreach (var category in defaultCategories)
                {
                    using var command = new NpgsqlCommand(insertQuery, connection);
                    command.Parameters.AddWithValue("@id", Guid.NewGuid());
                    command.Parameters.AddWithValue("@userId", userGuid);
                    command.Parameters.AddWithValue("@name", category.Name);
                    command.Parameters.AddWithValue("@icon", category.Icon);
                    command.Parameters.AddWithValue("@color", category.Color);
                    command.Parameters.AddWithValue("@createdAt", DateTime.UtcNow);

                    await command.ExecuteNonQueryAsync();
                }

                _logger.LogInformation("Default categories created for user: {UserId}", userId);
                return true;
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating default categories for user: {UserId}", userId);
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

    [HttpPost]
    public async Task<IActionResult> CreateCategory([FromBody] Category category)
    {
        try
        {
            if (category == null)
            {
                return BadRequest("Request body is required");
            }

            // Validate input
            var validationResults = new List<ValidationResult>();
            var validationContext = new ValidationContext(category);
            if (!Validator.TryValidateObject(category, validationContext, validationResults, true))
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
                return BadRequest($"Invalid user ID format: {userId}");
            }

            // Check for duplicate categories
            var duplicateCheck = await CheckForDuplicateCategory(userGuid, category.Name);
            if (duplicateCheck.isDuplicate)
            {
                return BadRequest($"A category with the name '{category.Name}' already exists. {duplicateCheck.suggestion}");
            }

            var result = await _databaseService.ExecuteWithRetryAsync(async connection =>
            {
                const string query = @"
                    INSERT INTO categories (id, user_id, name, icon, color, created_at)
                    VALUES (@id, @userId, @name, @icon, @color, @createdAt)
                    RETURNING id";

                using var command = new NpgsqlCommand(query, connection);
                command.Parameters.AddWithValue("@id", Guid.NewGuid());
                command.Parameters.AddWithValue("@userId", userGuid);
                command.Parameters.AddWithValue("@name", category.Name);
                command.Parameters.AddWithValue("@icon", category.Icon);
                command.Parameters.AddWithValue("@color", category.Color);
                command.Parameters.AddWithValue("@createdAt", DateTime.UtcNow);

                var newId = await command.ExecuteScalarAsync();
                category.Id = newId?.ToString() ?? "";
                category.UserId = userId;

                _logger.LogInformation("Category created successfully. CategoryId: {CategoryId}, UserId: {UserId}", category.Id, userId);

                return true;
            });

            if (result)
            {
                // Invalidate cache after creating new category
                var cacheKey = $"categories_{userId}";
                _cachingService.Remove(cacheKey);
                _logger.LogDebug("Cache invalidated for key: {CacheKey}", cacheKey);
            }

            return Ok(new { Message = "Category created successfully", Category = category });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating category for user");
            return StatusCode(500, "Internal server error");
        }
    }

    private async Task<(bool isDuplicate, string suggestion)> CheckForDuplicateCategory(Guid userGuid, string categoryName)
    {
        try
        {
            var result = await _databaseService.ExecuteWithRetryAsync(async connection =>
            {
                const string query = @"
                    SELECT name, icon, color 
                    FROM categories 
                    WHERE user_id = @userId::uuid 
                    AND LOWER(name) = LOWER(@categoryName)";
                
                using var command = new NpgsqlCommand(query, connection);
                command.Parameters.AddWithValue("@userId", userGuid);
                command.Parameters.AddWithValue("@categoryName", categoryName);
                
                using var reader = await command.ExecuteReaderAsync();
                if (await reader.ReadAsync())
                {
                    var existingName = reader["name"].ToString() ?? "";
                    var existingIcon = reader["icon"].ToString() ?? "";
                    var existingColor = reader["color"].ToString() ?? "";
                    
                    return new { 
                        isDuplicate = true, 
                        existingName, 
                        existingIcon, 
                        existingColor 
                    };
                }
                
                return new { isDuplicate = false, existingName = "", existingIcon = "", existingColor = "" };
            });

            if (result.isDuplicate)
            {
                var suggestion = $"You already have a category '{result.existingName}' with icon {result.existingIcon}. Consider using a different name or merging with the existing category.";
                return (true, suggestion);
            }

            return (false, "");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error checking for duplicate categories");
            return (false, "Unable to check for duplicates due to an error.");
        }
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteCategory(string id)
    {
        try
        {
            if (string.IsNullOrEmpty(id))
            {
                return BadRequest("Category ID is required");
            }

            // Supabase uses ClaimTypes.NameIdentifier for user ID
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            
            if (string.IsNullOrEmpty(userId))
            {
                _logger.LogWarning("User ID not found in token");
                return Unauthorized("User ID not found in token");
            }

            if (!Guid.TryParse(id, out var categoryId))
            {
                _logger.LogWarning("Invalid category ID format: {CategoryId}", id);
                return BadRequest($"Invalid category ID format: {id}");
            }
            
            if (!Guid.TryParse(userId, out var userGuid))
            {
                _logger.LogWarning("Invalid user ID format: {UserId}", userId);
                return BadRequest($"Invalid user ID format: {userId}");
            }

            var rowsAffected = await _databaseService.ExecuteWithRetryAsync(async connection =>
            {
                const string query = @"
                    DELETE FROM categories 
                    WHERE id = @id AND user_id = @userId::uuid";

                using var command = new NpgsqlCommand(query, connection);
                command.Parameters.AddWithValue("@id", categoryId);
                command.Parameters.AddWithValue("@userId", userGuid);

                return await command.ExecuteNonQueryAsync();
            });
            
            if (rowsAffected > 0)
            {
                // Invalidate cache after deleting category
                var cacheKey = $"categories_{userId}";
                _cachingService.Remove(cacheKey);
                _logger.LogDebug("Cache invalidated for key: {CacheKey}", cacheKey);
                
                _logger.LogInformation("Category deleted successfully. CategoryId: {CategoryId}, UserId: {UserId}", categoryId, userId);
                return Ok(new { Message = "Category deleted successfully" });
            }
            else
            {
                _logger.LogWarning("Category not found or not authorized. CategoryId: {CategoryId}, UserId: {UserId}", categoryId, userId);
                return NotFound("Category not found or not authorized");
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting category");
            return StatusCode(500, "Internal server error");
        }
    }

    [HttpGet("similar")]
    public async Task<IActionResult> FindSimilarCategories()
    {
        string? userId = null;
        
        try
        {
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

            var result = await _databaseService.ExecuteWithRetryAsync(async connection =>
            {
                const string query = @"
                    SELECT id, name, icon, color, created_at
                    FROM categories
                    WHERE user_id = @userId::uuid
                    ORDER BY name";

                using var command = new NpgsqlCommand(query, connection);
                command.Parameters.AddWithValue("@userId", userGuid);

                var categoryList = new List<Category>();
                using var reader = await command.ExecuteReaderAsync();
                
                while (await reader.ReadAsync())
                {
                    categoryList.Add(new Category
                    {
                        Id = reader["id"].ToString() ?? "",
                        UserId = userId,
                        Name = reader["name"].ToString() ?? "",
                        Icon = reader["icon"].ToString() ?? "",
                        Color = reader["color"].ToString() ?? "",
                        CreatedAt = DateTime.UtcNow
                    });
                }

                return categoryList;
            });

            // Find similar categories based on name similarity
            var similarCategories = FindSimilarCategoryGroups(result);
            
            return Ok(new { 
                Categories = result, 
                SimilarGroups = similarCategories,
                Message = similarCategories.Count > 0 
                    ? "Found similar categories that might be duplicates" 
                    : "No similar categories found"
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error finding similar categories for user: {UserId}", userId);
            return StatusCode(500, "Internal server error");
        }
    }

    private List<List<Category>> FindSimilarCategoryGroups(List<Category> categories)
    {
        var groups = new List<List<Category>>();
        var processed = new HashSet<string>();

        foreach (var category in categories)
        {
            if (processed.Contains(category.Id)) continue;

            var similarGroup = new List<Category> { category };
            processed.Add(category.Id);

            // Find categories with similar names
            foreach (var other in categories)
            {
                if (processed.Contains(other.Id)) continue;

                if (AreCategoriesSimilar(category.Name, other.Name))
                {
                    similarGroup.Add(other);
                    processed.Add(other.Id);
                }
            }

            if (similarGroup.Count > 1)
            {
                groups.Add(similarGroup);
            }
        }

        return groups;
    }

    private bool AreCategoriesSimilar(string name1, string name2)
    {
        var lower1 = name1.ToLower().Trim();
        var lower2 = name2.ToLower().Trim();

        // Exact match
        if (lower1 == lower2) return true;

        // Check for common words
        var words1 = lower1.Split(' ', '&', '-', '_').Where(w => w.Length > 2).ToArray();
        var words2 = lower2.Split(' ', '&', '-', '_').Where(w => w.Length > 2).ToArray();

        var commonWords = words1.Intersect(words2).Count();
        var totalWords = Math.Max(words1.Length, words2.Length);

        // If more than 50% of words are common, consider them similar
        if (totalWords > 0 && (double)commonWords / totalWords > 0.5)
        {
            return true;
        }

        // Check for common Turkish/English variations
        var variations = new Dictionary<string, string[]>
        {
            { "yemek", new[] { "food", "gıda", "gida", "market", "restoran", "cafe" } },
            { "ulaşım", new[] { "transport", "transportation", "taksi", "otobüs", "metro" } },
            { "eğlence", new[] { "entertainment", "spor", "sport", "oyun", "game" } },
            { "sağlık", new[] { "health", "saglik", "hastane", "hospital", "doktor" } },
            { "eğitim", new[] { "education", "egitim", "okul", "school", "kurs" } },
            { "giyim", new[] { "clothing", "kıyafet", "kiyafet", "moda", "fashion" } }
        };

        foreach (var variation in variations)
        {
            if ((variation.Key == lower1 && variation.Value.Contains(lower2)) ||
                (variation.Key == lower2 && variation.Value.Contains(lower1)))
            {
                return true;
            }
        }

        return false;
    }

    [HttpPost("merge")]
    public async Task<IActionResult> MergeCategories([FromBody] MergeCategoriesRequest request)
    {
        try
        {
            if (request == null || request.CategoryIds == null || request.CategoryIds.Count < 2)
            {
                return BadRequest("At least two category IDs are required for merging");
            }

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

            var result = await _databaseService.ExecuteWithRetryAsync(async connection =>
            {
                // Get the target category (first one) and source categories
                var targetCategoryId = request.CategoryIds[0];
                var sourceCategoryIds = request.CategoryIds.Skip(1).ToList();

                // Verify all categories belong to the user
                var allCategoryIds = request.CategoryIds;
                const string verifyQuery = @"
                    SELECT COUNT(*) FROM categories 
                    WHERE id = ANY(@categoryIds::uuid[]) AND user_id = @userId::uuid";
                
                using var verifyCommand = new NpgsqlCommand(verifyQuery, connection);
                verifyCommand.Parameters.AddWithValue("@categoryIds", allCategoryIds.ToArray());
                verifyCommand.Parameters.AddWithValue("@userId", userGuid);
                
                var count = Convert.ToInt32(await verifyCommand.ExecuteScalarAsync());
                if (count != allCategoryIds.Count)
                {
                    throw new InvalidOperationException("Some categories do not belong to the user or do not exist");
                }

                // Update all transactions to use the target category
                const string updateTransactionsQuery = @"
                    UPDATE transactions 
                    SET category_id = @targetCategoryId 
                    WHERE category_id = ANY(@sourceCategoryIds::uuid[])";

                using var updateTransactionsCommand = new NpgsqlCommand(updateTransactionsQuery, connection);
                updateTransactionsCommand.Parameters.AddWithValue("@targetCategoryId", targetCategoryId);
                updateTransactionsCommand.Parameters.AddWithValue("@sourceCategoryIds", sourceCategoryIds.ToArray());
                
                var updatedTransactions = await updateTransactionsCommand.ExecuteNonQueryAsync();

                // Update recurring transactions
                const string updateRecurringQuery = @"
                    UPDATE recurring_transactions 
                    SET category_id = @targetCategoryId 
                    WHERE category_id = ANY(@sourceCategoryIds::uuid[])";

                using var updateRecurringCommand = new NpgsqlCommand(updateRecurringQuery, connection);
                updateRecurringCommand.Parameters.AddWithValue("@targetCategoryId", targetCategoryId);
                updateRecurringCommand.Parameters.AddWithValue("@sourceCategoryIds", sourceCategoryIds.ToArray());
                
                var updatedRecurring = await updateRecurringCommand.ExecuteNonQueryAsync();

                // Delete source categories
                const string deleteCategoriesQuery = @"
                    DELETE FROM categories 
                    WHERE id = ANY(@sourceCategoryIds::uuid[])";

                using var deleteCategoriesCommand = new NpgsqlCommand(deleteCategoriesQuery, connection);
                deleteCategoriesCommand.Parameters.AddWithValue("@sourceCategoryIds", sourceCategoryIds.ToArray());
                
                var deletedCategories = await deleteCategoriesCommand.ExecuteNonQueryAsync();

                return new { 
                    UpdatedTransactions = updatedTransactions,
                    UpdatedRecurring = updatedRecurring,
                    DeletedCategories = deletedCategories
                };
            });

            // Invalidate cache after merging categories
            var cacheKey = $"categories_{userId}";
            _cachingService.Remove(cacheKey);
            _logger.LogDebug("Cache invalidated for key: {CacheKey}", cacheKey);

            return Ok(new { 
                Message = "Categories merged successfully", 
                Result = result,
                Details = $"Updated {result.UpdatedTransactions} transactions, {result.UpdatedRecurring} recurring transactions, and deleted {result.DeletedCategories} categories"
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error merging categories for user");
            return StatusCode(500, "Internal server error");
        }
    }
}

public class MergeCategoriesRequest
{
    public List<string> CategoryIds { get; set; } = new List<string>();
}
