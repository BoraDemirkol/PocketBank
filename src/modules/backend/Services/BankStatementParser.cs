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
        
        // Market ve Süpermarket
        if (lowerDesc.Contains("market") || lowerDesc.Contains("süpermarket") || lowerDesc.Contains("migros") || 
            lowerDesc.Contains("carrefour") || lowerDesc.Contains("bim") || lowerDesc.Contains("a101") || 
            lowerDesc.Contains("şok") || lowerDesc.Contains("gross") || lowerDesc.Contains("metro") ||
            lowerDesc.Contains("gida") || lowerDesc.Contains("gıda") || lowerDesc.Contains("süper") ||
            lowerDesc.Contains("hyper") || lowerDesc.Contains("discount") || lowerDesc.Contains("indirim"))
            return "Market";
        
        // Yemek ve Restoran
        if (lowerDesc.Contains("restoran") || lowerDesc.Contains("cafe") || lowerDesc.Contains("kafe") || 
            lowerDesc.Contains("yemek") || lowerDesc.Contains("doner") || lowerDesc.Contains("döner") ||
            lowerDesc.Contains("pizza") || lowerDesc.Contains("burger") || lowerDesc.Contains("mc") ||
            lowerDesc.Contains("kfc") || lowerDesc.Contains("subway") || lowerDesc.Contains("starbucks") ||
            lowerDesc.Contains("dominos") || lowerDesc.Contains("papa") || lowerDesc.Contains("johns") ||
            lowerDesc.Contains("snowy") || lowerDesc.Contains("kahve") || lowerDesc.Contains("coffee") ||
            lowerDesc.Contains("çay") || lowerDesc.Contains("cay") || lowerDesc.Contains("pastane") ||
            lowerDesc.Contains("fırın") || lowerDesc.Contains("firin") || lowerDesc.Contains("bakery") ||
            lowerDesc.Contains("kebap") || lowerDesc.Contains("kebab") || lowerDesc.Contains("lahmacun") ||
            lowerDesc.Contains("pide") || lowerDesc.Contains("mantı") || lowerDesc.Contains("manti") ||
            lowerDesc.Contains("çorba") || lowerDesc.Contains("corba") || lowerDesc.Contains("salata") ||
            lowerDesc.Contains("tatlı") || lowerDesc.Contains("tatli") || lowerDesc.Contains("dessert"))
            return "Yemek";
        
        // Online Alışveriş
        if (lowerDesc.Contains("trendyol") || lowerDesc.Contains("amazon") || lowerDesc.Contains("hepsiburada") ||
            lowerDesc.Contains("n11") || lowerDesc.Contains("gitti") || lowerDesc.Contains("gittigidiyor") ||
            lowerDesc.Contains("sahibinden") || lowerDesc.Contains("letgo") || lowerDesc.Contains("dolap") ||
            lowerDesc.Contains("iyzico") || lowerDesc.Contains("paytr") || lowerDesc.Contains("iyzico") ||
            lowerDesc.Contains("online") || lowerDesc.Contains("e-ticaret") || lowerDesc.Contains("eticaret") ||
            lowerDesc.Contains("shop") || lowerDesc.Contains("store") || lowerDesc.Contains("mall") ||
            lowerDesc.Contains("avm") || lowerDesc.Contains("plaza") || lowerDesc.Contains("center"))
            return "Online Alışveriş";
        
        // Ulaşım
        if (lowerDesc.Contains("taksi") || lowerDesc.Contains("uber") || lowerDesc.Contains("bitaksi") ||
            lowerDesc.Contains("otobüs") || lowerDesc.Contains("otobus") || lowerDesc.Contains("metro") ||
            lowerDesc.Contains("tren") || lowerDesc.Contains("marmaray") || lowerDesc.Contains("metrobus") ||
            lowerDesc.Contains("dolmuş") || lowerDesc.Contains("dolmus") || lowerDesc.Contains("minibus") ||
            lowerDesc.Contains("benzin") || lowerDesc.Contains("yakıt") || lowerDesc.Contains("yakit") ||
            lowerDesc.Contains("petrol") || lowerDesc.Contains("gas") || lowerDesc.Contains("fuel") ||
            lowerDesc.Contains("park") || lowerDesc.Contains("otopark") || lowerDesc.Contains("parking") ||
            lowerDesc.Contains("yol") || lowerDesc.Contains("toll") || lowerDesc.Contains("geçiş") ||
            lowerDesc.Contains("gecis") || lowerDesc.Contains("köprü") || lowerDesc.Contains("kopru") ||
            lowerDesc.Contains("tünel") || lowerDesc.Contains("tunel") || lowerDesc.Contains("otoyol") ||
            lowerDesc.Contains("highway") || lowerDesc.Contains("istasyon") || lowerDesc.Contains("station"))
            return "Ulaşım";
        
        // Fatura ve Ödemeler
        if (lowerDesc.Contains("fatura") || lowerDesc.Contains("elektrik") || lowerDesc.Contains("su") ||
            lowerDesc.Contains("doğalgaz") || lowerDesc.Contains("dogalgaz") || lowerDesc.Contains("gas") ||
            lowerDesc.Contains("internet") || lowerDesc.Contains("telefon") || lowerDesc.Contains("gsm") ||
            lowerDesc.Contains("enerji") || lowerDesc.Contains("ısıtma") || lowerDesc.Contains("isitma") ||
            lowerDesc.Contains("heating") || lowerDesc.Contains("water") || lowerDesc.Contains("electric") ||
            lowerDesc.Contains("phone") || lowerDesc.Contains("mobile") || lowerDesc.Contains("tel") ||
            lowerDesc.Contains("vodafone") || lowerDesc.Contains("turkcell") || lowerDesc.Contains("türk telekom") ||
            lowerDesc.Contains("turk telekom") || lowerDesc.Contains("superonline") || lowerDesc.Contains("türknet") ||
            lowerDesc.Contains("turknet") || lowerDesc.Contains("netflix") || lowerDesc.Contains("spotify") ||
            lowerDesc.Contains("youtube") || lowerDesc.Contains("prime") || lowerDesc.Contains("disney") ||
            lowerDesc.Contains("hbo") || lowerDesc.Contains("apple") || lowerDesc.Contains("google") ||
            lowerDesc.Contains("microsoft") || lowerDesc.Contains("adobe") || lowerDesc.Contains("office"))
            return "Fatura";
        
        // Kira ödemesi için özel kontrol
        if (lowerDesc.Contains("kira") && (lowerDesc.Contains("ödeme") || lowerDesc.Contains("odeme"))) {
            return "Kira";
        }
        
        // Kira ve Konut
        if (lowerDesc.Contains("kira") || lowerDesc.Contains("ev") || lowerDesc.Contains("konut") ||
            lowerDesc.Contains("apartman") || lowerDesc.Contains("mülk") || lowerDesc.Contains("mulk") ||
            lowerDesc.Contains("emlak") || lowerDesc.Contains("gayrimenkul") || lowerDesc.Contains("property") ||
            lowerDesc.Contains("rent") || lowerDesc.Contains("house") || lowerDesc.Contains("apartment") ||
            lowerDesc.Contains("condo") || lowerDesc.Contains("villa") || lowerDesc.Contains("residence") ||
            lowerDesc.Contains("site") || lowerDesc.Contains("mahalle") || lowerDesc.Contains("sokak") ||
            lowerDesc.Contains("cadde") || lowerDesc.Contains("bulvar") || lowerDesc.Contains("avenue"))
            return "Kira";
        
        // Eğlence ve Kültür
        if (lowerDesc.Contains("sinema") || lowerDesc.Contains("tiyatro") || lowerDesc.Contains("konser") ||
            lowerDesc.Contains("müze") || lowerDesc.Contains("muze") || lowerDesc.Contains("park") ||
            lowerDesc.Contains("oyun") || lowerDesc.Contains("game") || lowerDesc.Contains("eğlence") ||
            lowerDesc.Contains("eglence") || lowerDesc.Contains("gezi") || lowerDesc.Contains("tatil") ||
            lowerDesc.Contains("holiday") || lowerDesc.Contains("vacation") || lowerDesc.Contains("tur") ||
            lowerDesc.Contains("tour") || lowerDesc.Contains("seyahat") || lowerDesc.Contains("travel") ||
            lowerDesc.Contains("hotel") || lowerDesc.Contains("otel") || lowerDesc.Contains("resort") ||
            lowerDesc.Contains("spa") || lowerDesc.Contains("wellness") || lowerDesc.Contains("fitness") ||
            lowerDesc.Contains("gym") || lowerDesc.Contains("spor") || lowerDesc.Contains("sport") ||
            lowerDesc.Contains("yüzme") || lowerDesc.Contains("yuzme") || lowerDesc.Contains("swimming") ||
            lowerDesc.Contains("tenis") || lowerDesc.Contains("tennis") || lowerDesc.Contains("futbol") ||
            lowerDesc.Contains("football") || lowerDesc.Contains("basketbol") || lowerDesc.Contains("basketball") ||
            lowerDesc.Contains("bowling") || lowerDesc.Contains("bilardo") || lowerDesc.Contains("billiard") ||
            lowerDesc.Contains("karting") || lowerDesc.Contains("go-kart") || lowerDesc.Contains("gokart") ||
            lowerDesc.Contains("lunapark") || lowerDesc.Contains("funfair") || lowerDesc.Contains("aquapark") ||
            lowerDesc.Contains("waterpark") || lowerDesc.Contains("kayak") || lowerDesc.Contains("ski") ||
            lowerDesc.Contains("snowboard") || lowerDesc.Contains("dağ") || lowerDesc.Contains("dag") ||
            lowerDesc.Contains("mountain") || lowerDesc.Contains("deniz") || lowerDesc.Contains("sea") ||
            lowerDesc.Contains("plaj") || lowerDesc.Contains("beach") || lowerDesc.Contains("ada") ||
            lowerDesc.Contains("island") || lowerDesc.Contains("cruise") || lowerDesc.Contains("gemi") ||
            lowerDesc.Contains("ship") || lowerDesc.Contains("feribot") || lowerDesc.Contains("ferry"))
            return "Eğlence";
        
        // Sağlık ve Eczane
        if (lowerDesc.Contains("eczane") || lowerDesc.Contains("pharmacy") || lowerDesc.Contains("doktor") ||
            lowerDesc.Contains("doctor") || lowerDesc.Contains("hastane") || lowerDesc.Contains("hospital") ||
            lowerDesc.Contains("klinik") || lowerDesc.Contains("clinic") || lowerDesc.Contains("muayene") ||
            lowerDesc.Contains("examination") || lowerDesc.Contains("tedavi") || lowerDesc.Contains("treatment") ||
            lowerDesc.Contains("ilaç") || lowerDesc.Contains("ilac") || lowerDesc.Contains("medicine") ||
            lowerDesc.Contains("vitamin") || lowerDesc.Contains("supplement") || lowerDesc.Contains("dental") ||
            lowerDesc.Contains("diş") || lowerDesc.Contains("dis") || lowerDesc.Contains("göz") ||
            lowerDesc.Contains("goz") || lowerDesc.Contains("eye") || lowerDesc.Contains("kardiyoloji") ||
            lowerDesc.Contains("cardiology") || lowerDesc.Contains("ortopedi") || lowerDesc.Contains("orthopedics") ||
            lowerDesc.Contains("fizik") || lowerDesc.Contains("physio") || lowerDesc.Contains("terapi") ||
            lowerDesc.Contains("therapy") || lowerDesc.Contains("laboratuvar") || lowerDesc.Contains("laboratory") ||
            lowerDesc.Contains("test") || lowerDesc.Contains("röntgen") || lowerDesc.Contains("rontgen") ||
            lowerDesc.Contains("x-ray") || lowerDesc.Contains("ultrason") || lowerDesc.Contains("ultrasound") ||
            lowerDesc.Contains("mr") || lowerDesc.Contains("tomografi") || lowerDesc.Contains("tomography") ||
            lowerDesc.Contains("ameliyat") || lowerDesc.Contains("surgery") || lowerDesc.Contains("operasyon") ||
            lowerDesc.Contains("operation") || lowerDesc.Contains("acil") || lowerDesc.Contains("emergency") ||
            lowerDesc.Contains("ambulans") || lowerDesc.Contains("ambulance") || lowerDesc.Contains("sağlık") ||
            lowerDesc.Contains("saglik") || lowerDesc.Contains("health"))
            return "Sağlık";
        
        // Eğitim
        if (lowerDesc.Contains("okul") || lowerDesc.Contains("school") || lowerDesc.Contains("üniversite") ||
            lowerDesc.Contains("universite") || lowerDesc.Contains("university") || lowerDesc.Contains("kolej") ||
            lowerDesc.Contains("college") || lowerDesc.Contains("ders") || lowerDesc.Contains("lesson") ||
            lowerDesc.Contains("kurs") || lowerDesc.Contains("course") || lowerDesc.Contains("eğitim") ||
            lowerDesc.Contains("egitim") || lowerDesc.Contains("education") || lowerDesc.Contains("öğrenci") ||
            lowerDesc.Contains("ogrenci") || lowerDesc.Contains("student") || lowerDesc.Contains("öğretmen") ||
            lowerDesc.Contains("ogretmen") || lowerDesc.Contains("teacher") || lowerDesc.Contains("profesör") ||
            lowerDesc.Contains("profesor") || lowerDesc.Contains("professor") || lowerDesc.Contains("kitap") ||
            lowerDesc.Contains("book") || lowerDesc.Contains("kütüphane") || lowerDesc.Contains("kutuphane") ||
            lowerDesc.Contains("library") || lowerDesc.Contains("yayın") || lowerDesc.Contains("yayin") ||
            lowerDesc.Contains("publication") || lowerDesc.Contains("dergi") || lowerDesc.Contains("magazine") ||
            lowerDesc.Contains("gazete") || lowerDesc.Contains("newspaper") || lowerDesc.Contains("araştırma") ||
            lowerDesc.Contains("arastirma") || lowerDesc.Contains("research") || lowerDesc.Contains("seminer") ||
            lowerDesc.Contains("seminar") || lowerDesc.Contains("konferans") || lowerDesc.Contains("conference") ||
            lowerDesc.Contains("workshop") || lowerDesc.Contains("atölye") || lowerDesc.Contains("atolye") ||
            lowerDesc.Contains("laboratuvar") || lowerDesc.Contains("laboratory") || lowerDesc.Contains("deney") ||
            lowerDesc.Contains("experiment") || lowerDesc.Contains("proje") || lowerDesc.Contains("project"))
            return "Eğitim";
        
        // Giyim ve Aksesuar
        if (lowerDesc.Contains("giyim") || lowerDesc.Contains("clothing") || lowerDesc.Contains("tekstil") ||
            lowerDesc.Contains("textile") || lowerDesc.Contains("kumaş") || lowerDesc.Contains("kumas") ||
            lowerDesc.Contains("fabric") || lowerDesc.Contains("elbise") || lowerDesc.Contains("dress") ||
            lowerDesc.Contains("pantolon") || lowerDesc.Contains("pants") || lowerDesc.Contains("gömlek") ||
            lowerDesc.Contains("gomlek") || lowerDesc.Contains("shirt") || lowerDesc.Contains("ceket") ||
            lowerDesc.Contains("jacket") || lowerDesc.Contains("mont") || lowerDesc.Contains("coat") ||
            lowerDesc.Contains("kazak") || lowerDesc.Contains("sweater") || lowerDesc.Contains("tişört") ||
            lowerDesc.Contains("tisort") || lowerDesc.Contains("t-shirt") || lowerDesc.Contains("tshirt") ||
            lowerDesc.Contains("ayakkabı") || lowerDesc.Contains("ayakkabi") || lowerDesc.Contains("shoe") ||
            lowerDesc.Contains("çanta") || lowerDesc.Contains("canta") || lowerDesc.Contains("bag") ||
            lowerDesc.Contains("çeki") || lowerDesc.Contains("ceki") || lowerDesc.Contains("wallet") ||
            lowerDesc.Contains("cüzdan") || lowerDesc.Contains("cuzdan") || lowerDesc.Contains("purse") ||
            lowerDesc.Contains("saat") || lowerDesc.Contains("watch") || lowerDesc.Contains("takı") ||
            lowerDesc.Contains("taki") || lowerDesc.Contains("jewelry") || lowerDesc.Contains("mücevher") ||
            lowerDesc.Contains("mucevher") || lowerDesc.Contains("altın") || lowerDesc.Contains("altin") ||
            lowerDesc.Contains("gold") || lowerDesc.Contains("gümüş") || lowerDesc.Contains("gumus") ||
            lowerDesc.Contains("silver") || lowerDesc.Contains("elmas") || lowerDesc.Contains("diamond") ||
            lowerDesc.Contains("inci") || lowerDesc.Contains("pearl") || lowerDesc.Contains("kolye") ||
            lowerDesc.Contains("necklace") || lowerDesc.Contains("yüzük") || lowerDesc.Contains("yuzuk") ||
            lowerDesc.Contains("ring") || lowerDesc.Contains("küpe") || lowerDesc.Contains("kupe") ||
            lowerDesc.Contains("earring") || lowerDesc.Contains("bilezik") || lowerDesc.Contains("bracelet") ||
            lowerDesc.Contains("kemer") || lowerDesc.Contains("belt") || lowerDesc.Contains("kravat") ||
            lowerDesc.Contains("tie") || lowerDesc.Contains("fular") || lowerDesc.Contains("scarf") ||
            lowerDesc.Contains("şal") || lowerDesc.Contains("sal") || lowerDesc.Contains("shawl") ||
            lowerDesc.Contains("eldiven") || lowerDesc.Contains("glove") || lowerDesc.Contains("şapka") ||
            lowerDesc.Contains("sapka") || lowerDesc.Contains("hat") || lowerDesc.Contains("beret") ||
            lowerDesc.Contains("bere") || lowerDesc.Contains("çorap") || lowerDesc.Contains("corap") ||
            lowerDesc.Contains("sock") || lowerDesc.Contains("iç çamaşır") || lowerDesc.Contains("ic camasir") ||
            lowerDesc.Contains("underwear") || lowerDesc.Contains("mayo") || lowerDesc.Contains("swimsuit") ||
            lowerDesc.Contains("bikini") || lowerDesc.Contains("şort") || lowerDesc.Contains("short") ||
            lowerDesc.Contains("eşarp") || lowerDesc.Contains("esarp") || lowerDesc.Contains("headscarf") ||
            lowerDesc.Contains("türban") || lowerDesc.Contains("turban") || lowerDesc.Contains("hijab") ||
            lowerDesc.Contains("abaya") || lowerDesc.Contains("kıyafet") || lowerDesc.Contains("kiyafet") ||
            lowerDesc.Contains("outfit") || lowerDesc.Contains("kostüm") || lowerDesc.Contains("kostum") ||
            lowerDesc.Contains("costume") || lowerDesc.Contains("uniform") || lowerDesc.Contains("üniforma") ||
            lowerDesc.Contains("uniforma") || lowerDesc.Contains("takım") || lowerDesc.Contains("takim") ||
            lowerDesc.Contains("suit") || lowerDesc.Contains("smokin") || lowerDesc.Contains("tuxedo") ||
            lowerDesc.Contains("abiyye") || lowerDesc.Contains("gown") || lowerDesc.Contains("gelinlik") ||
            lowerDesc.Contains("wedding") || lowerDesc.Contains("damatlık") || lowerDesc.Contains("groom") ||
            lowerDesc.Contains("bebek") || lowerDesc.Contains("baby") || lowerDesc.Contains("çocuk") ||
            lowerDesc.Contains("cocuk") || lowerDesc.Contains("child") || lowerDesc.Contains("kadın") ||
            lowerDesc.Contains("kadin") || lowerDesc.Contains("woman") || lowerDesc.Contains("erkek") ||
            lowerDesc.Contains("man") || lowerDesc.Contains("genç") || lowerDesc.Contains("genc") ||
            lowerDesc.Contains("young") || lowerDesc.Contains("yaşlı") || lowerDesc.Contains("yasli") ||
            lowerDesc.Contains("elder") || lowerDesc.Contains("spor") || lowerDesc.Contains("sport") ||
            lowerDesc.Contains("casual") || lowerDesc.Contains("günlük") || lowerDesc.Contains("gunluk") ||
            lowerDesc.Contains("daily") || lowerDesc.Contains("resmi") || lowerDesc.Contains("formal") ||
            lowerDesc.Contains("gece") || lowerDesc.Contains("night") || lowerDesc.Contains("gündüz") ||
            lowerDesc.Contains("gunduz") || lowerDesc.Contains("day") || lowerDesc.Contains("yaz") ||
            lowerDesc.Contains("summer") || lowerDesc.Contains("kış") || lowerDesc.Contains("kis") ||
            lowerDesc.Contains("winter") || lowerDesc.Contains("ilkbahar") || lowerDesc.Contains("spring") ||
            lowerDesc.Contains("sonbahar") || lowerDesc.Contains("autumn") || lowerDesc.Contains("fall"))
            return "Giyim";
        
        // Elektronik ve Teknoloji
        if (lowerDesc.Contains("elektronik") || lowerDesc.Contains("electronic") || lowerDesc.Contains("teknoloji") ||
            lowerDesc.Contains("technology") || lowerDesc.Contains("bilgisayar") || lowerDesc.Contains("computer") ||
            lowerDesc.Contains("laptop") || lowerDesc.Contains("notebook") || lowerDesc.Contains("tablet") ||
            lowerDesc.Contains("telefon") || lowerDesc.Contains("phone") || lowerDesc.Contains("smartphone") ||
            lowerDesc.Contains("akıllı") || lowerDesc.Contains("akilli") || lowerDesc.Contains("smart") ||
            lowerDesc.Contains("tv") || lowerDesc.Contains("televizyon") || lowerDesc.Contains("television") ||
            lowerDesc.Contains("monitör") || lowerDesc.Contains("monitor") || lowerDesc.Contains("ekran") ||
            lowerDesc.Contains("screen") || lowerDesc.Contains("klavye") || lowerDesc.Contains("keyboard") ||
            lowerDesc.Contains("fare") || lowerDesc.Contains("mouse") || lowerDesc.Contains("yazıcı") ||
            lowerDesc.Contains("yazici") || lowerDesc.Contains("printer") || lowerDesc.Contains("tarayıcı") ||
            lowerDesc.Contains("tarayici") || lowerDesc.Contains("scanner") || lowerDesc.Contains("hoparlör") ||
            lowerDesc.Contains("hoparlor") || lowerDesc.Contains("speaker") || lowerDesc.Contains("kulaklık") ||
            lowerDesc.Contains("kulaklik") || lowerDesc.Contains("headphone") || lowerDesc.Contains("mikrofon") ||
            lowerDesc.Contains("microphone") || lowerDesc.Contains("kamera") || lowerDesc.Contains("camera") ||
            lowerDesc.Contains("video") || lowerDesc.Contains("kayıt") || lowerDesc.Contains("kayit") ||
            lowerDesc.Contains("recording") || lowerDesc.Contains("çekim") || lowerDesc.Contains("cekim") ||
            lowerDesc.Contains("shooting") || lowerDesc.Contains("fotoğraf") || lowerDesc.Contains("fotograf") ||
            lowerDesc.Contains("photo") || lowerDesc.Contains("resim") || lowerDesc.Contains("image") ||
            lowerDesc.Contains("görüntü") || lowerDesc.Contains("goruntu") || lowerDesc.Contains("display") ||
            lowerDesc.Contains("projeksiyon") || lowerDesc.Contains("projection") || lowerDesc.Contains("uydu") ||
            lowerDesc.Contains("satellite") || lowerDesc.Contains("anten") || lowerDesc.Contains("antenna") ||
            lowerDesc.Contains("modem") || lowerDesc.Contains("router") || lowerDesc.Contains("switch") ||
            lowerDesc.Contains("hub") || lowerDesc.Contains("kablo") || lowerDesc.Contains("cable") ||
            lowerDesc.Contains("adaptör") || lowerDesc.Contains("adaptor") || lowerDesc.Contains("şarj") ||
            lowerDesc.Contains("sarj") || lowerDesc.Contains("charge") || lowerDesc.Contains("pil") ||
            lowerDesc.Contains("battery") || lowerDesc.Contains("akü") || lowerDesc.Contains("aku") ||
            lowerDesc.Contains("accumulator") || lowerDesc.Contains("güç") || lowerDesc.Contains("guc") ||
            lowerDesc.Contains("power") || lowerDesc.Contains("enerji") || lowerDesc.Contains("energy") ||
            lowerDesc.Contains("elektrik") || lowerDesc.Contains("electric") || lowerDesc.Contains("volt") ||
            lowerDesc.Contains("watt") || lowerDesc.Contains("amper") || lowerDesc.Contains("ampere") ||
            lowerDesc.Contains("ohm") || lowerDesc.Contains("frekans") || lowerDesc.Contains("frequency") ||
            lowerDesc.Contains("dalga") || lowerDesc.Contains("wave") || lowerDesc.Contains("sinyal") ||
            lowerDesc.Contains("signal") || lowerDesc.Contains("veri") || lowerDesc.Contains("data") ||
            lowerDesc.Contains("dosya") || lowerDesc.Contains("file") || lowerDesc.Contains("program") ||
            lowerDesc.Contains("yazılım") || lowerDesc.Contains("yazilim") || lowerDesc.Contains("software") ||
            lowerDesc.Contains("uygulama") || lowerDesc.Contains("application") || lowerDesc.Contains("app") ||
            lowerDesc.Contains("sistem") || lowerDesc.Contains("system") || lowerDesc.Contains("işletim") ||
            lowerDesc.Contains("isletim") || lowerDesc.Contains("operating") || lowerDesc.Contains("windows") ||
            lowerDesc.Contains("mac") || lowerDesc.Contains("linux") || lowerDesc.Contains("android") ||
            lowerDesc.Contains("ios") || lowerDesc.Contains("iphone") || lowerDesc.Contains("ipad") ||
            lowerDesc.Contains("ipod") || lowerDesc.Contains("apple") || lowerDesc.Contains("samsung") ||
            lowerDesc.Contains("huawei") || lowerDesc.Contains("xiaomi") || lowerDesc.Contains("oppo") ||
            lowerDesc.Contains("vivo") || lowerDesc.Contains("oneplus") || lowerDesc.Contains("sony") ||
            lowerDesc.Contains("lg") || lowerDesc.Contains("panasonic") || lowerDesc.Contains("philips") ||
            lowerDesc.Contains("sharp") || lowerDesc.Contains("toshiba") || lowerDesc.Contains("hitachi") ||
            lowerDesc.Contains("daewoo") || lowerDesc.Contains("beko") || lowerDesc.Contains("vestel") ||
            lowerDesc.Contains("arcelik") || lowerDesc.Contains("profilo") || lowerDesc.Contains("altus") ||
            lowerDesc.Contains("regal") || lowerDesc.Contains("baymak") || lowerDesc.Contains("demirdöküm") ||
            lowerDesc.Contains("demirdokum") || lowerDesc.Contains("vaillant") || lowerDesc.Contains("bosch") ||
            lowerDesc.Contains("siemens") || lowerDesc.Contains("miele") || lowerDesc.Contains("whirlpool") ||
            lowerDesc.Contains("electrolux") || lowerDesc.Contains("candy") || lowerDesc.Contains("hoover") ||
            lowerDesc.Contains("dyson") || lowerDesc.Contains("rowenta") || lowerDesc.Contains("braun") ||
            lowerDesc.Contains("philips") || lowerDesc.Contains("oral-b") || lowerDesc.Contains("oralb") ||
            lowerDesc.Contains("oral") || lowerDesc.Contains("şarj") || lowerDesc.Contains("sarj") ||
            lowerDesc.Contains("charge") || lowerDesc.Contains("şarj") || lowerDesc.Contains("sarj") ||
            lowerDesc.Contains("charge") || lowerDesc.Contains("şarj") || lowerDesc.Contains("sarj") ||
            lowerDesc.Contains("charge"))
            return "Elektronik";
        
        // ATM ve Nakit İşlemleri
        if (lowerDesc.Contains("atm") || lowerDesc.Contains("nakit") || lowerDesc.Contains("cash") ||
            lowerDesc.Contains("para") || lowerDesc.Contains("money") || lowerDesc.Contains("çekim") ||
            lowerDesc.Contains("cekim") || lowerDesc.Contains("withdrawal") || lowerDesc.Contains("yatırım") ||
            lowerDesc.Contains("yatirim") || lowerDesc.Contains("deposit") || lowerDesc.Contains("transfer") ||
            lowerDesc.Contains("havale") || lowerDesc.Contains("eft") || lowerDesc.Contains("iban") ||
            lowerDesc.Contains("hesap") || lowerDesc.Contains("account") || lowerDesc.Contains("banka") ||
            lowerDesc.Contains("bank") || lowerDesc.Contains("kredi") || lowerDesc.Contains("credit") ||
            lowerDesc.Contains("kart") || lowerDesc.Contains("card") || lowerDesc.Contains("pos") ||
            lowerDesc.Contains("terminal") || lowerDesc.Contains("ödeme") || lowerDesc.Contains("odeme") ||
            lowerDesc.Contains("payment") || lowerDesc.Contains("taksit") || lowerDesc.Contains("installment") ||
            lowerDesc.Contains("faiz") || lowerDesc.Contains("interest") || lowerDesc.Contains("komisyon") ||
            lowerDesc.Contains("commission") || lowerDesc.Contains("masraf") || lowerDesc.Contains("expense") ||
            lowerDesc.Contains("ücret") || lowerDesc.Contains("ucret") || lowerDesc.Contains("fee") ||
            lowerDesc.Contains("tutar") || lowerDesc.Contains("amount") || lowerDesc.Contains("bakiye") ||
            lowerDesc.Contains("balance") || lowerDesc.Contains("hesap") || lowerDesc.Contains("account") ||
            lowerDesc.Contains("müşteri") || lowerDesc.Contains("musteri") || lowerDesc.Contains("customer") ||
            lowerDesc.Contains("şube") || lowerDesc.Contains("sube") || lowerDesc.Contains("branch") ||
            lowerDesc.Contains("merkez") || lowerDesc.Contains("center") || lowerDesc.Contains("genel") ||
            lowerDesc.Contains("general") || lowerDesc.Contains("müdürlük") || lowerDesc.Contains("mudurluk") ||
            lowerDesc.Contains("directorate") || lowerDesc.Contains("müdür") || lowerDesc.Contains("mudur") ||
            lowerDesc.Contains("director") || lowerDesc.Contains("müdür") || lowerDesc.Contains("mudur") ||
            lowerDesc.Contains("director"))
            return "Banka İşlemleri";
        
        // Gelir ve Maaş
        if (lowerDesc.Contains("maaş") || lowerDesc.Contains("maas") || lowerDesc.Contains("salary") ||
            lowerDesc.Contains("ücret") || lowerDesc.Contains("ucret") || lowerDesc.Contains("wage") ||
            lowerDesc.Contains("gelir") || lowerDesc.Contains("income") || lowerDesc.Contains("kazanç") ||
            lowerDesc.Contains("kazanc") || lowerDesc.Contains("earnings") || lowerDesc.Contains("ödeme") ||
            lowerDesc.Contains("odeme") || lowerDesc.Contains("payment") || lowerDesc.Contains("tahsilat") ||
            lowerDesc.Contains("collection") || lowerDesc.Contains("alacak") || lowerDesc.Contains("receivable") ||
            lowerDesc.Contains("borç") || lowerDesc.Contains("borc") || lowerDesc.Contains("debt") ||
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
            lowerDesc.Contains("dolar") || lowerDesc.Contains("dollar") || lowerDesc.Contains("sterlin") ||
            lowerDesc.Contains("pound") || lowerDesc.Contains("lira") || lowerDesc.Contains("tl") ||
            lowerDesc.Contains("₺") || lowerDesc.Contains("$") || lowerDesc.Contains("€") || lowerDesc.Contains("£"))
            return "Gelir";
        
        return string.Empty;
    }
} 