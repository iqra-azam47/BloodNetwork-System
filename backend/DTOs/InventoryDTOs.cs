using System.ComponentModel.DataAnnotations;

namespace BloodNetwork.API.DTOs;

public class InventoryItemDto
{
    public Guid Id { get; set; }
    public Guid FacilityId { get; set; }
    public string FacilityName { get; set; } = string.Empty;
    public string BloodGroup { get; set; } = string.Empty;
    public int AvailableUnits { get; set; }
    public int MinThresholdUnits { get; set; }
    public bool IsCriticalShortage => AvailableUnits <= MinThresholdUnits;
    public DateTime LastUpdated { get; set; }
}

public class RecordTransactionDto
{
    [Required]
    public string Type { get; set; } = "Intake"; // "Intake" or "Dispatch"

    [Required]
    public string BloodGroup { get; set; } = string.Empty;

    [Required]
    [Range(1, 1000)]
    public int Units { get; set; }

    [Required]
    [MaxLength(200)]
    public string SourceOrRecipient { get; set; } = string.Empty;
}

public class DispatchToHospitalRequestDto
{
    [Required]
    public Guid RequestId { get; set; }

    [Required]
    [Range(1, 50)]
    public int UnitsToDispatch { get; set; }

    [MaxLength(200)]
    public string DispatchNotes { get; set; } = string.Empty;
}

public class InventorySummaryDto
{
    public int TotalUnits { get; set; }
    public int CriticalShortageTypesCount { get; set; }
    public List<InventoryItemDto> Items { get; set; } = new();
    public List<InventoryTransactionDto> RecentTransactions { get; set; } = new();
}

public class InventoryTransactionDto
{
    public Guid Id { get; set; }
    public string Type { get; set; } = string.Empty;
    public string BloodGroup { get; set; } = string.Empty;
    public int Units { get; set; }
    public string SourceOrRecipient { get; set; } = string.Empty;
    public DateTime Timestamp { get; set; }
}
