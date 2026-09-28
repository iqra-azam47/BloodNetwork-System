using BloodNetwork.API.Models;
using Microsoft.EntityFrameworkCore;

namespace BloodNetwork.API.Data;

public static class DbInitializer
{
    public static async Task SeedAsync(ApplicationDbContext context)
    {
        // Ensure isolated schema exists
        await context.Database.ExecuteSqlRawAsync("CREATE SCHEMA IF NOT EXISTS bloodnetwork;");

        // Apply migrations
        await context.Database.MigrateAsync();

        if (await context.Users.AnyAsync())
        {
            return; // DB has been seeded
        }

        var defaultPasswordHash = BCrypt.Net.BCrypt.HashPassword("Admin@123");
        var userPasswordHash = BCrypt.Net.BCrypt.HashPassword("Password@123");

        // 1. Admin
        var admin = new User
        {
            Id = Guid.NewGuid(),
            FullName = "Platform Super Administrator",
            Email = "admin@bloodnetwork.org",
            PasswordHash = defaultPasswordHash,
            Role = UserRoles.Admin,
            PhoneNumber = "+1-555-0100",
            City = "Central Command",
            Address = "100 Health Systems Blvd",
            BloodGroup = "O+",
            IsVerified = true,
            LicenseOrRegNumber = "ADM-GLOBAL-001",
            CreatedAt = DateTime.UtcNow
        };

        // 2. Hospital Facilities
        var hospital1 = new User
        {
            Id = Guid.NewGuid(),
            FullName = "St. Jude Memorial Hospital",
            Email = "hospital@stjude.org",
            PasswordHash = userPasswordHash,
            Role = UserRoles.Hospital,
            PhoneNumber = "+1-555-0144",
            City = "Metropolis",
            Address = "450 Medical Heights Way",
            BloodGroup = null,
            IsVerified = true,
            LicenseOrRegNumber = "HOSP-METRO-9921",
            CreatedAt = DateTime.UtcNow.AddDays(-30)
        };

        var hospital2 = new User
        {
            Id = Guid.NewGuid(),
            FullName = "Metro Trauma Center",
            Email = "trauma@metrohealth.org",
            PasswordHash = userPasswordHash,
            Role = UserRoles.Hospital,
            PhoneNumber = "+1-555-0188",
            City = "Gotham",
            Address = "88 Urgent Care Parkway",
            BloodGroup = null,
            IsVerified = true,
            LicenseOrRegNumber = "HOSP-GOTHAM-4412",
            CreatedAt = DateTime.UtcNow.AddDays(-20)
        };

        var hospitalPending = new User
        {
            Id = Guid.NewGuid(),
            FullName = "City Urgent Care Clinic",
            Email = "clinic@cityurgent.org",
            PasswordHash = userPasswordHash,
            Role = UserRoles.Hospital,
            PhoneNumber = "+1-555-0199",
            City = "Star City",
            Address = "12 Harbor View Road",
            BloodGroup = null,
            IsVerified = false, // Pending admin approval
            LicenseOrRegNumber = "PEND-CLINIC-7788",
            CreatedAt = DateTime.UtcNow.AddDays(-2)
        };

        // 3. Regional Blood Banks
        var bloodBank1 = new User
        {
            Id = Guid.NewGuid(),
            FullName = "Red Cross Central Blood Depot",
            Email = "bank@redcrossblood.org",
            PasswordHash = userPasswordHash,
            Role = UserRoles.BloodBank,
            PhoneNumber = "+1-555-0211",
            City = "Metropolis",
            Address = "700 Transfusion Lane",
            BloodGroup = null,
            IsVerified = true,
            LicenseOrRegNumber = "BB-RED-CENTRAL-104",
            CreatedAt = DateTime.UtcNow.AddDays(-45)
        };

        var bloodBank2 = new User
        {
            Id = Guid.NewGuid(),
            FullName = "Northern Regional Blood Center",
            Email = "depot@northblood.org",
            PasswordHash = userPasswordHash,
            Role = UserRoles.BloodBank,
            PhoneNumber = "+1-555-0299",
            City = "Star City",
            Address = "330 Bio-Reserve Ave",
            BloodGroup = null,
            IsVerified = true,
            LicenseOrRegNumber = "BB-NORTH-6019",
            CreatedAt = DateTime.UtcNow.AddDays(-15)
        };

        // 4. Blood Donors
        var donor1 = new User
        {
            Id = Guid.NewGuid(),
            FullName = "Jane Doe",
            Email = "donor@bloodnetwork.org",
            PasswordHash = userPasswordHash,
            Role = UserRoles.Donor,
            PhoneNumber = "+1-555-0301",
            City = "Metropolis",
            Address = "12 Maple Street, Apt 4B",
            BloodGroup = "O+",
            IsVerified = true,
            NotificationRadiusKm = 25,
            CreatedAt = DateTime.UtcNow.AddDays(-60)
        };

        var donor2 = new User
        {
            Id = Guid.NewGuid(),
            FullName = "Marcus Vance",
            Email = "marcus@donornet.io",
            PasswordHash = userPasswordHash,
            Role = UserRoles.Donor,
            PhoneNumber = "+1-555-0355",
            City = "Metropolis",
            Address = "77 Oakwood Drive",
            BloodGroup = "A-",
            IsVerified = true,
            NotificationRadiusKm = 30,
            CreatedAt = DateTime.UtcNow.AddDays(-40)
        };

        await context.Users.AddRangeAsync(admin, hospital1, hospital2, hospitalPending, bloodBank1, bloodBank2, donor1, donor2);
        await context.SaveChangesAsync();

        // 5. Seed Inventory for Blood Bank 1 (all 8 blood groups)
        var inventoryItems = new List<BloodInventoryItem>
        {
            new() { FacilityId = bloodBank1.Id, BloodGroup = "A+", AvailableUnits = 28, MinThresholdUnits = 5, LastUpdated = DateTime.UtcNow },
            new() { FacilityId = bloodBank1.Id, BloodGroup = "A-", AvailableUnits = 8, MinThresholdUnits = 5, LastUpdated = DateTime.UtcNow },
            new() { FacilityId = bloodBank1.Id, BloodGroup = "B+", AvailableUnits = 19, MinThresholdUnits = 5, LastUpdated = DateTime.UtcNow },
            new() { FacilityId = bloodBank1.Id, BloodGroup = "B-", AvailableUnits = 3, MinThresholdUnits = 5, LastUpdated = DateTime.UtcNow }, // Shortage!
            new() { FacilityId = bloodBank1.Id, BloodGroup = "AB+", AvailableUnits = 12, MinThresholdUnits = 5, LastUpdated = DateTime.UtcNow },
            new() { FacilityId = bloodBank1.Id, BloodGroup = "AB-", AvailableUnits = 2, MinThresholdUnits = 5, LastUpdated = DateTime.UtcNow }, // Shortage!
            new() { FacilityId = bloodBank1.Id, BloodGroup = "O+", AvailableUnits = 35, MinThresholdUnits = 8, LastUpdated = DateTime.UtcNow },
            new() { FacilityId = bloodBank1.Id, BloodGroup = "O-", AvailableUnits = 4, MinThresholdUnits = 10, LastUpdated = DateTime.UtcNow }, // Shortage!

            // Blood Bank 2 items
            new() { FacilityId = bloodBank2.Id, BloodGroup = "A+", AvailableUnits = 15, MinThresholdUnits = 5, LastUpdated = DateTime.UtcNow },
            new() { FacilityId = bloodBank2.Id, BloodGroup = "O+", AvailableUnits = 20, MinThresholdUnits = 5, LastUpdated = DateTime.UtcNow },
            new() { FacilityId = bloodBank2.Id, BloodGroup = "O-", AvailableUnits = 2, MinThresholdUnits = 6, LastUpdated = DateTime.UtcNow },
        };
        await context.BloodInventoryItems.AddRangeAsync(inventoryItems);

        // 6. Sample Initial Transactions
        var transactions = new List<InventoryTransaction>
        {
            new() { FacilityId = bloodBank1.Id, Type = "Intake", BloodGroup = "O+", Units = 10, SourceOrRecipient = "Mobile Blood Drive #42", Timestamp = DateTime.UtcNow.AddDays(-5) },
            new() { FacilityId = bloodBank1.Id, Type = "Dispatch", BloodGroup = "O+", Units = 4, SourceOrRecipient = "St. Jude Emergency Ward", Timestamp = DateTime.UtcNow.AddDays(-2) },
            new() { FacilityId = bloodBank1.Id, Type = "Intake", BloodGroup = "A+", Units = 8, SourceOrRecipient = "University Donor Drive", Timestamp = DateTime.UtcNow.AddDays(-3) }
        };
        await context.InventoryTransactions.AddRangeAsync(transactions);

        // 7. Seed Emergency Blood Requests
        var req1 = new BloodRequest
        {
            Id = Guid.NewGuid(),
            CreatorId = hospital1.Id,
            BloodGroup = "O-",
            RequiredUnits = 4,
            FulfilledUnits = 1,
            Urgency = UrgencyLevels.Critical,
            PatientDiagnosis = "Acute traumatic hemorrhage after multi-vehicle collision",
            WardOrBedNumber = "Trauma ICU - Bed 04",
            ContactNumber = "+1-555-0144",
            IsActive = true,
            CreatedAt = DateTime.UtcNow.AddHours(-3)
        };

        var req2 = new BloodRequest
        {
            Id = Guid.NewGuid(),
            CreatorId = hospital2.Id,
            BloodGroup = "B+",
            RequiredUnits = 3,
            FulfilledUnits = 0,
            Urgency = UrgencyLevels.Urgent,
            PatientDiagnosis = "Severe thrombocytopenia & anemia secondary to chemotherapy",
            WardOrBedNumber = "Oncology Ward 5, Room 512",
            ContactNumber = "+1-555-0188",
            IsActive = true,
            CreatedAt = DateTime.UtcNow.AddHours(-6)
        };

        var req3 = new BloodRequest
        {
            Id = Guid.NewGuid(),
            CreatorId = bloodBank1.Id, // Blood Bank broadcast replenishment request!
            BloodGroup = "AB-",
            RequiredUnits = 5,
            FulfilledUnits = 0,
            Urgency = UrgencyLevels.Urgent,
            PatientDiagnosis = "Regional Depot Strategic Reserve Replenishment (Critically Low Stock)",
            WardOrBedNumber = "Depot Cryo-Storage Unit 2",
            ContactNumber = "+1-555-0211",
            IsActive = true,
            CreatedAt = DateTime.UtcNow.AddHours(-12)
        };

        await context.BloodRequests.AddRangeAsync(req1, req2, req3);

        // 8. Seed Pledges
        var pledge1 = new BloodPledge
        {
            Id = Guid.NewGuid(),
            RequestId = req1.Id,
            DonorId = donor1.Id,
            UnitsOffered = 1,
            EstimatedArrival = "Within 45 minutes",
            DonorContactNumber = donor1.PhoneNumber,
            Status = "Completed",
            CreatedAt = DateTime.UtcNow.AddHours(-2)
        };

        var pledge2 = new BloodPledge
        {
            Id = Guid.NewGuid(),
            RequestId = req2.Id,
            DonorId = donor2.Id,
            UnitsOffered = 1,
            EstimatedArrival = "In transit - 20 mins",
            DonorContactNumber = donor2.PhoneNumber,
            Status = "Pledged",
            CreatedAt = DateTime.UtcNow.AddMinutes(-30)
        };

        await context.BloodPledges.AddRangeAsync(pledge1, pledge2);

        // 9. Seed Donation History for Donor 1
        var donation1 = new DonationHistory
        {
            Id = Guid.NewGuid(),
            DonorId = donor1.Id,
            FacilityId = hospital1.Id,
            BloodGroup = "O+",
            Units = 1,
            ClinicalCase = "Trauma emergency transfusion support",
            DonationDate = DateTime.UtcNow.AddDays(-45),
            VerificationCode = "TX-VFY-98231-OK"
        };
        await context.DonationHistories.AddAsync(donation1);

        // 10. Audit Logs
        var auditLogs = new List<AuditLog>
        {
            new() { Action = "SYSTEM_INITIALIZE", ActorEmail = admin.Email, Details = "Enterprise BloodNetwork initialized with core security policies.", Timestamp = DateTime.UtcNow.AddDays(-60) },
            new() { Action = "FACILITY_VERIFIED", ActorEmail = admin.Email, Details = $"Facility '{hospital1.FullName}' verified and approved for emergency broadcasting.", Timestamp = DateTime.UtcNow.AddDays(-30) },
            new() { Action = "REQUEST_BROADCAST", ActorEmail = hospital1.Email, Details = $"Emergency request broadcasted for 4 units of O- blood.", Timestamp = DateTime.UtcNow.AddHours(-3) }
        };
        await context.AuditLogs.AddRangeAsync(auditLogs);

        await context.SaveChangesAsync();
    }
}
