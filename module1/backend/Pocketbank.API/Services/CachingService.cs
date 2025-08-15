using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Options;
using System.Text.Json;
using System.IO.Compression;
using System.Text;

namespace Pocketbank.API.Services;

public interface ICachingService
{
    Task<T> GetOrCreateAsync<T>(string key, Func<Task<T>> factory, TimeSpan? expiration = null);
    T? Get<T>(string key);
    void Set<T>(string key, T value, TimeSpan? expiration = null);
    void Remove(string key);
    void Clear();
    Task<T?> GetOrCreateCompressedAsync<T>(string key, Func<Task<T>> factory, TimeSpan? expiration = null);
    void SetCompressed<T>(string key, T value, TimeSpan? expiration = null);
}

public class CachingService : ICachingService
{
    private readonly IMemoryCache _memoryCache;
    private readonly ILogger<CachingService> _logger;
    private readonly MemoryCacheEntryOptions _defaultOptions;
    private readonly SemaphoreSlim _semaphore = new SemaphoreSlim(1, 1);

    public CachingService(IMemoryCache memoryCache, ILogger<CachingService> logger, IOptions<CachingOptions> options)
    {
        _memoryCache = memoryCache ?? throw new ArgumentNullException(nameof(memoryCache));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
        
        var cacheOptions = options?.Value ?? new CachingOptions();
        
        _defaultOptions = new MemoryCacheEntryOptions
        {
            SlidingExpiration = TimeSpan.FromMinutes(cacheOptions.DefaultExpirationMinutes),
            AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(cacheOptions.DefaultExpirationMinutes * 2),
            Size = 1, // Default size for memory management
            Priority = CacheItemPriority.Normal
        };
    }

