using Microsoft.AspNetCore.Mvc;
using System.Text;
using CsvHelper;
using System.Globalization;

namespace Pocketbank.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ImportController : ControllerBase
    {
        [HttpPost("parse-import-file")]
        public Task<IActionResult> ParseImportFile(IFormFile file)
        {
            if (file == null || file.Length == 0)
            {
                return Task.FromResult<IActionResult>(BadRequest("No file uploaded"));
            }

            try
            {
                var fileExtension = Path.GetExtension(file.FileName).ToLowerInvariant();
                var headers = new List<string>();
                var rows = new List<Dictionary<string, string>>();

                if (fileExtension == ".csv")
                {
                    using var reader = new StreamReader(file.OpenReadStream(), Encoding.UTF8);
                    using var csv = new CsvReader(reader, CultureInfo.InvariantCulture);
                    
                    // Read headers
                    csv.Read();
                    csv.ReadHeader();
                    headers = csv.HeaderRecord?.ToList() ?? new List<string>();

                    // Read rows
                    while (csv.Read())
                    {
                        var row = new Dictionary<string, string>();
                        foreach (var header in headers)
                        {
                            row[header] = csv.GetField(header) ?? "";
                        }
                        rows.Add(row);
                    }
                }
                else
                {
                    // For now, return mock data for Excel files
                    // In a real implementation, you would use EPPlus or similar library
                    headers = new List<string> { "Tarih", "Açıklama", "Tutar", "Kategori" };
                    rows = new List<Dictionary<string, string>>
                    {
                        new Dictionary<string, string>
                        {
                            ["Tarih"] = "01.01.2025",
                            ["Açıklama"] = "Örnek işlem 1",
                            ["Tutar"] = "100.00",
                            ["Kategori"] = "Market"
                        },
                        new Dictionary<string, string>
                        {
                            ["Tarih"] = "02.01.2025",
                            ["Açıklama"] = "Örnek işlem 2",
                            ["Tutar"] = "50.00",
                            ["Kategori"] = "Yemek"
                        }
                    };
                }

                return Task.FromResult<IActionResult>(Ok(new { headers, rows }));
            }
            catch (Exception ex)
            {
                return Task.FromResult<IActionResult>(BadRequest($"Error parsing file: {ex.Message}"));
            }
        }

        [HttpPost("parse-bank-statement")]
        public Task<IActionResult> ParseBankStatement(IFormFile file, [FromForm] string bankType)
        {
            if (file == null || file.Length == 0)
            {
                return Task.FromResult<IActionResult>(BadRequest("No file uploaded"));
            }

            try
            {
                // For now, return mock data
                // In a real implementation, you would parse different bank formats
                var transactions = new List<object>
                {
                    new
                    {
                        date = "01.01.2025",
                        description = "POS ALIŞVERİŞ - MARKET",
                        amount = -150.00,
                        category = "Market"
                    },
                    new
                    {
                        date = "02.01.2025",
                        description = "POS ALIŞVERİŞ - RESTORAN",
                        amount = -75.00,
                        category = "Yemek"
                    },
                    new
                    {
                        date = "03.01.2025",
                        description = "MAAŞ",
                        amount = 5000.00,
                        category = "Gelir"
                    }
                };

                return Task.FromResult<IActionResult>(Ok(new { success = true, transactions }));
            }
            catch (Exception ex)
            {
                return Task.FromResult<IActionResult>(BadRequest($"Error parsing bank statement: {ex.Message}"));
            }
        }
    }
}
