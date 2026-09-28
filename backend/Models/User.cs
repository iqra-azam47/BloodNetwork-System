using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace BloodNetwork.API.Models;

public class User
{
    [Key]
    public Guid Id { get; set; } = Guid.NewGuid();

    [Required]
    [MaxLength(150)]
    public string FullName { get; set; } = string.Empty;

    [Required]
    [EmailAddress]
    [MaxLength(150)]
    public string Email { get; set; } = string.Empty;

    [Required]
    [JsonIgnore]
    public string PasswordHash { get; set; } = string.Empty;

    /// <summary>
    /// 0=Donor, 1=Hospital, 2=BloodBank, 3=Admin
    /// </summary>
    [Required]
    public int Role { get; set; } = UserRoles.Donor;

    [Required]
    [MaxLength(30)]
    public string PhoneNumber { get; set; } = string.Empty;

    [Required]
    [MaxLength(100)]
    public string City { get; set; } = string.Empty;

    [Required]
    [MaxLength(250)]
    public string Address { get; set; } = string.Empty;

    [MaxLength(10)]
    public string? BloodGroup { get; set; }

    /// <summary>
    /// Default true for donors, false for facilities pending approval
    /// </summary>
    public bool IsVerified { get; set; } = false;

    [MaxLength(100)]
    public string? LicenseOrRegNumber { get; set; }

    public double NotificationRadiusKm { get; set; } = 25.0;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public ICollection<BloodRequest> BloodRequests { get; set; } = new List<BloodRequest>();
    public ICollection<BloodPledge> BloodPledges { get; set; } = new List<BloodPledge>();
    public ICollection<DonationHistory> DonorDonations { get; set; } = new List<DonationHistory>();
    public ICollection<DonationHistory> FacilityDonations { get; set; } = new List<DonationHistory>();
    public ICollection<BloodInventoryItem> InventoryItems { get; set; } = new List<BloodInventoryItem>();
    public ICollection<InventoryTransaction> InventoryTransactions { get; set; } = new List<InventoryTransaction>();
}
