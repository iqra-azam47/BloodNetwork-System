using System.ComponentModel.DataAnnotations;

namespace BloodNetwork.API.DTOs;

public class CreatePledgeDto
{
    [Required]
    public Guid RequestId { get; set; }

    [Required]
    [Range(1, 10)]
    public int UnitsOffered { get; set; } = 1;

    [Required]
    [MaxLength(100)]
    public string EstimatedArrival { get; set; } = string.Empty;

    [Required]
    [MaxLength(30)]
    public string DonorContactNumber { get; set; } = string.Empty;
}

public class BloodPledgeResponseDto
{
    public Guid Id { get; set; }
    public Guid RequestId { get; set; }
    public Guid DonorId { get; set; }
    public string DonorName { get; set; } = string.Empty;
    public string DonorEmail { get; set; } = string.Empty;
    public string DonorContactNumber { get; set; } = string.Empty;
    public string DonorCity { get; set; } = string.Empty;
    public string? DonorBloodGroup { get; set; }
    public int UnitsOffered { get; set; }
    public string EstimatedArrival { get; set; } = string.Empty;
    public string Status { get; set; } = "Pledged";
    public DateTime CreatedAt { get; set; }

    // Request details
    public string BloodGroup { get; set; } = string.Empty;
    public string UrgencyLabel { get; set; } = string.Empty;
    public string FacilityName { get; set; } = string.Empty;
    public string WardOrBedNumber { get; set; } = string.Empty;
}

public class ConfirmDonationDto
{
    [Required]
    public Guid PledgeId { get; set; }

    [MaxLength(300)]
    public string? ClinicalCaseNotes { get; set; }
}

public class ConfirmDonationResultDto
{
    public bool Success { get; set; }
    public string Message { get; set; } = string.Empty;
    public string VerificationCode { get; set; } = string.Empty;
    public int RequestFulfilledUnits { get; set; }
    public int RequestRequiredUnits { get; set; }
    public bool IsRequestAutoClosed { get; set; }
}
