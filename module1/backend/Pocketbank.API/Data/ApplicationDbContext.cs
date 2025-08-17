using Microsoft.EntityFrameworkCore;
using Pocketbank.API.Models;

namespace Pocketbank.API.Data
{
    public class ApplicationDbContext : DbContext
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
            : base(options)
        {
        }

        public DbSet<User> Users { get; set; }
        public DbSet<Transaction> Transactions { get; set; }
        public DbSet<Category> Categories { get; set; }
        public DbSet<Account> Accounts { get; set; }
        public DbSet<RecurringTransaction> RecurringTransactions { get; set; }
        public DbSet<Budget> Budgets { get; set; }
        public DbSet<BudgetCategory> BudgetCategories { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // Configure User entity
            modelBuilder.Entity<User>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Email).HasMaxLength(255).IsRequired();
                entity.Property(e => e.ProfilePictureUrl).IsRequired();
            });

            // Configure Transaction entity
            modelBuilder.Entity<Transaction>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Amount).HasColumnType("numeric");
                entity.Property(e => e.TransactionDate).IsRequired();
                entity.Property(e => e.Description).HasColumnType("text");
                entity.Property(e => e.ReceiptUrl).HasColumnType("character varying");
                entity.Property(e => e.TransactionType).HasColumnType("text");
                
                entity.HasOne(e => e.Category)
                    .WithMany(c => c.Transactions)
                    .HasForeignKey(e => e.CategoryId)
                    .OnDelete(DeleteBehavior.Restrict);
                
                entity.HasOne(e => e.Account)
                    .WithMany(a => a.Transactions)
                    .HasForeignKey(e => e.AccountId)
                    .OnDelete(DeleteBehavior.Restrict);
            });

            // Configure Category entity
            modelBuilder.Entity<Category>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Name).HasMaxLength(255).IsRequired();
                entity.Property(e => e.Icon).HasColumnType("character varying");
                entity.Property(e => e.Color).HasColumnType("character varying");
                
                entity.HasOne(e => e.User)
                    .WithMany()
                    .HasForeignKey(e => e.UserId)
                    .OnDelete(DeleteBehavior.Restrict);
            });

            // Configure Account entity
            modelBuilder.Entity<Account>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.AccountName).HasMaxLength(255).IsRequired();
                entity.Property(e => e.AccountType).HasMaxLength(255).IsRequired();
                entity.Property(e => e.Balance).HasColumnType("numeric");
                entity.Property(e => e.Currency).HasColumnType("character varying");
                
                entity.HasOne(e => e.User)
                    .WithMany()
                    .HasForeignKey(e => e.UserId)
                    .OnDelete(DeleteBehavior.Restrict);
            });

            // Configure RecurringTransaction entity
            modelBuilder.Entity<RecurringTransaction>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Description).HasMaxLength(255).IsRequired();
                entity.Property(e => e.Amount).HasColumnType("numeric");
                entity.Property(e => e.StartDate).IsRequired();
                entity.Property(e => e.Frequency).HasMaxLength(255).IsRequired();
                entity.Property(e => e.IsIncome).IsRequired();
                entity.Property(e => e.IsActive).IsRequired();
                entity.Property(e => e.CreatedAt).IsRequired();
                
                entity.HasOne(e => e.User)
                    .WithMany()
                    .HasForeignKey(e => e.UserId)
                    .OnDelete(DeleteBehavior.Restrict);
                
                entity.HasOne(e => e.Category)
                    .WithMany(c => c.RecurringTransactions)
                    .HasForeignKey(e => e.CategoryId)
                    .OnDelete(DeleteBehavior.Restrict);
                
                entity.HasOne(e => e.Account)
                    .WithMany(a => a.RecurringTransactions)
                    .HasForeignKey(e => e.AccountId)
                    .OnDelete(DeleteBehavior.Restrict);
            });

            // Configure Budget entity
            modelBuilder.Entity<Budget>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Name).HasMaxLength(255).IsRequired();
                entity.Property(e => e.Amount).HasColumnType("numeric").IsRequired();
                entity.Property(e => e.Period).HasMaxLength(255).IsRequired();
                entity.Property(e => e.StartDate).HasColumnType("date").IsRequired();
                
                entity.HasOne(e => e.User)
                    .WithMany()
                    .HasForeignKey(e => e.UserId)
                    .OnDelete(DeleteBehavior.Restrict);
            });

            // Configure BudgetCategory entity
            modelBuilder.Entity<BudgetCategory>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Limit).HasColumnType("bigint");
                entity.Property(e => e.CreatedAt).IsRequired();
                
                entity.HasOne(e => e.Budget)
                    .WithMany(b => b.BudgetCategories)
                    .HasForeignKey(e => e.BudgetId)
                    .OnDelete(DeleteBehavior.Restrict);
                
                entity.HasOne(e => e.Category)
                    .WithMany()
                    .HasForeignKey(e => e.CategoryId)
                    .OnDelete(DeleteBehavior.Restrict);
            });
        }
    }
}
