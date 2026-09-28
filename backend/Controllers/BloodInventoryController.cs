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
public class BloodInventoryController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly IAuditService _auditService;

    public BloodInventoryController(ApplicationDbContext context, IAuditService auditService)
    {
        _context = context;
        _auditService = auditService;
    }

    /// <summary>
    /// Blood Bank (Role 2) or Admin (Role 3): View Comprehensive Inventory Ledger
    /// Donors (Role 0) and Hospitals (Role 1) are strictly prohibited!
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<InventorySummaryDto>> GetInventory([FromQuery] Guid? facilityId)
    {
        var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!Guid.TryParse(userIdStr, out var userId)) return Unauthorized();

        var user = await _context.Users.FindAsync(userId);
        if (user == null) return Unauthorized();

        if (user.Role != UserRoles.BloodBank && user.Role != UserRoles.Admin)
        {
            return Forbid("Only Blood Banks and Administrators are authorized to view stock ledger matrices.");
        }

        var targetFacilityId = user.Role == UserRoles.Admin && facilityId.HasValue
            ? facilityId.Value
            : userId;

        // Ensure all 8 blood groups exist for this facility
        var items = await _context.BloodInventoryItems
            .Include(i => i.Facility)
            .Where(i => i.FacilityId == targetFacilityId)
            .ToListAsync();

        var missingGroups = BloodGroups.All.Except(items.Select(i => i.BloodGroup)).ToList();
        if (missingGroups.Any())
        {
            foreach (var bg in missingGroups)
            {
                var newItem = new BloodInventoryItem
                {
                    Id = Guid.NewGuid(),
                    FacilityId = targetFacilityId,
                    BloodGroup = bg,
                    AvailableUnits = 0,
                    MinThresholdUnits = 5,
                    LastUpdated = DateTime.UtcNow
                };
                _context.BloodInventoryItems.Add(newItem);
                items.Add(newItem);
            }
            await _context.SaveChangesAsync();
        }

        var recentTransactions = await _context.InventoryTransactions
            .Where(t => t.FacilityId == targetFacilityId)
            .OrderByDescending(t => t.Timestamp)
            .Take(15)
            .Select(t => new InventoryTransactionDto
            {
                Id = t.Id,
                Type = t.Type,
                BloodGroup = t.BloodGroup,
                Units = t.Units,
                SourceOrRecipient = t.SourceOrRecipient,
                Timestamp = t.Timestamp
            })
            .ToListAsync();

        var itemDtos = items.OrderBy(i => i.BloodGroup).Select(i => new InventoryItemDto
        {
            Id = i.Id,
            FacilityId = i.FacilityId,
            FacilityName = i.Facility?.FullName ?? "Blood Depot",
            BloodGroup = i.BloodGroup,
            AvailableUnits = i.AvailableUnits,
            MinThresholdUnits = i.MinThresholdUnits,
            LastUpdated = i.LastUpdated
        }).ToList();

        var summary = new InventorySummaryDto
        {
            TotalUnits = itemDtos.Sum(i => i.AvailableUnits),
            CriticalShortageTypesCount = itemDtos.Count(i => i.IsCriticalShortage),
            Items = itemDtos,
            RecentTransactions = recentTransactions
        };

        return Ok(summary);
    }

    /// <summary>
    /// Record Inward / Intake or Outward / Dispatch transaction
    /// </summary>
    [HttpPost("transaction")]
    public async Task<ActionResult<InventoryItemDto>> RecordTransaction([FromBody] RecordTransactionDto dto)
    {
        var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!Guid.TryParse(userIdStr, out var userId)) return Unauthorized();

        var user = await _context.Users.FindAsync(userId);
        if (user == null) return Unauthorized();

        if (user.Role != UserRoles.BloodBank && user.Role != UserRoles.Admin)
        {
            return Forbid("Only Blood Banks and Administrators can record inventory transactions.");
        }

        if (!BloodGroups.IsValid(dto.BloodGroup))
        {
            return BadRequest(new { message = "Invalid blood group." });
        }

        var item = await _context.BloodInventoryItems
            .FirstOrDefaultAsync(i => i.FacilityId == userId && i.BloodGroup == dto.BloodGroup);

        if (item == null)
        {
            item = new BloodInventoryItem
            {
                Id = Guid.NewGuid(),
                FacilityId = userId,
                BloodGroup = dto.BloodGroup,
                AvailableUnits = 0,
                MinThresholdUnits = 5,
                LastUpdated = DateTime.UtcNow
            };
            await _context.BloodInventoryItems.AddAsync(item);
        }

        var isIntake = dto.Type.Equals("Intake", StringComparison.OrdinalIgnoreCase);

        if (!isIntake)
        {
            if (item.AvailableUnits < dto.Units)
            {
                return BadRequest(new
                {
                    message = $"Insufficient units for dispatch. Available: {item.AvailableUnits} units, Requested: {dto.Units} units."
                });
            }
            item.AvailableUnits -= dto.Units;
        }
        else
        {
            item.AvailableUnits += dto.Units;
        }

        item.LastUpdated = DateTime.UtcNow;

        var tx = new InventoryTransaction
        {
            Id = Guid.NewGuid(),
            FacilityId = userId,
            Type = isIntake ? "Intake" : "Dispatch",
            BloodGroup = dto.BloodGroup,
            Units = dto.Units,
            SourceOrRecipient = dto.SourceOrRecipient.Trim(),
            Timestamp = DateTime.UtcNow
        };

        await _context.InventoryTransactions.AddAsync(tx);
        await _context.SaveChangesAsync();

        await _auditService.LogAsync(
            $"INVENTORY_{(isIntake ? "INTAKE" : "DISPATCH")}",
            user.Email,
            $"{(isIntake ? "Added" : "Dispatched")} {dto.Units} units of {dto.BloodGroup} (Source/Target: {dto.SourceOrRecipient}). New Stock: {item.AvailableUnits}"
        );

        return Ok(new InventoryItemDto
        {
            Id = item.Id,
            FacilityId = item.FacilityId,
            FacilityName = user.FullName,
            BloodGroup = item.BloodGroup,
            AvailableUnits = item.AvailableUnits,
            MinThresholdUnits = item.MinThresholdUnits,
            LastUpdated = item.LastUpdated
        });
    }

    /// <summary>
    /// Fulfill Hospital Request directly from Blood Bank reserve units
    /// </summary>
    [HttpPost("fulfill-request")]
    public async Task<IActionResult> FulfillHospitalRequest([FromBody] DispatchToHospitalRequestDto dto)
    {
        var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!Guid.TryParse(userIdStr, out var userId)) return Unauthorized();

        var user = await _context.Users.FindAsync(userId);
        if (user == null) return Unauthorized();

        if (user.Role != UserRoles.BloodBank && user.Role != UserRoles.Admin)
        {
            return Forbid("Only Blood Banks can directly fulfill hospital requests from reserve inventory.");
        }

        var request = await _context.BloodRequests
            .Include(r => r.Creator)
            .FirstOrDefaultAsync(r => r.Id == dto.RequestId);

        if (request == null)
        {
            return NotFound(new { message = "Hospital blood request not found." });
        }

        if (!request.IsActive || request.FulfilledUnits >= request.RequiredUnits)
        {
            return BadRequest(new { message = "This request is already inactive or completely fulfilled." });
        }

        var unitsNeeded = request.RequiredUnits - request.FulfilledUnits;
        var dispatchUnits = Math.Min(dto.UnitsToDispatch, unitsNeeded);

        // Check Blood Bank reserve
        var inventoryItem = await _context.BloodInventoryItems
            .FirstOrDefaultAsync(i => i.FacilityId == userId && i.BloodGroup == request.BloodGroup);

        if (inventoryItem == null || inventoryItem.AvailableUnits < dispatchUnits)
        {
            var available = inventoryItem?.AvailableUnits ?? 0;
            return BadRequest(new
            {
                message = $"Insufficient reserve stock in depot. Required: {dispatchUnits} units of {request.BloodGroup}, Available: {available} units."
            });
        }

        // Deduct from Blood Bank
        inventoryItem.AvailableUnits -= dispatchUnits;
        inventoryItem.LastUpdated = DateTime.UtcNow;

        // Increment Request Fulfilled Units
        request.FulfilledUnits += dispatchUnits;
        if (request.FulfilledUnits >= request.RequiredUnits)
        {
            request.IsActive = false;
        }

        // Record dispatch transaction
        var tx = new InventoryTransaction
        {
            Id = Guid.NewGuid(),
            FacilityId = userId,
            Type = "Dispatch",
            BloodGroup = request.BloodGroup,
            Units = dispatchUnits,
            SourceOrRecipient = $"Direct Dispatch to Hospital: {request.Creator?.FullName} ({request.WardOrBedNumber})",
            Timestamp = DateTime.UtcNow
        };
        await _context.InventoryTransactions.AddAsync(tx);

        await _context.SaveChangesAsync();

        await _auditService.LogAsync(
            "REQUEST_FULFILLED_BY_BLOODBANK",
            user.Email,
            $"Dispatched {dispatchUnits} unit(s) of {request.BloodGroup} to {request.Creator?.FullName}. Request Fulfilled: {request.FulfilledUnits}/{request.RequiredUnits} (Status: {(request.IsActive ? "Active" : "Closed")})"
        );

        return Ok(new
        {
            message = $"Successfully dispatched {dispatchUnits} units to {request.Creator?.FullName}.",
            fulfilledUnits = request.FulfilledUnits,
            requiredUnits = request.RequiredUnits,
            isActive = request.IsActive,
            depotRemainingStock = inventoryItem.AvailableUnits
        });
    }
}
