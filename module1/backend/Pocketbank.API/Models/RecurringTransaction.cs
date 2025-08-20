using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Pocketbank.API.Models
{
    [Table("recurring_transactions")]
    public class RecurringTransaction
    {
        [Column("id")]
        public Guid Id { get; set; }
        
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
        [MaxLength(255)]
        [Column("description")]
        public string Description { get; set; } = string.Empty;
        
        [Required]
        [Column("amount")]
        public decimal Amount { get; set; }
        
        [Required]
        [Column("start_date")]
        public DateTime StartDate { get; set; }
        
        [Required]
        [MaxLength(255)]
        [Column("frequency")]
        public string Frequency { get; set; } = "aylık";
        
        [Required]
        [Column("is_income")]
        public bool IsIncome { get; set; }
        
        [Required]
        [Column("is_active")]
        public bool IsActive { get; set; } = true;
        
        [Column("last_processed")]
        public DateTime? LastProcessed { get; set; }
        
        [Required]
        [Column("created_at")]
        public DateTime CreatedAt { get; set; }
        
        // Navigation properties
        public virtual User? User { get; set; }
        public virtual Category? Category { get; set; }
        public virtual Account? Account { get; set; }
    }
}
