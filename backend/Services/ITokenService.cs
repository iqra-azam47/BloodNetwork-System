using BloodNetwork.API.Models;

namespace BloodNetwork.API.Services;

public interface ITokenService
{
    string CreateToken(User user);
}
