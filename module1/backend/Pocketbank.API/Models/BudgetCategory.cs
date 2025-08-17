using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Pocketbank.API.Models
{
    [Table("budget_categories")]
    public class BudgetCategory
    {
        [Column("id")]
        public Guid Id { get; set; }
        
        [Column("budget_id")]
        public Guid? BudgetId { get; set; }
        
        [Column("category_id")]
        public Guid? CategoryId { get; set; }
        
        [Column("limit")]
        public long? Limit { get; set; }
        
        [Required]
        [Column("created_at")]
        public DateTime CreatedAt { get; set; }
        
        // Navigation properties
        public virtual Budget? Budget { get; set; }
        public virtual Category? Category { get; set; }
    }
}
