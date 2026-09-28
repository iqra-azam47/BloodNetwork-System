using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace BloodNetwork.API.Models;

public class BloodRequest
{
    [Key]
    public Guid Id { get; set; } = Guid.NewGuid();

    [Required]
    public Guid CreatorId { get; set; }

    [ForeignKey(nameof(CreatorId))]
    public User? Creator { get; set; }

    [Required]
    [MaxLength(10)]
    public string BloodGroup { get; set; } = string.Empty;

    [Required]
    public int RequiredUnits { get; set; }

    public int FulfilledUnits { get; set; } = 0;

    /// <summary>
    /// 0=Critical, 1=Urgent, 2=Standard
    /// </summary>
    [Required]
    public int Urgency { get; set; } = UrgencyLevels.Standard;

    [Required]
    [MaxLength(300)]
    public string PatientDiagnosis { get; set; } = string.Empty;

    [Required]
    [MaxLength(100)]
    public string WardOrBedNumber { get; set; } = string.Empty;

    [Required]
    [MaxLength(30)]
    public string ContactNumber { get; set; } = string.Empty;

    public bool IsActive { get; set; } = true;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public ICollection<BloodPledge> Pledges { get; set; } = new List<BloodPledge>();
}
