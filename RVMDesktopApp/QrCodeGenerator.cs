using System;
using System.IO;
using System.Windows.Media.Imaging;
using QRCoder;

namespace RVMDesktopApp;

public static class QrCodeGenerator
{
    /// <summary>
    /// Generates a crisp WPF BitmapSource QR Code from the given text or URL using PngByteQRCode.
    /// </summary>
    public static BitmapSource GenerateQrCode(string content, int pixelsPerModule = 10)
    {
        if (string.IsNullOrWhiteSpace(content))
        {
            content = "https://isprvm.binishaqsoft.com";
        }

        using var qrGenerator = new QRCodeGenerator();
        using var qrCodeData = qrGenerator.CreateQrCode(content, QRCodeGenerator.ECCLevel.M);
        using var qrCode = new PngByteQRCode(qrCodeData);
        byte[] qrCodeBytes = qrCode.GetGraphic(pixelsPerModule);

        var image = new BitmapImage();
        using (var mem = new MemoryStream(qrCodeBytes))
        {
            mem.Position = 0;
            image.BeginInit();
            image.CreateOptions = BitmapCreateOptions.PreservePixelFormat;
            image.CacheOption = BitmapCacheOption.OnLoad;
            image.UriSource = null;
            image.StreamSource = mem;
            image.EndInit();
        }
        image.Freeze();
        return image;
    }
}
