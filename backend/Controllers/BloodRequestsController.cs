using System.Security.Claims;
using BloodNetwork.API.Data;
using BloodNetwork.API.DTOs;
using BloodNetwork.API.Models;
using BloodNetwork.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace BloodNetwork.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class BloodRequestsController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly IAuditService _auditService;

    public BloodRequestsController(ApplicationDbContext context, IAuditService auditService)
    {
        _context = context;
        _auditService = auditService;
    }

    /// <summary>
    /// Donors & Public: View ONLY Active emergency blood requests
    /// </summary>
    [HttpGet("active")]
    public async Task<ActionResult<List<BloodRequestResponseDto>>> GetActiveRequests([FromQuery] string? bloodGroup, [FromQuery] string? city)
    {
        var query = _context.BloodRequests
            .Include(r => r.Creator)
            .Include(r => r.Pledges)
            .Where(r => r.IsActive && r.FulfilledUnits < r.RequiredUnits);

        if (!string.IsNullOrWhiteSpace(bloodGroup))
        {
            query = query.Where(r => r.BloodGroup == bloodGroup);
        }

        if (!string.IsNullOrWhiteSpace(city))
        {
            query = query.Where(r => r.Creator != null && r.Creator.City.ToLower().Contains(city.ToLower()));
        }

        var requests = await query
            .OrderBy(r => r.Urgency) // 0=Critical first
            .ThenByDescending(r => r.CreatedAt)
            .Select(r => new BloodRequestResponseDto
            {
                Id = r.Id,
                CreatorId = r.CreatorId,
                CreatorName = r.Creator != null ? r.Creator.FullName : "Unknown Facility",
                CreatorCity = r.Creator != null ? r.Creator.City : "Unknown",
                CreatorAddress = r.Creator != null ? r.Creator.Address : "Unknown",
                CreatorType = r.Creator != null ? UserRoles.GetRoleName(r.Creator.Role) : "Facility",
                BloodGroup = r.BloodGroup,
                RequiredUnits = r.RequiredUnits,
                FulfilledUnits = r.FulfilledUnits,
                Urgency = r.Urgency,
                UrgencyLabel = UrgencyLevels.GetUrgencyName(r.Urgency),
                PatientDiagnosis = r.PatientDiagnosis,
                WardOrBedNumber = r.WardOrBedNumber,
                ContactNumber = r.ContactNumber,
                IsActive = r.IsActive,
                CreatedAt = r.CreatedAt,
                ActivePledgesCount = r.Pledges.Count(p => p.Status != "Cancelled")
            })
            .ToListAsync();

        return Ok(requests);
    }

    /// <summary>
    /// Facility: View their own broadcasted requests
    /// </summary>
    [Authorize]
    [HttpGet("mine")]
    public async Task<ActionResult<List<BloodRequestResponseDto>>> GetMyRequests()
    {
        var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!Guid.TryParse(userIdStr, out var userId)) return Unauthorized();

        var requests = await _context.BloodRequests
            .Include(r => r.Creator)
            .Include(r => r.Pledges)
            .Where(r => r.CreatorId == userId)
            .OrderByDescending(r => r.CreatedAt)
            .Select(r => new BloodRequestResponseDto
            {
                Id = r.Id,
                CreatorId = r.CreatorId,
                CreatorName = r.Creator != null ? r.Creator.FullName : "My Facility",
                CreatorCity = r.Creator != null ? r.Creator.City : "",
                CreatorAddress = r.Creator != null ? r.Creator.Address : "",
                CreatorType = r.Creator != null ? UserRoles.GetRoleName(r.Creator.Role) : "",
                BloodGroup = r.BloodGroup,
                RequiredUnits = r.RequiredUnits,
                FulfilledUnits = r.FulfilledUnits,
                Urgency = r.Urgency,
                UrgencyLabel = UrgencyLevels.GetUrgencyName(r.Urgency),
                PatientDiagnosis = r.PatientDiagnosis,
                WardOrBedNumber = r.WardOrBedNumber,
                ContactNumber = r.ContactNumber,
                IsActive = r.IsActive,
                CreatedAt = r.CreatedAt,
                ActivePledgesCount = r.Pledges.Count(p => p.Status != "Cancelled")
            })
            .ToListAsync();

        return Ok(requests);
    }

    /// <summary>
    /// Hospital (Role 1) or Blood Bank (Role 2) or Admin (Role 3): Broadcast Emergency Request
    /// Donors (Role 0) are strictly prohibited!
    /// </summary>
    [Authorize]
    [HttpPost]
    public async Task<ActionResult<BloodRequestResponseDto>> CreateRequest([FromBody] CreateBloodRequestDto dto)
    {
        var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!Guid.TryParse(userIdStr, out var userId)) return Unauthorized();

        var user = await _context.Users.FindAsync(userId);
        if (user == null) return Unauthorized();

        if (user.Role == UserRoles.Donor)
        {
            return Forbid("Donors are not permitted to create blood requests.");
        }

        if (!user.IsVerified && user.Role != UserRoles.Admin)
        {
            return BadRequest(new { message = "Your facility account is pending admin verification. You cannot broadcast emergency requests until approved." });
        }

        if (!BloodGroups.IsValid(dto.BloodGroup))
        {
            return BadRequest(new { message = "Invalid blood group specified." });
        }

        var request = new BloodRequest
        {
            Id = Guid.NewGuid(),
            CreatorId = user.Id,
            BloodGroup = dto.BloodGroup,
            RequiredUnits = dto.RequiredUnits,
            FulfilledUnits = 0,
            Urgency = dto.Urgency,
            PatientDiagnosis = dto.PatientDiagnosis.Trim(),
            WardOrBedNumber = dto.WardOrBedNumber.Trim(),
            ContactNumber = dto.ContactNumber.Trim(),
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        };

        await _context.BloodRequests.AddAsync(request);
        await _context.SaveChangesAsync();

        await _auditService.LogAsync(
            "REQUEST_CREATED",
            user.Email,
            $"Created {UrgencyLevels.GetUrgencyName(request.Urgency)} request for {request.RequiredUnits} units of {request.BloodGroup} (Ward: {request.WardOrBedNumber})"
        );

        return Ok(new BloodRequestResponseDto
        {
            Id = request.Id,
            CreatorId = request.CreatorId,
            CreatorName = user.FullName,
            CreatorCity = user.City,
            CreatorAddress = user.Address,
            CreatorType = UserRoles.GetRoleName(user.Role),
            BloodGroup = request.BloodGroup,
            RequiredUnits = request.RequiredUnits,
            FulfilledUnits = 0,
            Urgency = request.Urgency,
            UrgencyLabel = UrgencyLevels.GetUrgencyName(request.Urgency),
            PatientDiagnosis = request.PatientDiagnosis,
            WardOrBedNumber = request.WardOrBedNumber,
            ContactNumber = request.ContactNumber,
            IsActive = request.IsActive,
            CreatedAt = request.CreatedAt,
            ActivePledgesCount = 0
        });
    }

    /// <summary>
    /// Toggle Request Active/Inactive Status
    /// </summary>
    [Authorize]
    [HttpPatch("{id}/toggle-status")]
    public async Task<IActionResult> ToggleStatus(Guid id, [FromBody] ToggleRequestStatusDto dto)
    {
        var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!Guid.TryParse(userIdStr, out var userId)) return Unauthorized();

        var user = await _context.Users.FindAsync(userId);
        if (user == null) return Unauthorized();

        var request = await _context.BloodRequests.FindAsync(id);
        if (request == null) return NotFound();

        // Must be the owner or an admin
        if (request.CreatorId != userId && user.Role != UserRoles.Admin)
        {
            return Forbid("You do not have permission to modify this request.");
        }

        request.IsActive = dto.IsActive;
        await _context.SaveChangesAsync();

        await _auditService.LogAsync(
            "REQUEST_STATUS_TOGGLED",
            user.Email,
            $"Request {id} status set to Active={dto.IsActive}"
        );

        return Ok(new { message = $"Request is now {(dto.IsActive ? "active" : "closed/inactive")}.", isActive = request.IsActive });
    }
}
