using Pocketbank.API.Models;

namespace Pocketbank.API.Services;

public interface IBankStatementParser
{
    Task<List<Transaction>> ParseBankStatementAsync(Stream fileStream, string fileName, Guid userId, Guid accountId);
}
