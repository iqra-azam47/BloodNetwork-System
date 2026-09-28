using System.ComponentModel.DataAnnotations;

namespace BloodNetwork.API.DTOs;

public class MedicalScreeningRequestDto
{
    public string? ReportTextOrSymptoms { get; set; }
    
    [Range(0.0, 25.0)]
    public double HemoglobinLevel { get; set; } = 13.5;
    
    public bool HasChronicIllness { get; set; } = false;
    
    public bool RecentTattooOrPiercingInLast6Months { get; set; } = false;
    
    public bool TraveledToMalariaProneAreaRecently { get; set; } = false;

    // Optional physical anemia symptoms checklist
    public bool HasFatigueOrWeakness { get; set; } = false;
    public bool HasPaleSkinOrGums { get; set; } = false;
    public bool HasShortnessOfBreath { get; set; } = false;
}

public class MedicalScreeningResponseDto
{
    public bool IsEligible { get; set; }
    public string EligibilitySummary { get; set; } = string.Empty;
    public string ClinicalInsights { get; set; } = string.Empty;
    public DateTime EvaluatedAt { get; set; } = DateTime.UtcNow;
    public string ScreeningSource { get; set; } = "AI Engine (Gemini Pro / Clinical Rules Engine)";
}
