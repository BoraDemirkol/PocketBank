using Microsoft.AspNetCore.Mvc;
using Pocketbank.API.Models;
using Pocketbank.API.Services;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace Pocketbank.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class WebhookController : ControllerBase
{
    private readonly UserService _userService;
    private readonly IConfiguration _configuration;
    private readonly ILogger<WebhookController> _logger;

    public WebhookController(UserService userService, IConfiguration configuration, ILogger<WebhookController> logger)
    {
        _userService = userService;
        _configuration = configuration;
        _logger = logger;
    }

    [HttpPost("supabase-auth")]
    public async Task<IActionResult> HandleSupabaseAuth()
    {
        try
        {
            using var reader = new StreamReader(Request.Body);
            var body = await reader.ReadToEndAsync();
            
            _logger.LogInformation("Received Supabase webhook: {Body}", body);

            var webhookData = JsonSerializer.Deserialize<SupabaseWebhookPayload>(body);
            
            _logger.LogInformation("Deserialized webhook - Type: '{Type}', Table: '{Table}', Record ID: '{RecordId}'", 
                webhookData?.Type, webhookData?.Table, webhookData?.Record?.Id);
            
            if (webhookData?.Type == "INSERT" || webhookData?.Type == "UPDATE")
            {
                _logger.LogInformation("Processing {Type} event for table {Table}", webhookData.Type, webhookData.Table);
                var userData = webhookData.Record;
                if (userData != null && !string.IsNullOrEmpty(userData.Id))
                {
                    _logger.LogInformation("Calling CreateOrUpdateUserFromAuthAsync for user {UserId}", userData.Id);
                    var result = await _userService.CreateOrUpdateUserFromAuthAsync(userData);
                    _logger.LogInformation("CreateOrUpdateUserFromAuthAsync returned: {Result}", result);
                    return Ok(new { success = true });
                }
                else
                {
                    _logger.LogWarning("Invalid user data - userData is null or ID is empty");
                }
            }

            return Ok(new { success = true, message = "No action needed" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error processing Supabase webhook");
            return StatusCode(500, new { error = "Internal server error" });
        }
    }
}

public class SupabaseWebhookPayload
{
    [JsonPropertyName("type")]
    public string Type { get; set; } = string.Empty;
    
    [JsonPropertyName("table")]
    public string Table { get; set; } = string.Empty;
    
    [JsonPropertyName("record")]
    public SupabaseUserRecord? Record { get; set; }
}

public class SupabaseUserRecord
{
    [JsonPropertyName("id")]
    public string Id { get; set; } = string.Empty;
    
    [JsonPropertyName("email")]
    public string Email { get; set; } = string.Empty;
    
    [JsonPropertyName("email_confirmed_at")]
    public DateTime? EmailConfirmedAt { get; set; }
    
    [JsonPropertyName("raw_user_meta_data")]
    public JsonElement? RawUserMetaData { get; set; }
}