using System.Text.RegularExpressions;
using System.Text;
using iText.Kernel.Pdf;
using iText.Kernel.Pdf.Canvas.Parser;
using iText.Kernel.Pdf.Canvas.Parser.Listener;
using OfficeOpenXml;
using System.IO;
using Pocketbank.API.Models;

namespace Pocketbank.API.Services;

public class BankStatementParser : IBankStatementParser
{
    public class ParsedTransaction
    {
        public DateTime Date { get; set; }
        public string Description { get; set; } = string.Empty;
        public decimal Amount { get; set; }
        public string Category { get; set; } = string.Empty;
    }

    public async Task<List<Transaction>> ParseBankStatementAsync(Stream fileStream, string fileName, Guid userId, Guid accountId)
    {
        var bankType = DetermineBankType(fileName);
        var content = await ReadFileContentAsync(fileStream, fileName);
        var parsedTransactions = ParseBankStatement(content, bankType);
        
        return parsedTransactions.Select(pt => new Transaction
        {
            Id = Guid.NewGuid().ToString(),
            AccountId = accountId.ToString(),
            CategoryId = Guid.Empty.ToString(), // Will be set by category matching logic
            Amount = pt.Amount,
            Description = pt.Description,
            TransactionDate = pt.Date,
            TransactionType = pt.Amount > 0 ? "income" : "expense",
            CreatedAt = DateTime.UtcNow
        }).ToList();
    }

    private string DetermineBankType(string fileName)
    {
        var lowerFileName = fileName.ToLower();
        if (lowerFileName.Contains("garanti")) return "garanti";
        if (lowerFileName.Contains("akbank")) return "akbank";
        if (lowerFileName.Contains("isbank")) return "isbank";
        if (lowerFileName.Contains("ziraat")) return "ziraat";
        return "generic";
    }

    private async Task<string> ReadFileContentAsync(Stream fileStream, string fileName)
    {
        var fileExtension = System.IO.Path.GetExtension(fileName).ToLower();
        
        switch (fileExtension)
        {
            case ".pdf":
                return ReadPdfContentAsync(fileStream);
            case ".xlsx":
            case ".xls":
                return ReadExcelContentAsync(fileStream);
            case ".csv":
            case ".txt":
                return await ReadTextContentAsync(fileStream);
            default:
                throw new ArgumentException("Desteklenmeyen dosya formatı");
        }
    }

    private string ReadPdfContentAsync(Stream fileStream)
    {
        using var pdfReader = new PdfReader(fileStream);
        using var pdfDocument = new PdfDocument(pdfReader);
        
        var text = new StringBuilder();
        
        for (int i = 1; i <= pdfDocument.GetNumberOfPages(); i++)
        {
            var page = pdfDocument.GetPage(i);
            var strategy = new LocationTextExtractionStrategy();
            var pageText = PdfTextExtractor.GetTextFromPage(page, strategy);
            text.AppendLine(pageText);
        }
        
        return text.ToString();
    }

    private string ReadExcelContentAsync(Stream fileStream)
    {
        using var package = new ExcelPackage(fileStream);
        var worksheet = package.Workbook.Worksheets.FirstOrDefault();
        
        if (worksheet == null)
            throw new ArgumentException("Excel dosyasında çalışma sayfası bulunamadı");
        
        var text = new StringBuilder();
        var rowCount = worksheet.Dimension?.Rows ?? 0;
        var colCount = worksheet.Dimension?.Columns ?? 0;
        
        for (int row = 1; row <= rowCount; row++)
        {
            for (int col = 1; col <= colCount; col++)
            {
                var cellValue = worksheet.Cells[row, col].Value?.ToString() ?? "";
                text.Append(cellValue).Append("\t");
            }
            text.AppendLine();
        }
        
        return text.ToString();
    }

    private async Task<string> ReadTextContentAsync(Stream fileStream)
    {
        using var reader = new StreamReader(fileStream);
        return await reader.ReadToEndAsync();
    }

