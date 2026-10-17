using System.Net.Http;

namespace PecoDropDesktopApp;

/// <summary>
/// Central API HTTP helper. Every HttpClient that talks to the central dashboard API must be created
/// through <see cref="CreateClient"/> (or have <see cref="ApplyKioskHeaders"/> applied) so the shared
/// kiosk secret (<c>x-kiosk-key</c>, from config.txt "KioskApiKey") is sent on every request.
/// The key is never displayed in the UI.
/// </summary>
public static class KioskHttp
{
    public const string ApiKeyHeaderName = "x-kiosk-key";

    private static string _apiKey = string.Empty;

    /// <summary>Shared kiosk secret. Empty means "send no header" (server with no KIOSK_API_KEY configured).</summary>
    public static string ApiKey
    {
        get => _apiKey;
        set => _apiKey = value?.Trim() ?? string.Empty;
    }

    /// <summary>Loads the kiosk secret from the application settings (config.txt is the source).</summary>
    public static void Configure(AppSettings settings)
    {
        if (settings is null) return;
        ApiKey = settings.KioskApiKey;
    }

    /// <summary>
    /// Creates an HttpClient whose requests automatically carry the x-kiosk-key header
    /// (resolved at send time, so late configuration and static clients both work).
    /// </summary>
    public static HttpClient CreateClient(TimeSpan? timeout = null)
    {
        var client = new HttpClient(new KioskApiKeyHandler(), disposeHandler: true);
        if (timeout.HasValue) client.Timeout = timeout.Value;
        return client;
    }

    /// <summary>Applies the x-kiosk-key default header to an existing client when a key is configured.</summary>
    public static void ApplyKioskHeaders(HttpClient client, AppSettings? settings = null)
    {
        if (client is null) return;
        string key = settings is not null ? (settings.KioskApiKey?.Trim() ?? string.Empty) : ApiKey;
        client.DefaultRequestHeaders.Remove(ApiKeyHeaderName);
        if (!string.IsNullOrWhiteSpace(key))
        {
            client.DefaultRequestHeaders.TryAddWithoutValidation(ApiKeyHeaderName, key);
        }
    }

    /// <summary>Injects the x-kiosk-key header on every outgoing request when a key is configured.</summary>
    private sealed class KioskApiKeyHandler : DelegatingHandler
    {
        public KioskApiKeyHandler() : base(new HttpClientHandler()) { }

        protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
        {
            string key = ApiKey;
            if (!string.IsNullOrWhiteSpace(key) && !request.Headers.Contains(ApiKeyHeaderName))
            {
                request.Headers.TryAddWithoutValidation(ApiKeyHeaderName, key);
            }
            return base.SendAsync(request, cancellationToken);
        }
    }
}
