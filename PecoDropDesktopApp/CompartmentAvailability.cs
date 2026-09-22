namespace PecoDropDesktopApp;

// Shared by both kiosk layouts. Availability is independent of session counters.
public sealed class CompartmentAvailability
{
    public sealed record State(bool WorkingFailed, bool BinFull, bool IsKnown = true)
    {
        public bool Available => IsKnown && !WorkingFailed && !BinFull;
        public string Message(string name) => !IsKnown ? $"{name} unavailable" : string.Join("; ", new[]
        {
            WorkingFailed ? $"{name} working failed" : null,
            BinFull ? $"{name} bin is full" : null
        }.Where(x => x is not null));
    }

    private readonly Dictionary<string, State> states = new(StringComparer.OrdinalIgnoreCase)
    {
        ["PLASTIC"] = new(false, false, false),
        ["METAL"] = new(false, false, false),
        ["PAPER"] = new(false, false, false)
    };

    public bool SmokeWarning { get; private set; }
    public void ResetConnection()
    {
        foreach (string name in states.Keys.ToArray()) states[name] = new(false, false, false);
    }
    public State this[string name] => states[name];
    public string WarningText => string.Join("  |  ", states
        .Select(x => x.Value.Message(x.Key)).Where(x => x.Length > 0)
        .Concat(SmokeWarning ? new[] { "MQ6: Smoke / gas detected" } : Array.Empty<string>()));

    public static string? CompartmentFor(string material)
    {
        material = material.Trim().ToUpperInvariant();
        if (material == "PLASTIC") return "PLASTIC";
        if (material.Contains("CAN") || material.Contains("METAL") || material.Contains("ALUMINIUM")) return "METAL";
        if (material.Contains("PAPER") || material.Contains("TETRA") || material.Contains("UBC") || material.Contains("CARTON")) return "PAPER";
        return null;
    }

    public bool CanAccept(string material) => CompartmentFor(material) is not { } name || states[name].Available;

    public bool TryApply(string message)
    {
        string[] parts = message.Trim().ToUpperInvariant().Split(';');
        if (parts.Length == 1 && (parts[0] == "MQ6:WARNING" || parts[0] == "MQ6:CLEAR"))
        {
            SmokeWarning = parts[0] == "MQ6:WARNING";
            return true;
        }
        if (parts.Length != 3 || !parts[0].StartsWith("COMPARTMENT:")) return false;
        string name = parts[0]["COMPARTMENT:".Length..];
        if (!states.ContainsKey(name) ||
            (parts[1] != "WORKING:OK" && parts[1] != "WORKING:FAILED") ||
            (parts[2] != "BIN:FULL" && parts[2] != "BIN:CLEAR")) return false;
        states[name] = new(parts[1] == "WORKING:FAILED", parts[2] == "BIN:FULL");
        return true;
    }
}