    public List<ParsedTransaction> ParseBankStatement(string content, string bankType)
    {
        return bankType.ToLower() switch
        {
            "garanti" => ParseGarantiFormat(content),
            "akbank" => ParseAkbankFormat(content),
            "isbank" => ParseIsbankFormat(content),
            "ziraat" => ParseZiraatFormat(content),
            _ => ParseGenericFormat(content)
        };
    }

    public List<ParsedTransaction> ParseBankStatementFromFile(IFormFile file, string bankType)
    {
        var fileExtension = System.IO.Path.GetExtension(file.FileName).ToLower();
        
        switch (fileExtension)
        {
            case ".pdf":
                return ParsePdfFile(file, bankType);
            case ".xlsx":
            case ".xls":
                return ParseExcelFile(file, bankType);
            case ".csv":
            case ".txt":
                return ParseTextFile(file, bankType);
            default:
                throw new ArgumentException("Desteklenmeyen dosya formatı");
        }
    }

    private List<ParsedTransaction> ParsePdfFile(IFormFile file, string bankType)
    {
        using var stream = file.OpenReadStream();
        using var pdfReader = new PdfReader(stream);
        using var pdfDocument = new PdfDocument(pdfReader);
        
        var text = new StringBuilder();
        
        for (int i = 1; i <= pdfDocument.GetNumberOfPages(); i++)
        {
            var page = pdfDocument.GetPage(i);
            var strategy = new LocationTextExtractionStrategy();
            var pageText = PdfTextExtractor.GetTextFromPage(page, strategy);
            text.AppendLine(pageText);
        }
        
        return ParseBankStatement(text.ToString(), bankType);
    }

    private List<ParsedTransaction> ParseExcelFile(IFormFile file, string bankType)
    {
        using var stream = file.OpenReadStream();
        using var package = new ExcelPackage(stream);
        var worksheet = package.Workbook.Worksheets.FirstOrDefault();
        
        if (worksheet == null)
            throw new ArgumentException("Excel dosyasında çalışma sayfası bulunamadı");
        
        var transactions = new List<ParsedTransaction>();
        var rowCount = worksheet.Dimension?.Rows ?? 0;
        var colCount = worksheet.Dimension?.Columns ?? 0;
        
        // Find header row and column indices
        int dateCol = -1, descriptionCol = -1, amountCol = -1;
        
        for (int row = 1; row <= Math.Min(10, rowCount); row++) // Check first 10 rows for headers
        {
            for (int col = 1; col <= colCount; col++)
            {
                var cellValue = worksheet.Cells[row, col].Value?.ToString()?.ToLower() ?? "";
                
                if (dateCol == -1 && (cellValue.Contains("tarih") || cellValue.Contains("date")))
                    dateCol = col;
                else if (descriptionCol == -1 && (cellValue.Contains("açıklama") || cellValue.Contains("description") || cellValue.Contains("işlem")))
                    descriptionCol = col;
                else if (amountCol == -1 && (cellValue.Contains("tutar") || cellValue.Contains("amount") || cellValue.Contains("miktar")))
                    amountCol = col;
            }
            
            if (dateCol != -1 && descriptionCol != -1 && amountCol != -1)
                break;
        }
        
        // If we couldn't find headers, try to guess based on data patterns
        if (dateCol == -1 || descriptionCol == -1 || amountCol == -1)
        {
            // Try to find columns by data patterns
            for (int col = 1; col <= colCount; col++)
            {
                var sampleValue = worksheet.Cells[2, col].Value?.ToString() ?? "";
                
                if (dateCol == -1 && Regex.IsMatch(sampleValue, @"\d{1,2}[./-]\d{1,2}[./-]\d{2,4}"))
                    dateCol = col;
                else if (amountCol == -1 && Regex.IsMatch(sampleValue, @"[+-]?\d{1,3}(?:[.,]\d{3})*(?:[.,]\d{2})?"))
                    amountCol = col;
                else if (descriptionCol == -1 && sampleValue.Length > 10)
                    descriptionCol = col;
            }
        }
        
        // If still not found, use default positions
        if (dateCol == -1) dateCol = 1;
        if (descriptionCol == -1) descriptionCol = 2;
        if (amountCol == -1) amountCol = 3;
        
        // Parse data rows
        for (int row = 2; row <= rowCount; row++) // Start from row 2 (skip header)
        {
            var dateValue = worksheet.Cells[row, dateCol].Value?.ToString() ?? "";
            var descriptionValue = worksheet.Cells[row, descriptionCol].Value?.ToString() ?? "";
            var amountValue = worksheet.Cells[row, amountCol].Value?.ToString() ?? "";
            
            if (!string.IsNullOrWhiteSpace(dateValue) && !string.IsNullOrWhiteSpace(amountValue))
            {
                if (DateTime.TryParse(dateValue, out var date))
                {
                    var amount = ParseAmount(amountValue);
                    var category = CategorizeTransaction(descriptionValue);
                    
                    transactions.Add(new ParsedTransaction
                    {
                        Date = date,
                        Description = descriptionValue,
                        Amount = amount,
                        Category = category
                    });
                }
            }
        }
        
        return transactions;
    }

