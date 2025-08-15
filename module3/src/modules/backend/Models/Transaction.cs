using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace backend.Models;

public class Transaction
{
    [Key]
    [Column("id")]
    public Guid Id { get; set; } = Guid.NewGuid();
    
    [Required]
    [Column("account_id")]
    public Guid AccountId { get; set; }
    
    [Required]
    [Column("category_id")]
    public Guid CategoryId { get; set; }
    
    [Column("amount", TypeName = "decimal(18, 2)")]
    public decimal Amount { get; set; }
    
    [Required]
    [Column("transaction_date")]
    public DateTime TransactionDate { get; set; }
    
    [MaxLength(500)]
    [Column("description")]
    public string? Description { get; set; }
    
    [Column("created_at")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    
    [MaxLength(500)]
    [Column("receipt_url")]
    public string? ReceiptUrl { get; set; }
    
    // Navigation properties
    [ForeignKey("CategoryId")]
    public Category Category { get; set; } = null!;
    
    [ForeignKey("AccountId")]
    public Account Account { get; set; } = null!;
} 