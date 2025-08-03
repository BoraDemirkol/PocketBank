using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Server.Models
{
    [Table("accounts")]
    public class Account
    {
        [Key]
        [Column("id")]
        public Guid Id { get; set; }

        [Column("user_id")]
        public Guid UserId { get; set; }

        [Column("account_name")]
        public string AccountName { get; set; } = string.Empty;

        [Column("account_type")]
        public string AccountType { get; set; } = string.Empty;

        [Column("balance")]
        public decimal Balance { get; set; }

        [Column("currency")]
        public string Currency { get; set; } = "TRY";
    }
}