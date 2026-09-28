namespace BloodNetwork.API.Services;

public interface IAuditService
{
    Task LogAsync(string action, string actorEmail, string details);
}
