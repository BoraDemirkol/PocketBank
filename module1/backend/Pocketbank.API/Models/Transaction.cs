using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Pocketbank.API.Models
{
    [Table("transactions")]
    public class Transaction
    {
        [Column("id")]
        public Guid Id { get; set; }
        
        [Column("account_id")]
        public Guid? AccountId { get; set; }
        
        [Column("category_id")]
        public Guid? CategoryId { get; set; }
        
        [Required]
        [Column("amount")]
        public decimal Amount { get; set; }
        
        [Required]
        [Column("transaction_date")]
        public DateTime TransactionDate { get; set; }
        
        [Column("description")]
        public string? Description { get; set; }
        
        [Column("created_at")]
        public DateTime? CreatedAt { get; set; }
        
        [Column("receipt_url")]
        public string? ReceiptUrl { get; set; }
        
        [Column("transaction_type")]
        public string? TransactionType { get; set; }
        
        // Navigation properties
        public virtual Category? Category { get; set; }
        public virtual Account? Account { get; set; }
    }
}
