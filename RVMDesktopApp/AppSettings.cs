using System.Globalization;
using System.IO;

namespace RVMDesktopApp;

public sealed class AppSettings
{
    public string ArduinoPort { get; init; } = "COM16";
    public int ArduinoBaud { get; init; } = 9600;
    public string AdvertisementVideoFolder { get; init; } = string.Empty;
    public string InstructionVideoFolder { get; init; } = string.Empty;

    public static AppSettings Load()
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

        return new AppSettings
        {
            ArduinoPort = Get(values, "ArduinoPort", "COM16"),
            ArduinoBaud = GetInt(values, "ArduinoBaud", 9600),
            AdvertisementVideoFolder = ResolvePath(Get(values, "AdvertisementVideoFolder", Path.Combine("Ads", "Advertisements"))),
            InstructionVideoFolder = ResolvePath(Get(values, "InstructionVideoFolder", Path.Combine("Ads", "Instructions")))
        };
    }

    private static string Get(Dictionary<string, string> values, string key, string fallback) =>
        values.TryGetValue(key, out string? value) && !string.IsNullOrWhiteSpace(value) ? value : fallback;

    private static int GetInt(Dictionary<string, string> values, string key, int fallback) =>
        int.TryParse(Get(values, key, fallback.ToString(CultureInfo.InvariantCulture)),
            NumberStyles.Integer, CultureInfo.InvariantCulture, out int value) && value > 0 ? value : fallback;

    private static string ResolvePath(string path) =>
        Path.GetFullPath(Path.IsPathRooted(path) ? path : Path.Combine(AppContext.BaseDirectory, path));
}
