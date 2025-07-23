using PocketBank.Backend.Models;


using Microsoft.EntityFrameworkCore;
using PocketBank.Backend.Data;

var builder = WebApplication.CreateBuilder(args);

// JSON loop hatalarını önlemek için Newtonsoft kullan
builder.Services.AddControllers().AddNewtonsoftJson(options =>
{
options.SerializerSettings.ReferenceLoopHandling = Newtonsoft.Json.ReferenceLoopHandling.Ignore;
});

// In-Memory veritabanı kullanımı
builder.Services.AddDbContext<AppDbContext>(options =>
options.UseInMemoryDatabase("PocketBankDb"));

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
    context.Categories.Add(new Category
    {
        Name = "Gıda",
        Color = "#FF0000",
        Icon = "🍔"
    });

    context.SaveChanges();
}
}
app.Run();