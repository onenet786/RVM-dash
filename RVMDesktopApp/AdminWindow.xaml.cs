using System;
using System.Data;
using System.Windows;

namespace RVMDesktopApp;

public partial class AdminWindow : Window
{
    public AdminWindow()
    {
        InitializeComponent();
        Loaded += (sender, e) => Load();
    }

    private void Load()
    {
        PointsGrid.ItemsSource = DatabaseManager.GetPointSettings().DefaultView;
        TransactionsGrid.ItemsSource = DatabaseManager.GetTransactions().DefaultView;
    }

    private void Refresh_Click(object sender, RoutedEventArgs e) => Load();

    private void Save_Click(object sender, RoutedEventArgs e)
    {
        if (PointsGrid.ItemsSource is not DataView view)
        {
            MessageBox.Show("No point settings loaded.", "Save Points", MessageBoxButton.OK, MessageBoxImage.Warning);
            return;
        }

        bool anyError = false;

        foreach (DataRowView rowView in view)
        {
            try
            {
                if (rowView.Row.RowState == DataRowState.Unchanged)
                {
                    continue;
                }

                int id = Convert.ToInt32(rowView["PointSettingID"]);
                int points = Convert.ToInt32(rowView["Points"]);

                if (points < 0)
                {
                    MessageBox.Show("Points cannot be negative.", "Validation", MessageBoxButton.OK, MessageBoxImage.Warning);
                    anyError = true;
                    break;
                }

                DatabaseManager.UpdatePoints(id, points);
                rowView.Row.AcceptChanges();
            }
            catch (Exception ex)
            {
                MessageBox.Show($"Failed to save row: {ex.Message}", "Save Points", MessageBoxButton.OK, MessageBoxImage.Error);
                anyError = true;
                break;
            }
        }

        if (!anyError)
        {
            MessageBox.Show("Point settings saved.", "Save Points", MessageBoxButton.OK, MessageBoxImage.Information);
        }

        Load();
    }
}
