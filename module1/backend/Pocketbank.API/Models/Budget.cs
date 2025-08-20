using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Pocketbank.API.Models
{
    [Table("budgets")]
    public class Budget
    {
        [Column("id")]
        public Guid Id { get; set; }
        
        [Column("user_id")]
        public Guid? UserId { get; set; }
        
        [Required]
        [MaxLength(255)]
        [Column("name")]
        public string Name { get; set; } = string.Empty;
        
        [Required]
        [Column("amount")]
        public decimal Amount { get; set; }
        
        [Required]
        [MaxLength(255)]
        [Column("period")]
        public string Period { get; set; } = "aylık";
        
        [Required]
        [Column("start_date")]
        public DateTime StartDate { get; set; }
        
        [Column("created_at")]
        public DateTime? CreatedAt { get; set; }
        
        // Navigation properties
        public virtual User? User { get; set; }
        public virtual ICollection<BudgetCategory>? BudgetCategories { get; set; }
    }
}
