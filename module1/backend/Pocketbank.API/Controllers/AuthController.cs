using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using Pocketbank.API.Data;
using Pocketbank.API.Models;
using Microsoft.AspNetCore.Authorization;

namespace Pocketbank.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly IConfiguration _configuration;
    public AuthController(ApplicationDbContext context, IConfiguration configuration)
    {
        _context = context;
        _configuration = configuration;
    }



    [HttpGet("me")]
    [Authorize]
    public async Task<IActionResult> GetMe()
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        
        if (string.IsNullOrEmpty(userId))
        {
            return Unauthorized();
        }

        if (!Guid.TryParse(userId, out var userGuid))
        {
            return Unauthorized();
        }

        var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == userGuid);
        if (user == null)
        {
            return NotFound();
        }

        return Ok(new
        {
            id = user.Id.ToString(),
            email = user.Email,
            name = user.Name,
            surname = user.Surname
        });
    }
}