    private List<ParsedTransaction> ParseTextFile(IFormFile file, string bankType)
    {
        using var stream = file.OpenReadStream();
        using var reader = new StreamReader(stream, Encoding.UTF8);
        var content = reader.ReadToEnd();
        
        return ParseBankStatement(content, bankType);
    }

    private List<ParsedTransaction> ParseGenericFormat(string content)
    {
        var transactions = new List<ParsedTransaction>();
        var lines = content.Split('\n', StringSplitOptions.RemoveEmptyEntries);
        
        foreach (var line in lines)
        {
            var trimmedLine = line.Trim();
            if (string.IsNullOrWhiteSpace(trimmedLine))
                continue;
            
            // Basit regex pattern'ları
            var datePattern = @"(\d{1,2}[./-]\d{1,2}[./-]\d{2,4})";
            var amountPattern = @"([+-]?\d{1,3}(?:[.,]\d{3})*(?:[.,]\d{2})?)";
            
            var dateMatch = Regex.Match(trimmedLine, datePattern);
            var amountMatch = Regex.Match(trimmedLine, amountPattern);
            
            if (dateMatch.Success && amountMatch.Success)
            {
                var dateStr = dateMatch.Groups[1].Value;
                var amountStr = amountMatch.Groups[1].Value;
                
                if (DateTime.TryParse(dateStr, out var date))
                {
                    var amount = ParseAmount(amountStr);
                    var description = ExtractDescription(trimmedLine, dateStr, amountStr);
                    var category = CategorizeTransaction(description);
                    
                    transactions.Add(new ParsedTransaction
                    {
                        Date = date,
                        Description = description,
                        Amount = amount,
                        Category = category
                    });
                }
            }
        }
        
        return transactions;
    }

    private List<ParsedTransaction> ParseGarantiFormat(string content)
    {
        var transactions = new List<ParsedTransaction>();
        var lines = content.Split('\n', StringSplitOptions.RemoveEmptyEntries);
        
        foreach (var line in lines)
        {
            var trimmedLine = line.Trim();
            if (string.IsNullOrWhiteSpace(trimmedLine))
                continue;
            
            // Garanti Bankası formatı için özel pattern
            var pattern = @"(\d{2}/\d{2}/\d{4})\s+(.+?)\s+([+-]?\d{1,3}(?:[.,]\d{3})*(?:[.,]\d{2})?)";
            var match = Regex.Match(trimmedLine, pattern);
            
            if (match.Success)
            {
                var dateStr = match.Groups[1].Value;
                var description = match.Groups[2].Value.Trim();
                var amountStr = match.Groups[3].Value;
                
                if (DateTime.TryParse(dateStr, out var date))
                {
                    var amount = ParseAmount(amountStr);
                    var category = CategorizeTransaction(description);
                    
                    transactions.Add(new ParsedTransaction
                    {
                        Date = date,
                        Description = description,
                        Amount = amount,
                        Category = category
                    });
                }
            }
        }
        
        return transactions;
    }