    public async Task<T> GetOrCreateAsync<T>(string key, Func<Task<T>> factory, TimeSpan? expiration = null)
    {
        if (string.IsNullOrEmpty(key))
            throw new ArgumentException("Cache key cannot be null or empty", nameof(key));

        if (factory == null)
            throw new ArgumentNullException(nameof(factory));

        try
        {
            // Try to get from cache first
            if (_memoryCache.TryGetValue(key, out T? cachedValue) && cachedValue != null)
            {
                _logger.LogDebug("Cache hit for key: {Key}", key);
                return cachedValue;
            }

            // Use semaphore to prevent multiple simultaneous factory calls for the same key
            await _semaphore.WaitAsync();
            try
            {
                // Double-check pattern to prevent race conditions
                if (_memoryCache.TryGetValue(key, out cachedValue) && cachedValue != null)
                {
                    _logger.LogDebug("Cache hit after semaphore for key: {Key}", key);
                    return cachedValue;
                }

                // Create the value
                _logger.LogDebug("Cache miss for key: {Key}, executing factory", key);
                var value = await factory();

                if (value != null)
                {
                    var options = CreateCacheOptions(expiration);
                    _memoryCache.Set(key, value, options);
                    _logger.LogDebug("Value cached for key: {Key} with expiration: {Expiration}", key, options.AbsoluteExpirationRelativeToNow);
                }

                return value;
            }
            finally
            {
                _semaphore.Release();
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error in GetOrCreateAsync for key: {Key}", key);
            // Fallback to factory execution without caching
            return await factory();
        }
    }

    public T? Get<T>(string key)
    {
        if (string.IsNullOrEmpty(key))
            return default;

        try
        {
            if (_memoryCache.TryGetValue(key, out T? value))
            {
                _logger.LogDebug("Cache hit for key: {Key}", key);
                return value;
            }

            _logger.LogDebug("Cache miss for key: {Key}", key);
            return default;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting value from cache for key: {Key}", key);
            return default;
        }
    }

    public void Set<T>(string key, T value, TimeSpan? expiration = null)
    {
        if (string.IsNullOrEmpty(key) || value == null)
            return;

        try
        {
            var options = CreateCacheOptions(expiration);
            _memoryCache.Set(key, value, options);
            _logger.LogDebug("Value set in cache for key: {Key} with expiration: {Expiration}", key, options.AbsoluteExpirationRelativeToNow);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error setting value in cache for key: {Key}", key);
        }
    }

    public void Remove(string key)
    {
        if (string.IsNullOrEmpty(key))
            return;

        try
        {
            _memoryCache.Remove(key);
            _logger.LogDebug("Value removed from cache for key: {Key}", key);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error removing value from cache for key: {Key}", key);
        }
    }

    public void Clear()
    {
        try
        {
            if (_memoryCache is MemoryCache memoryCache)
            {
                memoryCache.Compact(1.0);
            }
            _logger.LogInformation("Cache cleared");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error clearing cache");
        }
    }

    public async Task<T?> GetOrCreateCompressedAsync<T>(string key, Func<Task<T>> factory, TimeSpan? expiration = null)
    {
        if (string.IsNullOrEmpty(key))
            throw new ArgumentException("Cache key cannot be null or empty", nameof(key));

        if (factory == null)
            throw new ArgumentNullException(nameof(factory));

        try
        {
            // Try to get compressed value from cache
            var compressedKey = $"compressed_{key}";
            if (_memoryCache.TryGetValue(compressedKey, out byte[]? compressedData) && compressedData != null)
            {
                _logger.LogDebug("Compressed cache hit for key: {Key}", key);
                return Decompress<T>(compressedData);
            }

            // Use semaphore to prevent multiple simultaneous factory calls
            await _semaphore.WaitAsync();
            try
            {
                // Double-check pattern
                if (_memoryCache.TryGetValue(compressedKey, out compressedData) && compressedData != null)
                {
                    _logger.LogDebug("Compressed cache hit after semaphore for key: {Key}", key);
                    return Decompress<T>(compressedData);
                }

                // Create and compress the value
                _logger.LogDebug("Compressed cache miss for key: {Key}, executing factory", key);
                var value = await factory();

                if (value != null)
                {
                    var compressedValue = Compress(value);
                    var options = CreateCacheOptions(expiration);
                    options.Size = compressedValue.Length; // Set size based on compressed data
                    
                    _memoryCache.Set(compressedKey, compressedValue, options);
                    _logger.LogDebug("Compressed value cached for key: {Key}, size: {Size} bytes", key, compressedValue.Length);
                }

                return value;
            }
            finally
            {
                _semaphore.Release();
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error in GetOrCreateCompressedAsync for key: {Key}", key);
            // Fallback to uncompressed caching
            return await GetOrCreateAsync(key, factory, expiration);
        }
    }

    public void SetCompressed<T>(string key, T value, TimeSpan? expiration = null)
    {
        if (string.IsNullOrEmpty(key) || value == null)
            return;

        try
        {
            var compressedKey = $"compressed_{key}";
            var compressedValue = Compress(value);
            var options = CreateCacheOptions(expiration);
            options.Size = compressedValue.Length;

            _memoryCache.Set(compressedKey, compressedValue, options);
            _logger.LogDebug("Compressed value set in cache for key: {Key}, size: {Size} bytes", key, compressedValue.Length);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error setting compressed value in cache for key: {Key}", key);
            // Fallback to uncompressed caching
            Set(key, value, expiration);
        }
    }

    private MemoryCacheEntryOptions CreateCacheOptions(TimeSpan? expiration)
    {
        var options = new MemoryCacheEntryOptions();
        
        if (expiration.HasValue)
        {
            options.SlidingExpiration = expiration.Value;
            options.AbsoluteExpirationRelativeToNow = TimeSpan.FromTicks(expiration.Value.Ticks * 2);
        }

        return options;
    }

    private byte[] Compress<T>(T value)
    {
        try
        {
            var jsonString = JsonSerializer.Serialize(value);
            var bytes = Encoding.UTF8.GetBytes(jsonString);

            using var memoryStream = new MemoryStream();
            using (var gzipStream = new GZipStream(memoryStream, CompressionMode.Compress))
            {
                gzipStream.Write(bytes, 0, bytes.Length);
            }

            return memoryStream.ToArray();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error compressing value for cache");
            throw;
        }
    }

    private T? Decompress<T>(byte[] compressedData)
    {
        try
        {
            using var memoryStream = new MemoryStream(compressedData);
            using var gzipStream = new GZipStream(memoryStream, CompressionMode.Decompress);
            using var resultStream = new MemoryStream();
            
            gzipStream.CopyTo(resultStream);
            var jsonString = Encoding.UTF8.GetString(resultStream.ToArray());
            
            return JsonSerializer.Deserialize<T>(jsonString);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error decompressing value from cache");
            return default;
        }
    }

    public void Dispose()
    {
        _semaphore?.Dispose();
    }
}

public class CachingOptions
{
    public int DefaultExpirationMinutes { get; set; } = 30;
    public int MaxCacheSize { get; set; } = 1000;
    public bool EnableCompression { get; set; } = true;
}
