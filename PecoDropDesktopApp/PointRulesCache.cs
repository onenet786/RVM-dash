using System;
using System.Text.Json;

namespace PecoDropDesktopApp;

public static class PointRulesCache
{
    public static int PlasticSmall { get; set; } = 5;
    public static int PlasticMedium { get; set; } = 10;
    public static int PlasticLarge { get; set; } = 15;

    public static int CanSmall { get; set; } = 10;
    public static int CanMedium { get; set; } = 15;
    public static int CanLarge { get; set; } = 20;

    public static int GlassSmall { get; set; } = 10;
    public static int GlassMedium { get; set; } = 15;
    public static int GlassLarge { get; set; } = 20;

    public static int PaperPerKg { get; set; } = 15;

    public static string PlasticUnit { get; set; } = "per_piece";
    public static string AluminiumUnit { get; set; } = "per_piece";
    public static string PaperUnit { get; set; } = "per_kg";
    public static string GlassUnit { get; set; } = "per_piece";

    public static int ConfigVersion { get; set; } = 1;
    public static DateTime? LastSyncedAt { get; set; }

    public static void ApplyJsonConfig(string json)
    {
        try
        {
            using var doc = JsonDocument.Parse(json);
            var root = doc.RootElement;

            if (TryGetInt(root, "pointsPlasticSmall", "points_plastic_small", out int ps)) PlasticSmall = ps;
            if (TryGetInt(root, "pointsPlasticMedium", "points_plastic_medium", out int pm)) PlasticMedium = pm;
            if (TryGetInt(root, "pointsPlasticLarge", "points_plastic_large", out int pl)) PlasticLarge = pl;

            if (TryGetInt(root, "pointsCanSmall", "points_can_small", out int cs)) CanSmall = cs;
            if (TryGetInt(root, "pointsCanMedium", "points_can_medium", out int cm)) CanMedium = cm;
            if (TryGetInt(root, "pointsCanLarge", "points_can_large", out int cl)) CanLarge = cl;

            if (TryGetInt(root, "pointsGlassSmall", "points_glass_small", out int gs)) GlassSmall = gs;
            if (TryGetInt(root, "pointsGlassMedium", "points_glass_medium", out int gm)) GlassMedium = gm;
            if (TryGetInt(root, "pointsGlassLarge", "points_glass_large", out int gl)) GlassLarge = gl;

            if (TryGetInt(root, "pointsPerPaperKg", "points_per_paper_kg", out int paper)) PaperPerKg = paper;

            if (TryGetString(root, "plasticUnit", "plastic_unit", out string pu)) PlasticUnit = pu;
            if (TryGetString(root, "aluminiumUnit", "aluminium_unit", out string au)) AluminiumUnit = au;
            if (TryGetString(root, "paperUnit", "paper_unit", out string pau)) PaperUnit = pau;
            if (TryGetString(root, "glassUnit", "glass_unit", out string gu)) GlassUnit = gu;

            if (TryGetInt(root, "configVersion", "config_version", out int ver)) ConfigVersion = ver;

            LastSyncedAt = DateTime.Now;

            // Sync to local SQL Server database if available
            DatabaseManager.UpdateLocalPointSettings(PlasticSmall, PlasticMedium, PlasticLarge, CanSmall, CanMedium, CanLarge, GlassSmall, GlassMedium, GlassLarge);
        }
        catch
        {
            // Ignore JSON parse errors for robust fallback
        }
    }

    public static int GetPoints(string size, string material)
    {
        string sz = (size ?? "SMALL").ToUpper();
        string mat = (material ?? "PLASTIC").ToUpper();

        if (mat.Contains("PLASTIC") || mat.Contains("BOTTLE"))
        {
            return sz switch
            {
                "SMALL" => PlasticSmall,
                "MEDIUM" => PlasticMedium,
                "LARGE" => PlasticLarge,
                _ => PlasticMedium
            };
        }
        if (mat.Contains("CAN") || mat.Contains("METAL") || mat.Contains("ALUMINIUM"))
        {
            return sz switch
            {
                "SMALL" => CanSmall,
                "MEDIUM" => CanMedium,
                "LARGE" => CanLarge,
                _ => CanMedium
            };
        }
        if (mat.Contains("GLASS"))
        {
            return sz switch
            {
                "SMALL" => GlassSmall,
                "MEDIUM" => GlassMedium,
                "LARGE" => GlassLarge,
                _ => GlassMedium
            };
        }
        if (mat.Contains("UBC") || mat.Contains("PAPER") || mat.Contains("TETRA") || mat.Contains("CARTON"))
        {
            return PaperPerKg > 0 ? PaperPerKg : 15;
        }

        return sz switch
        {
            "SMALL" => PlasticSmall,
            "MEDIUM" => PlasticMedium,
            "LARGE" => PlasticLarge,
            _ => PlasticMedium
        };
    }

    private static bool TryGetInt(JsonElement root, string prop1, string prop2, out int value)
    {
        value = 0;
        if (root.TryGetProperty(prop1, out var p1) && p1.ValueKind == JsonValueKind.Number)
        {
            value = p1.GetInt32();
            return true;
        }
        if (root.TryGetProperty(prop2, out var p2) && p2.ValueKind == JsonValueKind.Number)
        {
            value = p2.GetInt32();
            return true;
        }
        return false;
    }

    private static bool TryGetString(JsonElement root, string prop1, string prop2, out string value)
    {
        value = string.Empty;
        if (root.TryGetProperty(prop1, out var p1) && p1.ValueKind == JsonValueKind.String)
        {
            value = p1.GetString() ?? string.Empty;
            return true;
        }
        if (root.TryGetProperty(prop2, out var p2) && p2.ValueKind == JsonValueKind.String)
        {
            value = p2.GetString() ?? string.Empty;
            return true;
        }
        return false;
    }
}