    private List<ParsedTransaction> ParseAkbankFormat(string content)
    {
        var transactions = new List<ParsedTransaction>();
        var lines = content.Split('\n', StringSplitOptions.RemoveEmptyEntries);
        
        foreach (var line in lines)
        {
            var trimmedLine = line.Trim();
            if (string.IsNullOrWhiteSpace(trimmedLine))
                continue;
            
            // Akbank formatı için özel pattern
            var pattern = @"(\d{2}\.\d{2}\.\d{4})\s+(.+?)\s+([+-]?\d{1,3}(?:[.,]\d{3})*(?:[.,]\d{2})?)";
            var match = Regex.Match(trimmedLine, pattern);
            
            if (match.Success)
            {
                var dateStr = match.Groups[1].Value;
                var description = match.Groups[2].Value.Trim();
                var amountStr = match.Groups[3].Value;
                
                if (DateTime.TryParse(dateStr, out var date))
                {
                    var amount = ParseAmount(amountStr);
                    var category = CategorizeTransaction(description);
                    
                    transactions.Add(new ParsedTransaction
                    {
                        Date = date,
                        Description = description,
                        Amount = amount,
                        Category = category
                    });
                }
            }
        }
        
        return transactions;
    }

    private List<ParsedTransaction> ParseIsbankFormat(string content)
    {
        var transactions = new List<ParsedTransaction>();
        var lines = content.Split('\n', StringSplitOptions.RemoveEmptyEntries);
        
        foreach (var line in lines)
        {
            var trimmedLine = line.Trim();
            if (string.IsNullOrWhiteSpace(trimmedLine))
                continue;
            
            // İş Bankası formatı için özel pattern
            var pattern = @"(\d{2}-\d{2}-\d{4})\s+(.+?)\s+([+-]?\d{1,3}(?:[.,]\d{3})*(?:[.,]\d{2})?)";
            var match = Regex.Match(trimmedLine, pattern);
            
            if (match.Success)
            {
                var dateStr = match.Groups[1].Value;
                var description = match.Groups[2].Value.Trim();
                var amountStr = match.Groups[3].Value;
                
                if (DateTime.TryParse(dateStr, out var date))
                {
                    var amount = ParseAmount(amountStr);
                    var category = CategorizeTransaction(description);
                    
                    transactions.Add(new ParsedTransaction
                    {
                        Date = date,
                        Description = description,
                        Amount = amount,
                        Category = category
                    });
                }
            }
        }
        
        return transactions;
    }

    private List<ParsedTransaction> ParseZiraatFormat(string content)
    {
        var transactions = new List<ParsedTransaction>();
        var lines = content.Split('\n', StringSplitOptions.RemoveEmptyEntries);
        
        foreach (var line in lines)
        {
            var trimmedLine = line.Trim();
            if (string.IsNullOrWhiteSpace(trimmedLine))
                continue;
            
            // Ziraat Bankası formatı için özel pattern
            var pattern = @"(\d{2}/\d{2}/\d{4})\s+(.+?)\s+([+-]?\d{1,3}(?:[.,]\d{3})*(?:[.,]\d{2})?)";
            var match = Regex.Match(trimmedLine, pattern);
            
            if (match.Success)
            {
                var dateStr = match.Groups[1].Value;
                var description = match.Groups[2].Value.Trim();
                var amountStr = match.Groups[3].Value;
                
                if (DateTime.TryParse(dateStr, out var date))
                {
                    var amount = ParseAmount(amountStr);
                    var category = CategorizeTransaction(description);
                    
                    transactions.Add(new ParsedTransaction
                    {
                        Date = date,
                        Description = description,
                        Amount = amount,
                        Category = category
                    });
                }
            }
        }
        
        return transactions;
    }

