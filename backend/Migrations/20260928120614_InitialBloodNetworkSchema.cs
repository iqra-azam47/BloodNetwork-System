using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BloodNetwork.API.Migrations
{
    /// <inheritdoc />
    public partial class InitialBloodNetworkSchema : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.EnsureSchema(
                name: "bloodnetwork");

            migrationBuilder.CreateTable(
                name: "AuditLogs",
                schema: "bloodnetwork",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Action = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    ActorEmail = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: false),
                    Details = table.Column<string>(type: "text", nullable: false),
                    Timestamp = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AuditLogs", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Users",
                schema: "bloodnetwork",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    FullName = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: false),
                    Email = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: false),
                    PasswordHash = table.Column<string>(type: "text", nullable: false),
                    Role = table.Column<int>(type: "integer", nullable: false),
                    PhoneNumber = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false),
                    City = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Address = table.Column<string>(type: "character varying(250)", maxLength: 250, nullable: false),
                    BloodGroup = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: true),
                    IsVerified = table.Column<bool>(type: "boolean", nullable: false),
                    LicenseOrRegNumber = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    NotificationRadiusKm = table.Column<double>(type: "double precision", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Users", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "BloodInventoryItems",
                schema: "bloodnetwork",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    FacilityId = table.Column<Guid>(type: "uuid", nullable: false),
                    BloodGroup = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: false),
                    AvailableUnits = table.Column<int>(type: "integer", nullable: false),
                    MinThresholdUnits = table.Column<int>(type: "integer", nullable: false),
                    LastUpdated = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_BloodInventoryItems", x => x.Id);
                    table.ForeignKey(
                        name: "FK_BloodInventoryItems_Users_FacilityId",
                        column: x => x.FacilityId,
                        principalSchema: "bloodnetwork",
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "BloodRequests",
                schema: "bloodnetwork",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    CreatorId = table.Column<Guid>(type: "uuid", nullable: false),
                    BloodGroup = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: false),
                    RequiredUnits = table.Column<int>(type: "integer", nullable: false),
                    FulfilledUnits = table.Column<int>(type: "integer", nullable: false),
                    Urgency = table.Column<int>(type: "integer", nullable: false),
                    PatientDiagnosis = table.Column<string>(type: "character varying(300)", maxLength: 300, nullable: false),
                    WardOrBedNumber = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    ContactNumber = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_BloodRequests", x => x.Id);
                    table.ForeignKey(
                        name: "FK_BloodRequests_Users_CreatorId",
                        column: x => x.CreatorId,
                        principalSchema: "bloodnetwork",
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "DonationHistories",
                schema: "bloodnetwork",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    DonorId = table.Column<Guid>(type: "uuid", nullable: false),
                    FacilityId = table.Column<Guid>(type: "uuid", nullable: false),
                    BloodGroup = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: false),
                    Units = table.Column<int>(type: "integer", nullable: false),
                    ClinicalCase = table.Column<string>(type: "character varying(300)", maxLength: 300, nullable: false),
                    DonationDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    VerificationCode = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_DonationHistories", x => x.Id);
                    table.ForeignKey(
                        name: "FK_DonationHistories_Users_DonorId",
                        column: x => x.DonorId,
                        principalSchema: "bloodnetwork",
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_DonationHistories_Users_FacilityId",
                        column: x => x.FacilityId,
                        principalSchema: "bloodnetwork",
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "InventoryTransactions",
                schema: "bloodnetwork",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    FacilityId = table.Column<Guid>(type: "uuid", nullable: false),
                    Type = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    BloodGroup = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: false),
                    Units = table.Column<int>(type: "integer", nullable: false),
                    SourceOrRecipient = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    Timestamp = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_InventoryTransactions", x => x.Id);
                    table.ForeignKey(
                        name: "FK_InventoryTransactions_Users_FacilityId",
                        column: x => x.FacilityId,
                        principalSchema: "bloodnetwork",
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "BloodPledges",
                schema: "bloodnetwork",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    RequestId = table.Column<Guid>(type: "uuid", nullable: false),
                    DonorId = table.Column<Guid>(type: "uuid", nullable: false),
                    UnitsOffered = table.Column<int>(type: "integer", nullable: false),
                    EstimatedArrival = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    DonorContactNumber = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false),
                    Status = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_BloodPledges", x => x.Id);
                    table.ForeignKey(
                        name: "FK_BloodPledges_BloodRequests_RequestId",
                        column: x => x.RequestId,
                        principalSchema: "bloodnetwork",
                        principalTable: "BloodRequests",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_BloodPledges_Users_DonorId",
                        column: x => x.DonorId,
                        principalSchema: "bloodnetwork",
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_BloodInventoryItems_FacilityId_BloodGroup",
                schema: "bloodnetwork",
                table: "BloodInventoryItems",
                columns: new[] { "FacilityId", "BloodGroup" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_BloodPledges_DonorId",
                schema: "bloodnetwork",
                table: "BloodPledges",
                column: "DonorId");

            migrationBuilder.CreateIndex(
                name: "IX_BloodPledges_RequestId",
                schema: "bloodnetwork",
                table: "BloodPledges",
                column: "RequestId");

            migrationBuilder.CreateIndex(
                name: "IX_BloodRequests_CreatorId",
                schema: "bloodnetwork",
                table: "BloodRequests",
                column: "CreatorId");

            migrationBuilder.CreateIndex(
                name: "IX_DonationHistories_DonorId",
                schema: "bloodnetwork",
                table: "DonationHistories",
                column: "DonorId");

            migrationBuilder.CreateIndex(
                name: "IX_DonationHistories_FacilityId",
                schema: "bloodnetwork",
                table: "DonationHistories",
                column: "FacilityId");

            migrationBuilder.CreateIndex(
                name: "IX_InventoryTransactions_FacilityId",
                schema: "bloodnetwork",
                table: "InventoryTransactions",
                column: "FacilityId");

            migrationBuilder.CreateIndex(
                name: "IX_Users_Email",
                schema: "bloodnetwork",
                table: "Users",
                column: "Email",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "AuditLogs",
                schema: "bloodnetwork");

            migrationBuilder.DropTable(
                name: "BloodInventoryItems",
                schema: "bloodnetwork");

            migrationBuilder.DropTable(
                name: "BloodPledges",
                schema: "bloodnetwork");

            migrationBuilder.DropTable(
                name: "DonationHistories",
                schema: "bloodnetwork");

            migrationBuilder.DropTable(
                name: "InventoryTransactions",
                schema: "bloodnetwork");

            migrationBuilder.DropTable(
                name: "BloodRequests",
                schema: "bloodnetwork");

            migrationBuilder.DropTable(
                name: "Users",
                schema: "bloodnetwork");
        }
    }
}
