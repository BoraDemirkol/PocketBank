using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace backend.Models;

public class RecurringTransaction
{
    [Key]
    [Column("id")]
    public Guid Id { get; set; } = Guid.NewGuid();
    
    [Required]
    [Column("user_id")]
    public Guid UserId { get; set; }
    
    [Required]
    [Column("account_id")]
    public Guid AccountId { get; set; }
    
    [Required]
    [Column("category_id")]
    public Guid CategoryId { get; set; }
    
    [Required]
    [MaxLength(500)]
    [Column("description")]
    public string Description { get; set; } = string.Empty;
    
    [Column("amount", TypeName = "decimal(18, 2)")]
    public decimal Amount { get; set; }
    
    [Required]
    [Column("start_date")]
    public DateTime StartDate { get; set; }
    
    [Required]
    [MaxLength(20)]
    [Column("frequency")]
    public string Frequency { get; set; } = string.Empty; // günlük, haftalık, aylık, yıllık
    
    [Column("is_income")]
    public bool IsIncome { get; set; }
    
    [Column("is_active")]
    public bool IsActive { get; set; } = true;
    
    [Column("last_processed")]
    public DateTime? LastProcessed { get; set; }
    
    [Column("created_at")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    
    // Navigation properties
    [ForeignKey("UserId")]
    public User User { get; set; } = null!;
    
    [ForeignKey("AccountId")]
    public Account Account { get; set; } = null!;
    
    [ForeignKey("CategoryId")]
    public Category Category { get; set; } = null!;
} 