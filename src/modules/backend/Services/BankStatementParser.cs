using System.Text.RegularExpressions;
using System.Text;
using iText.Kernel.Pdf;
using iText.Kernel.Pdf.Canvas.Parser;
using iText.Kernel.Pdf.Canvas.Parser.Listener;
using OfficeOpenXml;
using System.IO;

namespace backend.Services;

public class BankStatementParser
{
    public class ParsedTransaction
    {
        public DateTime Date { get; set; }
        public string Description { get; set; } = string.Empty;
        public decimal Amount { get; set; }
        public string Category { get; set; } = string.Empty;
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
        var transactions = new List<ParsedTransaction>();
        
        try
        {
            using (var stream = file.OpenReadStream())
            using (var pdfReader = new PdfReader(stream))
            using (var pdfDocument = new PdfDocument(pdfReader))
            {
                var text = new StringBuilder();
                
                for (int i = 1; i <= pdfDocument.GetNumberOfPages(); i++)
                {
                    var page = pdfDocument.GetPage(i);
                    var strategy = new SimpleTextExtractionStrategy();
                    var pageText = PdfTextExtractor.GetTextFromPage(page, strategy);
                    text.AppendLine(pageText);
                }
                
                var content = text.ToString();
                return ParseBankStatement(content, bankType);
            }
        }
        catch (Exception ex)
        {
            // Log error and return empty list instead of throwing
            Console.WriteLine($"Error parsing PDF file: {ex.Message}");
            return transactions;
        }
    }

