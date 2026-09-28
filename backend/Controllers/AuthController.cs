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
public class AuthController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly ITokenService _tokenService;
    private readonly IAuditService _auditService;

    public AuthController(ApplicationDbContext context, ITokenService tokenService, IAuditService auditService)
    {
        _context = context;
        _tokenService = tokenService;
        _auditService = auditService;
    }

    [HttpPost("register")]
    public async Task<ActionResult<AuthResponseDto>> Register([FromBody] RegisterDto dto)
    {
        var email = dto.Email.Trim().ToLowerInvariant();
        if (await _context.Users.AnyAsync(u => u.Email == email))
        {
            return BadRequest(new { message = "An account with this email already exists." });
        }

        // Validate role: public registration allows Donor (0), Hospital (1), BloodBank (2)
        if (dto.Role is < UserRoles.Donor or > UserRoles.BloodBank)
        {
            return BadRequest(new { message = "Invalid role specified." });
        }

        // Facility validation
        if (dto.Role is UserRoles.Hospital or UserRoles.BloodBank)
        {
            if (string.IsNullOrWhiteSpace(dto.LicenseOrRegNumber))
            {
                return BadRequest(new { message = "License or Government Registration Number is required for medical facilities." });
            }
        }

        // Donors are verified by default; facilities require admin verification
        var isVerified = dto.Role == UserRoles.Donor;

        var user = new User
        {
            Id = Guid.NewGuid(),
            FullName = dto.FullName.Trim(),
            Email = email,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password),
            Role = dto.Role,
            PhoneNumber = dto.PhoneNumber.Trim(),
            City = dto.City.Trim(),
            Address = dto.Address.Trim(),
            BloodGroup = dto.Role == UserRoles.Donor ? dto.BloodGroup : null,
            LicenseOrRegNumber = dto.LicenseOrRegNumber?.Trim(),
            IsVerified = isVerified,
            CreatedAt = DateTime.UtcNow
        };

        await _context.Users.AddAsync(user);

        // If registering a Blood Bank, initialize all 8 blood groups in inventory with 0 units
        if (user.Role == UserRoles.BloodBank)
        {
            foreach (var bg in BloodGroups.All)
            {
                _context.BloodInventoryItems.Add(new BloodInventoryItem
                {
                    Id = Guid.NewGuid(),
                    FacilityId = user.Id,
                    BloodGroup = bg,
                    AvailableUnits = 0,
                    MinThresholdUnits = 5,
                    LastUpdated = DateTime.UtcNow
                });
            }
        }

        await _context.SaveChangesAsync();

        await _auditService.LogAsync(
            "USER_REGISTERED",
            user.Email,
            $"New user registered as {UserRoles.GetRoleName(user.Role)} (Verified: {user.IsVerified})"
        );

        var token = _tokenService.CreateToken(user);

        return Ok(new AuthResponseDto
        {
            Token = token,
            Id = user.Id,
            FullName = user.FullName,
            Email = user.Email,
            Role = user.Role,
            RoleName = UserRoles.GetRoleName(user.Role),
            City = user.City,
            Address = user.Address,
            PhoneNumber = user.PhoneNumber,
            BloodGroup = user.BloodGroup,
            IsVerified = user.IsVerified,
            LicenseOrRegNumber = user.LicenseOrRegNumber,
            NotificationRadiusKm = user.NotificationRadiusKm
        });
    }

    [HttpPost("login")]
    public async Task<ActionResult<AuthResponseDto>> Login([FromBody] LoginDto dto)
    {
        var email = dto.Email.Trim().ToLowerInvariant();
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == email);

        if (user == null || !BCrypt.Net.BCrypt.Verify(dto.Password, user.PasswordHash))
        {
            return Unauthorized(new { message = "Invalid email or password." });
        }

        var token = _tokenService.CreateToken(user);

        await _auditService.LogAsync(
            "USER_LOGIN",
            user.Email,
            $"User logged in as {UserRoles.GetRoleName(user.Role)}"
        );

        return Ok(new AuthResponseDto
        {
            Token = token,
            Id = user.Id,
            FullName = user.FullName,
            Email = user.Email,
            Role = user.Role,
            RoleName = UserRoles.GetRoleName(user.Role),
            City = user.City,
            Address = user.Address,
            PhoneNumber = user.PhoneNumber,
            BloodGroup = user.BloodGroup,
            IsVerified = user.IsVerified,
            LicenseOrRegNumber = user.LicenseOrRegNumber,
            NotificationRadiusKm = user.NotificationRadiusKm
        });
    }

    [Authorize]
    [HttpGet("me")]
    public async Task<ActionResult<AuthResponseDto>> GetCurrentUser()
    {
        var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userIdStr) || !Guid.TryParse(userIdStr, out var userId))
        {
            return Unauthorized();
        }

        var user = await _context.Users.FindAsync(userId);
        if (user == null)
        {
            return NotFound();
        }

        var token = _tokenService.CreateToken(user);

        return Ok(new AuthResponseDto
        {
            Token = token,
            Id = user.Id,
            FullName = user.FullName,
            Email = user.Email,
            Role = user.Role,
            RoleName = UserRoles.GetRoleName(user.Role),
            City = user.City,
            Address = user.Address,
            PhoneNumber = user.PhoneNumber,
            BloodGroup = user.BloodGroup,
            IsVerified = user.IsVerified,
            LicenseOrRegNumber = user.LicenseOrRegNumber,
            NotificationRadiusKm = user.NotificationRadiusKm
        });
    }

    [Authorize]
    [HttpPut("profile")]
    public async Task<IActionResult> UpdateProfile([FromBody] UpdateProfileDto dto)
    {
        var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!Guid.TryParse(userIdStr, out var userId))
        {
            return Unauthorized();
        }

        var user = await _context.Users.FindAsync(userId);
        if (user == null) return NotFound();

        if (!string.IsNullOrWhiteSpace(dto.PhoneNumber)) user.PhoneNumber = dto.PhoneNumber.Trim();
        if (!string.IsNullOrWhiteSpace(dto.Address)) user.Address = dto.Address.Trim();
        if (!string.IsNullOrWhiteSpace(dto.City)) user.City = dto.City.Trim();
        if (dto.NotificationRadiusKm.HasValue && dto.NotificationRadiusKm > 0)
        {
            user.NotificationRadiusKm = dto.NotificationRadiusKm.Value;
        }

        await _context.SaveChangesAsync();

        await _auditService.LogAsync("PROFILE_UPDATED", user.Email, "User updated profile contact information and notification preferences.");

        return Ok(new { message = "Profile updated successfully." });
    }
}
