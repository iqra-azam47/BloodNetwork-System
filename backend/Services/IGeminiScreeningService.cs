using BloodNetwork.API.DTOs;

namespace BloodNetwork.API.Services;

public interface IGeminiScreeningService
{
    Task<MedicalScreeningResponseDto> EvaluateDonorAsync(MedicalScreeningRequestDto request);
}
