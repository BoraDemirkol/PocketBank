using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Pocketbank.API.Models
{
    [Table("accounts")]
    public class Account
    {
        [Column("id")]
        public Guid Id { get; set; }
        
        [Column("user_id")]
        public Guid? UserId { get; set; }
        
        [Required]
        [MaxLength(255)]
        [Column("account_name")]
        public string AccountName { get; set; } = string.Empty;
        
        [Required]
        [MaxLength(255)]
        [Column("account_type")]
        public string AccountType { get; set; } = "Vadesiz";
        
        [Column("balance")]
        public decimal? Balance { get; set; }
        
        [MaxLength(255)]
        [Column("currency")]
        public string? Currency { get; set; }
        
        [Column("created_at")]
        public DateTime? CreatedAt { get; set; }
        
        // Navigation properties
        public virtual User? User { get; set; }
        public virtual ICollection<Transaction>? Transactions { get; set; }
        public virtual ICollection<RecurringTransaction>? RecurringTransactions { get; set; }
    }
}