    private List<ParsedTransaction> ParseExcelFile(IFormFile file, string bankType)
    {
        var transactions = new List<ParsedTransaction>();
        
        try
        {
            using (var stream = file.OpenReadStream())
            using (var package = new ExcelPackage(stream))
            {
                var worksheet = package.Workbook.Worksheets.FirstOrDefault();
                if (worksheet == null) return transactions;
                
                var rowCount = worksheet.Dimension?.Rows ?? 0;
                var colCount = worksheet.Dimension?.Columns ?? 0;
                
                if (rowCount < 2) return transactions; // En az header + 1 satır
            
                // Header satırını oku ve sütun indekslerini bul
                var headers = new List<string>();
                for (int col = 1; col <= colCount; col++)
                {
                    var headerValue = worksheet.Cells[1, col].Value?.ToString()?.ToLower() ?? "";
                    headers.Add(headerValue);
                }
                
                // Eğer header'lar boşsa, ilk birkaç satırı kontrol et
                if (headers.All(h => string.IsNullOrEmpty(h)))
                {
                    // İlk 20 satırı kontrol et ve sütun yapısını anla
                    for (int row = 1; row <= Math.Min(20, rowCount); row++)
                    {
                        var rowData = new List<string>();
                        for (int col = 1; col <= colCount; col++)
                        {
                            var cellValue = worksheet.Cells[row, col].Value?.ToString() ?? "";
                            rowData.Add(cellValue);
                        }
                    }
                    
                    // Ziraat Bankası formatına göre gerçek işlem verilerini bul
                    // İşlem verileri genellikle tarih formatında başlar (dd.mm.yyyy)
                    int dataStartRow = -1;
                    int detectedDateCol = -1;
                    int detectedDescriptionCol = -1;
                    int detectedAmountCol = -1;
                    
                    // Gerçek işlem verilerini bul (tarih formatında olan ilk satır)
                    for (int row = 1; row <= Math.Min(50, rowCount); row++)
                    {
                        for (int col = 1; col <= colCount; col++)
                        {
                            var cellValue = worksheet.Cells[row, col].Value?.ToString() ?? "";
                            if (!string.IsNullOrEmpty(cellValue))
                            {
                                // Tarih formatını kontrol et (dd.mm.yyyy veya dd/mm/yyyy)
                                if (System.Text.RegularExpressions.Regex.IsMatch(cellValue, @"^\d{1,2}[./]\d{1,2}[./]\d{4}$"))
                                {
                                    dataStartRow = row;
                                    detectedDateCol = col;
                                    break;
                                }
                            }
                        }
                        if (dataStartRow != -1) break;
                    }
                    
                    if (dataStartRow == -1)
                    {
                        dataStartRow = 1;
                        detectedDateCol = 1;
                        detectedDescriptionCol = 2;
                        detectedAmountCol = 3;
                    }
                    else
                    {
                        // Bu satırda diğer sütunları analiz et
                        
                        // Tarih sütunundan sonraki sütunları kontrol et
                        for (int col = detectedDateCol + 1; col <= colCount; col++)
                        {
                            var cellValue = worksheet.Cells[dataStartRow, col].Value?.ToString() ?? "";
                            
                            if (!string.IsNullOrEmpty(cellValue))
                            {
                                // Eğer bu sütun uzun metin içeriyorsa (açıklama)
                                if (cellValue.Length > 20 && !System.Text.RegularExpressions.Regex.IsMatch(cellValue, @"^[\d\s.,-]+$"))
                                {
                                    detectedDescriptionCol = col;
                                }
                                // Eğer bu sütun negatif sayısal değer içeriyorsa (işlem tutarı)
                                else if (System.Text.RegularExpressions.Regex.IsMatch(cellValue, @"^-[\d\s.,]+$"))
                                {
                                    detectedAmountCol = col;
                                }
                                // Eğer bu sütun pozitif sayısal değer içeriyorsa ve henüz tutar sütunu bulunmadıysa
                                else if (System.Text.RegularExpressions.Regex.IsMatch(cellValue, @"^[\d\s.,]+$") && cellValue.Length < 20 && detectedAmountCol == -1)
                                {
                                    detectedAmountCol = col;
                                }
                            }
                        }
                        
                        // Eğer sütunlar belirlenemezse varsayılan değerler kullan
                        if (detectedDescriptionCol == -1) detectedDescriptionCol = detectedDateCol + 1;
                        if (detectedAmountCol == -1) detectedAmountCol = detectedDateCol + 2;
                    }
                    
                    return ParseExcelData(worksheet, rowCount, detectedDateCol, detectedDescriptionCol, detectedAmountCol, dataStartRow);
                }
                
                // Sütun indekslerini bul
                int dateColIndex = -1;
                int descriptionColIndex = -1;
                int amountColIndex = -1;
                
                for (int i = 0; i < headers.Count; i++)
                {
                    var header = headers[i];
                    if (header.Contains("tarih") || header.Contains("date"))
                        dateColIndex = i + 1;
                    else if (header.Contains("açıklama") || header.Contains("description") || header.Contains("işlem") || header.Contains("açıklama"))
                        descriptionColIndex = i + 1;
                    else if (header.Contains("tutar") || header.Contains("amount") || header.Contains("bakiye") || header.Contains("balance") || header.Contains("miktar"))
                        amountColIndex = i + 1;
                }
                
                // Eğer sütunlar bulunamadıysa, varsayılan olarak ilk 3 sütunu kullan
                if (dateColIndex == -1) dateColIndex = 1;
                if (descriptionColIndex == -1) descriptionColIndex = 2;
                if (amountColIndex == -1) amountColIndex = 3;
                
                return ParseExcelData(worksheet, rowCount, dateColIndex, descriptionColIndex, amountColIndex);
            }
        }
        catch (Exception ex)
        {
            // Log error and return empty list instead of throwing
            Console.WriteLine($"Error parsing Excel file: {ex.Message}");
            return transactions;
        }
    }
    
    private List<ParsedTransaction> ParseExcelData(ExcelWorksheet worksheet, int rowCount, int dateColIndex, int descriptionColIndex, int amountColIndex, int dataStartRow = 1)
    {
        var transactions = new List<ParsedTransaction>();
        
        // Veri satırlarını oku
        for (int row = dataStartRow; row <= rowCount; row++)
        {
            var dateCell = worksheet.Cells[row, dateColIndex].Value?.ToString();
            var descriptionCell = worksheet.Cells[row, descriptionColIndex].Value?.ToString();
            var amountCell = worksheet.Cells[row, amountColIndex].Value?.ToString();
            
            // Sadece geçerli tarih ve açıklama olan satırları işle
            if (!string.IsNullOrEmpty(dateCell) && !string.IsNullOrEmpty(descriptionCell))
            {
                if (DateTime.TryParse(dateCell, out var date))
                {
                    // Tutar hücresi boşsa veya IBAN/hesap numarası ise 0 olarak kabul et
                    var amount = 0m;
                    if (!string.IsNullOrEmpty(amountCell))
                    {
                        amount = ParseAmount(amountCell);
                    }
                    
                    // Sadece geçerli tutarları olan işlemleri ekle
                    if (amount != 0)
                    {
                        transactions.Add(new ParsedTransaction
                        {
                            Date = date,
                            Description = descriptionCell.Trim(),
                            Amount = amount,
                            Category = AutoDetectCategory(descriptionCell)
                        });
                    }
                }
            }
        }
        
        return transactions;
    }

