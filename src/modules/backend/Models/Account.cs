using System;

namespace PocketBank.Models
{
    public enum AccountType
    {
        Checking, // Vadesiz
        Savings,  // Vadeli
        Credit    // Kredi Kartı
    }

    public class Account
    {
        public Guid Id { get; set; }
        public Guid UserId { get; set; }
        public string AccountName { get; set; } = string.Empty;
        public string AccountType { get; set; } = string.Empty;
        public decimal Balance { get; set; } = 0;
        public string Currency { get; set; } = "TRY";
    }
}
