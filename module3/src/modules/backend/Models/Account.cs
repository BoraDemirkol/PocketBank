using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace backend.Models;

public class Account
{
    [Key]
    [Column("id")]
    public Guid Id { get; set; } = Guid.NewGuid();
    
    [Required]
    [Column("user_id")]
    public Guid UserId { get; set; }
    
    [Required]
    [MaxLength(100)]
    [Column("account_name")]
    public string AccountName { get; set; } = string.Empty;
    
    [Required]
    [MaxLength(20)]
    [Column("account_type")]
    public string AccountType { get; set; } = string.Empty; // Vadesiz, Vadeli, Kredi Kartı
    
    [Column("balance", TypeName = "decimal(18, 2)")]
    public decimal Balance { get; set; }
    
    [Required]
    [MaxLength(3)]
    [Column("currency")]
    public string Currency { get; set; } = "TRY";
    
    [Column("created_at")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    
    // Navigation property
    public User User { get; set; } = null!;
    public ICollection<Transaction> Transactions { get; set; } = new List<Transaction>();
} 