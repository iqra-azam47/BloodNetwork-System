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
public class AdminController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly IAuditService _auditService;

    public AdminController(ApplicationDbContext context, IAuditService auditService)
    {
        _context = context;
        _auditService = auditService;
    }

    private async Task<User?> GetAdminUserAsync()
    {
        var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!Guid.TryParse(userIdStr, out var userId)) return null;

        var user = await _context.Users.FindAsync(userId);
        return (user != null && user.Role == UserRoles.Admin) ? user : null;
    }

    /// <summary>
    /// Admin Dashboard Summary Stats
    /// </summary>
    [HttpGet("stats")]
    public async Task<ActionResult<AdminStatsDto>> GetStats()
    {
        var admin = await GetAdminUserAsync();
        if (admin == null) return Forbid("Access restricted to platform administrators.");

        var totalUsers = await _context.Users.CountAsync();
        var totalDonors = await _context.Users.CountAsync(u => u.Role == UserRoles.Donor);
        var totalHospitals = await _context.Users.CountAsync(u => u.Role == UserRoles.Hospital);
        var totalBloodBanks = await _context.Users.CountAsync(u => u.Role == UserRoles.BloodBank);
        var pendingApprovals = await _context.Users.CountAsync(u => !u.IsVerified && (u.Role == UserRoles.Hospital || u.Role == UserRoles.BloodBank));
        var activeRequests = await _context.BloodRequests.CountAsync(r => r.IsActive);
        var completedDonations = await _context.DonationHistories.CountAsync();
        var dispatchedUnits = await _context.InventoryTransactions.Where(t => t.Type == "Dispatch").SumAsync(t => (int?)t.Units) ?? 0;

        return Ok(new AdminStatsDto
        {
            TotalUsers = totalUsers,
            TotalDonors = totalDonors,
            TotalHospitals = totalHospitals,
            TotalBloodBanks = totalBloodBanks,
            PendingFacilityApprovals = pendingApprovals,
            ActiveBloodRequests = activeRequests,
            CompletedDonations = completedDonations,
            TotalUnitsDispatched = dispatchedUnits
        });
    }

    /// <summary>
    /// Facility Approval Pipeline: Get pending facilities
    /// </summary>
    [HttpGet("facilities/pending")]
    public async Task<ActionResult<List<UserAdminViewDto>>> GetPendingFacilities()
    {
        var admin = await GetAdminUserAsync();
        if (admin == null) return Forbid("Admin access required.");

        var pending = await _context.Users
            .Where(u => !u.IsVerified && (u.Role == UserRoles.Hospital || u.Role == UserRoles.BloodBank))
            .OrderByDescending(u => u.CreatedAt)
            .Select(u => new UserAdminViewDto
            {
                Id = u.Id,
                FullName = u.FullName,
                Email = u.Email,
                Role = u.Role,
                RoleName = UserRoles.GetRoleName(u.Role),
                PhoneNumber = u.PhoneNumber,
                City = u.City,
                Address = u.Address,
                BloodGroup = u.BloodGroup,
                IsVerified = u.IsVerified,
                LicenseOrRegNumber = u.LicenseOrRegNumber,
                CreatedAt = u.CreatedAt
            })
            .ToListAsync();

        return Ok(pending);
    }

    /// <summary>
    /// Facility Approval Pipeline: Approve or Reject
    /// </summary>
    [HttpPost("facilities/approve")]
    public async Task<IActionResult> ApproveFacility([FromBody] FacilityApprovalDto dto)
    {
        var admin = await GetAdminUserAsync();
        if (admin == null) return Forbid("Admin access required.");

        var facility = await _context.Users.FindAsync(dto.FacilityId);
        if (facility == null) return NotFound(new { message = "Facility not found." });

        if (facility.Role != UserRoles.Hospital && facility.Role != UserRoles.BloodBank)
        {
            return BadRequest(new { message = "User is not a medical facility." });
        }

        if (dto.Approve)
        {
            facility.IsVerified = true;
            await _context.SaveChangesAsync();

            await _auditService.LogAsync(
                "FACILITY_APPROVED",
                admin.Email,
                $"Facility '{facility.FullName}' ({facility.Email}, License: {facility.LicenseOrRegNumber}) verified and approved."
            );

            return Ok(new { message = $"Facility '{facility.FullName}' has been approved and activated." });
        }
        else
        {
            facility.IsVerified = false;
            await _context.SaveChangesAsync();

            await _auditService.LogAsync(
                "FACILITY_REJECTED",
                admin.Email,
                $"Facility '{facility.FullName}' ({facility.Email}) verification rejected. Reason: {dto.Reason ?? "Not specified"}"
            );

            return Ok(new { message = $"Facility '{facility.FullName}' verification was marked as rejected/inactive." });
        }
    }

    /// <summary>
    /// List all platform users with role filter
    /// </summary>
    [HttpGet("users")]
    public async Task<ActionResult<List<UserAdminViewDto>>> GetUsers([FromQuery] int? role, [FromQuery] string? search)
    {
        var admin = await GetAdminUserAsync();
        if (admin == null) return Forbid("Admin access required.");

        var query = _context.Users.AsQueryable();

        if (role.HasValue)
        {
            query = query.Where(u => u.Role == role.Value);
        }

        if (!string.IsNullOrWhiteSpace(search))
        {
            var s = search.ToLower();
            query = query.Where(u => u.FullName.ToLower().Contains(s) || u.Email.ToLower().Contains(s) || u.City.ToLower().Contains(s));
        }

        var users = await query
            .OrderByDescending(u => u.CreatedAt)
            .Select(u => new UserAdminViewDto
            {
                Id = u.Id,
                FullName = u.FullName,
                Email = u.Email,
                Role = u.Role,
                RoleName = UserRoles.GetRoleName(u.Role),
                PhoneNumber = u.PhoneNumber,
                City = u.City,
                Address = u.Address,
                BloodGroup = u.BloodGroup,
                IsVerified = u.IsVerified,
                LicenseOrRegNumber = u.LicenseOrRegNumber,
                CreatedAt = u.CreatedAt,
                AssociatedCount = u.Role == UserRoles.Donor
                    ? u.DonorDonations.Count
                    : u.BloodRequests.Count
            })
            .ToListAsync();

        return Ok(users);
    }

    /// <summary>
    /// Manually add a facility by Admin
    /// </summary>
    [HttpPost("facilities")]
    public async Task<ActionResult<UserAdminViewDto>> CreateFacility([FromBody] CreateFacilityByAdminDto dto)
    {
        var admin = await GetAdminUserAsync();
        if (admin == null) return Forbid("Admin access required.");

        var email = dto.Email.Trim().ToLowerInvariant();
        if (await _context.Users.AnyAsync(u => u.Email == email))
        {
            return BadRequest(new { message = "Email already in use." });
        }

        var facility = new User
        {
            Id = Guid.NewGuid(),
            FullName = dto.FullName.Trim(),
            Email = email,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password),
            Role = dto.Role,
            PhoneNumber = dto.PhoneNumber.Trim(),
            City = dto.City.Trim(),
            Address = dto.Address.Trim(),
            LicenseOrRegNumber = dto.LicenseOrRegNumber.Trim(),
            IsVerified = dto.IsVerified,
            CreatedAt = DateTime.UtcNow
        };

        await _context.Users.AddAsync(facility);

        if (facility.Role == UserRoles.BloodBank)
        {
            foreach (var bg in BloodGroups.All)
            {
                _context.BloodInventoryItems.Add(new BloodInventoryItem
                {
                    Id = Guid.NewGuid(),
                    FacilityId = facility.Id,
                    BloodGroup = bg,
                    AvailableUnits = 0,
                    MinThresholdUnits = 5,
                    LastUpdated = DateTime.UtcNow
                });
            }
        }

        await _context.SaveChangesAsync();

        await _auditService.LogAsync(
            "FACILITY_CREATED_BY_ADMIN",
            admin.Email,
            $"Admin manually onboarded facility '{facility.FullName}' as {UserRoles.GetRoleName(facility.Role)}."
        );

        return Ok(new UserAdminViewDto
        {
            Id = facility.Id,
            FullName = facility.FullName,
            Email = facility.Email,
            Role = facility.Role,
            RoleName = UserRoles.GetRoleName(facility.Role),
            PhoneNumber = facility.PhoneNumber,
            City = facility.City,
            Address = facility.Address,
            IsVerified = facility.IsVerified,
            LicenseOrRegNumber = facility.LicenseOrRegNumber,
            CreatedAt = facility.CreatedAt
        });
    }

    /// <summary>
    /// Edit facility details
    /// </summary>
    [HttpPut("facilities/{id}")]
    public async Task<IActionResult> UpdateFacility(Guid id, [FromBody] UpdateFacilityDto dto)
    {
        var admin = await GetAdminUserAsync();
        if (admin == null) return Forbid("Admin access required.");

        var facility = await _context.Users.FindAsync(id);
        if (facility == null) return NotFound();

        facility.FullName = dto.FullName.Trim();
        facility.PhoneNumber = dto.PhoneNumber.Trim();
        facility.City = dto.City.Trim();
        facility.Address = dto.Address.Trim();
        facility.LicenseOrRegNumber = dto.LicenseOrRegNumber?.Trim();
        facility.IsVerified = dto.IsVerified;

        await _context.SaveChangesAsync();

        await _auditService.LogAsync(
            "FACILITY_UPDATED_BY_ADMIN",
            admin.Email,
            $"Updated details for '{facility.FullName}'."
        );

        return Ok(new { message = "Facility information updated successfully." });
    }

    /// <summary>
    /// Revoke / Delete Entity
    /// </summary>
    [HttpDelete("users/{id}")]
    public async Task<IActionResult> DeleteUser(Guid id)
    {
        var admin = await GetAdminUserAsync();
        if (admin == null) return Forbid("Admin access required.");

        if (id == admin.Id)
        {
            return BadRequest(new { message = "You cannot delete your own administrator account." });
        }

        var user = await _context.Users.FindAsync(id);
        if (user == null) return NotFound();

        var email = user.Email;
        var roleName = UserRoles.GetRoleName(user.Role);

        _context.Users.Remove(user);
        await _context.SaveChangesAsync();

        await _auditService.LogAsync(
            "USER_DELETED_BY_ADMIN",
            admin.Email,
            $"Deleted {roleName} entity '{user.FullName}' ({email})."
        );

        return Ok(new { message = $"Entity '{user.FullName}' has been removed from the platform." });
    }

    /// <summary>
    /// Searchable Platform Audit Trail
    /// </summary>
    [HttpGet("audit-logs")]
    public async Task<ActionResult<List<AuditLogDto>>> GetAuditLogs([FromQuery] string? search, [FromQuery] int limit = 100)
    {
        var admin = await GetAdminUserAsync();
        if (admin == null) return Forbid("Admin access required.");

        var query = _context.AuditLogs.AsQueryable();

        if (!string.IsNullOrWhiteSpace(search))
        {
            var s = search.ToLower();
            query = query.Where(l => l.Action.ToLower().Contains(s) || l.ActorEmail.ToLower().Contains(s) || l.Details.ToLower().Contains(s));
        }

        var logs = await query
            .OrderByDescending(l => l.Timestamp)
            .Take(Math.Min(limit, 500))
            .Select(l => new AuditLogDto
            {
                Id = l.Id,
                Action = l.Action,
                ActorEmail = l.ActorEmail,
                Details = l.Details,
                Timestamp = l.Timestamp
            })
            .ToListAsync();

        return Ok(logs);
    }
}
