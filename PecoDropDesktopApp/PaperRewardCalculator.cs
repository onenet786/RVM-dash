namespace PecoDropDesktopApp;

public static class PaperRewardCalculator
{
    public static string NormalizeUnit(string? unit)
    {
        string normalized = (unit ?? string.Empty).Trim().ToLowerInvariant().Replace('-', '_').Replace(' ', '_');
        return normalized switch
        {
            "per_gram" or "per_g" or "gram" or "grams" => "per_gram",
            "per_piece" or "piece" or "pieces" => "per_piece",
            _ => "per_kg"
        };
    }

    public static int Calculate(double previousWeightKg, double acceptedWeightKg, int rate, string? unit)
    {
        if (!double.IsFinite(acceptedWeightKg) || acceptedWeightKg <= 0 || rate <= 0)
            return 0;

        string normalizedUnit = NormalizeUnit(unit);
        if (normalizedUnit == "per_piece") return rate;

        double multiplier = normalizedUnit == "per_gram" ? 1000.0 : 1.0;
        double safePreviousKg = double.IsFinite(previousWeightKg) && previousWeightKg > 0 ? previousWeightKg : 0;
        int before = (int)Math.Round(safePreviousKg * multiplier * rate, MidpointRounding.AwayFromZero);
        int after = (int)Math.Round((safePreviousKg + acceptedWeightKg) * multiplier * rate, MidpointRounding.AwayFromZero);
        return Math.Max(0, after - before);
    }

    public static string FormatRateLabel(int rate, string? unit) => NormalizeUnit(unit) switch
    {
        "per_gram" => $"{rate} points/g",
        "per_piece" => $"{rate} points/item",
        _ => $"{rate} points/kg"
    };
}
