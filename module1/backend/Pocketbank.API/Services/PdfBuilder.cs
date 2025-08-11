using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;
using System.Globalization;
using Pocketbank.API.Models;

namespace Pocketbank.API.Services
{
    public static class PdfBuilder
    {
        public static byte[] BuildStatementPdf(List<Transaction> transactions, DateTime start, DateTime end)
        {
            var dateRange = $"{start:dd.MM.yyyy} - {end:dd.MM.yyyy}";

            var document = Document.Create(container =>
            {
                container.Page(page =>
                {
                    page.Margin(30);
                    page.Size(PageSizes.A4);

                    page.Header()
                        .Text($"📄 Hesap Özeti ({dateRange})")
                        .FontSize(20)
                        .Bold()
                        .FontColor(Colors.Blue.Medium);

                    page.Content().Table(table =>
                    {
                        table.ColumnsDefinition(columns =>
                        {
                            columns.ConstantColumn(100); // Tarih
                            columns.RelativeColumn(2);   // Açıklama
                            columns.RelativeColumn();    // Tutar
                        });

                        // Tablo başlıkları
                        table.Header(header =>
                        {
                            header.Cell().Text("Tarih").Bold();
                            header.Cell().Text("Açıklama").Bold();
                            header.Cell().Text("Tutar (₺)").Bold();
                        });

                        // İşlem verileri
                        foreach (var tx in transactions)
                        {
                            table.Cell().Text(tx.Date.ToString("dd.MM.yyyy"));
                            table.Cell().Text(tx.Description);
                            table.Cell().Text(tx.Amount.ToString("N2", CultureInfo.InvariantCulture));
                        }
                    });

                    page.Footer().AlignCenter().Text(x =>
                    {
                        x.Span("PocketBank Ekstre • ").SemiBold();
                        x.Span(DateTime.Now.ToString("dd.MM.yyyy HH:mm"));
                    });
                });
            });

            return document.GeneratePdf();
        }
    }
}
