using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace BloodNetwork.API.Models;

public class DonationHistory
{
    [Key]
    public Guid Id { get; set; } = Guid.NewGuid();

    [Required]
    public Guid DonorId { get; set; }

    [ForeignKey(nameof(DonorId))]
    public User? Donor { get; set; }

    [Required]
    public Guid FacilityId { get; set; }

    [ForeignKey(nameof(FacilityId))]
    public User? Facility { get; set; }

    [Required]
    [MaxLength(10)]
    public string BloodGroup { get; set; } = string.Empty;

    [Required]
    public int Units { get; set; } = 1;

    [MaxLength(300)]
    public string ClinicalCase { get; set; } = string.Empty;

    public DateTime DonationDate { get; set; } = DateTime.UtcNow;

    [Required]
    [MaxLength(50)]
    public string VerificationCode { get; set; } = string.Empty;
}
