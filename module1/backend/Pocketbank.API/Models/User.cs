using System.ComponentModel.DataAnnotations;

namespace Pocketbank.API.Models;

public class User
{
    public string Id { get; set; } = string.Empty;
    
    [Required]
    [EmailAddress]
    public string Email { get; set; } = string.Empty;
    
    [StringLength(100)]
    public string Name { get; set; } = string.Empty;
    
    [StringLength(100)]
    public string Surname { get; set; } = string.Empty;
    
    public string ProfilePictureUrl { get; set; } = string.Empty;
    
    public DateTime CreatedAt { get; set; }
}

public class UpdateProfileRequest
{
    [Required]
    [StringLength(100)]
    public string Name { get; set; } = string.Empty;
    
    [Required]
    [StringLength(100)]
    public string Surname { get; set; } = string.Empty;
    
    [Url]
    public string ProfilePictureUrl { get; set; } = string.Empty;
}

public class CreateUserRequest
{
    [Required]
    [EmailAddress]
    public string Email { get; set; } = string.Empty;
    
    [StringLength(100)]
    public string Name { get; set; } = string.Empty;
    
    [StringLength(100)]
    public string Surname { get; set; } = string.Empty;
}