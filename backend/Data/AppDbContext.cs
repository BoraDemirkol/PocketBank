using Microsoft.EntityFrameworkCore;
using PocketBank.Models;

namespace PocketBank.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options)
            : base(options)
        {
        }

        public DbSet<Account> Accounts => Set<Account>();

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<Account>().ToTable("accounts");

            modelBuilder.Entity<Account>(entity =>
            {
                entity.Property(e => e.Id).HasColumnName("id");
                entity.Property(e => e.UserId).HasColumnName("user_id");
                entity.Property(e => e.AccountName).HasColumnName("account_name");
                entity.Property(e => e.AccountType).HasColumnName("account_type");
                entity.Property(e => e.Balance).HasColumnName("balance");
                entity.Property(e => e.Currency).HasColumnName("currency");
            });
        }
    }
}
