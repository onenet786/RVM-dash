using System;
using System.Net.Http;
using System.Text.Json;
using System.Threading.Tasks;

namespace PecoDropDesktopApp;

public sealed class GeoLocationResult
{
    public string City { get; set; } = "Lahore";
    public string RegionName { get; set; } = "Punjab";
    public string Country { get; set; } = "Pakistan";
    public double Latitude { get; set; } = 31.5826;
    public double Longitude { get; set; } = 74.3276;

    public string FormattedCoordinates => 
        $"{Math.Abs(Latitude):F4}° {(Latitude >= 0 ? "N" : "S")}, {Math.Abs(Longitude):F4}° {(Longitude >= 0 ? "E" : "W")}";

    public string FormattedLocation
    {
        get
        {
            if (Math.Abs(Latitude - 31.5826) < 0.05 && Math.Abs(Longitude - 74.3276) < 0.05)
                return "Katra Neem Wala, Walled City, Lahore, Punjab, Pakistan";

            if (!string.IsNullOrWhiteSpace(City))
            {
                if (!string.IsNullOrWhiteSpace(RegionName) && !City.Equals(RegionName, StringComparison.OrdinalIgnoreCase))
                    return $"{City}, {RegionName}, {Country}".Trim(',', ' ');
                return $"{City}, {Country}".Trim(',', ' ');
            }
            return "Katra Neem Wala, Walled City, Lahore, Punjab, Pakistan";
        }
    }
}

public static class GeoLocationService
{
    private static readonly HttpClient _httpClient = new() { Timeout = TimeSpan.FromSeconds(4) };
    private static GeoLocationResult? _cachedResult;

    public static async Task<GeoLocationResult?> DetectAsync()
    {
        if (_cachedResult != null) return _cachedResult;

        try
        {
            string json = await _httpClient.GetStringAsync("http://ip-api.com/json");
            using var doc = JsonDocument.Parse(json);
            var root = doc.RootElement;
            if (root.TryGetProperty("status", out var status) && status.GetString() == "success")
            {
                double lat = root.TryGetProperty("lat", out var latVal) ? latVal.GetDouble() : 31.5826;
                double lon = root.TryGetProperty("lon", out var lonVal) ? lonVal.GetDouble() : 74.3276;
                string city = root.TryGetProperty("city", out var c) ? c.GetString() ?? "" : "Lahore";
                string region = root.TryGetProperty("regionName", out var r) ? r.GetString() ?? "" : "Punjab";
                string country = root.TryGetProperty("country", out var cntry) ? cntry.GetString() ?? "" : "Pakistan";

                var result = new GeoLocationResult
                {
                    City = city,
                    RegionName = region,
                    Country = country,
                    Latitude = lat,
                    Longitude = lon
                };
                _cachedResult = result;
                return result;
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[GeoLocation Detection Note] {ex.Message}");
        }

        // Default to Lahore Walled City coordinates
        return new GeoLocationResult
        {
            City = "Lahore",
            RegionName = "Punjab",
            Country = "Pakistan",
            Latitude = 31.5826,
            Longitude = 74.3276
        };
    }
}
