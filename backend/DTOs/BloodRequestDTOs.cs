using System.ComponentModel.DataAnnotations;

namespace BloodNetwork.API.DTOs;

public class CreateBloodRequestDto
{
    [Required]
    public string BloodGroup { get; set; } = string.Empty;

    [Required]
    [Range(1, 100)]
    public int RequiredUnits { get; set; }

    [Required]
    [Range(0, 2)]
    public int Urgency { get; set; } // 0=Critical, 1=Urgent, 2=Standard

    [Required]
    [MaxLength(300)]
    public string PatientDiagnosis { get; set; } = string.Empty;

    [Required]
    [MaxLength(100)]
    public string WardOrBedNumber { get; set; } = string.Empty;

    [Required]
    [MaxLength(30)]
    public string ContactNumber { get; set; } = string.Empty;
}

public class BloodRequestResponseDto
{
    public Guid Id { get; set; }
    public Guid CreatorId { get; set; }
    public string CreatorName { get; set; } = string.Empty;
    public string CreatorCity { get; set; } = string.Empty;
    public string CreatorAddress { get; set; } = string.Empty;
    public string CreatorType { get; set; } = string.Empty;
    public string BloodGroup { get; set; } = string.Empty;
    public int RequiredUnits { get; set; }
    public int FulfilledUnits { get; set; }
    public int RemainingUnits => Math.Max(0, RequiredUnits - FulfilledUnits);
    public int Urgency { get; set; }
    public string UrgencyLabel { get; set; } = string.Empty;
    public string PatientDiagnosis { get; set; } = string.Empty;
    public string WardOrBedNumber { get; set; } = string.Empty;
    public string ContactNumber { get; set; } = string.Empty;
    public bool IsActive { get; set; }
    public DateTime CreatedAt { get; set; }
    public int ActivePledgesCount { get; set; }
}

public class ToggleRequestStatusDto
{
    public bool IsActive { get; set; }
}
