using Microsoft.EntityFrameworkCore;
using backend.Models;

namespace backend.Data;

public class ApplicationDbContext : DbContext
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options)
    {
    }

    public DbSet<User> Users { get; set; }
    public DbSet<Account> Accounts { get; set; }
    public DbSet<Category> Categories { get; set; }
    public DbSet<Transaction> Transactions { get; set; }
    public DbSet<Budget> Budgets { get; set; }
    public DbSet<RecurringTransaction> RecurringTransactions { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Configure table names to match Supabase
        modelBuilder.Entity<User>().ToTable("users");
        modelBuilder.Entity<Account>().ToTable("accounts");
        modelBuilder.Entity<Category>().ToTable("categories");
        modelBuilder.Entity<Transaction>().ToTable("transactions");
        modelBuilder.Entity<Budget>().ToTable("budgets");
        modelBuilder.Entity<RecurringTransaction>().ToTable("recurring_transactions");

        // Configure relationships with correct foreign key column names
        modelBuilder.Entity<Account>()
            .HasOne(a => a.User)
            .WithMany(u => u.Accounts)
            .HasForeignKey(a => a.UserId)
            .HasPrincipalKey(u => u.Id);

        modelBuilder.Entity<Category>()
            .HasOne(c => c.User)
            .WithMany(u => u.Categories)
            .HasForeignKey(c => c.UserId)
            .HasPrincipalKey(u => u.Id);

        modelBuilder.Entity<Transaction>()
            .HasOne(t => t.Account)
            .WithMany(a => a.Transactions)
            .HasForeignKey(t => t.AccountId)
            .HasPrincipalKey(a => a.Id);

        modelBuilder.Entity<Transaction>()
            .HasOne(t => t.Category)
            .WithMany(c => c.Transactions)
            .HasForeignKey(t => t.CategoryId)
            .HasPrincipalKey(c => c.Id);

        modelBuilder.Entity<Budget>()
            .HasOne(b => b.User)
            .WithMany()
            .HasForeignKey(b => b.UserId)
            .HasPrincipalKey(u => u.Id);

        modelBuilder.Entity<RecurringTransaction>()
            .HasOne(rt => rt.User)
            .WithMany()
            .HasForeignKey(rt => rt.UserId)
            .HasPrincipalKey(u => u.Id);

        modelBuilder.Entity<RecurringTransaction>()
            .HasOne(rt => rt.Account)
            .WithMany()
            .HasForeignKey(rt => rt.AccountId)
            .HasPrincipalKey(a => a.Id);

        modelBuilder.Entity<RecurringTransaction>()
            .HasOne(rt => rt.Category)
            .WithMany()
            .HasForeignKey(rt => rt.CategoryId)
            .HasPrincipalKey(c => c.Id);
    }
} 