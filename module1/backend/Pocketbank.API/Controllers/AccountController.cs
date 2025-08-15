using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using Pocketbank.API.Services;
using Pocketbank.API.Models;

namespace Pocketbank.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class AccountController : ControllerBase
{
    private readonly UserService _userService;
    private readonly ILogger<AccountController> _logger;

    public AccountController(UserService userService, ILogger<AccountController> logger)
    {
        _userService = userService;
        _logger = logger;
    }

    [HttpGet("profile")]
    public async Task<IActionResult> GetProfile()
    {
        _logger.LogInformation("GetProfile endpoint called");
        
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        var email = User.FindFirst(ClaimTypes.Email)?.Value;
        
        _logger.LogInformation("Extracted from token - UserId: {UserId}, Email: {Email}", userId ?? "NULL", email ?? "NULL");
        
        if (string.IsNullOrEmpty(userId) && string.IsNullOrEmpty(email))
        {
            _logger.LogWarning("Neither user ID nor email found in token");
            return Unauthorized("User identification not found in token");
        }

        User? user = null;
        
        // Safe approach: Try ID first, fallback to email
        if (!string.IsNullOrEmpty(userId))
        {
            _logger.LogInformation("Searching for user with ID: {UserId}", userId);
            user = await _userService.GetUserByIdAsync(userId);
        }
        
        if (user == null && !string.IsNullOrEmpty(email))
        {
            _logger.LogInformation("User not found by ID, trying email: {Email}", email);
            user = await _userService.GetUserByEmailAsync(email);
            
            if (user != null)
            {
                _logger.LogWarning("User found by email but not by ID. This indicates an ID mismatch. Email: {Email}, DB ID: {DbId}, Token ID: {TokenId}", 
                    email, user.Id, userId);
            }
        }
        
        if (user == null)
        {
            _logger.LogWarning("User profile not found for ID: {UserId} or Email: {Email}", userId, email);
            return NotFound("User profile not found");
        }

        _logger.LogInformation("User profile found: {Email}", user.Email);
        return Ok(new
        {
            UserId = user.Id,
            Email = user.Email,
            Name = user.Name,
            Surname = user.Surname,
            ProfilePictureUrl = user.ProfilePictureUrl,
            Message = "Profile data retrieved successfully"
        });
    }

    [HttpPut("profile")]
    public async Task<IActionResult> UpdateProfile([FromBody] UpdateProfileRequest request)
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        
        if (string.IsNullOrEmpty(userId))
        {
            return Unauthorized("User ID not found in token");
        }

        var success = await _userService.UpdateUserProfileAsync(userId, request);
        
        if (!success)
        {
            return BadRequest("Failed to update profile");
        }

        return Ok(new { Message = "Profile updated successfully" });
    }
    
    [HttpGet("balance")]
    public IActionResult GetBalance()
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        
        // Mock balance for now
        return Ok(new
        {
            UserId = userId,
            Balance = 1250.75m,
            Currency = "USD"
        });
    }
}