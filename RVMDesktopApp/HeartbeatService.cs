using System;
using System.Net.Http;
using System.Text;
using System.Threading;
using System.Threading.Tasks;

namespace RVMDesktopApp;

public static class HeartbeatService
{
    private static Timer? _timer;
    private static string _machineId = "RVM-001";
    private static string _serverUrl = "https://isprvm.binishaqsoft.com";

    public static void Start(string machineId, string serverUrl)
    {
        _machineId = string.IsNullOrWhiteSpace(machineId) ? "RVM-001" : machineId.Trim();
        _serverUrl = string.IsNullOrWhiteSpace(serverUrl) ? "https://isprvm.binishaqsoft.com" : serverUrl.Trim();

        _timer?.Dispose();
        // Fire immediately (0 ms), then repeat every 15 seconds (15000 ms)
        _timer = new Timer(async _ => await SendHeartbeatAsync(), null, 0, 15000);
    }

    public static void Stop()
    {
        _timer?.Dispose();
        _timer = null;
    }

    private static async Task SendHeartbeatAsync()
    {
        try
        {
            using var client = new HttpClient { Timeout = TimeSpan.FromSeconds(5) };
            string baseUrl = _serverUrl.TrimEnd('/');

            // 1. Post telemetry heartbeat
            var heartbeatObj = new { machineId = _machineId, status = "active", binFillPercentage = 0 };
            var heartbeatJson = System.Text.Json.JsonSerializer.Serialize(heartbeatObj);
            using var content = new StringContent(heartbeatJson, Encoding.UTF8, "application/json");
            await client.PostAsync($"{baseUrl}/api/machine/heartbeat", content);

            // 2. Fetch machine config to ensure ping is recorded in database
            await client.GetAsync($"{baseUrl}/api/machine/config/{_machineId}");
        }
        catch (Exception ex)
        {
            System.Diagnostics.Debug.WriteLine($"[HeartbeatService Warning] {ex.Message}");
        }
    }
}
