using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace Pocketbank.API.Models;

public class Transaction
{
    [JsonPropertyName("id")]
    public string Id { get; set; } = string.Empty;
    
    [Required]
    [JsonPropertyName("accountId")]
    public string AccountId { get; set; } = string.Empty;
    
    [Required]
    [JsonPropertyName("categoryId")]
    public string CategoryId { get; set; } = string.Empty;
    
    [Required]
    [Range(double.MinValue, double.MaxValue, ErrorMessage = "Amount is required")]
    [JsonPropertyName("amount")]
    public decimal Amount { get; set; }
    
    [Required]
    [JsonPropertyName("transactionDate")]
    public DateTime TransactionDate { get; set; }
    
    [StringLength(500)]
    [JsonPropertyName("description")]
    public string? Description { get; set; }
    
    [JsonPropertyName("createdAt")]
    public DateTime CreatedAt { get; set; }
    
    [JsonPropertyName("receiptUrl")]
    public string? ReceiptUrl { get; set; }
    
    [Required]
    [RegularExpression("^(income|expense)$", ErrorMessage = "Transaction type must be 'income' or 'expense'")]
    [JsonPropertyName("transactionType")]
    public string TransactionType { get; set; } = "expense";
}
