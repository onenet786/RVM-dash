using System.Windows;
using System.Windows.Controls;
using System.Windows.Media;
using System.Runtime.CompilerServices;

namespace PecoDropDesktopApp;

internal static class CompartmentStatusPresenter
{
    private sealed record Appearance(Brush Background, Brush Border);
    private static readonly ConditionalWeakTable<Border, Appearance> OriginalAppearance = new();

    public static void UpdateCard(Border card, TextBlock status, CompartmentAvailability.State state, string name)
    {
        var original = OriginalAppearance.GetValue(card, c => new(c.Background, c.BorderBrush));
        card.IsEnabled = state.Available;
        card.Opacity = 1;
        card.Background = state.Available ? original.Background : Brushes.Black;
        card.BorderBrush = state.Available ? original.Border : Brushes.DimGray;
        if (card.Child is Panel panel)
        {
            foreach (UIElement child in panel.Children)
                if (child != status) child.Opacity = state.Available ? 1 : 0;
        }
        status.Foreground = Brushes.White;
        status.VerticalAlignment = VerticalAlignment.Center;
        Grid.SetRow(status, state.Available ? 3 : 0);
        Grid.SetRowSpan(status, state.Available ? 1 : 4);
        card.ToolTip = state.Available ? null : state.Message(name);
        status.Text = state.Message(name);
        status.Visibility = state.Available ? Visibility.Collapsed : Visibility.Visible;
    }
}
