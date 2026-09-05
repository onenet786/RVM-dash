namespace PecoDropDesktopApp;

public class BottleResult
{
    public string Size { get; set; } = "UNKNOWN";
    public string Material { get; set; } = "REJECT";
    public int Distance { get; set; }
    public int DurationMs { get; set; }
    public int ChangeCm { get; set; }
    public int EmptyDistanceCm { get; set; }
}
