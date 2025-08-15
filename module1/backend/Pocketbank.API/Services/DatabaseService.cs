using Npgsql;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using System.Threading;

namespace Pocketbank.API.Services;

public interface IDatabaseService
{
    Task<NpgsqlConnection> GetConnectionAsync();
    Task<T> ExecuteWithRetryAsync<T>(Func<NpgsqlConnection, Task<T>> operation, int maxRetries = 3);
    Task ExecuteWithRetryAsync(Func<NpgsqlConnection, Task> operation, int maxRetries = 3);
}

public class DatabaseService : IDatabaseService
{
    private readonly string _connectionString;
    private readonly string _fallbackConnectionString;
    private readonly ILogger<DatabaseService> _logger;
    private readonly SemaphoreSlim _connectionSemaphore;
    private readonly int _maxConcurrentConnections;
    private readonly int _maxRetriesConfig;
    private readonly int _retryDelayMsConfig;
    private readonly int _connectionTimeoutMs;
    private readonly int _commandTimeoutMs;
    private bool _useFallbackConnection = false;

    public DatabaseService(IConfiguration configuration, ILogger<DatabaseService> logger)
    {
        _connectionString = configuration.GetConnectionString("DefaultConnection") 
            ?? throw new InvalidOperationException("Connection string not found");
        _fallbackConnectionString = configuration.GetConnectionString("AlternativeConnection") ?? _connectionString;
        _logger = logger;
        _maxConcurrentConnections = configuration.GetValue<int>("Database:MaxConcurrentConnections", 20);
        _maxRetriesConfig = configuration.GetValue<int>("Database:MaxRetries", 3);
        _retryDelayMsConfig = configuration.GetValue<int>("Database:RetryDelayMs", 1000);
        _connectionTimeoutMs = configuration.GetValue<int>("Database:ConnectionTimeoutMs", 15000);
        _commandTimeoutMs = configuration.GetValue<int>("Database:CommandTimeoutMs", 30000);
        _connectionSemaphore = new SemaphoreSlim(_maxConcurrentConnections, _maxConcurrentConnections);
    }

    public async Task<NpgsqlConnection> GetConnectionAsync()
    {
        var cts = new CancellationTokenSource(_connectionTimeoutMs);
        
        try
        {
            await _connectionSemaphore.WaitAsync(cts.Token);
            
            var connectionString = _useFallbackConnection ? _fallbackConnectionString : _connectionString;
            var connection = new NpgsqlConnection(connectionString);
            
            // Set connection-level timeouts
            connection.ConnectionString = connectionString;
            
            // Open connection with timeout
            await connection.OpenAsync(cts.Token);
            
            // Note: CommandTimeout is read-only and set via connection string
            // The timeout is configured in the connection string as "Command Timeout=60"
            
            return connection;
        }
        catch (OperationCanceledException)
        {
            _logger.LogError("Database connection timeout after {Timeout}ms", _connectionTimeoutMs);
            throw new TimeoutException($"Database connection timeout after {_connectionTimeoutMs}ms");
        }
        catch (NpgsqlException ex) when (ex.Message.Contains("SCRAM") && !_useFallbackConnection)
        {
            _logger.LogWarning("SCRAM authentication failed, trying fallback connection: {Message}", ex.Message);
            _useFallbackConnection = true;
            throw; // Re-throw to trigger retry with fallback
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to create database connection");
            throw;
        }
    }

    public async Task<T> ExecuteWithRetryAsync<T>(Func<NpgsqlConnection, Task<T>> operation, int maxRetries = -1)
    {
        var attempt = 0;
        var lastException = (Exception?)null;
        var startTime = DateTime.UtcNow;
        
        // Use configuration value if maxRetries is not specified
        if (maxRetries == -1)
        {
            maxRetries = _maxRetriesConfig;
        }

        while (attempt < maxRetries)
        {
            attempt++;
            NpgsqlConnection? connection = null;

            try
            {
                var connectionStartTime = DateTime.UtcNow;
                connection = await GetConnectionAsync();
                var connectionTime = DateTime.UtcNow - connectionStartTime;
                
                if (connectionTime.TotalMilliseconds > 1000)
                {
                    _logger.LogWarning("Slow database connection: {ConnectionTime}ms", connectionTime.TotalMilliseconds);
                }
                
                var operationStartTime = DateTime.UtcNow;
                var result = await operation(connection);
                var operationTime = DateTime.UtcNow - operationStartTime;
                
                var totalTime = DateTime.UtcNow - startTime;
                if (totalTime.TotalMilliseconds > 5000)
                {
                    _logger.LogWarning("Slow database operation: {TotalTime}ms (Connection: {ConnectionTime}ms, Operation: {OperationTime}ms)", 
                        totalTime.TotalMilliseconds, connectionTime.TotalMilliseconds, operationTime.TotalMilliseconds);
                }
                
                return result;
            }
            catch (NpgsqlException ex) when (IsRetryableException(ex))
            {
                lastException = ex;
                _logger.LogWarning("Database operation failed on attempt {Attempt}/{MaxRetries}: {Message}", 
                    attempt, maxRetries, ex.Message);

                if (attempt == maxRetries)
                {
                    break;
                }

                // Exponential backoff with jitter
                var delay = _retryDelayMsConfig * Math.Pow(2, attempt - 1) + Random.Shared.Next(100, 500);
                await Task.Delay((int)delay);
            }
            catch (Exception ex)
            {
                lastException = ex;
                _logger.LogError(ex, "Non-retryable database operation failed on attempt {Attempt}/{MaxRetries}", 
                    attempt, maxRetries);
                break;
            }
            finally
            {
                if (connection != null)
                {
                    try
                    {
                        await connection.DisposeAsync();
                    }
                    catch (Exception ex)
                    {
                        _logger.LogWarning(ex, "Error disposing database connection");
                    }
                    finally
                    {
                        _connectionSemaphore.Release();
                    }
                }
            }
        }

        _logger.LogError(lastException, "Database operation failed after {MaxRetries} attempts", maxRetries);
        throw lastException ?? new InvalidOperationException("Database operation failed");
    }

    public async Task ExecuteWithRetryAsync(Func<NpgsqlConnection, Task> operation, int maxRetries = -1)
    {
        await ExecuteWithRetryAsync(async connection =>
        {
            await operation(connection);
            return true; // Return dummy value for void operations
        }, maxRetries);
    }

    private static bool IsRetryableException(NpgsqlException ex)
    {
        // Retry on connection issues, timeouts, and temporary failures
        return ex.ErrorCode switch
        {
            // Connection timeout
            08000 => true,
            // Connection does not exist
            08003 => true,
            // Connection failure
            08006 => true,
            // SQL statement not yet complete or Query canceled
            57014 => true,
            // Connection timed out
            08001 => true,
            // Connection limit exceeded
            08004 => true,
            // Connection limit exceeded for this host
            08005 => true,
            _ => ex.Message.Contains("timeout", StringComparison.OrdinalIgnoreCase) || 
                 ex.Message.Contains("connection", StringComparison.OrdinalIgnoreCase) ||
                 ex.Message.Contains("stream", StringComparison.OrdinalIgnoreCase)
        };
    }
}
