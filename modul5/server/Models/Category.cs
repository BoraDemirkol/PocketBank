using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Server.Models
{
    [Table("categories")]
    public class Category
    {
        [Key]
        [Column("id")]
        public Guid Id { get; set; }

        [Column("user_id")]
        public Guid? UserId { get; set; } // Bazı kategoriler genel olabilir

        [Column("name")]
        public string Name { get; set; } = string.Empty;

        [Column("icon")]
        public string? Icon { get; set; }

        [Column("color")]
        public string? Color { get; set; }
    }
}