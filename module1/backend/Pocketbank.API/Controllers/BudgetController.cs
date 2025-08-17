using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Pocketbank.API.Data;
using Pocketbank.API.Models;

namespace Pocketbank.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class BudgetController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public BudgetController(ApplicationDbContext context)
        {
            _context = context;
        }

        // GET: api/budgets
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Budget>>> GetBudgets()
        {
            return await _context.Budgets
                .Include(b => b.BudgetCategories!)
                .ThenInclude(bc => bc.Category!)
                .OrderBy(b => b.StartDate)
                .ToListAsync();
        }

        // GET: api/budgets/{id}
        [HttpGet("{id}")]
        public async Task<ActionResult<Budget>> GetBudget(Guid id)
        {
            var budget = await _context.Budgets
                .Include(b => b.BudgetCategories!)
                .ThenInclude(bc => bc.Category!)
                .FirstOrDefaultAsync(b => b.Id == id);

            if (budget == null)
            {
                return NotFound();
            }

            return budget;
        }

        // POST: api/budgets
        [HttpPost]
        public async Task<ActionResult<Budget>> CreateBudget(Budget budget)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            budget.Id = Guid.NewGuid();
            budget.CreatedAt = DateTime.UtcNow;

            _context.Budgets.Add(budget);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetBudget), new { id = budget.Id }, budget);
        }

        // PUT: api/budgets/{id}
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateBudget(Guid id, Budget budget)
        {
            if (id != budget.Id)
            {
                return BadRequest();
            }

            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var existingBudget = await _context.Budgets.FindAsync(id);
            if (existingBudget == null)
            {
                return NotFound();
            }

            existingBudget.Name = budget.Name;
            existingBudget.Amount = budget.Amount;
            existingBudget.Period = budget.Period;
            existingBudget.StartDate = budget.StartDate;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!BudgetExists(id))
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

        // DELETE: api/budgets/{id}
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteBudget(Guid id)
        {
            var budget = await _context.Budgets.FindAsync(id);
            if (budget == null)
            {
                return NotFound();
            }

            _context.Budgets.Remove(budget);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        private bool BudgetExists(Guid id)
        {
            return _context.Budgets.Any(e => e.Id == id);
        }
    }
}
