namespace Pocketbank.API.Models;

public class BudgetCategory
{
    public string Id { get; set; } = string.Empty;
    public string BudgetId { get; set; } = string.Empty;
    public string CategoryId { get; set; } = string.Empty;
    public long Limit { get; set; }
    public DateTime CreatedAt { get; set; }
}
