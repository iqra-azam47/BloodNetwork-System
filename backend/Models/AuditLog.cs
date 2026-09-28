using System.ComponentModel.DataAnnotations;

namespace BloodNetwork.API.Models;

public class AuditLog
{
    [Key]
    public Guid Id { get; set; } = Guid.NewGuid();

    [Required]
    [MaxLength(100)]
    public string Action { get; set; } = string.Empty;

    [Required]
    [MaxLength(150)]
    public string ActorEmail { get; set; } = string.Empty;

    [Required]
    public string Details { get; set; } = string.Empty;

    public DateTime Timestamp { get; set; } = DateTime.UtcNow;
}
