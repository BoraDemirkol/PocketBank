using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Pocketbank.API.Models
{
    [Table("categories")]
    public class Category
    {
        [Column("id")]
        public Guid Id { get; set; }
        
        [Column("user_id")]
        public Guid? UserId { get; set; }
        
        [Required]
        [MaxLength(255)]
        [Column("name")]
        public string Name { get; set; } = string.Empty;
        
        [Column("icon")]
        public string? Icon { get; set; }
        
        [Column("color")]
        public string? Color { get; set; }
        
        [Column("created_at")]
        public DateTime? CreatedAt { get; set; }
        
        // Navigation properties
        public virtual User? User { get; set; }
        public virtual ICollection<Transaction>? Transactions { get; set; }
        public virtual ICollection<RecurringTransaction>? RecurringTransactions { get; set; }
    }
}
