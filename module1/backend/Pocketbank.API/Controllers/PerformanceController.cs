using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Cors;

namespace Pocketbank.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[EnableCors("AllowFrontend")] // Enable CORS for this controller
public class PerformanceController : ControllerBase
{
    [HttpGet("test-auth")]
    [Authorize]
    public IActionResult TestAuthentication()
    {
        var user = User;
        var claims = user.Claims.Select(c => new { c.Type, c.Value }).ToList();
        
        return Ok(new
        {
            Message = "Authentication successful!",
            UserId = user.FindFirst("sub")?.Value ?? "Unknown",
            Email = user.FindFirst("email")?.Value ?? "Unknown",
            Claims = claims,
            Timestamp = DateTime.UtcNow
        });
    }
    
    [HttpGet("public")]
    public IActionResult PublicEndpoint()
    {
        return Ok(new
        {
            Message = "This is a public endpoint - no authentication required",
            Timestamp = DateTime.UtcNow
        });
    }
}
