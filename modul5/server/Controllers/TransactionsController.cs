using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Server.Data; // DbContext'imiz için
using Server.Models; // Transaction modelimiz için

namespace Server.Controllers
{
    [ApiController]
    [Route("api/[controller]")] // Bu controller'a api/transactions adresinden erişilecek
    public class TransactionsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        // DbContext'i (veritabanı yöneticimizi) bu sınıfa "enjekte ediyoruz"
        // Bu sayede bu sınıf içinde veritabanı işlemleri yapabiliriz.
        public TransactionsController(ApplicationDbContext context)
        {
            _context = context;
        }

        // GET: api/transactions
        // Tüm işlemleri getiren bir endpoint (adres)
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Transaction>>> GetTransactions()
        {
            var transactions = await _context.Transactions.ToListAsync();
            return Ok(transactions);
        }
    }
}