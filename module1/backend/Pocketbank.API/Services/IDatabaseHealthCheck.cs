namespace Pocketbank.API.Services;

public interface IDatabaseHealthCheck
{
    Task<bool> IsHealthyAsync();
}
