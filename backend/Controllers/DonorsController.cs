using System.Security.Claims;
using BloodNetwork.API.Data;
using BloodNetwork.API.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace BloodNetwork.API.Controllers;

public class DonorBadge
{
    public string Id { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Icon { get; set; } = string.Empty;
    public string Color { get; set; } = string.Empty;
    public bool IsUnlocked { get; set; }
}

public class DonorImpactStatsDto
{
    public int TotalDonations { get; set; }
    public int TotalUnitsDonated { get; set; }
    public int LivesImpacted { get; set; }
    public DateTime? LastDonationDate { get; set; }
    public DateTime? NextEligibleDonationDate { get; set; }
    public bool IsEligibleNow { get; set; }
    public List<DonorBadge> Badges { get; set; } = new();
    public List<DonationRecordDto> Donations { get; set; } = new();
}

public class DonationRecordDto
{
    public Guid Id { get; set; }
    public string FacilityName { get; set; } = string.Empty;
    public string FacilityCity { get; set; } = string.Empty;
    public string BloodGroup { get; set; } = string.Empty;
    public int Units { get; set; }
    public string ClinicalCase { get; set; } = string.Empty;
    public DateTime DonationDate { get; set; }
    public string VerificationCode { get; set; } = string.Empty;
}

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class DonorsController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public DonorsController(ApplicationDbContext context)
    {
        _context = context;
    }

    [HttpGet("history")]
    public async Task<ActionResult<DonorImpactStatsDto>> GetDonorHistory()
    {
        var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!Guid.TryParse(userIdStr, out var userId)) return Unauthorized();

        var donor = await _context.Users.FindAsync(userId);
        if (donor == null) return Unauthorized();

        var donations = await _context.DonationHistories
            .Include(d => d.Facility)
            .Where(d => d.DonorId == userId)
            .OrderByDescending(d => d.DonationDate)
            .ToListAsync();

        var totalDonations = donations.Count;
        var totalUnits = donations.Sum(d => d.Units);
        var livesImpacted = totalUnits * 3; // 1 unit saves up to 3 lives

        var lastDonation = donations.FirstOrDefault()?.DonationDate;
        DateTime? nextEligible = lastDonation?.AddDays(56); // 8-week medical rest interval
        var isEligibleNow = !nextEligible.HasValue || DateTime.UtcNow >= nextEligible.Value;

        var badges = new List<DonorBadge>
        {
            new()
            {
                Id = "first_donation",
                Title = "Lifesaver Hero",
                Description = "Completed your first verified clinical blood donation.",
                Icon = "HeartHandshake",
                Color = "rose",
                IsUnlocked = totalDonations >= 1
            },
            new()
            {
                Id = "silver_donor",
                Title = "Silver Vanguard",
                Description = "Achieved 3 or more verified life-saving transfusions.",
                Icon = "ShieldCheck",
                Color = "emerald",
                IsUnlocked = totalDonations >= 3
            },
            new()
            {
                Id = "gold_guardian",
                Title = "Golden Guardian",
                Description = "Elite contributor with 5+ community blood donations.",
                Icon = "Award",
                Color = "amber",
                IsUnlocked = totalDonations >= 5
            },
            new()
            {
                Id = "universal_donor",
                Title = "Universal Donor",
                Description = "Critical O-negative donor supplying emergency trauma care.",
                Icon = "Flame",
                Color = "indigo",
                IsUnlocked = donor.BloodGroup == "O-"
            },
            new()
            {
                Id = "ready_donor",
                Title = "Ready Responder",
                Description = "Currently clinically eligible for immediate whole blood donation.",
                Icon = "Activity",
                Color = "cyan",
                IsUnlocked = isEligibleNow
            }
        };

        var records = donations.Select(d => new DonationRecordDto
        {
            Id = d.Id,
            FacilityName = d.Facility?.FullName ?? "Medical Facility",
            FacilityCity = d.Facility?.City ?? "Local",
            BloodGroup = d.BloodGroup,
            Units = d.Units,
            ClinicalCase = d.ClinicalCase,
            DonationDate = d.DonationDate,
            VerificationCode = d.VerificationCode
        }).ToList();

        return Ok(new DonorImpactStatsDto
        {
            TotalDonations = totalDonations,
            TotalUnitsDonated = totalUnits,
            LivesImpacted = livesImpacted,
            LastDonationDate = lastDonation,
            NextEligibleDonationDate = nextEligible,
            IsEligibleNow = isEligibleNow,
            Badges = badges,
            Donations = records
        });
    }
}
