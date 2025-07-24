using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace Pocketbank.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class AccountController : ControllerBase
{
    [HttpGet("profile")]
    public IActionResult GetProfile()
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        var email = User.FindFirst(ClaimTypes.Email)?.Value;
        
        return Ok(new
        {
            UserId = userId,
            Email = email,
            Message = "This is a protected endpoint!"
        });
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