using Microsoft.AspNetCore.Mvc;
using PocketBank.Backend.Data;
using PocketBank.Backend.Models;
using Microsoft.EntityFrameworkCore;

namespace PocketBank.Backend.Controllers;

[ApiController]
[Route("api/[controller]")]
public class CategoryController : ControllerBase
{
private readonly AppDbContext _context;

public CategoryController(AppDbContext context)
{
    _context = context;
}

// GET: api/category
[HttpGet]
public async Task<ActionResult<IEnumerable<Category>>> GetCategories()
{
    return await _context.Categories.ToListAsync();
}

// POST: api/category
[HttpPost]
public async Task<ActionResult<Category>> CreateCategory(Category category)
{
    _context.Categories.Add(category);
    await _context.SaveChangesAsync();
    return CreatedAtAction(nameof(GetCategories), new { id = category.Id }, category);
}

// DELETE: api/category/5
[HttpDelete("{id}")]
public async Task<IActionResult> DeleteCategory(int id)
{
    var category = await _context.Categories.FindAsync(id);
    if (category == null)
    {
        return NotFound();
    }

    _context.Categories.Remove(category);
    await _context.SaveChangesAsync();
    return NoContent();
}
}