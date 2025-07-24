using PocketBank.Backend.Models;
using Microsoft.EntityFrameworkCore;
using PocketBank.Backend.Data;

var builder = WebApplication.CreateBuilder(args);

// JSON loop hatalarını önlemek için Newtonsoft kullan
builder.Services.AddControllers().AddNewtonsoftJson(options =>
{
options.SerializerSettings.ReferenceLoopHandling = Newtonsoft.Json.ReferenceLoopHandling.Ignore;
});

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

// Swagger ve API Explorer
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

// Geliştirme ortamıysa Swagger UI aç
if (app.Environment.IsDevelopment())
{
app.UseSwagger();
app.UseSwaggerUI();
}

app.UseHttpsRedirection();

app.UseAuthorization();

app.MapControllers(); // Controller'ları otomatik algıla

// Test kategorisi ekleyelim (sadece bir kere eklenir)
using (var scope = app.Services.CreateScope())
{
var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();

if (!context.Categories.Any())
{
    var defaultCategories = new List<Category>
     {
         new Category { Name = "Gıda", Color = "#FF6347", Icon = "🍔" },
         new Category { Name = "Ulaşım", Color = "#4682B4", Icon = "🚗" },
         new Category { Name = "Faturalar", Color = "#FFD700", Icon = "💡" },
         new Category { Name = "Eğlence", Color = "#FF69B4", Icon = "🎮" },
         new Category { Name = "Sağlık", Color = "#32CD32", Icon = "⚕️" }
         // İstersen buraya daha ekle
     };
     context.Categories.AddRange(defaultCategories);
     context.SaveChanges();
}
}
app.Run();