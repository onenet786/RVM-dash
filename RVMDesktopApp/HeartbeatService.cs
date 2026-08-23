using System;
using System.Net.Http;
using System.Text;
using System.Threading;
using System.Threading.Tasks;

namespace RVMDesktopApp;

public enum NetworkStatus
{
    Checking,
    Online,
    Offline,
    Unauthorized
}

public static class HeartbeatService
{
    private static Timer? _timer;
    private static string _machineId = "RVM-001";
    private static string _serverUrl = "https://isprvm.binishaqsoft.com";

    public static NetworkStatus CurrentStatus { get; private set; } = NetworkStatus.Checking;
    public static string? LastError { get; private set; }
    public static event Action<NetworkStatus, string?>? StatusChanged;

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

    public static string GetLocalIpAddress()
    {
        try
        {
            using var socket = new System.Net.Sockets.Socket(System.Net.Sockets.AddressFamily.InterNetwork, System.Net.Sockets.SocketType.Dgram, 0);
            socket.Connect("8.8.8.8", 65530);
            if (socket.LocalEndPoint is System.Net.IPEndPoint endPoint)
            {
                return endPoint.Address.ToString();
            }
        }
        catch
        {
            try
            {
                var host = System.Net.Dns.GetHostEntry(System.Net.Dns.GetHostName());
                foreach (var ip in host.AddressList)
                {
                    if (ip.AddressFamily == System.Net.Sockets.AddressFamily.InterNetwork && !System.Net.IPAddress.IsLoopback(ip))
                    {
                        return ip.ToString();
                    }
                }
            }
            catch {}
        }
        return "127.0.0.1";
    }

    private static async Task SendHeartbeatAsync()
    {
        try
        {
            using var client = new HttpClient { Timeout = TimeSpan.FromSeconds(5) };
            string baseUrl = _serverUrl.TrimEnd('/');
            string localIp = GetLocalIpAddress();
            client.DefaultRequestHeaders.TryAddWithoutValidation("X-Local-IP", localIp);

            // 1. Post telemetry heartbeat with Local IP & Status
            var heartbeatObj = new { machineId = _machineId, status = "active", binFillPercentage = 0, localIp };
            var heartbeatJson = System.Text.Json.JsonSerializer.Serialize(heartbeatObj);
            using var content = new StringContent(heartbeatJson, Encoding.UTF8, "application/json");
            var hbResponse = await client.PostAsync($"{baseUrl}/api/machine/heartbeat", content);

            if (hbResponse.StatusCode == System.Net.HttpStatusCode.Forbidden)
            {
                UpdateStatus(NetworkStatus.Unauthorized, "Machine not registered/authorized on Central Dashboard");
                return;
            }

            var configResponse = await client.GetAsync($"{baseUrl}/api/machine/config/{_machineId}");
            if (configResponse.IsSuccessStatusCode)
            {
                string json = await configResponse.Content.ReadAsStringAsync();
                PointRulesCache.ApplyJsonConfig(json);
                UpdateStatus(NetworkStatus.Online, null);
            }
            else if (configResponse.StatusCode == System.Net.HttpStatusCode.Forbidden)
            {
                UpdateStatus(NetworkStatus.Unauthorized, "Machine not registered/authorized on Central Dashboard");
            }
            else
            {
                UpdateStatus(NetworkStatus.Offline, $"HTTP {(int)configResponse.StatusCode}");
            }
        }
        catch (Exception ex)
        {
            UpdateStatus(NetworkStatus.Offline, ex.Message);
        }
    }

    private static void UpdateStatus(NetworkStatus status, string? error)
    {
        CurrentStatus = status;
        LastError = error;
        StatusChanged?.Invoke(status, error);
    }
}
