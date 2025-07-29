using System.ComponentModel.DataAnnotations.Schema;

[Table("transactions")]
public class Transaction
{
    [Column("id")]
    public Guid Id { get; set; }

    [Column("account_id")]
    public Guid AccountId { get; set; }

    [Column("transaction_date")]
    public DateTime Date { get; set; }

    [Column("amount")]
    public decimal Amount { get; set; }

    [Column("description")]
    public string Description { get; set; } = string.Empty;
}
