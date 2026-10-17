using System;
using System.Net.Http;

namespace RVMDesktopApp;

/// <summary>
/// Central place for HttpClient creation towards the Central Master API.
/// Every client created here carries the shared-secret <c>x-kiosk-key</c> header
/// (read from config.txt key <c>KioskApiKey</c>) when it is configured.
/// </summary>
public static class KioskHttp
{
    public const string KioskKeyHeader = "x-kiosk-key";
    private static readonly object _lock = new();
    private static string? _kioskApiKey;

    /// <summary>Shared long-lived client (15 s timeout) for lightweight periodic calls such as heartbeats.</summary>
    public static HttpClient Client { get; } = Create(TimeSpan.FromSeconds(15));

    /// <summary>Returns the configured kiosk API key (loaded lazily from config.txt). Never log or display this value.</summary>
    public static string KioskApiKey
    {
        get
        {
            lock (_lock)
            {
                _kioskApiKey ??= SafeLoadKey();
                return _kioskApiKey;
            }
        }
    }

    /// <summary>Re-reads the key from config.txt (e.g. after Admin saves settings).</summary>
    public static void ReloadKey()
    {
        lock (_lock)
        {
            _kioskApiKey = SafeLoadKey();
        }
    }

    /// <summary>Creates a new HttpClient with the kiosk key header applied and the given timeout.</summary>
    public static HttpClient Create(TimeSpan timeout)
    {
        var client = new HttpClient { Timeout = timeout };
        ApplyKioskHeaders(client);
        return client;
    }

    /// <summary>Adds the x-kiosk-key default header to an existing client when a key is configured.</summary>
    public static void ApplyKioskHeaders(HttpClient client)
    {
        string key = KioskApiKey;
        if (string.IsNullOrWhiteSpace(key)) return;
        try
        {
            client.DefaultRequestHeaders.Remove(KioskKeyHeader);
            client.DefaultRequestHeaders.TryAddWithoutValidation(KioskKeyHeader, key);
        }
        catch { }
    }

    /// <summary>Adds the x-kiosk-key header to a single request (for callers that build HttpRequestMessage themselves).</summary>
    public static void ApplyKioskHeaders(HttpRequestMessage request)
    {
        string key = KioskApiKey;
        if (string.IsNullOrWhiteSpace(key)) return;
        try
        {
            request.Headers.Remove(KioskKeyHeader);
            request.Headers.TryAddWithoutValidation(KioskKeyHeader, key);
        }
        catch { }
    }

    private static string SafeLoadKey()
    {
        try
        {
            return AppSettings.Load().KioskApiKey?.Trim() ?? string.Empty;
        }
        catch
        {
            return string.Empty;
        }
    }
}
