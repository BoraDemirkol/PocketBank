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

    public AccountController(UserService userService)
    {
        _userService = userService;
    }

    [HttpGet("profile")]
    public async Task<IActionResult> GetProfile()
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        
        if (string.IsNullOrEmpty(userId))
        {
            return Unauthorized("User ID not found in token");
        }

        var user = await _userService.GetUserByIdAsync(userId);
        
        if (user == null)
        {
            return NotFound("User profile not found");
        }

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