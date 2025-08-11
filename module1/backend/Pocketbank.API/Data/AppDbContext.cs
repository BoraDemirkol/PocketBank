using Microsoft.EntityFrameworkCore;
using Pocketbank.API.Models;

namespace Pocketbank.API.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
        {
        }

        public DbSet<Account> Accounts { get; set; }
        public DbSet<Transaction> Transactions { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            modelBuilder.Entity<Account>(entity =>
            {
                entity.ToTable("accounts");
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Id).HasColumnName("id");
                entity.Property(e => e.UserId).HasColumnName("user_id");
                entity.Property(e => e.AccountName).HasColumnName("account_name");
                entity.Property(e => e.AccountType).HasColumnName("account_type");
                entity.Property(e => e.Balance).HasColumnName("balance");
                entity.Property(e => e.Currency).HasColumnName("currency");
            });

            modelBuilder.Entity<Transaction>(entity =>
            {
                entity.ToTable("transactions");
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Id).HasColumnName("id");
                entity.Property(e => e.AccountId).HasColumnName("account_id");
                entity.Property(e => e.Date).HasColumnName("transaction_date");
                entity.Property(e => e.Amount).HasColumnName("amount");
                entity.Property(e => e.Description).HasColumnName("description");
            });
        }
    }
}
