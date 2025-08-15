using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace Pocketbank.API.Models;

public class RecurringTransaction
{
    [JsonPropertyName("id")]
    public string Id { get; set; } = string.Empty;
    
    [Required]
    [JsonPropertyName("userId")]
    public string UserId { get; set; } = string.Empty;
    
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
    [StringLength(500)]
    [JsonPropertyName("description")]
    public string Description { get; set; } = string.Empty;
    
    [Required]
    [JsonPropertyName("startDate")]
    public DateTime StartDate { get; set; }
    
    [Required]
    [RegularExpression("^(daily|weekly|monthly|yearly|günlük|haftalık|aylık|yıllık)$", ErrorMessage = "Frequency must be one of: daily, weekly, monthly, yearly, günlük, haftalık, aylık, yıllık")]
    [JsonPropertyName("frequency")]
    public string Frequency { get; set; } = string.Empty;
    
    [Required]
    [JsonPropertyName("isIncome")]
    public bool IsIncome { get; set; }
    
    [Required]
    [JsonPropertyName("isActive")]
    public bool IsActive { get; set; }
    
    [JsonPropertyName("createdAt")]
    public DateTime CreatedAt { get; set; }
    
    [JsonPropertyName("lastProcessed")]
    public DateTime? LastProcessed { get; set; }
}
