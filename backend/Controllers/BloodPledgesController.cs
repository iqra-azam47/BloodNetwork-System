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
[Authorize]
public class BloodPledgesController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly IAuditService _auditService;

    public BloodPledgesController(ApplicationDbContext context, IAuditService auditService)
    {
        _context = context;
        _auditService = auditService;
    }

    /// <summary>
    /// Donor: Pledge to donate blood for an active request
    /// </summary>
    [HttpPost]
    public async Task<ActionResult<BloodPledgeResponseDto>> CreatePledge([FromBody] CreatePledgeDto dto)
    {
        var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!Guid.TryParse(userIdStr, out var userId)) return Unauthorized();

        var donor = await _context.Users.FindAsync(userId);
        if (donor == null) return Unauthorized();

        if (donor.Role != UserRoles.Donor && donor.Role != UserRoles.Admin)
        {
            return BadRequest(new { message = "Only registered blood donors can submit donation pledges." });
        }

        var request = await _context.BloodRequests
            .Include(r => r.Creator)
            .FirstOrDefaultAsync(r => r.Id == dto.RequestId);

        if (request == null)
        {
            return NotFound(new { message = "Blood request not found." });
        }

        if (!request.IsActive || request.FulfilledUnits >= request.RequiredUnits)
        {
            return BadRequest(new { message = "This blood request is no longer active or has already been fulfilled." });
        }

        var pledge = new BloodPledge
        {
            Id = Guid.NewGuid(),
            RequestId = request.Id,
            DonorId = donor.Id,
            UnitsOffered = dto.UnitsOffered,
            EstimatedArrival = dto.EstimatedArrival.Trim(),
            DonorContactNumber = string.IsNullOrWhiteSpace(dto.DonorContactNumber) ? donor.PhoneNumber : dto.DonorContactNumber.Trim(),
            Status = "Pledged",
            CreatedAt = DateTime.UtcNow
        };

        await _context.BloodPledges.AddAsync(pledge);
        await _context.SaveChangesAsync();

        await _auditService.LogAsync(
            "DONOR_PLEDGE_CREATED",
            donor.Email,
            $"Pledged {pledge.UnitsOffered} unit(s) of {request.BloodGroup} to {request.Creator?.FullName} (ETA: {pledge.EstimatedArrival})"
        );

        return Ok(new BloodPledgeResponseDto
        {
            Id = pledge.Id,
            RequestId = request.Id,
            DonorId = donor.Id,
            DonorName = donor.FullName,
            DonorEmail = donor.Email,
            DonorContactNumber = pledge.DonorContactNumber,
            DonorCity = donor.City,
            DonorBloodGroup = donor.BloodGroup,
            UnitsOffered = pledge.UnitsOffered,
            EstimatedArrival = pledge.EstimatedArrival,
            Status = pledge.Status,
            CreatedAt = pledge.CreatedAt,
            BloodGroup = request.BloodGroup,
            UrgencyLabel = UrgencyLevels.GetUrgencyName(request.Urgency),
            FacilityName = request.Creator?.FullName ?? "Medical Facility",
            WardOrBedNumber = request.WardOrBedNumber
        });
    }

    /// <summary>
    /// Donor: View personal pledges
    /// </summary>
    [HttpGet("my-pledges")]
    public async Task<ActionResult<List<BloodPledgeResponseDto>>> GetMyPledges()
    {
        var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!Guid.TryParse(userIdStr, out var userId)) return Unauthorized();

        var pledges = await _context.BloodPledges
            .Include(p => p.Donor)
            .Include(p => p.Request)
                .ThenInclude(r => r!.Creator)
            .Where(p => p.DonorId == userId)
            .OrderByDescending(p => p.CreatedAt)
            .Select(p => new BloodPledgeResponseDto
            {
                Id = p.Id,
                RequestId = p.RequestId,
                DonorId = p.DonorId,
                DonorName = p.Donor != null ? p.Donor.FullName : "",
                DonorEmail = p.Donor != null ? p.Donor.Email : "",
                DonorContactNumber = p.DonorContactNumber,
                DonorCity = p.Donor != null ? p.Donor.City : "",
                DonorBloodGroup = p.Donor != null ? p.Donor.BloodGroup : "",
                UnitsOffered = p.UnitsOffered,
                EstimatedArrival = p.EstimatedArrival,
                Status = p.Status,
                CreatedAt = p.CreatedAt,
                BloodGroup = p.Request != null ? p.Request.BloodGroup : "",
                UrgencyLabel = p.Request != null ? UrgencyLevels.GetUrgencyName(p.Request.Urgency) : "",
                FacilityName = p.Request != null && p.Request.Creator != null ? p.Request.Creator.FullName : "Medical Facility",
                WardOrBedNumber = p.Request != null ? p.Request.WardOrBedNumber : ""
            })
            .ToListAsync();

        return Ok(pledges);
    }

    /// <summary>
    /// Facility: Live Incoming Pledges Feed for a specific request or all facility requests
    /// </summary>
    [HttpGet("incoming")]
    public async Task<ActionResult<List<BloodPledgeResponseDto>>> GetIncomingPledges([FromQuery] Guid? requestId)
    {
        var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!Guid.TryParse(userIdStr, out var userId)) return Unauthorized();

        var user = await _context.Users.FindAsync(userId);
        if (user == null) return Unauthorized();

        if (user.Role == UserRoles.Donor)
        {
            return Forbid("Donors cannot access facility pledge management feeds.");
        }

        var query = _context.BloodPledges
            .Include(p => p.Donor)
            .Include(p => p.Request)
                .ThenInclude(r => r!.Creator)
            .AsQueryable();

        if (user.Role != UserRoles.Admin)
        {
            // Restrict to pledges on requests created by this facility
            query = query.Where(p => p.Request != null && p.Request.CreatorId == userId);
        }

        if (requestId.HasValue && requestId.Value != Guid.Empty)
        {
            query = query.Where(p => p.RequestId == requestId.Value);
        }

        var pledges = await query
            .OrderByDescending(p => p.CreatedAt)
            .Select(p => new BloodPledgeResponseDto
            {
                Id = p.Id,
                RequestId = p.RequestId,
                DonorId = p.DonorId,
                DonorName = p.Donor != null ? p.Donor.FullName : "Donor",
                DonorEmail = p.Donor != null ? p.Donor.Email : "",
                DonorContactNumber = p.DonorContactNumber,
                DonorCity = p.Donor != null ? p.Donor.City : "",
                DonorBloodGroup = p.Donor != null ? p.Donor.BloodGroup : "",
                UnitsOffered = p.UnitsOffered,
                EstimatedArrival = p.EstimatedArrival,
                Status = p.Status,
                CreatedAt = p.CreatedAt,
                BloodGroup = p.Request != null ? p.Request.BloodGroup : "",
                UrgencyLabel = p.Request != null ? UrgencyLevels.GetUrgencyName(p.Request.Urgency) : "",
                FacilityName = p.Request != null && p.Request.Creator != null ? p.Request.Creator.FullName : "",
                WardOrBedNumber = p.Request != null ? p.Request.WardOrBedNumber : ""
            })
            .ToListAsync();

        return Ok(pledges);
    }

    /// <summary>
    /// Hospital Action: "Confirm Donation Received"
    /// 1. Pledge status changes to "Completed & Verified"
    /// 2. Request fulfilled units count increases. If fulfilled >= required, status auto-closes.
    /// 3. The donation record is permanently written to Donor's profile history.
    /// 4. An immutable event is appended to System Audit Log.
    /// </summary>
    [HttpPost("confirm-donation")]
    public async Task<ActionResult<ConfirmDonationResultDto>> ConfirmDonation([FromBody] ConfirmDonationDto dto)
    {
        var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!Guid.TryParse(userIdStr, out var userId)) return Unauthorized();

        var user = await _context.Users.FindAsync(userId);
        if (user == null) return Unauthorized();

        var pledge = await _context.BloodPledges
            .Include(p => p.Donor)
            .Include(p => p.Request)
                .ThenInclude(r => r!.Creator)
            .FirstOrDefaultAsync(p => p.Id == dto.PledgeId);

        if (pledge == null || pledge.Request == null)
        {
            return NotFound(new { message = "Pledge not found." });
        }

        // Must be the owner facility or Admin
        if (pledge.Request.CreatorId != userId && user.Role != UserRoles.Admin)
        {
            return Forbid("You do not have permission to verify donations for another facility's request.");
        }

        if (pledge.Status == "Completed" || pledge.Status == "Completed & Verified")
        {
            return BadRequest(new { message = "This donation pledge has already been confirmed and verified." });
        }

        // 1. Update Pledge Status
        pledge.Status = "Completed & Verified";

        // 2. Increment Request Fulfilled Units
        var request = pledge.Request;
        request.FulfilledUnits += pledge.UnitsOffered;
        var autoClosed = false;
        if (request.FulfilledUnits >= request.RequiredUnits)
        {
            request.IsActive = false; // Auto-close
            autoClosed = true;
        }

        // 3. Generate Verification Code and Write to Donor's History
        var verificationCode = $"BN-TX-{DateTime.UtcNow:yyyyMMdd}-{Guid.NewGuid().ToString("N")[..8].ToUpperInvariant()}";
        var donationHistory = new DonationHistory
        {
            Id = Guid.NewGuid(),
            DonorId = pledge.DonorId,
            FacilityId = request.CreatorId,
            BloodGroup = request.BloodGroup,
            Units = pledge.UnitsOffered,
            ClinicalCase = !string.IsNullOrWhiteSpace(dto.ClinicalCaseNotes)
                ? dto.ClinicalCaseNotes
                : $"Emergency donation fulfilled for {request.PatientDiagnosis}",
            DonationDate = DateTime.UtcNow,
            VerificationCode = verificationCode
        };

        await _context.DonationHistories.AddAsync(donationHistory);

        // 4. Save and Append to Audit Log
        await _context.SaveChangesAsync();

        await _auditService.LogAsync(
            "DONATION_VERIFIED",
            user.Email,
            $"Verified {pledge.UnitsOffered} unit(s) of {request.BloodGroup} from donor {pledge.Donor?.FullName} ({pledge.Donor?.Email}). Code: {verificationCode}. Request Fulfilled: {request.FulfilledUnits}/{request.RequiredUnits}"
        );

        return Ok(new ConfirmDonationResultDto
        {
            Success = true,
            Message = "Donation physically confirmed, verified, and permanently recorded in donor history.",
            VerificationCode = verificationCode,
            RequestFulfilledUnits = request.FulfilledUnits,
            RequestRequiredUnits = request.RequiredUnits,
            IsRequestAutoClosed = autoClosed
        });
    }
}
