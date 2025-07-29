using System.Text.RegularExpressions;

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
        // Sayısal olmayan karakterleri temizle
        var cleanAmount = Regex.Replace(amountStr, @"[^\d.,-]", "");
        
        // Türk para birimi formatını düzelt
        cleanAmount = cleanAmount.Replace('.', ' ').Replace(',', '.');
        
        if (decimal.TryParse(cleanAmount, out var amount))
        {
            return amount;
        }
        
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
        
        return "Diğer";
    }
} 