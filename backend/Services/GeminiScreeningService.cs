using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using BloodNetwork.API.DTOs;

namespace BloodNetwork.API.Services;

public class GeminiScreeningService : IGeminiScreeningService
{
    private readonly HttpClient _httpClient;
    private readonly IConfiguration _config;
    private readonly ILogger<GeminiScreeningService> _logger;

    public GeminiScreeningService(HttpClient httpClient, IConfiguration config, ILogger<GeminiScreeningService> logger)
    {
        _httpClient = httpClient;
        _config = config;
        _logger = logger;
    }

    public async Task<MedicalScreeningResponseDto> EvaluateDonorAsync(MedicalScreeningRequestDto request)
    {
        var apiKey = _config["Gemini:ApiKey"] ?? Environment.GetEnvironmentVariable("GEMINI_API_KEY");

        // Baseline normalization per execution rules:
        // If user selects "Check Signs (No Report)", the frontend sends an estimated baseline (13.5 g/dL)
        // unless physical anemia signs (pale eyes, chronic fatigue) are flagged.
        // We ensure Hb >= 12.5 baseline if zero was passed by accident without signs.
        var effectiveHb = request.HemoglobinLevel;
        if (effectiveHb <= 0)
        {
            effectiveHb = (request.HasFatigueOrWeakness || request.HasPaleSkinOrGums) ? 11.0 : 13.5;
        }

        if (!string.IsNullOrWhiteSpace(apiKey))
        {
            try
            {
                var prompt = $@"You are a certified medical transfusion safety officer and hematology AI screener.
Evaluate whole blood donor eligibility based strictly on standard clinical donation guidelines:
- Hemoglobin level: {effectiveHb} g/dL (World Health Organization / Red Cross minimum threshold is 12.5 g/dL for females and 13.0 g/dL for males)
- Chronic Illness history: {request.HasChronicIllness}
- Tattoo, piercing or acupuncture in the past 6 months: {request.RecentTattooOrPiercingInLast6Months}
- Recent travel to malaria-endemic or arbovirus zones: {request.TraveledToMalariaProneAreaRecently}
- Subjective symptoms / CBC Lab Report text / physical signs: ""{request.ReportTextOrSymptoms ?? "None reported"}""
- Physical fatigue: {request.HasFatigueOrWeakness}, Pale skin/gums: {request.HasPaleSkinOrGums}, Shortness of breath: {request.HasShortnessOfBreath}

Evaluate absolute contraindications (active infection, chronic blood-borne illness, recent tattoo <6 months, severe anemia) versus acceptable donation conditions.
Return STRICT JSON ONLY matching this exact structure:
{{
  ""isEligible"": boolean,
  ""eligibilitySummary"": ""Concise 1-2 sentence medical conclusion"",
  ""clinicalInsights"": ""Detailed clinical analysis covering hemoglobin adequacy, deferral risks, and safety parameters.""
}}";

                var requestBody = new
                {
                    contents = new[]
                    {
                        new
                        {
                            parts = new[]
                            {
                                new { text = prompt }
                            }
                        }
                    },
                    generationConfig = new
                    {
                        responseMimeType = "application/json"
                    }
                };

                var content = new StringContent(JsonSerializer.Serialize(requestBody), Encoding.UTF8, "application/json");
                var url = $"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={apiKey}";

                using var cts = new CancellationTokenSource(TimeSpan.FromSeconds(10));
                var response = await _httpClient.PostAsync(url, content, cts.Token);

                if (response.IsSuccessStatusCode)
                {
                    var responseJson = await response.Content.ReadAsStringAsync();
                    var geminiResponse = JsonSerializer.Deserialize<GeminiApiRawResponse>(responseJson);
                    var textResponse = geminiResponse?.Candidates?.FirstOrDefault()?.Content?.Parts?.FirstOrDefault()?.Text;

                    if (!string.IsNullOrWhiteSpace(textResponse))
                    {
                        // Clean possible markdown code ticks
                        var cleaned = textResponse.Trim();
                        if (cleaned.StartsWith("```json")) cleaned = cleaned[7..];
                        if (cleaned.StartsWith("```")) cleaned = cleaned[3..];
                        if (cleaned.EndsWith("```")) cleaned = cleaned[..^3];

                        var parsed = JsonSerializer.Deserialize<MedicalScreeningResponseDto>(cleaned.Trim(), new JsonSerializerOptions
                        {
                            PropertyNameCaseInsensitive = true
                        });

                        if (parsed != null)
                        {
                            parsed.EvaluatedAt = DateTime.UtcNow;
                            parsed.ScreeningSource = "Google Gemini 1.5 Flash (Medical AI)";
                            return parsed;
                        }
                    }
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Gemini API screening attempt failed or timed out. Falling back to deterministic clinical rules.");
            }
        }

        // Deterministic Clinical Rules Fallback
        return EvaluateDeterministicFallback(request, effectiveHb);
    }

    private static MedicalScreeningResponseDto EvaluateDeterministicFallback(MedicalScreeningRequestDto request, double effectiveHb)
    {
        var reasons = new List<string>();

        if (effectiveHb < 12.5)
        {
            reasons.Add($"Hemoglobin level ({effectiveHb:F1} g/dL) is below the minimum clinical donation threshold of 12.5 g/dL.");
        }

        if (request.HasChronicIllness)
        {
            reasons.Add("Active or chronic systemic illness flagged. Medical clearance required prior to blood donation.");
        }

        if (request.RecentTattooOrPiercingInLast6Months)
        {
            reasons.Add("Body piercing or tattoo within the past 6 months requires a temporary deferral period to eliminate blood-borne pathogen incubation risks.");
        }

        if (request.TraveledToMalariaProneAreaRecently)
        {
            reasons.Add("Recent travel to malaria-endemic zones necessitates a temporary deferral protocol under international transfusion guidelines.");
        }

        if (request.HasPaleSkinOrGums || (request.HasFatigueOrWeakness && request.HasShortnessOfBreath))
        {
            reasons.Add("Observable physical indicators of acute fatigue or severe microcytic anemia detected.");
        }

        var isEligible = reasons.Count == 0;

        string summary;
        string insights;

        if (isEligible)
        {
            summary = "Donor cleared for whole blood donation.";
            insights = $"Hemoglobin metrics ({effectiveHb:F1} g/dL) and biological markers satisfy standard transfusion safety guidelines. No active contraindications or viral deferral markers detected.";
        }
        else
        {
            summary = "Donor temporarily deferred based on clinical safety guidelines.";
            insights = string.Join(" ", reasons);
        }

        return new MedicalScreeningResponseDto
        {
            IsEligible = isEligible,
            EligibilitySummary = summary,
            ClinicalInsights = insights,
            EvaluatedAt = DateTime.UtcNow,
            ScreeningSource = "Deterministic Hematology Rules Engine (Fallback)"
        };
    }

    private class GeminiApiRawResponse
    {
        [JsonPropertyName("candidates")]
        public List<Candidate>? Candidates { get; set; }
    }

    private class Candidate
    {
        [JsonPropertyName("content")]
        public Content? Content { get; set; }
    }

    private class Content
    {
        [JsonPropertyName("parts")]
        public List<Part>? Parts { get; set; }
    }

    private class Part
    {
        [JsonPropertyName("text")]
        public string? Text { get; set; }
    }
}
