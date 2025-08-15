using System.ComponentModel.DataAnnotations;

namespace Pocketbank.API.Models;

public class Budget
{
    public string Id { get; set; } = string.Empty;
    
    [Required]
    public string UserId { get; set; } = string.Empty;
    
    [Required]
    [StringLength(100)]
    public string Name { get; set; } = string.Empty;
    
    [Required]
    [Range(0.01, double.MaxValue, ErrorMessage = "Amount must be greater than 0")]
    public decimal Amount { get; set; }
    
    [Required]
    [RegularExpression("^(daily|weekly|monthly|yearly)$", ErrorMessage = "Period must be one of: daily, weekly, monthly, yearly")]
    public string Period { get; set; } = string.Empty; // daily, weekly, monthly, yearly
    
    [Required]
    public DateTime StartDate { get; set; }
    
    public DateTime CreatedAt { get; set; }
}
