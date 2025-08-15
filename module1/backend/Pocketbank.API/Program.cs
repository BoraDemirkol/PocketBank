using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.AspNetCore.ResponseCompression;
using Microsoft.AspNetCore.OpenApi;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Pocketbank.API.Services;
using Pocketbank.API.Middleware;
using System.Threading.RateLimiting;
using System;
using Microsoft.AspNetCore.Authorization;

var builder = WebApplication.CreateBuilder(args);

// Replace environment variable placeholders in configuration
var configuration = builder.Configuration;
var connectionString = configuration.GetConnectionString("DefaultConnection");
if (!string.IsNullOrEmpty(connectionString))
{
    connectionString = connectionString.Replace("%DB_PASSWORD%", 
        Environment.GetEnvironmentVariable("DB_PASSWORD") ?? "default_password");
    builder.Configuration["ConnectionStrings:DefaultConnection"] = connectionString;
}

// Add services to the container.
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddOpenApi();

// Configure CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyMethod()
              .AllowAnyHeader();
    });
    
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.WithOrigins("http://localhost:5173", "http://localhost:3000", "http://localhost:4173")
              .AllowAnyMethod()
              .AllowAnyHeader()
              .AllowCredentials();
    });
});

// Configure Memory Cache with optimized settings
builder.Services.AddMemoryCache(options =>
{
    options.SizeLimit = builder.Configuration.GetValue<int>("Caching:MaxCacheSize", 1000);
    options.ExpirationScanFrequency = TimeSpan.FromMinutes(5);
    options.CompactionPercentage = 0.25;
});

// Configure Caching Service
builder.Services.Configure<CachingOptions>(builder.Configuration.GetSection("Caching"));
builder.Services.AddSingleton<ICachingService, CachingService>();

// Configure Database Service
builder.Services.Configure<DatabaseOptions>(builder.Configuration.GetSection("Database"));
builder.Services.AddSingleton<IDatabaseService, DatabaseService>();

// Configure other services
builder.Services.AddScoped<IBankStatementParser, BankStatementParser>();
builder.Services.AddScoped<IUserService, UserService>();
builder.Services.AddScoped<IDatabaseHealthCheck, DatabaseHealthCheck>();

// Add background service for processing recurring transactions daily
builder.Services.AddHostedService<RecurringTransactionProcessor>();

// Configure JWT Authentication
var supabaseUrl = builder.Configuration["Supabase:Url"];

// Validate configuration
if (string.IsNullOrEmpty(supabaseUrl))
{
    throw new InvalidOperationException("Supabase:Url configuration is missing in appsettings.json");
}

Console.WriteLine($"Configuring JWT with Supabase URL: {supabaseUrl}");

// JWT Configuration for Supabase using JWKS
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        // Configure JWT validation using Supabase's JWKS endpoint
        options.Authority = supabaseUrl;
        options.Audience = "authenticated";
        
        // Use JWKS for automatic key discovery
        options.MetadataAddress = $"{supabaseUrl}/.well-known/openid_configuration";
        
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuerSigningKey = true,
            ValidateIssuer = true,
            ValidIssuers = new[] { 
                supabaseUrl, 
                $"{supabaseUrl}/auth/v1",
                $"{supabaseUrl}/auth"
            },
            ValidateAudience = false, // Supabase doesn't always validate audience
            ValidateLifetime = true,
            ClockSkew = TimeSpan.FromMinutes(5),
            RequireSignedTokens = true,
            RequireExpirationTime = true
        };
        
        Console.WriteLine("✓ JWT authentication configured successfully for Supabase using JWKS");
        
        // Events for debugging
        options.Events = new JwtBearerEvents
        {
            OnAuthenticationFailed = context =>
            {
                Console.WriteLine($"JWT Authentication failed: {context.Exception.Message}");
                return Task.CompletedTask;
            },
            OnTokenValidated = context =>
            {
                Console.WriteLine("✓ JWT Token validated successfully");
                var user = context.Principal;
                if (user != null)
                {
                    var userId = user.FindFirst("sub")?.Value;
                    var email = user.FindFirst("email")?.Value;
                    Console.WriteLine($"User authenticated: {userId} ({email})");
                }
                return Task.CompletedTask;
            }
        };
    });

// Configure Authorization
builder.Services.AddAuthorization(options =>
{
    // Add a policy that accepts JWT authentication
    options.DefaultPolicy = new AuthorizationPolicyBuilder()
        .RequireAuthenticatedUser()
        .Build();
    
    // Add specific policies for different endpoints
    options.AddPolicy("JWT", policy =>
        policy.RequireAuthenticatedUser());
});

// Configure Logging
builder.Services.AddLogging(logging =>
{
    logging.ClearProviders();
    logging.AddConsole();
    logging.AddDebug();
    
    // Add performance logging
    logging.AddFilter("Microsoft.EntityFrameworkCore.Database.Command", LogLevel.Warning);
    logging.AddFilter("Microsoft.EntityFrameworkCore.Infrastructure", LogLevel.Warning);
});

// Configure HTTP Client with optimized settings
builder.Services.AddHttpClient("default", client =>
{
    client.Timeout = TimeSpan.FromSeconds(30);
    client.DefaultRequestHeaders.Add("User-Agent", "PocketBank-API");
});

// Add Health Checks
builder.Services.AddHealthChecks()
    .AddCheck<DatabaseHealthCheck>("database");

// Add Response Compression
builder.Services.AddResponseCompression(options =>
{
    options.EnableForHttps = true;
    options.Providers.Add<BrotliCompressionProvider>();
    options.Providers.Add<GzipCompressionProvider>();
});

// Add Rate Limiting
builder.Services.AddRateLimiter(options =>
{
    options.GlobalLimiter = PartitionedRateLimiter.Create<HttpContext, string>(context =>
        RateLimitPartition.GetFixedWindowLimiter(
            partitionKey: context.User.Identity?.Name ?? context.Request.Headers.Host.ToString(),
            factory: partition => new FixedWindowRateLimiterOptions
            {
                AutoReplenishment = true,
                PermitLimit = 100,
                Window = TimeSpan.FromMinutes(1)
            }));
});

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseDeveloperExceptionPage();
    app.MapOpenApi();
}

// Add performance monitoring middleware
app.UseMiddleware<DatabaseMonitoringMiddleware>();

// Use response compression
app.UseResponseCompression();

// Use CORS
app.UseCors("AllowFrontend");

// Use rate limiting
app.UseRateLimiter();

// Use authentication and authorization
app.UseAuthentication();
app.UseAuthorization();

// Map controllers
app.MapControllers();

// Map health checks
app.MapHealthChecks("/health");

// Add performance monitoring endpoint
app.MapGet("/performance", (ICachingService cacheService, IDatabaseService dbService) =>
{
    var cacheStats = new
    {
        CacheSize = cacheService.GetType().GetProperty("CacheSize")?.GetValue(cacheService),
        Timestamp = DateTime.UtcNow
    };

    var dbStats = new
    {
        ConnectionPoolSize = dbService.GetType().GetProperty("ConnectionPoolSize")?.GetValue(cacheService),
        ActiveConnections = cacheService.GetType().GetProperty("ActiveConnections")?.GetValue(cacheService),
        Timestamp = DateTime.UtcNow
    };

    return new { Cache = cacheStats, Database = dbStats };
});

app.Run();
