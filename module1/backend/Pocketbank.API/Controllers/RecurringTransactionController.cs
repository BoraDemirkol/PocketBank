using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Pocketbank.API.Data;
using Pocketbank.API.Models;

namespace Pocketbank.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class RecurringTransactionController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public RecurringTransactionController(ApplicationDbContext context)
        {
            _context = context;
        }

        // GET: api/recurring-transactions
        [HttpGet]
        public async Task<ActionResult<IEnumerable<RecurringTransaction>>> GetRecurringTransactions()
        {
            return await _context.RecurringTransactions
                .Include(rt => rt.Category)
                .Include(rt => rt.Account)
                .OrderBy(rt => rt.StartDate)
                .ToListAsync();
        }

        // GET: api/recurring-transactions/{id}
        [HttpGet("{id}")]
        public async Task<ActionResult<RecurringTransaction>> GetRecurringTransaction(Guid id)
        {
            var recurringTransaction = await _context.RecurringTransactions
                .Include(rt => rt.Category)
                .Include(rt => rt.Account)
                .FirstOrDefaultAsync(rt => rt.Id == id);

            if (recurringTransaction == null)
            {
                return NotFound();
            }

            return recurringTransaction;
        }

        // POST: api/recurring-transactions
        [HttpPost]
        public async Task<ActionResult<RecurringTransaction>> CreateRecurringTransaction(RecurringTransaction recurringTransaction)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            recurringTransaction.Id = Guid.NewGuid();
            recurringTransaction.CreatedAt = DateTime.UtcNow;

            _context.RecurringTransactions.Add(recurringTransaction);
            await _context.SaveChangesAsync();

            // Reload with includes
            await _context.Entry(recurringTransaction)
                .Reference(rt => rt.Category)
                .LoadAsync();
            await _context.Entry(recurringTransaction)
                .Reference(rt => rt.Account)
                .LoadAsync();

            return CreatedAtAction(nameof(GetRecurringTransaction), new { id = recurringTransaction.Id }, recurringTransaction);
        }

        // PUT: api/recurring-transactions/{id}
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateRecurringTransaction(Guid id, RecurringTransaction recurringTransaction)
        {
            if (id != recurringTransaction.Id)
            {
                return BadRequest();
            }

            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var existingRecurringTransaction = await _context.RecurringTransactions.FindAsync(id);
            if (existingRecurringTransaction == null)
            {
                return NotFound();
            }

            existingRecurringTransaction.Description = recurringTransaction.Description;
            existingRecurringTransaction.Amount = recurringTransaction.Amount;
            existingRecurringTransaction.CategoryId = recurringTransaction.CategoryId;
            existingRecurringTransaction.AccountId = recurringTransaction.AccountId;
            existingRecurringTransaction.StartDate = recurringTransaction.StartDate;
            existingRecurringTransaction.Frequency = recurringTransaction.Frequency;
            existingRecurringTransaction.IsIncome = recurringTransaction.IsIncome;
            existingRecurringTransaction.IsActive = recurringTransaction.IsActive;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!RecurringTransactionExists(id))
                {
                    return NotFound();
                }
                else
                {
                    throw;
                }
            }

            return NoContent();
        }

        // DELETE: api/recurring-transactions/{id}
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteRecurringTransaction(Guid id)
        {
            var recurringTransaction = await _context.RecurringTransactions.FindAsync(id);
            if (recurringTransaction == null)
            {
                return NotFound();
            }

            _context.RecurringTransactions.Remove(recurringTransaction);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        private bool RecurringTransactionExists(Guid id)
        {
            return _context.RecurringTransactions.Any(e => e.Id == id);
        }
    }
}
