using Microsoft.Extensions.Diagnostics.HealthChecks;
using Pocketbank.API.Services;
using Npgsql;

namespace Pocketbank.API.Services;

public class DatabaseHealthCheck : IHealthCheck, IDatabaseHealthCheck
{
    private readonly IDatabaseService _databaseService;

    public DatabaseHealthCheck(IDatabaseService databaseService)
    {
        _databaseService = databaseService;
    }

    public async Task<HealthCheckResult> CheckHealthAsync(HealthCheckContext context, CancellationToken cancellationToken = default)
    {
        try
        {
            await _databaseService.ExecuteWithRetryAsync(async connection =>
            {
                using var command = new NpgsqlCommand("SELECT 1", connection);
                await command.ExecuteScalarAsync(cancellationToken);
                return true;
            });
            
            return HealthCheckResult.Healthy("Database connection successful");
        }
        catch (Exception ex)
        {
            return HealthCheckResult.Unhealthy("Database connection failed", ex);
        }
    }

    public async Task<bool> IsHealthyAsync()
    {
        try
        {
            await _databaseService.ExecuteWithRetryAsync(async connection =>
            {
                using var command = new NpgsqlCommand("SELECT 1", connection);
                await command.ExecuteScalarAsync();
                return true;
            });
            
            return true;
        }
        catch
        {
            return false;
        }
    }
}
