using System.Text.Json.Serialization;

namespace Pocketbank.API.Models;

public class Category
{
    [JsonPropertyName("id")]
    public string Id { get; set; } = string.Empty;
    
    [JsonPropertyName("userId")]
    public string UserId { get; set; } = string.Empty;
    
    [JsonPropertyName("name")]
    public string Name { get; set; } = string.Empty;
    
    [JsonPropertyName("icon")]
    public string Icon { get; set; } = string.Empty;
    
    [JsonPropertyName("color")]
    public string Color { get; set; } = string.Empty;
    
    [JsonPropertyName("createdAt")]
    public DateTime CreatedAt { get; set; }
}
