using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace BloodNetwork.API.Models;

public class BloodPledge
{
    [Key]
    public Guid Id { get; set; } = Guid.NewGuid();

    [Required]
    public Guid RequestId { get; set; }

    [ForeignKey(nameof(RequestId))]
    public BloodRequest? Request { get; set; }

    [Required]
    public Guid DonorId { get; set; }

    [ForeignKey(nameof(DonorId))]
    public User? Donor { get; set; }

    [Required]
    public int UnitsOffered { get; set; } = 1;

    [Required]
    [MaxLength(100)]
    public string EstimatedArrival { get; set; } = string.Empty;

    [Required]
    [MaxLength(30)]
    public string DonorContactNumber { get; set; } = string.Empty;

    /// <summary>
    /// Pledged, Arrived, Completed, Cancelled
    /// </summary>
    [Required]
    [MaxLength(30)]
    public string Status { get; set; } = "Pledged";

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
