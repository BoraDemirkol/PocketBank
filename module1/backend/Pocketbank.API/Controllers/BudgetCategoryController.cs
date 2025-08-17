using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Pocketbank.API.Data;
using Pocketbank.API.Models;

namespace Pocketbank.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class BudgetCategoryController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public BudgetCategoryController(ApplicationDbContext context)
        {
            _context = context;
        }

        // GET: api/budget-categories
        [HttpGet]
        public async Task<ActionResult<IEnumerable<BudgetCategory>>> GetBudgetCategories()
        {
            return await _context.BudgetCategories
                .Include(bc => bc.Budget)
                .Include(bc => bc.Category)
                .OrderBy(bc => bc.CreatedAt)
                .ToListAsync();
        }

        // GET: api/budget-categories/{id}
        [HttpGet("{id}")]
        public async Task<ActionResult<BudgetCategory>> GetBudgetCategory(Guid id)
        {
            var budgetCategory = await _context.BudgetCategories
                .Include(bc => bc.Budget)
                .Include(bc => bc.Category)
                .FirstOrDefaultAsync(bc => bc.Id == id);

            if (budgetCategory == null)
            {
                return NotFound();
            }

            return budgetCategory;
        }

        // POST: api/budget-categories
        [HttpPost]
        public async Task<ActionResult<BudgetCategory>> CreateBudgetCategory(BudgetCategory budgetCategory)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            budgetCategory.Id = Guid.NewGuid();
            budgetCategory.CreatedAt = DateTime.UtcNow;

            _context.BudgetCategories.Add(budgetCategory);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetBudgetCategory), new { id = budgetCategory.Id }, budgetCategory);
        }

        // PUT: api/budget-categories/{id}
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateBudgetCategory(Guid id, BudgetCategory budgetCategory)
        {
            if (id != budgetCategory.Id)
            {
                return BadRequest();
            }

            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var existingBudgetCategory = await _context.BudgetCategories.FindAsync(id);
            if (existingBudgetCategory == null)
            {
                return NotFound();
            }

            existingBudgetCategory.BudgetId = budgetCategory.BudgetId;
            existingBudgetCategory.CategoryId = budgetCategory.CategoryId;
            existingBudgetCategory.Limit = budgetCategory.Limit;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!BudgetCategoryExists(id))
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

        // DELETE: api/budget-categories/{id}
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteBudgetCategory(Guid id)
        {
            var budgetCategory = await _context.BudgetCategories.FindAsync(id);
            if (budgetCategory == null)
            {
                return NotFound();
            }

            _context.BudgetCategories.Remove(budgetCategory);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        private bool BudgetCategoryExists(Guid id)
        {
            return _context.BudgetCategories.Any(e => e.Id == id);
        }
    }
}
