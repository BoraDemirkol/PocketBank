using Microsoft.Extensions.Logging;

namespace Pocketbank.API.Middleware;

public class DatabaseMonitoringMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<DatabaseMonitoringMiddleware> _logger;

    public DatabaseMonitoringMiddleware(RequestDelegate next, ILogger<DatabaseMonitoringMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        var startTime = DateTime.UtcNow;
        var path = context.Request.Path;
        
        // Only monitor API endpoints
        if (path.StartsWithSegments("/api"))
        {
            _logger.LogDebug("Starting API request: {Method} {Path}", context.Request.Method, path);
            
            try
            {
                await _next(context);
                
                var duration = DateTime.UtcNow - startTime;
                if (duration.TotalMilliseconds > 2000) // Log slow requests (increased from 1000ms)
                {
                    _logger.LogWarning("Slow API request: {Method} {Path} took {Duration}ms", 
                        context.Request.Method, path, duration.TotalMilliseconds);
                }
                else
                {
                    _logger.LogDebug("API request completed: {Method} {Path} took {Duration}ms", 
                        context.Request.Method, path, duration.TotalMilliseconds);
                }
            }
            catch (Exception ex)
            {
                var duration = DateTime.UtcNow - startTime;
                _logger.LogError(ex, "API request failed: {Method} {Path} after {Duration}ms", 
                    context.Request.Method, path, duration.TotalMilliseconds);
                throw;
            }
        }
        else
        {
            await _next(context);
        }
    }
}

public static class DatabaseMonitoringMiddlewareExtensions
{
    public static IApplicationBuilder UseDatabaseMonitoring(this IApplicationBuilder builder)
    {
        return builder.UseMiddleware<DatabaseMonitoringMiddleware>();
    }
}
