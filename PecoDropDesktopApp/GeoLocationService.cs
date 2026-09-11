using System;
using System.Net.Http;
using System.Text.Json;
using System.Threading.Tasks;

namespace PecoDropDesktopApp;

public sealed class GeoLocationResult
{
    public string City { get; set; } = string.Empty;
    public string RegionName { get; set; } = string.Empty;
    public string Country { get; set; } = string.Empty;
    public double Latitude { get; set; }
    public double Longitude { get; set; }
    public string FormattedLocation => !string.IsNullOrWhiteSpace(City) 
        ? $"{City}, {Country}".Trim(',', ' ') 
        : "Islamabad, Pakistan";
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
                var result = new GeoLocationResult
                {
                    City = root.TryGetProperty("city", out var c) ? c.GetString() ?? "" : "",
                    RegionName = root.TryGetProperty("regionName", out var r) ? r.GetString() ?? "" : "",
                    Country = root.TryGetProperty("country", out var cntry) ? cntry.GetString() ?? "" : "",
                    Latitude = root.TryGetProperty("lat", out var lat) ? lat.GetDouble() : 33.7294,
                    Longitude = root.TryGetProperty("lon", out var lon) ? lon.GetDouble() : 73.0931
                };
                _cachedResult = result;
                return result;
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[GeoLocation Detection Note] {ex.Message}");
        }

        return null;
    }
}
