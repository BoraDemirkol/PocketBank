namespace Pocketbank.API.Services;

public class DatabaseOptions
{
    public int MaxConcurrentConnections { get; set; } = 100;
    public int MaxRetries { get; set; } = 3;
    public int RetryDelayMs { get; set; } = 1000;
    public int ConnectionTimeoutMs { get; set; } = 10000;
    public int CommandTimeoutMs { get; set; } = 15000;
    public int ReadTimeoutMs { get; set; } = 15000;
    public int WriteTimeoutMs { get; set; } = 15000;
    public bool EnableQueryCache { get; set; } = true;
    public int QueryCacheTimeoutMs { get; set; } = 300000;
    public bool EnableConnectionPooling { get; set; } = true;
    public int ConnectionPoolSize { get; set; } = 50;
    public int IdleConnectionTimeoutMs { get; set; } = 300000;
}
