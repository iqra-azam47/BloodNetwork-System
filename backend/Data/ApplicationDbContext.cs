using Microsoft.EntityFrameworkCore;
using BloodNetwork.API.Models;

namespace BloodNetwork.API.Data;

public class ApplicationDbContext : DbContext
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options)
    {
    }

    public DbSet<User> Users => Set<User>();
    public DbSet<BloodRequest> BloodRequests => Set<BloodRequest>();
    public DbSet<BloodPledge> BloodPledges => Set<BloodPledge>();
    public DbSet<DonationHistory> DonationHistories => Set<DonationHistory>();
    public DbSet<BloodInventoryItem> BloodInventoryItems => Set<BloodInventoryItem>();
    public DbSet<InventoryTransaction> InventoryTransactions => Set<InventoryTransaction>();
    public DbSet<AuditLog> AuditLogs => Set<AuditLog>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Enterprise schema isolation
        modelBuilder.HasDefaultSchema("bloodnetwork");

        // User unique email
        modelBuilder.Entity<User>(entity =>
        {
            entity.HasIndex(u => u.Email).IsUnique();
        });

        // BloodRequest relationships
        modelBuilder.Entity<BloodRequest>(entity =>
        {
            entity.HasOne(r => r.Creator)
                  .WithMany(u => u.BloodRequests)
                  .HasForeignKey(r => r.CreatorId)
                  .OnDelete(DeleteBehavior.Restrict);
        });

        // BloodPledge relationships
        modelBuilder.Entity<BloodPledge>(entity =>
        {
            entity.HasOne(p => p.Request)
                  .WithMany(r => r.Pledges)
                  .HasForeignKey(p => p.RequestId)
                  .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(p => p.Donor)
                  .WithMany(u => u.BloodPledges)
                  .HasForeignKey(p => p.DonorId)
                  .OnDelete(DeleteBehavior.Restrict);
        });

        // DonationHistory relationships
        modelBuilder.Entity<DonationHistory>(entity =>
        {
            entity.HasOne(d => d.Donor)
                  .WithMany(u => u.DonorDonations)
                  .HasForeignKey(d => d.DonorId)
                  .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(d => d.Facility)
                  .WithMany(u => u.FacilityDonations)
                  .HasForeignKey(d => d.FacilityId)
                  .OnDelete(DeleteBehavior.Restrict);
        });

        // BloodInventoryItem unique per facility and blood group
        modelBuilder.Entity<BloodInventoryItem>(entity =>
        {
            entity.HasIndex(i => new { i.FacilityId, i.BloodGroup }).IsUnique();

            entity.HasOne(i => i.Facility)
                  .WithMany(u => u.InventoryItems)
                  .HasForeignKey(i => i.FacilityId)
                  .OnDelete(DeleteBehavior.Cascade);
        });

        // InventoryTransaction
        modelBuilder.Entity<InventoryTransaction>(entity =>
        {
            entity.HasOne(t => t.Facility)
                  .WithMany(u => u.InventoryTransactions)
                  .HasForeignKey(t => t.FacilityId)
                  .OnDelete(DeleteBehavior.Cascade);
        });
    }
}
