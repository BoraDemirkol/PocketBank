using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Server.Models
{
    [Table("transactions")]
    public class Transaction
    {
        [Key]
        [Column("id")]
        public Guid Id { get; set; }

        [Column("account_id")]
        public Guid AccountId { get; set; }

        [Column("category_id")]
        public Guid? CategoryId { get; set; }

        [Column("amount")]
        public decimal Amount { get; set; }

        [Column("transaction_type")]
        // --- DÜZELTME BURADA ---
        public string TransactionType { get; set; } = string.Empty; // Başlangıç değeri olarak boş bir string atıyoruz

        [Column("transaction_date")]
        public DateTime TransactionDate { get; set; }

        [Column("description")]
        public string? Description { get; set; }
    }
}