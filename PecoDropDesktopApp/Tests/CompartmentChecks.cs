using System.Windows;
using System.Windows.Controls;
using System.Windows.Media;
using PecoDropDesktopApp;

internal static class CompartmentChecks
{
    private static int assertions;

    private static void Check(bool condition, string description)
    {
        if (!condition) throw new Exception(description);
        assertions++;
    }

    [STAThread]
    private static void Main()
    {
        var state = new CompartmentAvailability();
        Check(!state.CanAccept("PLASTIC") && !state.CanAccept("CAN") && !state.CanAccept("PAPER"), "Unconfirmed hardware starts disabled");
        foreach (string name in new[] { "PLASTIC", "METAL", "PAPER" })
            state.TryApply($"COMPARTMENT:{name};WORKING:OK;BIN:CLEAR");
        Check(state.TryApply("COMPARTMENT:PLASTIC;WORKING:FAILED;BIN:CLEAR"), "Fault snapshot accepted");
        Check(!state.CanAccept("PLASTIC"), "Failed plastic cannot earn points");
        Check(state.CanAccept("CAN") && state.CanAccept("PAPER"), "Other compartments remain available");
        Check(state.WarningText == "PLASTIC working failed", "Named working-failed message");

        state.TryApply("COMPARTMENT:METAL;WORKING:OK;BIN:FULL");
        Check(!state.CanAccept("CAN") && !state.CanAccept("ALUMINIUM"), "All metal aliases are blocked");
        Check(state.WarningText.Contains("METAL bin is full"), "Named bin-full message");
        Check(state.CanAccept("PAPER"), "Paper remains available with two blocked compartments");

        state.TryApply("COMPARTMENT:PLASTIC;WORKING:FAILED;BIN:FULL");
        state.TryApply("COMPARTMENT:PLASTIC;WORKING:FAILED;BIN:CLEAR");
        Check(!state.CanAccept("PLASTIC"), "Clearing bin must not erase an independent hardware fault");
        state.TryApply("COMPARTMENT:METAL;WORKING:OK;BIN:CLEAR");
        Check(state.CanAccept("CAN"), "Healthy compartment recovers after bin clears");
        state.TryApply("COMPARTMENT:PLASTIC;WORKING:OK;BIN:FULL");
        Check(!state.CanAccept("PLASTIC"), "Successful calibration must not erase bin-full block");
        state.TryApply("COMPARTMENT:PLASTIC;WORKING:OK;BIN:CLEAR");
        Check(state.CanAccept("PLASTIC") && state.WarningText.Length == 0, "All-clear snapshot restores intake");

        state.TryApply("MQ6:WARNING");
        Check(state.SmokeWarning && state.WarningText.Contains("Smoke / gas"), "MQ6 warning displayed");
        Check(state.CanAccept("PLASTIC") && state.CanAccept("CAN") && state.CanAccept("PAPER"), "MQ6 is warning-only");
        state.TryApply("COMPARTMENT:PAPER;WORKING:OK;BIN:FULL");
        Check(!state.CanAccept("UBC") && !state.CanAccept("TETRA PAK") && !state.CanAccept("CARTON"), "Paper aliases blocked");
        state.TryApply("MQ6:CLEAR");
        Check(!state.SmokeWarning && state.WarningText == "PAPER bin is full", "Clearing smoke preserves bin warning");
        Check(!state.TryApply("COMPARTMENT:PAPER;WORKING:OK;BIN:MAYBE"), "Malformed bin state ignored");
        Check(!state.TryApply("COMPARTMENT:UNKNOWN;WORKING:OK;BIN:CLEAR"), "Unknown compartment ignored");
        Check(!state.TryApply("CALIBRATION:OK") && !state.CanAccept("PAPER"), "Generic ready cannot clear compartment warning");
        Check(state.TryApply("compartment:paper;working:ok;bin:clear"), "Case-insensitive protocol");

        var count = new TextBlock { Text = "7" };
        var label = new TextBlock();
        var content = new Grid();
        content.Children.Add(count);
        content.Children.Add(label);
        var card = new Border { Child = content, Background = Brushes.LightBlue, BorderBrush = Brushes.Blue };
        CompartmentStatusPresenter.UpdateCard(card, label, new(true, false), "PLASTIC");
        Check(!card.IsEnabled && card.Background == Brushes.Black && card.Opacity == 1 && count.Opacity == 0 && count.Text == "7", "Unavailable card blacks out its counters without deleting them");
        Check(label.Visibility == Visibility.Visible && label.Text == "PLASTIC working failed", "Card explains disability");
        CompartmentStatusPresenter.UpdateCard(card, label, new(false, false), "PLASTIC");
        Check(card.IsEnabled && card.Background == Brushes.LightBlue && count.Opacity == 1 && label.Visibility == Visibility.Collapsed && count.Text == "7", "Recovered card restores colors and earned counts");
        state.ResetConnection();
        Check(!state.CanAccept("PLASTIC") && !state.CanAccept("CAN") && !state.CanAccept("PAPER"), "Connection loss cannot leave stale healthy cards active");
        Console.WriteLine($"PASS: {assertions} compartment availability and UI checks");
    }
}
