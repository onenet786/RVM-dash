using System;
using System.Data;
using System.Net.Http;
using System.Text;
using System.Threading.Tasks;

namespace RVMDesktopApp;

public static class CentralSyncService
{
    private static readonly HttpClient _httpClient = new HttpClient();
    public static string CentralApiUrl { get; set; } = "https://isprvm.binishaqsoft.com";

    /// <summary>
    /// Syncs local SQL Server 2012 recycling transactions to Central Master Dashboard API.
    /// </summary>
    public static async Task<bool> SyncSessionToCentralAsync(
        string machineId,
        string localSessionId,
        string mobileNumber,
        int plasticCount,
        int aluminiumCount,
        double weightKg)
    {
        try
        {
            var payload = new
            {
                machineId = string.IsNullOrWhiteSpace(machineId) ? "RVM-001" : machineId,
                localSessionId = localSessionId,
                userId = string.IsNullOrWhiteSpace(mobileNumber) ? "anonymous" : mobileNumber,
                plasticCount = plasticCount,
                aluminiumCount = aluminiumCount,
                weightKg = weightKg,
                createdAt = DateTime.UtcNow.ToString("o")
            };

            string json = System.Text.Json.JsonSerializer.Serialize(payload);
            using var content = new StringContent(json, Encoding.UTF8, "application/json");

            HttpResponseMessage response = await _httpClient.PostAsync($"{CentralApiUrl}/api/machine/sync-session", content);
            return response.IsSuccessStatusCode;
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[CentralSync Error] Failed to sync session: {ex.Message}");
            return false;
        }
    }

    /// <summary>
    /// Sends RVM Machine Heartbeat & Bin Level Status to Master Dashboard.
    /// </summary>
    public static async Task<bool> SendHeartbeatAsync(string machineId, int binFillPercentage, string status = "active")
    {
        try
        {
            var payload = new
            {
                machineId = string.IsNullOrWhiteSpace(machineId) ? "RVM-001" : machineId,
                binFillPercentage = binFillPercentage,
                status = status
            };

            string json = System.Text.Json.JsonSerializer.Serialize(payload);
            using var content = new StringContent(json, Encoding.UTF8, "application/json");

            HttpResponseMessage response = await _httpClient.PostAsync($"{CentralApiUrl}/api/machine/heartbeat", content);
            return response.IsSuccessStatusCode;
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[Heartbeat Error] Failed to send heartbeat: {ex.Message}");
            return false;
        }
    }

    /// <summary>
    /// Verifies User QR Code Scanned at RVM Machine Hardware Scanner.
    /// </summary>
    public static async Task<string?> VerifyUserQrCodeAsync(string qrCodeToken, string machineId = "RVM-001")
    {
        try
        {
            var payload = new { qrCodeToken = qrCodeToken, machineId = machineId };
            string json = System.Text.Json.JsonSerializer.Serialize(payload);
            using var content = new StringContent(json, Encoding.UTF8, "application/json");

            HttpResponseMessage response = await _httpClient.PostAsync($"{CentralApiUrl}/api/user/verify-qr", content);
            if (response.IsSuccessStatusCode)
            {
                return await response.Content.ReadAsStringAsync();
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[QR Verification Error] {ex.Message}");
        }
        return null;
    }
}
