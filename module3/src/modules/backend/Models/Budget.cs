using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace backend.Models;

public class Budget
{
    [Key]
    [Column("id")]
    public Guid Id { get; set; } = Guid.NewGuid();
    
    [Required]
    [Column("user_id")]
    public Guid UserId { get; set; }
    
    [Required]
    [MaxLength(100)]
    [Column("name")]
    public string Name { get; set; } = string.Empty;
    
    [Column("amount", TypeName = "decimal(18, 2)")]
    public decimal Amount { get; set; }
    
    [Required]
    [MaxLength(20)]
    [Column("period")]
    public string Period { get; set; } = "monthly"; // monthly, yearly, etc.
    
    [Column("start_date")]
    public DateTime StartDate { get; set; }
    
    [Column("created_at")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    
    // Navigation property
    public User User { get; set; } = null!;
} 