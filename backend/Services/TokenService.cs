using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using BloodNetwork.API.Models;
using Microsoft.IdentityModel.Tokens;

namespace BloodNetwork.API.Services;

public class TokenService : ITokenService
{
    private readonly IConfiguration _config;

    public TokenService(IConfiguration config)
    {
        _config = config;
    }

    public string CreateToken(User user)
    {
        var secretKey = _config["Jwt:Key"] ?? "EnterpriseBloodNetworkSuperSecretProductionSigningKey2026!#*";
        var issuer = _config["Jwt:Issuer"] ?? "BloodNetworkAPI";
        var audience = _config["Jwt:Audience"] ?? "BloodNetworkClient";

        var claims = new List<Claim>
        {
            new(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new(ClaimTypes.Email, user.Email),
            new(ClaimTypes.Name, user.FullName),
            new(ClaimTypes.Role, UserRoles.GetRoleName(user.Role)),
            new("role_int", user.Role.ToString()),
            new("city", user.City),
            new("is_verified", user.IsVerified.ToString())
        };

        if (!string.IsNullOrEmpty(user.BloodGroup))
        {
            claims.Add(new("blood_group", user.BloodGroup));
        }

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var tokenDescriptor = new SecurityTokenDescriptor
        {
            Subject = new ClaimsIdentity(claims),
            Expires = DateTime.UtcNow.AddDays(7),
            Issuer = issuer,
            Audience = audience,
            SigningCredentials = creds
        };

        var tokenHandler = new JwtSecurityTokenHandler();
        var token = tokenHandler.CreateToken(tokenDescriptor);

        return tokenHandler.WriteToken(token);
    }
}
