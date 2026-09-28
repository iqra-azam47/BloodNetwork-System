using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace BloodNetwork.API.Models;

public class InventoryTransaction
{
    [Key]
    public Guid Id { get; set; } = Guid.NewGuid();

    [Required]
    public Guid FacilityId { get; set; }

    [ForeignKey(nameof(FacilityId))]
    public User? Facility { get; set; }

    /// <summary>
    /// "Intake" or "Dispatch"
    /// </summary>
    [Required]
    [MaxLength(20)]
    public string Type { get; set; } = "Intake";

    [Required]
    [MaxLength(10)]
    public string BloodGroup { get; set; } = string.Empty;

    [Required]
    public int Units { get; set; }

    [Required]
    [MaxLength(200)]
    public string SourceOrRecipient { get; set; } = string.Empty;

    public DateTime Timestamp { get; set; } = DateTime.UtcNow;
}
