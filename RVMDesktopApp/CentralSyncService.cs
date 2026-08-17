using System;
using System.Data;
using System.Net.Http;
using System.Text;
using System.Threading.Tasks;

namespace RVMDesktopApp;

public class SyncResult
{
    public bool IsSuccess { get; set; }
    public int StatusCode { get; set; }
    public string TargetUrl { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public string SessionId { get; set; } = string.Empty;
    public string RemoteDbEngine { get; set; } = "PostgreSQL (rvmpg)";
    public string RemoteTables { get; set; } = "recycling_sessions, machines, users, recyclingsessions";
}

public static class CentralSyncService
{
    private static readonly HttpClient _httpClient = new HttpClient();
    public static string CentralApiUrl { get; set; } = "https://isprvm.binishaqsoft.com";

    /// <summary>
    /// Syncs local SQL Server recycling transactions to Central Master Dashboard API with detailed status and granular item variants.
    /// </summary>
    public static async Task<SyncResult> SyncSessionToCentralDetailedAsync(
        string machineId,
        string localSessionId,
        string mobileNumber,
        int plasticCount,
        int aluminiumCount,
        int paperCardboardCount,
        int glassCount,
        int pointsEarned,
        double weightKg,
        string bottleSize = "MEDIUM",
        string material = "PLASTIC",
        int plasticSmallCount = 0,
        int plasticMediumCount = 0,
        int plasticLargeCount = 0,
        int canSmallCount = 0,
        int canMediumCount = 0,
        int canLargeCount = 0,
        int paperWeightGrams = 0,
        int tetrapakWeightGrams = 0)
    {
        var result = new SyncResult
        {
            TargetUrl = $"{CentralApiUrl.TrimEnd('/')}/api/machine/sync-session",
            SessionId = localSessionId
        };

        try
        {
            int totalItems = plasticCount + aluminiumCount + paperCardboardCount + glassCount;
            if (totalItems <= 0) totalItems = 1;

            var payload = new
            {
                machineId = string.IsNullOrWhiteSpace(machineId) ? "RVM-001" : machineId,
                localSessionId = localSessionId,
                userId = string.IsNullOrWhiteSpace(mobileNumber) ? "3214424625" : mobileNumber,
                mobileNumber = string.IsNullOrWhiteSpace(mobileNumber) ? "3214424625" : mobileNumber,
                plasticCount = plasticCount,
                aluminiumCount = aluminiumCount,
                paperCardboardCount = paperCardboardCount,
                glassCount = glassCount,
                bottleSize = bottleSize,
                itemVariant = $"{totalItems}x {bottleSize} {material}",
                plasticSmallCount = plasticSmallCount,
                plasticMediumCount = plasticMediumCount,
                plasticLargeCount = plasticLargeCount,
                canSmallCount = canSmallCount,
                canMediumCount = canMediumCount,
                canLargeCount = canLargeCount,
                paperWeightGrams = paperWeightGrams,
                tetrapakWeightGrams = tetrapakWeightGrams,
                totalBottles = totalItems,
                bottles = totalItems,
                pointsEarned = pointsEarned > 0 ? pointsEarned : 30,
                points = pointsEarned > 0 ? pointsEarned : 30,
                weightKg = weightKg,
                createdAt = DateTime.UtcNow.ToString("o")
            };

            string json = System.Text.Json.JsonSerializer.Serialize(payload);
            using var content = new StringContent(json, Encoding.UTF8, "application/json");

            HttpResponseMessage response = await _httpClient.PostAsync(result.TargetUrl, content);
            result.StatusCode = (int)response.StatusCode;
            result.IsSuccess = response.IsSuccessStatusCode;

            string respText = await response.Content.ReadAsStringAsync();
            if (!string.IsNullOrWhiteSpace(respText))
            {
                try
                {
                    using var doc = System.Text.Json.JsonDocument.Parse(respText);
                    if (doc.RootElement.TryGetProperty("message", out var msgProp))
                    {
                        result.Message = msgProp.GetString() ?? respText;
                    }
                    else if (doc.RootElement.TryGetProperty("error", out var errProp))
                    {
                        result.Message = errProp.GetString() ?? respText;
                    }
                    else
                    {
                        result.Message = respText;
                    }
                }
                catch
                {
                    result.Message = respText;
                }
            }
            else
            {
                result.Message = response.IsSuccessStatusCode ? "Session synchronized successfully." : "HTTP Server Error";
            }
        }
        catch (Exception ex)
        {
            result.IsSuccess = false;
            result.StatusCode = 500;
            result.Message = $"Connection Exception: {ex.Message}";
        }

        return result;
    }

    public static async Task<bool> SyncSessionToCentralAsync(
        string machineId,
        string localSessionId,
        string mobileNumber,
        int plasticCount,
        int aluminiumCount,
        int paperCardboardCount,
        int glassCount,
        int pointsEarned,
        double weightKg)
    {
        var res = await SyncSessionToCentralDetailedAsync(machineId, localSessionId, mobileNumber, plasticCount, aluminiumCount, paperCardboardCount, glassCount, pointsEarned, weightKg);
        return res.IsSuccess;
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

            HttpResponseMessage response = await _httpClient.PostAsync($"{CentralApiUrl.TrimEnd('/')}/api/machine/heartbeat", content);
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

            HttpResponseMessage response = await _httpClient.PostAsync($"{CentralApiUrl.TrimEnd('/')}/api/user/verify-qr", content);
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
