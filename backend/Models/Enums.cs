namespace BloodNetwork.API.Models;

public static class UserRoles
{
    public const int Donor = 0;
    public const int Hospital = 1;
    public const int BloodBank = 2;
    public const int Admin = 3;

    public static string GetRoleName(int role) => role switch
    {
        0 => "Donor",
        1 => "Hospital",
        2 => "BloodBank",
        3 => "Admin",
        _ => "Unknown"
    };
}

public static class UrgencyLevels
{
    public const int Critical = 0;
    public const int Urgent = 1;
    public const int Standard = 2;

    public static string GetUrgencyName(int urgency) => urgency switch
    {
        0 => "Critical",
        1 => "Urgent",
        2 => "Standard",
        _ => "Standard"
    };
}

public static class BloodGroups
{
    public static readonly string[] All = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
    public static bool IsValid(string bg) => All.Contains(bg);
}
