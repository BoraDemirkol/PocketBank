namespace PocketBank.Backend.Models;

public class Category
{
public int Id { get; set; }
public string Name { get; set; } = "";
public string Color { get; set; } = "#ffffff";
public string Icon { get; set; } = "🗂️";
public ICollection<Transaction>? Transactions { get; set; }
}