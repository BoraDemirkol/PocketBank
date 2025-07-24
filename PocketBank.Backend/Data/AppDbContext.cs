using Microsoft.EntityFrameworkCore;
using PocketBank.Backend.Models;

namespace PocketBank.Backend.Data;

public class AppDbContext : DbContext
{
public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) {}

public DbSet<Transaction> Transactions => Set<Transaction>();
public DbSet<Category> Categories => Set<Category>();
}