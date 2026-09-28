using BloodNetwork.API.DTOs;
using BloodNetwork.API.Services;
using Microsoft.AspNetCore.Mvc;

namespace BloodNetwork.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class MedicalScreeningController : ControllerBase
{
    private readonly IGeminiScreeningService _screeningService;
    private readonly IAuditService _auditService;

    public MedicalScreeningController(IGeminiScreeningService screeningService, IAuditService auditService)
    {
        _screeningService = screeningService;
        _auditService = auditService;
    }

    [HttpPost("evaluate-donor")]
    public async Task<ActionResult<MedicalScreeningResponseDto>> EvaluateDonor([FromBody] MedicalScreeningRequestDto request)
    {
        var result = await _screeningService.EvaluateDonorAsync(request);

        // Audit screening evaluation (anonymized if unauthenticated)
        var userEmail = User.Identity?.Name ?? "donor-screening@bloodnetwork.org";
        await _auditService.LogAsync(
            "AI_MEDICAL_SCREENING",
            userEmail,
            $"Evaluated donor eligibility: Result={(result.IsEligible ? "Eligible" : "Deferred")}, Hb={request.HemoglobinLevel} g/dL, Engine={result.ScreeningSource}"
        );

        return Ok(result);
    }
}
