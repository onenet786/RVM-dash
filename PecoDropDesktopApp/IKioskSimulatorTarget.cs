using System;
using System.Windows;

namespace PecoDropDesktopApp;

/// <summary>
/// Defines the kiosk interface that the Demo Testing Window / Hardware Simulator interacts with.
/// </summary>
public interface IKioskSimulatorTarget
{
    /// <summary>The WPF window reference.</summary>
    Window AsWindow { get; }

    /// <summary>Whether a user recycling session is currently running.</summary>
    bool IsMachineStarted { get; }

    /// <summary>Whether simulator/demo mode is active (bypasses hardware connection requirement).</summary>
    bool IsDemoMode { get; set; }

    /// <summary>Current count of accepted items in this session.</summary>
    int TotalItems { get; }

    /// <summary>Current accumulated points in this session.</summary>
    int TotalPoints { get; }

    /// <summary>Current count of rejected items in this session.</summary>
    int RejectedCount { get; }

    /// <summary>Current UI status label.</summary>
    string MachineStatus { get; }

    /// <summary>Fired when session state, items, points, or status change.</summary>
    event Action? SimulatorStateChanged;

    /// <summary>Starts recycling session (pressing '0').</summary>
    void StartMachine(bool forceSimulator = false);

    /// <summary>Stops recycling session.</summary>
    void StopMachine();

    /// <summary>Simulates item detection, acceptance/rejection, counter update, and video playback.</summary>
    void SimulateItemDeposit(string material, string size, bool accept);

    /// <summary>Triggers the wallet flow (pressing 'Enter') -> mobile number -> rating -> completion.</summary>
    void CompleteSessionToWallet();

    /// <summary>Resets the session counters back to initial zero.</summary>
    void ResetSession();

    /// <summary>Brings the main kiosk display to the front.</summary>
    void FocusKiosk();
}
