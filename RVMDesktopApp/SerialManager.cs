using System;
using System.Diagnostics;
using System.IO.Ports;
using System.Text;

namespace RVMDesktopApp;

public class SerialManager : IDisposable
{
    private readonly object _portLock = new();
    private readonly StringBuilder _receiveBuffer = new();
    private SerialPort? _port;

    public event Action<string>? DataReceived;
    public event Action<Exception>? ErrorReceived;

    public bool IsConnected
    {
        get
        {
            lock (_portLock)
            {
                return _port?.IsOpen == true;
            }
        }
    }

    public void Connect(string port, int baudRate = 9600)
    {
        lock (_portLock)
        {
            Disconnect();

            _port = new SerialPort(port, baudRate)
            {
                NewLine = "\n",
                WriteTimeout = 500
            };

            _receiveBuffer.Clear();
            _port.DataReceived += OnDataReceived;
            _port.Open();
        }
    }

    public void SendCommand(string command)
    {
        if (string.IsNullOrWhiteSpace(command))
        {
            return;
        }

        lock (_portLock)
        {
            if (_port?.IsOpen == true)
            {
                try
                {
                    _port.WriteLine(command);
                }
                catch (Exception ex)
                {
                    ReportError(ex);
                }
            }
        }
    }

    public void Disconnect()
    {
        lock (_portLock)
        {
            if (_port == null)
            {
                return;
            }

            try
            {
                _port.DataReceived -= OnDataReceived;
                if (_port.IsOpen)
                {
                    _port.Close();
                }
                _port.Dispose();
            }
            catch (Exception ex)
            {
                ReportError(ex);
            }
            finally
            {
                _port = null;
                _receiveBuffer.Clear();
            }
        }
    }

    public void Dispose()
    {
        Disconnect();
        GC.SuppressFinalize(this);
    }

    private void OnDataReceived(object sender, SerialDataReceivedEventArgs e)
    {
        try
        {
            var messages = new List<string>();

            lock (_portLock)
            {
                if (_port?.IsOpen != true)
                {
                    return;
                }

                // DataReceived can contain partial lines or several Arduino messages at once.
                // Read everything currently buffered and publish each complete line in order.
                _receiveBuffer.Append(_port.ReadExisting());

                int newlineIndex;
                while ((newlineIndex = IndexOfNewLine(_receiveBuffer)) >= 0)
                {
                    string line = _receiveBuffer.ToString(0, newlineIndex).Trim();
                    _receiveBuffer.Remove(0, newlineIndex + 1);

                    if (!string.IsNullOrEmpty(line))
                    {
                        messages.Add(line);
                    }
                }
            }

            foreach (string message in messages)
            {
                DataReceived?.Invoke(message);
            }
        }
        catch (Exception ex)
        {
            ReportError(ex);
        }
    }

    private static int IndexOfNewLine(StringBuilder buffer)
    {
        for (int i = 0; i < buffer.Length; i++)
        {
            if (buffer[i] == '\n')
            {
                return i;
            }
        }

        return -1;
    }

    private void ReportError(Exception ex)
    {
        Debug.WriteLine($"SerialManager error: {ex}");
        ErrorReceived?.Invoke(ex);
    }
}
