using System.Globalization;
using System.IO;
using System.Text;

namespace RVMDesktopApp;

public sealed class AppSettings
{
    public string ConnectionString { get; init; } = @"Server=.\SQLEXPRESS;Database=RVMDB;User ID=RVM;Password=RVM;Encrypt=False;TrustServerCertificate=True;";
    public string MachineId { get; init; } = "RVM-001";
    public string CentralApiUrl { get; init; } = "https://isprvm.binishaqsoft.com";
    public string ArduinoPort { get; init; } = "COM16";
    public int ArduinoBaud { get; init; } = 9600;
    public string CameraPort { get; init; } = "COM31";
    public int CameraBaud { get; init; } = 921600;
    public string AdvertisementVideoFolder { get; init; } = @"Ads\Advertisements";
    public string InstructionVideoFolder { get; init; } = @"Ads\Instructions";
    public string ModelPath { get; init; } = @"Models\rvm_classifier.onnx";
    public string CaptureDirectory { get; init; } = @"Captures";
    public string Location { get; init; } = "Katra Neem Wala, Walled City, Lahore, Punjab, Pakistan";
    public double? Latitude { get; init; } = 31.5826;
    public double? Longitude { get; init; } = 74.3276;
    public string UiTheme { get; init; } = "Modern";
    /// <summary>Shared secret sent as the x-kiosk-key header on every central API request. Never display in UI.</summary>
    public string KioskApiKey { get; init; } = "";
    /// <summary>Optional offline admin credentials (used only when the local SQL database is unreachable). Empty = offline admin login denied.</summary>
    public string AdminUsername { get; init; } = "";
    public string AdminPassword { get; init; } = "";

    public static AppSettings Load()
    {
        var values = LoadRawConfig();

        return new AppSettings
        {
            ConnectionString = Get(values, "ConnectionString", @"Server=.\SQLEXPRESS;Database=RVMDB;User ID=RVM;Password=RVM;Encrypt=False;TrustServerCertificate=True;"),
            MachineId = GetFirst(values, ["MachineId", "MachineName", "RVMName", "RVM_Name", "RVM Name", "Machine_Id", "Name"], "RVM-001"),
            CentralApiUrl = NormalizeUrl(Get(values, "CentralApiUrl", "https://isprvm.binishaqsoft.com")),
            Location = GetFirst(values, ["Location", "MachineLocation", "Address", "RVM_Location", "Branch"], "Katra Neem Wala, Walled City, Lahore, Punjab, Pakistan"),
            Latitude = GetDoubleOrNull(values, "Latitude") ?? 31.5826,
            Longitude = GetDoubleOrNull(values, "Longitude") ?? 74.3276,
            ArduinoPort = Get(values, "ArduinoPort", "COM16"),
            ArduinoBaud = GetInt(values, "ArduinoBaud", 9600),
            CameraPort = Get(values, "CameraPort", "COM31"),
            CameraBaud = GetInt(values, "CameraBaud", 921600),
            AdvertisementVideoFolder = Get(values, "AdvertisementVideoFolder", @"Ads\Advertisements"),
            InstructionVideoFolder = Get(values, "InstructionVideoFolder", @"Ads\Instructions"),
            ModelPath = Get(values, "ModelPath", @"Models\rvm_classifier.onnx"),
            CaptureDirectory = Get(values, "CaptureDirectory", "Captures"),
            UiTheme = Get(values, "UiTheme", "Modern"),
            KioskApiKey = Get(values, "KioskApiKey", ""),
            AdminUsername = Get(values, "AdminUsername", ""),
            AdminPassword = Get(values, "AdminPassword", "")
        };
    }

    public static string NormalizeUrl(string rawUrl)
    {
        if (string.IsNullOrWhiteSpace(rawUrl)) return "https://isprvm.binishaqsoft.com";
        string trimmed = rawUrl.Trim().TrimEnd('.', '/');
        if (!trimmed.StartsWith("http://", StringComparison.OrdinalIgnoreCase) &&
            !trimmed.StartsWith("https://", StringComparison.OrdinalIgnoreCase))
        {
            trimmed = "https://" + trimmed;
        }
        if (!Uri.TryCreate(trimmed, UriKind.Absolute, out _))
        {
            return "https://isprvm.binishaqsoft.com";
        }
        return trimmed;
    }

