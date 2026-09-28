namespace PecoDropDesktopApp;

internal static class ServoTestHotkeys
{
    private static readonly (string Code, string Command)[] Mappings =
    [
        ("601", "SERVO:PLASTIC:IRIS:OPEN"),
        ("602", "SERVO:PLASTIC:IRIS:CLOSE"),
        ("603", "SERVO:PLASTIC:DROP:OPEN"),
        ("604", "SERVO:PLASTIC:DROP:CLOSE"),
        ("605", "SERVO:METAL:IRIS:OPEN"),
        ("606", "SERVO:METAL:IRIS:CLOSE"),
        ("607", "SERVO:METAL:DROP:OPEN"),
        ("608", "SERVO:METAL:DROP:CLOSE"),
        ("609", "SERVO:PAPER:IRIS:OPEN"),
        ("610", "SERVO:PAPER:IRIS:CLOSE"),
        ("611", "SERVO:PAPER:DROP:OPEN"),
        ("612", "SERVO:PAPER:DROP:CLOSE")
    ];

    public static bool TryResolve(string buffer, out string code, out string command)
    {
        foreach (var mapping in Mappings)
        {
            if (!buffer.EndsWith(mapping.Code, StringComparison.Ordinal)) continue;
            code = mapping.Code;
            command = mapping.Command;
            return true;
        }
        code = command = string.Empty;
        return false;
    }
}
