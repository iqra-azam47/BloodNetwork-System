using System.ComponentModel.DataAnnotations;

namespace BloodNetwork.API.DTOs;

public class AdminStatsDto
{
    public int TotalUsers { get; set; }
    public int TotalDonors { get; set; }
    public int TotalHospitals { get; set; }
    public int TotalBloodBanks { get; set; }
    public int PendingFacilityApprovals { get; set; }
    public int ActiveBloodRequests { get; set; }
    public int CompletedDonations { get; set; }
    public int TotalUnitsDispatched { get; set; }
}

public class FacilityApprovalDto
{
    [Required]
    public Guid FacilityId { get; set; }

    [Required]
    public bool Approve { get; set; }

    public string? Reason { get; set; }
}

public class UpdateFacilityDto
{
    [Required]
    [MaxLength(150)]
    public string FullName { get; set; } = string.Empty;

    [Required]
    [MaxLength(30)]
    public string PhoneNumber { get; set; } = string.Empty;

    [Required]
    [MaxLength(100)]
    public string City { get; set; } = string.Empty;

    [Required]
    [MaxLength(250)]
    public string Address { get; set; } = string.Empty;

    [MaxLength(100)]
    public string? LicenseOrRegNumber { get; set; }

    public bool IsVerified { get; set; }
}

public class CreateFacilityByAdminDto
{
    [Required]
    [MaxLength(150)]
    public string FullName { get; set; } = string.Empty;

    [Required]
    [EmailAddress]
    [MaxLength(150)]
    public string Email { get; set; } = string.Empty;

    [Required]
    [MinLength(6)]
    public string Password { get; set; } = string.Empty;

    [Required]
    [Range(1, 2)]
    public int Role { get; set; } // 1=Hospital, 2=BloodBank

    [Required]
    [MaxLength(30)]
    public string PhoneNumber { get; set; } = string.Empty;

    [Required]
    [MaxLength(100)]
    public string City { get; set; } = string.Empty;

    [Required]
    [MaxLength(250)]
    public string Address { get; set; } = string.Empty;

    [Required]
    [MaxLength(100)]
    public string LicenseOrRegNumber { get; set; } = string.Empty;

    public bool IsVerified { get; set; } = true;
}

public class AuditLogDto
{
    public Guid Id { get; set; }
    public string Action { get; set; } = string.Empty;
    public string ActorEmail { get; set; } = string.Empty;
    public string Details { get; set; } = string.Empty;
    public DateTime Timestamp { get; set; }
}

public class UserAdminViewDto
{
    public Guid Id { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public int Role { get; set; }
    public string RoleName { get; set; } = string.Empty;
    public string PhoneNumber { get; set; } = string.Empty;
    public string City { get; set; } = string.Empty;
    public string Address { get; set; } = string.Empty;
    public string? BloodGroup { get; set; }
    public bool IsVerified { get; set; }
    public string? LicenseOrRegNumber { get; set; }
    public DateTime CreatedAt { get; set; }
    public int AssociatedCount { get; set; } // Requests or Donations
}