    public static Dictionary<string, string> LoadRawConfig()
    {
        var values = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);
        string path = Path.Combine(AppContext.BaseDirectory, "config.txt");
        if (File.Exists(path))
        {
            foreach (string rawLine in File.ReadLines(path))
            {
                string line = rawLine.Trim();
                if (line.Length == 0 || line.StartsWith('#') || line.StartsWith(';'))
                    continue;

                int separator = line.IndexOf('=');
                if (separator > 0)
                    values[line[..separator].Trim()] = line[(separator + 1)..].Trim();
            }
        }
        return values;
    }

    public static void SaveConfigToFile(Dictionary<string, string> configValues)
    {
        // Preserve security keys that callers (e.g. Admin > Save Config) do not expose in the UI,
        // so re-saving settings never blanks the kiosk API key or offline admin credentials.
        try
        {
            var existing = LoadRawConfig();
            foreach (string securedKey in new[] { "KioskApiKey", "AdminUsername", "AdminPassword" })
            {
                if (!configValues.ContainsKey(securedKey) && existing.TryGetValue(securedKey, out string? existingValue))
                {
                    configValues[securedKey] = existingValue;
                }
            }
        }
        catch { }

        var content = new StringBuilder();
        content.AppendLine("# Database connection settings.");
        content.AppendLine($"ConnectionString={configValues.GetValueOrDefault("ConnectionString", @"Server=.\SQLEXPRESS;Database=RVMDB;User ID=RVM;Password=RVM;Encrypt=False;TrustServerCertificate=True;")}");
        content.AppendLine();
        content.AppendLine("# Hardware and classifier settings");
        content.AppendLine($"ArduinoPort={configValues.GetValueOrDefault("ArduinoPort", "COM16")}");
        content.AppendLine($"ArduinoBaud={configValues.GetValueOrDefault("ArduinoBaud", "9600")}");
        content.AppendLine($"AdvertisementVideoFolder={configValues.GetValueOrDefault("AdvertisementVideoFolder", @"Ads\Advertisements")}");
        content.AppendLine($"InstructionVideoFolder={configValues.GetValueOrDefault("InstructionVideoFolder", @"Ads\Instructions")}");
        content.AppendLine($"CameraPort={configValues.GetValueOrDefault("CameraPort", "COM31")}");
        content.AppendLine($"CameraBaud={configValues.GetValueOrDefault("CameraBaud", "921600")}");
        content.AppendLine($"ModelPath={configValues.GetValueOrDefault("ModelPath", @"Models\rvm_classifier.onnx")}");
        content.AppendLine($"CaptureDirectory={configValues.GetValueOrDefault("CaptureDirectory", "Captures")}");
        content.AppendLine($"MachineId = {configValues.GetValueOrDefault("MachineId", "RVM-RWP")}");
        content.AppendLine($"CentralApiUrl = {configValues.GetValueOrDefault("CentralApiUrl", "https://isprvm.binishaqsoft.com")}");
        content.AppendLine($"Location = {configValues.GetValueOrDefault("Location", "Islamabad Campus")}");
        if (configValues.TryGetValue("Latitude", out string? latVal) && !string.IsNullOrWhiteSpace(latVal))
            content.AppendLine($"Latitude = {latVal}");
        if (configValues.TryGetValue("Longitude", out string? lngVal) && !string.IsNullOrWhiteSpace(lngVal))
            content.AppendLine($"Longitude = {lngVal}");
        content.AppendLine($"UiTheme = {configValues.GetValueOrDefault("UiTheme", "Modern")}");
        content.AppendLine();
        content.AppendLine("# Security (never shown in UI). KioskApiKey is sent as the x-kiosk-key header to the Central API.");
        content.AppendLine($"KioskApiKey = {configValues.GetValueOrDefault("KioskApiKey", "")}");
        content.AppendLine("# Optional offline admin fallback credentials (only used when local SQL is unreachable). Leave empty to deny offline admin login.");
        content.AppendLine($"AdminUsername = {configValues.GetValueOrDefault("AdminUsername", "")}");
        content.AppendLine($"AdminPassword = {configValues.GetValueOrDefault("AdminPassword", "")}");

        string text = content.ToString();
        string baseFile = Path.Combine(AppContext.BaseDirectory, "config.txt");
        File.WriteAllText(baseFile, text);
    }

    public static void UpdateUiTheme(string theme)
    {
        try
        {
            var values = LoadRawConfig();
            values["UiTheme"] = theme;
            SaveConfigToFile(values);
        }
        catch { }
    }

    private static double? GetDoubleOrNull(Dictionary<string, string> values, string key)
    {
        if (values.TryGetValue(key, out string? str) && double.TryParse(str, NumberStyles.Float, CultureInfo.InvariantCulture, out double d))
        {
            return d;
        }
        return null;
    }

    private static string GetFirst(Dictionary<string, string> values, string[] keys, string fallback)
    {
        foreach (string key in keys)
        {
            if (values.TryGetValue(key, out string? value) && !string.IsNullOrWhiteSpace(value))
                return value;
        }
        return fallback;
    }

    private static string Get(Dictionary<string, string> values, string key, string fallback) =>
        values.TryGetValue(key, out string? value) && !string.IsNullOrWhiteSpace(value) ? value : fallback;

    private static int GetInt(Dictionary<string, string> values, string key, int fallback) =>
        int.TryParse(Get(values, key, fallback.ToString(CultureInfo.InvariantCulture)),
            NumberStyles.Integer, CultureInfo.InvariantCulture, out int value) && value > 0 ? value : fallback;

    private static string ResolvePath(string path) =>
        Path.GetFullPath(Path.IsPathRooted(path) ? path : Path.Combine(AppContext.BaseDirectory, path));
}
