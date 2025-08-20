<<<<<<< HEAD
namespace Pocketbank.API.Models;

public class User
{
    public Guid Id { get; set; }
    public string Email { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Surname { get; set; } = string.Empty;
    public string? ProfilePictureUrl { get; set; }
    public DateTime CreatedAt { get; set; }
    public string PasswordHash { get; set; } = string.Empty;
}

public class UpdateProfileRequest
{
    public string Name { get; set; } = string.Empty;
    public string Surname { get; set; } = string.Empty;
    public string? ProfilePictureUrl { get; set; }
=======
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Pocketbank.API.Models
{
    [Table("users")]
    public class User
    {
        [Column("id")]
        public Guid Id { get; set; }
        
        [Required]
        [MaxLength(255)]
        [Column("email")]
        public string Email { get; set; } = string.Empty;
        
        [Column("name")]
        public string? Name { get; set; }
        
        [Column("surname")]
        public string? Surname { get; set; }
        
        [Required]
        [Column("profile_picture_url")]
        public string ProfilePictureUrl { get; set; } = string.Empty;
        
        [Column("password_hash")]
        public string? PasswordHash { get; set; }
        
        [Column("created_at")]
        public DateTime? CreatedAt { get; set; }
    }

    public class UpdateProfileRequest
    {
        public string Name { get; set; } = string.Empty;
        public string Surname { get; set; } = string.Empty;
        public string? ProfilePictureUrl { get; set; }
    }
>>>>>>> 9100c27ce5793f4af8ad037a2cd89bdf89599a38
}