    private decimal ParseAmount(string amountStr)
    {
        if (string.IsNullOrWhiteSpace(amountStr))
            return 0;
        
        // Boşlukları temizle
        amountStr = amountStr.Trim();
        
        // IBAN numarası kontrolü - IBAN genellikle 26 karakter uzunluğunda olur
        if (amountStr.Length >= 20 && Regex.IsMatch(amountStr, @"^[A-Z]{2}\d{2}[A-Z0-9]{4,}$"))
        {
            return 0; // IBAN numarası, para değeri değil
        }
        
        // Çok uzun sayısal değerler (muhtemelen IBAN veya hesap numarası)
        var onlyDigits = Regex.Replace(amountStr, @"[^\d]", "");
        if (onlyDigits.Length > 12) // 12 karakterden uzun sayısal değerler muhtemelen IBAN/hesap numarası
        {
            return 0;
        }
        
        // Sadece rakam içeren çok uzun değerler (muhtemelen IBAN)
        if (amountStr.Length > 15 && Regex.IsMatch(amountStr, @"^\d+$"))
        {
            return 0;
        }
        
        // Negatif işaretini kontrol et
        bool isNegative = amountStr.StartsWith("-") || amountStr.StartsWith("(") && amountStr.EndsWith(")");
        
        // Sayısal olmayan karakterleri temizle (₺, $, €, vb. hariç)
        var cleanAmount = Regex.Replace(amountStr, @"[^\d.,\-\(\)]", "");
        
        // Parantezleri kaldır
        cleanAmount = cleanAmount.Replace("(", "").Replace(")", "");
        
        // Eğer sadece nokta ve virgül varsa, Türk formatı olarak kabul et
        if (cleanAmount.Contains('.') && cleanAmount.Contains(','))
        {
            // Türk formatı: 1.234,56 -> 1234.56
            cleanAmount = cleanAmount.Replace(".", "").Replace(",", ".");
        }
        else if (cleanAmount.Contains(',') && !cleanAmount.Contains('.'))
        {
            // Sadece virgül varsa, ondalık ayırıcı olarak kabul et
            cleanAmount = cleanAmount.Replace(",", ".");
        }
        // Eğer sadece nokta varsa ve birden fazla nokta yoksa, ondalık ayırıcı olarak kabul et
        else if (cleanAmount.Count(c => c == '.') == 1 && cleanAmount.Contains('.'))
        {
            // Tek nokta varsa, ondalık ayırıcı olarak kabul et
            // Hiçbir şey yapma
        }
        else if (cleanAmount.Count(c => c == '.') > 1)
        {
            // Birden fazla nokta varsa, binlik ayırıcı olarak kabul et
            cleanAmount = cleanAmount.Replace(".", "");
        }
        
        // Son olarak, sayısal olmayan tüm karakterleri temizle
        cleanAmount = Regex.Replace(cleanAmount, @"[^\d.\-]", "");
        
        // Eğer sadece nokta kaldıysa, kaldır
        if (cleanAmount == "." || cleanAmount == "-")
            return 0;
        
        // Parse etmeyi dene
        if (decimal.TryParse(cleanAmount, System.Globalization.NumberStyles.Any, System.Globalization.CultureInfo.InvariantCulture, out var amount))
        {
            // Negatif işaretini uygula
            if (isNegative)
                amount = -Math.Abs(amount);
            
            // Çok büyük değerleri kontrol et (muhtemelen yanlış parsing)
            if (Math.Abs(amount) > 100000) // 100 bin (daha sıkı limit)
            {
                return 0;
            }
            
            return amount;
        }
        
        return 0;
    }

    private string ExtractDescription(string line, string dateStr, string amountStr)
    {
        // Tarih ve tutarı çıkar, kalan kısmı açıklama olarak al
        var description = line.Replace(dateStr, "").Replace(amountStr, "").Trim();
        
        // Fazla boşlukları temizle
        description = Regex.Replace(description, @"\s+", " ");
        
        return description;
    }

