using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using Microsoft.AspNetCore.Cors;

namespace Pocketbank.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]

    public class JwtTestController : ControllerBase
    {
        [HttpGet("public")]
        public IActionResult PublicEndpoint()
        {
            return Ok(new
            {
                Message = "This is a public endpoint - no authentication required",
                Timestamp = DateTime.UtcNow,
                Status = "Success"
            });
        }

        [HttpGet("protected")]
        [Authorize]
        public IActionResult ProtectedEndpoint()
        {
            var user = User;
            var claims = user.Claims.Select(c => new { c.Type, c.Value }).ToList();
            
            return Ok(new
            {
                Message = "This is a protected endpoint - authentication successful!",
                UserId = user.FindFirst("sub")?.Value,
                Email = user.FindFirst("email")?.Value,
                Claims = claims,
                Timestamp = DateTime.UtcNow,
                Status = "Authenticated"
            });
        }

        [HttpGet("admin")]
        [Authorize]
        public IActionResult AdminEndpoint()
        {
            var user = User;
            
            return Ok(new
            {
                Message = "This is an admin endpoint - JWT policy authentication successful!",
                UserId = user.FindFirst("sub")?.Value,
                Email = user.FindFirst("email")?.Value,
                AuthenticationType = user.Identity?.AuthenticationType,
                IsAuthenticated = user.Identity?.IsAuthenticated,
                Timestamp = DateTime.UtcNow,
                Status = "Admin Access Granted"
            });
        }

        [HttpGet("token-info")]
        public IActionResult TokenInfo()
        {
            var authHeader = Request.Headers["Authorization"].FirstOrDefault();
            var hasToken = !string.IsNullOrEmpty(authHeader) && authHeader.StartsWith("Bearer ");
            
            return Ok(new
            {
                HasAuthorizationHeader = !string.IsNullOrEmpty(authHeader),
                HasBearerToken = hasToken,
                TokenLength = hasToken && authHeader != null ? authHeader.Replace("Bearer ", "").Length : 0,
                Timestamp = DateTime.UtcNow,
                Status = "Token Info Retrieved"
            });
        }

        [HttpPost("test-token")]
        public IActionResult TestToken([FromBody] TokenTestRequest request)
        {
            try
            {
                if (string.IsNullOrEmpty(request.Token))
                {
                    return BadRequest(new { Error = "Token is required" });
                }

                return Ok(new
                {
                    Message = "Token received for testing",
                    TokenLength = request.Token.Length,
                    Timestamp = DateTime.UtcNow,
                    Status = "Token Test Successful"
                });
            }
            catch (Exception ex)
            {
                return BadRequest(new { Error = ex.Message });
            }
        }

        [HttpGet("jwks-test")]
        public async Task<IActionResult> TestJWKS()
        {
            try
            {
                using var httpClient = new HttpClient();
                var supabaseUrl = "https://xfrgkzlugacowzcfthwk.supabase.co";
                
                // Test OpenID Connect discovery
                var discoveryResponse = await httpClient.GetAsync($"{supabaseUrl}/.well-known/openid_configuration");
                var discoveryContent = await discoveryResponse.Content.ReadAsStringAsync();
                
                // Test JWKS endpoint
                var jwksResponse = await httpClient.GetAsync($"{supabaseUrl}/.well-known/jwks.json");
                var jwksContent = await jwksResponse.Content.ReadAsStringAsync();
                
                return Ok(new
                {
                    DiscoveryEndpoint = $"{supabaseUrl}/.well-known/openid_configuration",
                    DiscoveryStatus = discoveryResponse.StatusCode,
                    DiscoveryContent = discoveryContent,
                    JWKSEndpoint = $"{supabaseUrl}/.well-known/jwks.json",
                    JWKSStatus = jwksResponse.StatusCode,
                    JWKSContent = jwksContent,
                    Timestamp = DateTime.UtcNow
                });
            }
            catch (Exception ex)
            {
                return BadRequest(new { Error = ex.Message });
            }
        }
    }

    public class TokenTestRequest
    {
        public string Token { get; set; } = string.Empty;
    }
}
