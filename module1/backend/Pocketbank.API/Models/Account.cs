using System.Text.Json.Serialization;

namespace Pocketbank.API.Models;

public class Account
{
    [JsonPropertyName("id")]
    public string Id { get; set; } = string.Empty;
    
    [JsonPropertyName("userId")]
    public string UserId { get; set; } = string.Empty;
    
    [JsonPropertyName("accountName")]
    public string AccountName { get; set; } = string.Empty;
    
    [JsonPropertyName("accountType")]
    public string AccountType { get; set; } = string.Empty;
    
    [JsonPropertyName("balance")]
    public decimal Balance { get; set; }
    
    [JsonPropertyName("currency")]
    public string Currency { get; set; } = "TRY";
    
    [JsonPropertyName("createdAt")]
    public DateTime CreatedAt { get; set; }
}