    private string CategorizeTransaction(string description)
    {
        var lowerDesc = description.ToLower();
        
        // Gelir kategorileri
        if (lowerDesc.Contains("maaş") || lowerDesc.Contains("maas") || lowerDesc.Contains("salary") ||
            lowerDesc.Contains("ücret") || lowerDesc.Contains("ucret") || lowerDesc.Contains("wage") ||
            lowerDesc.Contains("gelir") || lowerDesc.Contains("income") || lowerDesc.Contains("kazanç") ||
            lowerDesc.Contains("kazanc") || lowerDesc.Contains("earnings") || lowerDesc.Contains("ödeme") ||
            lowerDesc.Contains("odeme") || lowerDesc.Contains("payment") || lowerDesc.Contains("tahsilat") ||
            lowerDesc.Contains("collection") || lowerDesc.Contains("alacak") || lowerDesc.Contains("receivable"))
        {
            return "Gelir";
        }
        
        // Gıda kategorileri
        if (lowerDesc.Contains("market") || lowerDesc.Contains("süpermarket") || lowerDesc.Contains("supermarket") ||
            lowerDesc.Contains("restoran") || lowerDesc.Contains("restaurant") || lowerDesc.Contains("yemek") ||
            lowerDesc.Contains("food") || lowerDesc.Contains("kahve") || lowerDesc.Contains("coffee") ||
            lowerDesc.Contains("kafe") || lowerDesc.Contains("cafe") || lowerDesc.Contains("mcdonalds") ||
            lowerDesc.Contains("burger") || lowerDesc.Contains("pizza") || lowerDesc.Contains("dominos") ||
            lowerDesc.Contains("kfc") || lowerDesc.Contains("subway") || lowerDesc.Contains("starbucks"))
        {
            return "Gıda";
        }
        
        // Ulaşım kategorileri
        if (lowerDesc.Contains("otobüs") || lowerDesc.Contains("otobus") || lowerDesc.Contains("bus") ||
            lowerDesc.Contains("metro") || lowerDesc.Contains("taksi") || lowerDesc.Contains("taxi") ||
            lowerDesc.Contains("uber") || lowerDesc.Contains("benzin") || lowerDesc.Contains("gas") ||
            lowerDesc.Contains("yakıt") || lowerDesc.Contains("yakit") || lowerDesc.Contains("fuel") ||
            lowerDesc.Contains("park") || lowerDesc.Contains("otopark") || lowerDesc.Contains("parking"))
        {
            return "Ulaşım";
        }
        
        // Alışveriş kategorileri
        if (lowerDesc.Contains("alışveriş") || lowerDesc.Contains("alisveris") || lowerDesc.Contains("shopping") ||
            lowerDesc.Contains("mağaza") || lowerDesc.Contains("magaza") || lowerDesc.Contains("store") ||
            lowerDesc.Contains("avm") || lowerDesc.Contains("mall") || lowerDesc.Contains("kıyafet") ||
            lowerDesc.Contains("kiyafet") || lowerDesc.Contains("clothing") || lowerDesc.Contains("giyim") ||
            lowerDesc.Contains("ayakkabı") || lowerDesc.Contains("ayakkabi") || lowerDesc.Contains("shoe"))
        {
            return "Alışveriş";
        }
        
        // Fatura kategorileri
        if (lowerDesc.Contains("elektrik") || lowerDesc.Contains("electricity") || lowerDesc.Contains("su") ||
            lowerDesc.Contains("water") || lowerDesc.Contains("doğalgaz") || lowerDesc.Contains("dogalgaz") ||
            lowerDesc.Contains("gas") || lowerDesc.Contains("internet") || lowerDesc.Contains("telefon") ||
            lowerDesc.Contains("phone") || lowerDesc.Contains("fatura") || lowerDesc.Contains("bill"))
        {
            return "Fatura";
        }
        
        // Sağlık kategorileri
        if (lowerDesc.Contains("hastane") || lowerDesc.Contains("hospital") || lowerDesc.Contains("doktor") ||
            lowerDesc.Contains("doctor") || lowerDesc.Contains("eczane") || lowerDesc.Contains("pharmacy") ||
            lowerDesc.Contains("ilaç") || lowerDesc.Contains("ilac") || lowerDesc.Contains("medicine") ||
            lowerDesc.Contains("sağlık") || lowerDesc.Contains("saglik") || lowerDesc.Contains("health"))
        {
            return "Sağlık";
        }
        
        // Eğlence kategorileri
        if (lowerDesc.Contains("sinema") || lowerDesc.Contains("cinema") || lowerDesc.Contains("tiyatro") ||
            lowerDesc.Contains("theater") || lowerDesc.Contains("konser") || lowerDesc.Contains("concert") ||
            lowerDesc.Contains("spor") || lowerDesc.Contains("gym") || lowerDesc.Contains("fitness") ||
            lowerDesc.Contains("oyun") || lowerDesc.Contains("game") || lowerDesc.Contains("eğlence") ||
            lowerDesc.Contains("eglence") || lowerDesc.Contains("entertainment"))
        {
            return "Eğlence";
        }
        
        // Eğitim kategorileri
        if (lowerDesc.Contains("okul") || lowerDesc.Contains("school") || lowerDesc.Contains("üniversite") ||
            lowerDesc.Contains("universite") || lowerDesc.Contains("university") || lowerDesc.Contains("kurs") ||
            lowerDesc.Contains("course") || lowerDesc.Contains("eğitim") || lowerDesc.Contains("egitim") ||
            lowerDesc.Contains("education") || lowerDesc.Contains("kitap") || lowerDesc.Contains("book"))
        {
            return "Eğitim";
        }
        
        // Banka işlemleri
        if (lowerDesc.Contains("borç") || lowerDesc.Contains("borc") || lowerDesc.Contains("debt") ||
            lowerDesc.Contains("kredi") || lowerDesc.Contains("credit") || lowerDesc.Contains("kart") ||
            lowerDesc.Contains("card") || lowerDesc.Contains("hesap") || lowerDesc.Contains("account") ||
            lowerDesc.Contains("banka") || lowerDesc.Contains("bank") || lowerDesc.Contains("vakıf") ||
            lowerDesc.Contains("vakif") || lowerDesc.Contains("foundation") || lowerDesc.Contains("garanti") ||
            lowerDesc.Contains("akbank") || lowerDesc.Contains("isbank") || lowerDesc.Contains("ziraat") ||
            lowerDesc.Contains("yapı") || lowerDesc.Contains("yapi") || lowerDesc.Contains("kredi") ||
            lowerDesc.Contains("credit") || lowerDesc.Contains("yurtiçi") || lowerDesc.Contains("yurtici") ||
            lowerDesc.Contains("domestic") || lowerDesc.Contains("yurtdışı") || lowerDesc.Contains("yurtdisi") ||
            lowerDesc.Contains("foreign") || lowerDesc.Contains("uluslararası") || lowerDesc.Contains("uluslararasi") ||
            lowerDesc.Contains("international") || lowerDesc.Contains("global") || lowerDesc.Contains("dünya") ||
            lowerDesc.Contains("dunya") || lowerDesc.Contains("world") || lowerDesc.Contains("euro") ||
            lowerDesc.Contains("dolar") || lowerDesc.Contains("dollar") || lowerDesc.Contains("tl") ||
            lowerDesc.Contains("lira") || lowerDesc.Contains("transfer") || lowerDesc.Contains("havale") ||
            lowerDesc.Contains("eft") || lowerDesc.Contains("swift") || lowerDesc.Contains("iban"))
        {
            return "Banka İşlemleri";
        }
        
        // Varsayılan kategori
        return "Diğer";
    }
}
