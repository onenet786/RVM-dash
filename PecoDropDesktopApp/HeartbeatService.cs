using System;
using System.Net.Http;
using System.Text;
using System.Threading;
using System.Threading.Tasks;

namespace PecoDropDesktopApp;

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
    private static string _machineId = "PECO-UNCONFIGURED";
    private static string _serverUrl = "https://isprvm.binishaqsoft.com";
    private static string _location = "Katra Neem Wala, Walled City, Lahore, Punjab, Pakistan";
    private static double? _latitude = 31.5826;
    private static double? _longitude = 74.3276;
    private static bool _geoAttempted;

    private static string _machineStatus = "ONLINE";
    private static int _plasticBinFill = 0;
    private static int _metalBinFill = 0;
    private static double _paperBinFillKg = 0.0;
    private static int _binFillPercentage = 0;
    private static bool _plasticBinFull = false;
    private static bool _metalBinFull = false;
    private static bool _paperBinFull = false;
    private static string _scaleStatus = "Ready";
    private static bool _smokeWarning = false;
    private static int _antiCheatTrips = 0;

    public static NetworkStatus CurrentStatus { get; private set; } = NetworkStatus.Checking;
    public static string? LastError { get; private set; }
    public static event Action<NetworkStatus, string?>? StatusChanged;

    public static void Start(string machineId, string serverUrl, string? location = null, double? latitude = null, double? longitude = null)
    {
        _machineId = string.IsNullOrWhiteSpace(machineId) ? "PECO-UNCONFIGURED" : machineId.Trim();
        _serverUrl = string.IsNullOrWhiteSpace(serverUrl) ? "https://isprvm.binishaqsoft.com" : serverUrl.Trim();
        if (!string.IsNullOrWhiteSpace(location)) _location = location.Trim();
        if (latitude != null) _latitude = latitude;
        if (longitude != null) _longitude = longitude;

        // Auto-detect coordinates asynchronously if not specified or incomplete
        if ((_latitude == null || _longitude == null || _location == "Islamabad Campus" || _location == "Lahore, Pakistan") && !_geoAttempted)
        {
            _ = Task.Run(async () =>
            {
                _geoAttempted = true;
                var geo = await GeoLocationService.DetectAsync();
                if (geo != null)
                {
                    _latitude ??= geo.Latitude;
                    _longitude ??= geo.Longitude;
                    if (string.IsNullOrWhiteSpace(_location) || _location == "Islamabad Campus" || _location == "Lahore, Pakistan")
                    {
                        _location = geo.FormattedLocation;
                    }
                }
            });
        }

        _timer?.Dispose();
        // Fire immediately (0 ms), then repeat every 15 seconds (15000 ms)
        _timer = new Timer(async _ => await SendHeartbeatAsync(), null, 0, 15000);
    }

    public static void UpdateTelemetry(
        string machineStatus,
        int plasticBinFill,
        int metalBinFill,
        double paperBinFillKg,
        int binFillPercentage,
        bool plasticBinFull = false,
        bool metalBinFull = false,
        bool paperBinFull = false,
        string scaleStatus = "Ready",
        bool smokeWarning = false,
        int antiCheatTrips = 0)
    {
        if (!string.IsNullOrWhiteSpace(machineStatus)) _machineStatus = machineStatus.Trim().ToUpperInvariant();
        _plasticBinFill = Math.Clamp(plasticBinFill, 0, 100);
        _metalBinFill = Math.Clamp(metalBinFill, 0, 100);
        _paperBinFillKg = Math.Max(0.0, paperBinFillKg);
        _binFillPercentage = Math.Clamp(binFillPercentage, 0, 100);
        _plasticBinFull = plasticBinFull;
        _metalBinFull = metalBinFull;
        _paperBinFull = paperBinFull;
        if (!string.IsNullOrWhiteSpace(scaleStatus)) _scaleStatus = scaleStatus.Trim();
        _smokeWarning = smokeWarning;
        _antiCheatTrips = antiCheatTrips;
    }

    public static void TriggerImmediateHeartbeat()
    {
        _ = Task.Run(async () => await SendHeartbeatAsync());
    }

    public static void UpdateLocation(string location, double? latitude, double? longitude)
    {
        if (!string.IsNullOrWhiteSpace(location)) _location = location.Trim();
        _latitude = latitude;
        _longitude = longitude;
        _ = Task.Run(async () => await SendHeartbeatAsync());
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

            // 1. Post telemetry heartbeat with full machine status, 3-bin levels, and alert flags
            var heartbeatObj = new 
            { 
                machineId = _machineId, 
                status = _machineStatus, 
                binFillPercentage = _binFillPercentage,
                plasticBinFill = _plasticBinFill,
                metalBinFill = _metalBinFill,
                paperBinFillKg = _paperBinFillKg,
                plasticBinFull = _plasticBinFull,
                metalBinFull = _metalBinFull,
                paperBinFull = _paperBinFull,
                scaleStatus = _scaleStatus,
                smokeDetected = _smokeWarning,
                antiCheatTrips = _antiCheatTrips,
                localIp,
                location = _location,
                latitude = _latitude,
                longitude = _longitude
            };
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
