namespace Pocketbank.API.Services
{
    public static class CurrencyConverter
    {
        private static readonly Dictionary<string, decimal> Rates = new()
        {
            { "TRY", 1m },
            { "USD", 0.033m },
            { "EUR", 0.030m }
        };

        public static decimal Convert(decimal amount, string from, string to)
        {
            if (from == to) return amount;

            var fromRate = Rates.GetValueOrDefault(from.ToUpper(), 1m);
            var toRate = Rates.GetValueOrDefault(to.ToUpper(), 1m);

            return amount / fromRate * toRate;
        }

        public static bool IsSupported(string currencyCode) => Rates.ContainsKey(currencyCode.ToUpper());
    }
}
