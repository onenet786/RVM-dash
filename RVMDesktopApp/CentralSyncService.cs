using System;
using System.Data;
using System.IO;
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
                status = status,
                localIp = HeartbeatService.GetLocalIpAddress()
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

    /// <summary>
    /// Syncs Advertisement Videos from Central Master Dashboard to local Ads/Advertisements directory.
    /// </summary>
    public static async Task<System.Collections.Generic.List<string>> SyncAdvertisementsFromCentralAsync(string machineId, string localAdsFolder, Action<string>? logCallback = null)
    {
        var updatedPlaylist = new System.Collections.Generic.List<string>();
        try
        {
            Directory.CreateDirectory(localAdsFolder);
            string url = $"{CentralApiUrl.TrimEnd('/')}/api/machine/ads?machineId={Uri.EscapeDataString(machineId)}";
            HttpResponseMessage response = await _httpClient.GetAsync(url);
            if (!response.IsSuccessStatusCode)
            {
                return updatedPlaylist;
            }

            string json = await response.Content.ReadAsStringAsync();
            using var doc = System.Text.Json.JsonDocument.Parse(json);
            if (doc.RootElement.TryGetProperty("ads", out var adsElem) && adsElem.ValueKind == System.Text.Json.JsonValueKind.Array)
            {
                foreach (var item in adsElem.EnumerateArray())
                {
                    bool isActive = !item.TryGetProperty("isActive", out var actProp) || actProp.GetBoolean();
                    if (!isActive) continue;

                    string? videoUrl = item.TryGetProperty("videoUrl", out var vUrl) ? vUrl.GetString() : null;
                    string? title = item.TryGetProperty("title", out var tProp) ? tProp.GetString() : null;
                    string? fileName = item.TryGetProperty("fileName", out var fProp) ? fProp.GetString() : null;

                    if (string.IsNullOrWhiteSpace(videoUrl)) continue;

                    // If relative URL from central server, prefix with CentralApiUrl
                    if (videoUrl.StartsWith("/"))
                    {
                        videoUrl = $"{CentralApiUrl.TrimEnd('/')}{videoUrl}";
                    }

                    if (string.IsNullOrWhiteSpace(fileName))
                    {
                        try
                        {
                            fileName = Path.GetFileName(new Uri(videoUrl).LocalPath);
                        }
                        catch {}

                        if (string.IsNullOrWhiteSpace(fileName) || !fileName.Contains('.'))
                        {
                            fileName = $"ad_{Guid.NewGuid().ToString("N")[..8]}.mp4";
                        }
                    }

                    string localPath = Path.Combine(localAdsFolder, fileName);
                    
                    // Download file if missing or empty
                    if (!File.Exists(localPath) || new FileInfo(localPath).Length == 0)
                    {
                        logCallback?.Invoke($"[AD SYNC 📥] Downloading advertisement video: {fileName}...");
                        var videoBytes = await _httpClient.GetByteArrayAsync(videoUrl);
                        await File.WriteAllBytesAsync(localPath, videoBytes);
                        logCallback?.Invoke($"[AD SYNC ✅] Saved ad video: {fileName} ({videoBytes.Length / (1024 * 1024.0):F1} MB)");
                    }

                    if (File.Exists(localPath))
                    {
                        updatedPlaylist.Add(localPath);
                    }
                }
            }
        }
        catch (Exception ex)
        {
            logCallback?.Invoke($"[AD SYNC ⚠️] Notice: {ex.Message}");
        }
        return updatedPlaylist;
    }

    /// <summary>
    /// Fetches the currently designated active advertisement video from Central Dashboard.
    /// If newly assigned or updated, downloads it to localAdsFolder and returns the local file path to play immediately.
    /// </summary>
    public static async Task<string?> FetchRemoteActiveAdVideoAsync(string machineId, string localAdsFolder, Action<string>? logCallback = null)
    {
        try
        {
            Directory.CreateDirectory(localAdsFolder);
            string url = $"{CentralApiUrl.TrimEnd('/')}/api/machine/ads/active?machineId={Uri.EscapeDataString(machineId)}";
            HttpResponseMessage response = await _httpClient.GetAsync(url);
            if (!response.IsSuccessStatusCode) return null;

            string json = await response.Content.ReadAsStringAsync();
            using var doc = System.Text.Json.JsonDocument.Parse(json);
            if (doc.RootElement.TryGetProperty("hasActiveVideo", out var hasProp) && hasProp.GetBoolean() &&
                doc.RootElement.TryGetProperty("activeVideo", out var activeProp) && activeProp.ValueKind == System.Text.Json.JsonValueKind.Object)
            {
                string? videoUrl = activeProp.TryGetProperty("videoUrl", out var vUrl) ? vUrl.GetString() : null;
                string? fileName = activeProp.TryGetProperty("fileName", out var fProp) ? fProp.GetString() : null;
                string? title = activeProp.TryGetProperty("title", out var tProp) ? tProp.GetString() : null;

                if (string.IsNullOrWhiteSpace(videoUrl)) return null;

                if (videoUrl.StartsWith("/"))
                {
                    videoUrl = $"{CentralApiUrl.TrimEnd('/')}{videoUrl}";
                }

                if (string.IsNullOrWhiteSpace(fileName))
                {
                    try
                    {
                        fileName = Path.GetFileName(new Uri(videoUrl).LocalPath);
                    }
                    catch {}

                    if (string.IsNullOrWhiteSpace(fileName) || !fileName.Contains('.'))
                    {
                        fileName = $"ad_{Guid.NewGuid().ToString("N")[..8]}.mp4";
                    }
                }

                string localPath = Path.Combine(localAdsFolder, fileName);
                if (!File.Exists(localPath) || new FileInfo(localPath).Length == 0)
                {
                    logCallback?.Invoke($"[REMOTE AD 📥] Downloading new advertisement assigned from dashboard: {fileName} ({title})...");
                    var videoBytes = await _httpClient.GetByteArrayAsync(videoUrl);
                    await File.WriteAllBytesAsync(localPath, videoBytes);
                    logCallback?.Invoke($"[REMOTE AD ✅] Saved new ad video: {fileName} ({videoBytes.Length / (1024 * 1024.0):F1} MB)");
                }

                if (File.Exists(localPath))
                {
                    return localPath;
                }
            }
        }
        catch (Exception ex)
        {
            logCallback?.Invoke($"[REMOTE AD ⚠️] Notice: {ex.Message}");
        }
        return null;
    }

    /// <summary>
    /// Fetches the complete active advertisement video rotation playlist from Central Dashboard.
    /// Downloads all missing videos and returns the local file paths in sequence for continuous loop.
    /// </summary>
    public static async Task<System.Collections.Generic.List<string>> FetchRemoteActivePlaylistAsync(string machineId, string localAdsFolder, Action<string>? logCallback = null)
    {
        var playlist = new System.Collections.Generic.List<string>();
        try
        {
            Directory.CreateDirectory(localAdsFolder);
            string url = $"{CentralApiUrl.TrimEnd('/')}/api/machine/ads/playlist?machineId={Uri.EscapeDataString(machineId)}";
            HttpResponseMessage response = await _httpClient.GetAsync(url);
            if (!response.IsSuccessStatusCode) return playlist;

            string json = await response.Content.ReadAsStringAsync();
            using var doc = System.Text.Json.JsonDocument.Parse(json);
            if (doc.RootElement.TryGetProperty("playlist", out var listProp) && listProp.ValueKind == System.Text.Json.JsonValueKind.Array)
            {
                foreach (var item in listProp.EnumerateArray())
                {
                    string? videoUrl = item.TryGetProperty("videoUrl", out var vUrl) ? vUrl.GetString() : null;
                    string? fileName = item.TryGetProperty("fileName", out var fProp) ? fProp.GetString() : null;
                    string? title = item.TryGetProperty("title", out var tProp) ? tProp.GetString() : null;

                    if (string.IsNullOrWhiteSpace(videoUrl)) continue;

                    if (videoUrl.StartsWith("/"))
                    {
                        videoUrl = $"{CentralApiUrl.TrimEnd('/')}{videoUrl}";
                    }

                    if (string.IsNullOrWhiteSpace(fileName))
                    {
                        try
                        {
                            fileName = Path.GetFileName(new Uri(videoUrl).LocalPath);
                        }
                        catch {}

                        if (string.IsNullOrWhiteSpace(fileName) || !fileName.Contains('.'))
                        {
                            fileName = $"ad_{Guid.NewGuid().ToString("N")[..8]}.mp4";
                        }
                    }

                    string localPath = Path.Combine(localAdsFolder, fileName);
                    if (!File.Exists(localPath) || new FileInfo(localPath).Length == 0)
                    {
                        logCallback?.Invoke($"[REMOTE PLAYLIST 📥] Downloading rotation video: {fileName} ({title})...");
                        var videoBytes = await _httpClient.GetByteArrayAsync(videoUrl);
                        await File.WriteAllBytesAsync(localPath, videoBytes);
                        logCallback?.Invoke($"[REMOTE PLAYLIST ✅] Saved rotation video: {fileName} ({videoBytes.Length / (1024 * 1024.0):F1} MB)");
                    }

                    if (File.Exists(localPath))
                    {
                        playlist.Add(localPath);
                    }
                }

                // If remote playlist has active videos, clean up any obsolete local video files that were deleted on dashboard
                if (playlist.Count > 0 && Directory.Exists(localAdsFolder))
                {
                    var supportedExts = new HashSet<string>(StringComparer.OrdinalIgnoreCase) { ".mp4", ".webm", ".avi", ".mov", ".mkv", ".m4v", ".wmv" };
                    var currentLocalFiles = Directory.EnumerateFiles(localAdsFolder)
                        .Where(f => supportedExts.Contains(Path.GetExtension(f)))
                        .ToList();

                    var activeNormalizedPaths = new HashSet<string>(playlist.Select(Path.GetFullPath), StringComparer.OrdinalIgnoreCase);

                    foreach (var localFile in currentLocalFiles)
                    {
                        string fullLocal = Path.GetFullPath(localFile);
                        if (!activeNormalizedPaths.Contains(fullLocal))
                        {
                            try
                            {
                                File.Delete(fullLocal);
                                logCallback?.Invoke($"[REMOTE CLEANUP 🗑️] Cleaned up obsolete local ad video: {Path.GetFileName(fullLocal)}");
                            }
                            catch {}
                        }
                    }
                }
            }
        }
        catch (Exception ex)
        {
            logCallback?.Invoke($"[REMOTE PLAYLIST ⚠️] Notice: {ex.Message}");
        }
        return playlist;
    }

    /// <summary>
    /// Syncs the latest top leaderboard users, names, profile images, and birthdays from Central Master API into the local kiosk database.
    /// </summary>
    public static async Task SyncLeaderboardFromCentralAsync(Action<string>? logCallback = null)
    {
        try
        {
            string url = $"{CentralApiUrl.TrimEnd('/')}/api/usernames";
            string json = await _httpClient.GetStringAsync(url);
            using var doc = System.Text.Json.JsonDocument.Parse(json);
            if (doc.RootElement.TryGetProperty("users", out var usersArr))
            {
                DatabaseManager.UpdateLeaderboardUsers(usersArr);
                logCallback?.Invoke($"[LEADERBOARD SYNC ✨] Synchronized {usersArr.GetArrayLength()} top recyclers with profile images from central master.");
            }
        }
        catch (Exception ex)
        {
            logCallback?.Invoke($"[LEADERBOARD SYNC ⚠️] {ex.Message}");
        }
    }
}
