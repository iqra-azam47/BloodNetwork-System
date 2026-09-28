using BloodNetwork.API.Data;
using BloodNetwork.API.Models;

namespace BloodNetwork.API.Services;

public class AuditService : IAuditService
{
    private readonly ApplicationDbContext _context;
    private readonly ILogger<AuditService> _logger;

    public AuditService(ApplicationDbContext context, ILogger<AuditService> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task LogAsync(string action, string actorEmail, string details)
    {
        try
        {
            var log = new AuditLog
            {
                Id = Guid.NewGuid(),
                Action = action,
                ActorEmail = actorEmail,
                Details = details,
                Timestamp = DateTime.UtcNow
            };

            await _context.AuditLogs.AddAsync(log);
            await _context.SaveChangesAsync();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to write audit log for action {Action} by {ActorEmail}", action, actorEmail);
        }
    }
}
