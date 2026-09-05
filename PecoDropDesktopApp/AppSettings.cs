using System.Globalization;
using System.IO;
using System.Text;

namespace PecoDropDesktopApp;

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
    public string DisplayMode { get; init; } = "MultiDisplay";

    public static AppSettings Load()
    {
        var values = LoadRawConfig();

        return new AppSettings
        {
            ConnectionString = Get(values, "ConnectionString", @"Server=.\SQLEXPRESS;Database=RVMDB;User ID=RVM;Password=RVM;Encrypt=False;TrustServerCertificate=True;"),
            MachineId = GetFirst(values, ["MachineId", "MachineName", "RVMName", "RVM_Name", "RVM Name", "Machine_Id", "Name"], "RVM-001"),
            CentralApiUrl = NormalizeUrl(Get(values, "CentralApiUrl", "https://isprvm.binishaqsoft.com")),
            ArduinoPort = Get(values, "ArduinoPort", "COM16"),
            ArduinoBaud = GetInt(values, "ArduinoBaud", 9600),
            CameraPort = Get(values, "CameraPort", "COM31"),
            CameraBaud = GetInt(values, "CameraBaud", 921600),
            AdvertisementVideoFolder = Get(values, "AdvertisementVideoFolder", @"Ads\Advertisements"),
            InstructionVideoFolder = Get(values, "InstructionVideoFolder", @"Ads\Instructions"),
            ModelPath = Get(values, "ModelPath", @"Models\rvm_classifier.onnx"),
            CaptureDirectory = Get(values, "CaptureDirectory", "Captures"),
            DisplayMode = Get(values, "DisplayMode", "MultiDisplay")
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

        string text = content.ToString();
        string baseFile = Path.Combine(AppContext.BaseDirectory, "config.txt");
        File.WriteAllText(baseFile, text);

        // Also update root config.txt if running in dev environment
        try
        {
            string devProjectFile = Path.GetFullPath(Path.Combine(AppContext.BaseDirectory, @"..\..\..\config.txt"));
            if (File.Exists(devProjectFile))
            {
                File.WriteAllText(devProjectFile, text);
            }
        }
        catch {}
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
