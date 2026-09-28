using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace BloodNetwork.API.Models;

public class BloodInventoryItem
{
    [Key]
    public Guid Id { get; set; } = Guid.NewGuid();

    [Required]
    public Guid FacilityId { get; set; }

    [ForeignKey(nameof(FacilityId))]
    public User? Facility { get; set; }

    [Required]
    [MaxLength(10)]
    public string BloodGroup { get; set; } = string.Empty;

    [Required]
    public int AvailableUnits { get; set; } = 0;

    [Required]
    public int MinThresholdUnits { get; set; } = 5;

    public DateTime LastUpdated { get; set; } = DateTime.UtcNow;

    [NotMapped]
    public bool IsCriticalShortage => AvailableUnits <= MinThresholdUnits;
}
