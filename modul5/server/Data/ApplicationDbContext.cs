using Microsoft.EntityFrameworkCore;
using Server.Models; 

namespace Server.Data
{
    public class ApplicationDbContext : DbContext
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options)
        {
        }

        // Mevcut transactions tablomuz
        public DbSet<Transaction> Transactions { get; set; }

        // --- YENİ EKLENEN KISIMLAR ---
        
        // Yeni Account modelimizi 'accounts' tablosuna bağlıyoruz
        public DbSet<Account> Accounts { get; set; }

        // Yeni Category modelimizi 'categories' tablosuna bağlıyoruz
        public DbSet<Category> Categories { get; set; }
    }
}