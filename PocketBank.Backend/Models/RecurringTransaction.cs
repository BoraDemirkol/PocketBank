namespace PocketBank.Backend.Models;

public class RecurringTransaction
{
    public int Id { get; set; }
    public decimal Amount { get; set; }
    public string Description { get; set; } = "";
    public DateTime NextRunDate { get; set; }
    public string Frequency { get; set; } = "aylık";
    public bool IsIncome { get; set; }
    public int CategoryId { get; set; }
    public Category? Category { get; set; }
} 