    private List<ParsedTransaction> ParseTextFile(IFormFile file, string bankType)
    {
        using (var stream = file.OpenReadStream())
        using (var reader = new StreamReader(stream))
        {
            var content = reader.ReadToEnd();
            return ParseBankStatement(content, bankType);
        }
    }

    private List<ParsedTransaction> ParseGarantiFormat(string content)
    {
        var transactions = new List<ParsedTransaction>();
        var lines = content.Split('\n', StringSplitOptions.RemoveEmptyEntries);
        
        foreach (var line in lines.Skip(1)) // İlk satır header
        {
            var parts = line.Split(',');
            if (parts.Length >= 4)
            {
                if (DateTime.TryParse(parts[0], out var date))
                {
                    transactions.Add(new ParsedTransaction
                    {
                        Date = date,
                        Description = parts[1].Trim(),
                        Amount = ParseAmount(parts[2]),
                        Category = AutoDetectCategory(parts[1])
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
        
        foreach (var line in lines.Skip(1))
        {
            var parts = line.Split('\t');
            if (parts.Length >= 3)
            {
                if (DateTime.TryParse(parts[0], out var date))
                {
                    transactions.Add(new ParsedTransaction
                    {
                        Date = date,
                        Description = parts[1].Trim(),
                        Amount = ParseAmount(parts[2]),
                        Category = AutoDetectCategory(parts[1])
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
        
        foreach (var line in lines.Skip(1))
        {
            var parts = line.Split(';');
            if (parts.Length >= 4)
            {
                if (DateTime.TryParse(parts[0], out var date))
                {
                    transactions.Add(new ParsedTransaction
                    {
                        Date = date,
                        Description = parts[2].Trim(),
                        Amount = ParseAmount(parts[3]),
                        Category = AutoDetectCategory(parts[2])
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
        
        foreach (var line in lines.Skip(1))
        {
            var parts = line.Split('|');
            if (parts.Length >= 4)
            {
                if (DateTime.TryParse(parts[0], out var date))
                {
                    transactions.Add(new ParsedTransaction
                    {
                        Date = date,
                        Description = parts[1].Trim(),
                        Amount = ParseAmount(parts[2]),
                        Category = AutoDetectCategory(parts[1])
                    });
                }
            }
        }
        
        return transactions;
    }

    private List<ParsedTransaction> ParseGenericFormat(string content)
    {
        var transactions = new List<ParsedTransaction>();
        var lines = content.Split('\n', StringSplitOptions.RemoveEmptyEntries);
        
        foreach (var line in lines.Skip(1))
        {
            // Farklı ayırıcıları dene
            var separators = new[] { ',', ';', '\t', '|' };
            var parts = line.Split(separators, StringSplitOptions.RemoveEmptyEntries);
            
            if (parts.Length >= 3)
            {
                // Tarih formatlarını dene
                var dateFormats = new[] { "dd.MM.yyyy", "yyyy-MM-dd", "dd/MM/yyyy", "MM/dd/yyyy" };
                DateTime? date = null;
                
                foreach (var format in dateFormats)
                {
                    if (DateTime.TryParseExact(parts[0], format, null, System.Globalization.DateTimeStyles.None, out var parsedDate))
                    {
                        date = parsedDate;
                        break;
                    }
                }
                
                if (date.HasValue)
                {
                    transactions.Add(new ParsedTransaction
                    {
                        Date = date.Value,
                        Description = parts[1].Trim(),
                        Amount = ParseAmount(parts[2]),
                        Category = AutoDetectCategory(parts[1])
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
        
        // Debug: Gelen değeri yazdır
        // Console.WriteLine($"Parsing amount: '{amountStr}'");
        
        // IBAN numarası kontrolü - IBAN genellikle 26 karakter uzunluğunda olur
        if (amountStr.Length >= 20 && Regex.IsMatch(amountStr, @"^[A-Z]{2}\d{2}[A-Z0-9]{4,}$"))
        {
            // Console.WriteLine($"Detected as IBAN: {amountStr}");
            return 0; // IBAN numarası, para değeri değil
        }
        
        // Çok uzun sayısal değerler (muhtemelen IBAN veya hesap numarası)
        var onlyDigits = Regex.Replace(amountStr, @"[^\d]", "");
        if (onlyDigits.Length > 12) // 12 karakterden uzun sayısal değerler muhtemelen IBAN/hesap numarası
        {
            // Console.WriteLine($"Too long numeric value (likely IBAN/account): {amountStr}");
            return 0;
        }
        
        // Sadece rakam içeren çok uzun değerler (muhtemelen IBAN)
        if (amountStr.Length > 15 && Regex.IsMatch(amountStr, @"^\d+$"))
        {
            // Console.WriteLine($"Very long numeric string (likely IBAN): {amountStr}");
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
        
        // Console.WriteLine($"Cleaned amount: '{cleanAmount}'");
        
        // Parse etmeyi dene
        if (decimal.TryParse(cleanAmount, System.Globalization.NumberStyles.Any, System.Globalization.CultureInfo.InvariantCulture, out var amount))
        {
            // Negatif işaretini uygula
            if (isNegative)
                amount = -Math.Abs(amount);
            
            // Çok büyük değerleri kontrol et (muhtemelen yanlış parsing)
            if (Math.Abs(amount) > 100000) // 100 bin (daha sıkı limit)
            {
                // Console.WriteLine($"Amount too large (likely wrong parsing): {amount}");
                return 0;
            }
            
            // Console.WriteLine($"Successfully parsed: {amount}");
            return amount;
        }
        
        // Console.WriteLine($"Failed to parse: {amountStr}");
        return 0;
    }
    
    private decimal ParseAmountCarefully(string amountStr)
    {
        if (string.IsNullOrWhiteSpace(amountStr))
            return 0;
        
        // Sadece rakamları ve nokta/virgülü al
        var digits = Regex.Replace(amountStr, @"[^\d.,]", "");
        
        if (string.IsNullOrEmpty(digits))
            return 0;
        
        // Eğer sadece rakam varsa, direkt parse et
        if (Regex.IsMatch(digits, @"^\d+$"))
        {
            if (decimal.TryParse(digits, out var amount))
                return amount;
        }
        
        // Eğer virgül varsa, ondalık ayırıcı olarak kabul et
        if (digits.Contains(','))
        {
            var parts = digits.Split(',');
            if (parts.Length == 2 && parts[0].Length > 0)
            {
                var wholePart = parts[0];
                var decimalPart = parts[1];
                
                // Binlik ayırıcıları kaldır
                wholePart = wholePart.Replace(".", "");
                
                var combined = wholePart + "." + decimalPart;
                if (decimal.TryParse(combined, out var amount))
                    return amount;
            }
        }
        
        // Son çare: sadece rakamları al
        var onlyDigits = Regex.Replace(amountStr, @"[^\d]", "");
        if (decimal.TryParse(onlyDigits, out var finalAmount))
            return finalAmount;
        
        return 0;
    }

    private string AutoDetectCategory(string description)
    {
        var lowerDesc = description.ToLower();
        
        if (lowerDesc.Contains("market") || lowerDesc.Contains("süpermarket") || lowerDesc.Contains("migros") || lowerDesc.Contains("carrefour"))
            return "Market";
        
        if (lowerDesc.Contains("kira") || lowerDesc.Contains("ev") || lowerDesc.Contains("konut"))
            return "Kira";
        
        if (lowerDesc.Contains("fatura") || lowerDesc.Contains("elektrik") || lowerDesc.Contains("su") || lowerDesc.Contains("doğalgaz"))
            return "Fatura";
        
        if (lowerDesc.Contains("taksi") || lowerDesc.Contains("uber") || lowerDesc.Contains("otobüs") || lowerDesc.Contains("metro"))
            return "Ulaşım";
        
        if (lowerDesc.Contains("restoran") || lowerDesc.Contains("cafe") || lowerDesc.Contains("yemek"))
            return "Eğlence";
        
        return string.Empty;
    }
} 