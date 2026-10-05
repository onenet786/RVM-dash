namespace RVMDesktopApp;

public interface IHardwareDiagnosticsHost
{
    event Action<string>? HardwareDiagnosticMessage;
    bool IsHardwareConnected { get; }
    bool SendAdminHardwareCommand(string command);
}
