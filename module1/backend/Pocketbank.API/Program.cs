using Microsoft.AspNetCore.Authentication.JwtBearer;
<<<<<<< HEAD
using Microsoft.IdentityModel.Tokens;
using Microsoft.EntityFrameworkCore;
=======
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
>>>>>>> 9100c27ce5793f4af8ad037a2cd89bdf89599a38
using System.Text;
using Pocketbank.API.Services;
using Pocketbank.API.Data;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddOpenApi();
builder.Services.AddScoped<UserService>();

<<<<<<< HEAD
// Add Entity Framework
builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));
=======
// Add Entity Framework with PostgreSQL
builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection"), npgsqlOptions =>
    {
        npgsqlOptions.EnableRetryOnFailure(
            maxRetryCount: 3,
            maxRetryDelay: TimeSpan.FromSeconds(30),
            errorCodesToAdd: null);
        npgsqlOptions.CommandTimeout(60);
    }));
>>>>>>> 9100c27ce5793f4af8ad037a2cd89bdf89599a38

// Add CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.WithOrigins("http://localhost:5173") // Vite default port
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

<<<<<<< HEAD
// Add JWT Authentication (Supabase)
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        var supabaseJwtSecret = builder.Configuration["Supabase:JwtSecret"];
        var supabaseUrl = builder.Configuration["Supabase:Url"];
=======
// Add JWT Authentication
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        var supabaseUrl = builder.Configuration["Supabase:Url"];
        var supabaseJwtSecret = builder.Configuration["Supabase:JwtSecret"];
>>>>>>> 9100c27ce5793f4af8ad037a2cd89bdf89599a38
        
        if (string.IsNullOrEmpty(supabaseJwtSecret))
        {
            throw new InvalidOperationException("Supabase JWT secret is not configured");
        }

        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(supabaseJwtSecret)),
            ValidateIssuer = true,
            ValidIssuer = supabaseUrl + "/auth/v1",
            ValidateAudience = true,
            ValidAudience = "authenticated",
            ValidateLifetime = true,
            ClockSkew = TimeSpan.Zero
        };
<<<<<<< HEAD
=======
        
>>>>>>> 9100c27ce5793f4af8ad037a2cd89bdf89599a38
    });

builder.Services.AddAuthorization();

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

<<<<<<< HEAD
=======
// Test database connection
using (var scope = app.Services.CreateScope())
{
    try
    {
        var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        Console.WriteLine("Testing database connection...");
        
        try
        {
            var canConnect = await context.Database.CanConnectAsync();
            if (canConnect)
            {
                Console.WriteLine("Database connection successful!");
                
                // Test a simple query to verify the connection is working
                try
                {
                    var accountCount = await context.Accounts.CountAsync();
                    Console.WriteLine($"Database query test successful. Found {accountCount} accounts.");
                }
                catch (Exception queryEx)
                {
                    Console.WriteLine($"Warning: Database query test failed: {queryEx.Message}");
                    Console.WriteLine($"Query exception type: {queryEx.GetType().Name}");
                    if (queryEx.InnerException != null)
                    {
                        Console.WriteLine($"Inner query exception: {queryEx.InnerException.Message}");
                    }
                }
            }
            else
            {
                Console.WriteLine("Warning: Database connection failed");
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Database connection test failed with exception: {ex.Message}");
            Console.WriteLine($"Exception type: {ex.GetType().Name}");
            if (ex.InnerException != null)
            {
                Console.WriteLine($"Inner exception: {ex.InnerException.Message}");
                if (ex.InnerException.InnerException != null)
                {
                    Console.WriteLine($"Inner inner exception: {ex.InnerException.InnerException.Message}");
                }
            }
        }
    }
    catch (Exception ex)
    {
        Console.WriteLine($"Warning: Database connection test failed: {ex.Message}");
        Console.WriteLine($"Exception type: {ex.GetType().Name}");
        if (ex.InnerException != null)
        {
            Console.WriteLine($"Inner exception: {ex.InnerException.Message}");
        }
        // Don't throw - just log the warning
    }
}

>>>>>>> 9100c27ce5793f4af8ad037a2cd89bdf89599a38
app.UseCors("AllowFrontend");
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

app.Run();
