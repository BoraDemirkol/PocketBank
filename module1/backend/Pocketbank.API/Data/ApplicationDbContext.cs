using Microsoft.EntityFrameworkCore;
using Pocketbank.API.Models;

namespace Pocketbank.API.Data;

public class ApplicationDbContext : DbContext
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options)
    {
    }

    public DbSet<User> Users { get; set; }
    public DbSet<Account> Accounts { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Configure User entity
        modelBuilder.Entity<User>(entity =>
        {
            entity.ToTable("users"); // Use lowercase table name
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).HasColumnName("id").ValueGeneratedNever(); // UUID generated manually
            entity.Property(e => e.Email).HasColumnName("email").IsRequired().HasMaxLength(255);
            entity.HasIndex(e => e.Email).IsUnique();
            entity.Property(e => e.Name).HasColumnName("name").IsRequired().HasMaxLength(100).HasDefaultValue("");
            entity.Property(e => e.Surname).HasColumnName("surname").IsRequired().HasMaxLength(100).HasDefaultValue("");
            entity.Property(e => e.ProfilePictureUrl).HasColumnName("profile_picture_url").HasDefaultValue("https://ui-avatars.com/api/?name=User&background=4a7c59&color=fff&size=200");
            entity.Property(e => e.CreatedAt).HasColumnName("created_at").HasDefaultValueSql("CURRENT_TIMESTAMP");
            entity.Property(e => e.PasswordHash).HasColumnName("password_hash").IsRequired();
        });

        // Configure Account entity
        modelBuilder.Entity<Account>(entity =>
        {
            entity.ToTable("accounts"); // Use lowercase table name
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).HasColumnName("id").HasDefaultValueSql("uuid_generate_v4()");
            entity.Property(e => e.UserId).HasColumnName("user_id").IsRequired();
            entity.Property(e => e.AccountName).HasColumnName("account_name").IsRequired().HasMaxLength(100);
            entity.Property(e => e.AccountType).HasColumnName("account_type").IsRequired().HasMaxLength(50);
            entity.Property(e => e.Balance).HasColumnName("balance").HasDefaultValue(0);
            entity.Property(e => e.Currency).HasColumnName("currency").HasMaxLength(3).HasDefaultValue("TRY");
            entity.Property(e => e.CreatedAt).HasColumnName("created_at").HasDefaultValueSql("CURRENT_TIMESTAMP");
            
            // Foreign key relationship
            entity.HasOne<User>()
                  .WithMany()
                  .HasForeignKey(e => e.UserId)
                  .OnDelete(DeleteBehavior.Cascade);
            
            entity.HasIndex(e => e.UserId);
        });
    }
}

public class Account
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public string AccountName { get; set; } = string.Empty;
    public string AccountType { get; set; } = string.Empty;
    public int Balance { get; set; } = 0;
    public string Currency { get; set; } = "TRY";
    public DateTime CreatedAt { get; set; }
}