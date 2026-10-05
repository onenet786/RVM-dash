using System;
using System.Runtime.InteropServices;
using System.Windows.Input;

namespace PecoDropDesktopApp;

/// <summary>
/// Universal Kiosk Keypad Input Resolver.
/// Seamlessly normalizes input from:
/// - Dedicated console digital keypads (USB / HID)
/// - External numeric keypads (with NumLock ON or OFF)
/// - Standard full keyboard numpads and number rows
/// - Virtual keys, system keys, and Alt-mapped scancodes
/// </summary>
public static class KioskNumpadHelper
{
    [DllImport("user32.dll", SetLastError = true)]
    private static extern void keybd_event(byte bVk, byte bScan, uint dwFlags, UIntPtr dwExtraInfo);

    [DllImport("user32.dll")]
    private static extern short GetKeyState(int nVirtKey);

    private const byte VK_NUMLOCK = 0x90;
    private const uint KEYEVENTF_EXTENDEDKEY = 0x0001;
    private const uint KEYEVENTF_KEYUP = 0x0002;

    /// <summary>
    /// Programmatically verifies and forces Windows NumLock to ON state.
    /// Useful for kiosk bootups where external keypads might default to navigation mode.
    /// </summary>
    public static void EnsureNumLockOn()
    {
        try
        {
            // Low-order bit indicates if key is toggled ON (1 = ON, 0 = OFF)
            bool isNumLockOn = (GetKeyState(VK_NUMLOCK) & 0x0001) != 0;
            if (!isNumLockOn)
            {
                keybd_event(VK_NUMLOCK, 0x45, KEYEVENTF_EXTENDEDKEY, UIntPtr.Zero);
                keybd_event(VK_NUMLOCK, 0x45, KEYEVENTF_EXTENDEDKEY | KEYEVENTF_KEYUP, UIntPtr.Zero);
            }
        }
        catch
        {
            // Non-critical fallback if OS restrictions prevent simulated keybd_event
        }
    }

    /// <summary>
    /// Normalizes a KeyEventArgs, unwrapping Key.System and Key.ImeProcessed.
    /// </summary>
    public static Key NormalizeKey(KeyEventArgs e)
    {
        if (e == null) return Key.None;
        if (e.Key == Key.System) return e.SystemKey;
        if (e.Key == Key.ImeProcessed) return e.ImeProcessedKey;
        return e.Key;
    }

    /// <summary>
    /// Resolves whether a key represents a numeric digit '0' through '9'.
    /// Works regardless of NumLock state, supporting both NumPad and navigation-key aliases.
    /// </summary>
    public static bool TryResolveDigit(KeyEventArgs e, out char digit)
    {
        return TryResolveDigit(NormalizeKey(e), out digit);
    }

    /// <summary>
    /// Resolves whether a key represents a numeric digit '0' through '9'.
    /// Works regardless of NumLock state, supporting both NumPad and navigation-key aliases.
    /// </summary>
    public static bool TryResolveDigit(Key key, out char digit)
    {
        switch (key)
        {
            case Key.D0:
            case Key.NumPad0:
            case Key.Insert: // NumPad 0 when NumLock is OFF
                digit = '0';
                return true;

            case Key.D1:
            case Key.NumPad1:
            case Key.End: // NumPad 1 when NumLock is OFF
                digit = '1';
                return true;

            case Key.D2:
            case Key.NumPad2:
            case Key.Down: // NumPad 2 when NumLock is OFF
                digit = '2';
                return true;

            case Key.D3:
            case Key.NumPad3:
            case Key.PageDown: // NumPad 3 when NumLock is OFF
                digit = '3';
                return true;

            case Key.D4:
            case Key.NumPad4:
            case Key.Left: // NumPad 4 when NumLock is OFF
                digit = '4';
                return true;

            case Key.D5:
            case Key.NumPad5:
            case Key.Clear: // NumPad 5 when NumLock is OFF
                digit = '5';
                return true;

            case Key.D6:
            case Key.NumPad6:
            case Key.Right: // NumPad 6 when NumLock is OFF
                digit = '6';
                return true;

            case Key.D7:
            case Key.NumPad7:
            case Key.Home: // NumPad 7 when NumLock is OFF
                digit = '7';
                return true;

            case Key.D8:
            case Key.NumPad8:
            case Key.Up: // NumPad 8 when NumLock is OFF
                digit = '8';
                return true;

            case Key.D9:
            case Key.NumPad9:
            case Key.PageUp: // NumPad 9 when NumLock is OFF
                digit = '9';
                return true;

            default:
                // Fallback check against Windows Virtual Keys
                try
                {
                    int vk = KeyInterop.VirtualKeyFromKey(key);
                    if (vk >= 0x60 && vk <= 0x69) // VK_NUMPAD0..VK_NUMPAD9
                    {
                        digit = (char)('0' + (vk - 0x60));
                        return true;
                    }
                    if (vk >= 0x30 && vk <= 0x39) // VK_0..VK_9
                    {
                        digit = (char)('0' + (vk - 0x30));
                        return true;
                    }
                }
                catch { }

                digit = '\0';
                return false;
        }
    }

    /// <summary>
    /// Checks if the key is a Backspace, Minus/Subtract, or Delete key.
    /// </summary>
    public static bool IsBackKey(Key key)
    {
        return key is Key.Back or Key.Subtract or Key.OemMinus or Key.Delete;
    }

    /// <summary>
    /// Checks if the key is an Enter or Return key.
    /// </summary>
    public static bool IsEnterKey(Key key)
    {
        return key is Key.Enter or Key.Return;
    }

    /// <summary>
    /// Checks if the key is a machine Start trigger ('0' or NumPad0 or Insert).
    /// </summary>
    public static bool IsStartKey(Key key)
    {
        return TryResolveDigit(key, out char d) && d == '0';
    }
}
