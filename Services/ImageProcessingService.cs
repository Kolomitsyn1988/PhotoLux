using PhotoStudio.Models;
using SixLabors.ImageSharp;
using SixLabors.ImageSharp.Formats;
using SixLabors.ImageSharp.Formats.Bmp;
using SixLabors.ImageSharp.Formats.Gif;
using SixLabors.ImageSharp.Formats.Jpeg;
using SixLabors.ImageSharp.Formats.Png;
using SixLabors.ImageSharp.Formats.Webp;
using SixLabors.ImageSharp.PixelFormats;
using SixLabors.ImageSharp.Processing;

namespace PhotoStudio.Services;

/// <summary>
/// Приём и обработка изображений. Математика коррекции идентична
/// фрагментному шейдеру предпросмотра в wwwroot/js/editor.js —
/// при изменении формул менять обе реализации синхронно.
/// </summary>
public sealed class ImageProcessingService
{
    private const int MaxExportDimension = 6000;

    // Форматы сайта. TIFF-модуль не регистрируется сознательно:
    // известные уязвимости декодера TIFF/BigTIFF (GHSA-v76p-62qx-wwq2,
    // GHSA-wmxv-xphr-5c9g) исправлены только в 3.2+, где Release-сборка
    // требует лицензию Six Labors. Без модуля TIFF-файлы отбраковываются
    // на этапе определения формата, даже если переименованы в .jpg.
    private static readonly DecoderOptions DecoderOptions = new()
    {
        Configuration = new Configuration(
            new JpegConfigurationModule(),
            new PngConfigurationModule(),
            new WebpConfigurationModule(),
            new BmpConfigurationModule(),
            new GifConfigurationModule())
    };

    private readonly ImageStore _store;

    public ImageProcessingService(ImageStore store)
    {
        _store = store;
    }

    public UploadResult Upload(byte[] data, string originalFileName)
    {
        var ext = Path.GetExtension(originalFileName ?? "");
        if (!ImageStore.IsAllowedExtension(ext))
            throw new InvalidOperationException("Поддерживаются форматы: JPEG, PNG, WebP, BMP, GIF.");

        var info = Image.Identify(DecoderOptions, data)
            ?? throw new InvalidOperationException("Файл не распознан как изображение.");

        var entry = _store.Save(data, ext, info.Width, info.Height, originalFileName ?? "photo");
        return new UploadResult(entry.Id, entry.OriginalName, entry.Width, entry.Height, entry.Ext,
            $"/api/images/{entry.Id}/original");
    }

    public byte[] Export(ExportRequest request)
    {
        var entry = _store.Get(request.Id)
            ?? throw new KeyNotFoundException("Изображение не найдено или срок его хранения истёк.");

        var data = File.ReadAllBytes(entry.Path);
        using var image = Image.Load<Rgba32>(DecoderOptions, data);
        image.Mutate(x => x.AutoOrient());

        // Поворот применяем до эффектов: все операции (размытие, резкость,
        // цвет) симметричны относительно поворота на 90°, а resize получает
        // итоговую ориентацию. Клиент присылает previewWidth уже в повёрнутой
        // системе, поэтому масштаб радиусов считается корректно.
        var rotation = ((request.Rotation % 4) + 4) % 4;
        if (rotation != 0)
            image.Mutate(x => x.Rotate(rotation * 90f));

        var settings = (request.Adjustments ?? AdjustmentSettings.Default).Clamped();

        int? maxW = request.MaxWidth is > 0 ? Math.Min(request.MaxWidth.Value, MaxExportDimension) : null;
        int? maxH = request.MaxHeight is > 0 ? Math.Min(request.MaxHeight.Value, MaxExportDimension) : null;
        if (maxW.HasValue || maxH.HasValue)
        {
            image.Mutate(x => x.Resize(new ResizeOptions
            {
                Mode = ResizeMode.Max,
                Size = new Size(maxW ?? MaxExportDimension, maxH ?? MaxExportDimension)
            }));
        }
        else if (image.Width > MaxExportDimension || image.Height > MaxExportDimension)
        {
            image.Mutate(x => x.Resize(new ResizeOptions
            {
                Mode = ResizeMode.Max,
                Size = new Size(MaxExportDimension, MaxExportDimension)
            }));
        }

        // Эффекты в предпросмотре заданы в пикселях уменьшенной копии,
        // для экспорта масштабируем радиусы к реальному размеру.
        float scale = request.PreviewWidth > 1f ? image.Width / request.PreviewWidth : 1f;
        scale = Math.Clamp(scale, 0.25f, 8f);

        if (settings.Blur > 0.001f)
            image.Mutate(x => x.GaussianBlur(settings.Blur * scale));

        if (settings.Sharpen > 0.001f)
            ApplySharpen(image, settings.Sharpen, scale);

        if (settings.Skin > 0.001f || settings.Glow > 0.001f)
            ApplyFaceEffects(image, settings.Skin, settings.Glow, scale);

        if (!settings.IsColorIdentity)
            ApplyColorPipeline(image, settings);

        return Encode(image, request.Format, Math.Clamp(request.Quality, 1, 100));
    }

    /// <summary>
    /// Резкость: крестовое ядро 3x3 (центр 1+4a, соседи -a),
    /// радиус соседства масштабируется от предпросмотра к полному размеру.
    /// </summary>
    private static void ApplySharpen(Image<Rgba32> image, float amount, float scale)
    {
        int w = image.Width, h = image.Height;
        int r = Math.Max(1, (int)MathF.Round(scale));

        image.ProcessPixelRows(accessor =>
        {
            // Кольцевой буфер снимков строк: строка y и её верхний сосед y-r
            // должны читаться до записи (иначе фильтр "размажет" сам себя).
            var ring = new Rgba32[r + 1][];
            for (int y = 0; y < h; y++)
            {
                var row = accessor.GetRowSpan(y);
                var cur = ring[y % (r + 1)] ??= new Rgba32[w];
                row.CopyTo(cur);

                bool hasUp = y - r >= 0;
                var up = hasUp ? ring[(y - r) % (r + 1)]! : cur;
                var down = accessor.GetRowSpan(Math.Min(y + r, h - 1));

                for (int x = 0; x < w; x++)
                {
                    var c = cur[x];
                    var u = hasUp ? up[x] : c;
                    var d = y + r < h ? down[x] : c;
                    var l = cur[Math.Max(x - r, 0)];
                    var rr = cur[Math.Min(x + r, w - 1)];

                    row[x] = new Rgba32(
                        Conv(c.R, u.R, d.R, l.R, rr.R, amount),
                        Conv(c.G, u.G, d.G, l.G, rr.G, amount),
                        Conv(c.B, u.B, d.B, l.B, rr.B, amount),
                        c.A);
                }
            }
        });
    }

    private static byte Conv(float c, float u, float d, float l, float r, float a) =>
        ToByte((c * (1f + 4f * a)) - ((u + d + l + r) * a));

    private const float SoftBlurSigma = 2.2f;

    /// <summary>
    /// Портретные эффекты (смягчение кожи, сияние). Работают по мягко размытой
    /// копии изображения — формулы синхронны с шейдером (editor.js, FRAG_COLOR).
    /// </summary>
    private static void ApplyFaceEffects(Image<Rgba32> image, float skin, float glow, float scale)
    {
        using var soft = image.Clone(x => x.GaussianBlur(SoftBlurSigma * scale));

        int w = image.Width, h = image.Height;
        image.ProcessPixelRows(accessor =>
        {
            for (int y = 0; y < h; y++)
            {
                var row = accessor.GetRowSpan(y);
                for (int x = 0; x < w; x++)
                {
                    var p = row[x];
                    float r = p.R / 255f;
                    float g = p.G / 255f;
                    float b = p.B / 255f;

                    var s = soft[x, y];
                    float sr = s.R / 255f;
                    float sg = s.G / 255f;
                    float sb = s.B / 255f;

                    if (skin > 0f)
                    {
                        float mx = MathF.Max(r, MathF.Max(g, b));
                        float mn = MathF.Min(r, MathF.Min(g, b));
                        bool isSkin = r > 0.37f && g > 0.15f && b > 0.08f && r > g && r > b
                            && mx - mn > 0.06f && MathF.Abs(r - g) > 0.06f;
                        if (isSkin)
                        {
                            float dr = r - sr, dg = g - sg, db = b - sb;
                            float edge = MathF.Sqrt(dr * dr + dg * dg + db * db);
                            // сильные края (глаза, контуры) сохраняем, ровную кожу разглаживаем
                            float k = skin * (1f - SmoothStep(0.05f, 0.20f, edge));
                            r += (sr - r) * k;
                            g += (sg - g) * k;
                            b += (sb - b) * k;
                        }
                    }

                    if (glow > 0f)
                    {
                        float screenR = 1f - (1f - r) * (1f - sr);
                        float screenG = 1f - (1f - g) * (1f - sg);
                        float screenB = 1f - (1f - b) * (1f - sb);
                        float k = glow * 0.7f;
                        r += (screenR - r) * k;
                        g += (screenG - g) * k;
                        b += (screenB - b) * k;
                    }

                    row[x] = new Rgba32(ToByte(r), ToByte(g), ToByte(b), p.A);
                }
            }
        });
    }

    /// <summary>
    /// Цветовая коррекция. Порядок операций повторяет шейдер:
    /// экспозиция → температура → гамма → яркость → контраст →
    /// насыщенность → красочность → оттенок → ч/б (поканальные веса) →
    /// сепия → синий тон → виньетка.
    /// </summary>
    private static void ApplyColorPipeline(Image<Rgba32> image, AdjustmentSettings s)
    {
        int w = image.Width, h = image.Height;

        float exposure = MathF.Pow(2f, s.Exposure);
        float tempR = 1f + 0.30f * s.Temperature;
        float tempB = 1f - 0.30f * s.Temperature;
        float invGamma = 1f / s.Gamma;
        float brightness = 1f + s.Brightness;
        float contrast = 1f + s.Contrast;
        float satK = 1f + s.Saturation;
        float vibrance = s.Vibrance;
        bool rotateHue = MathF.Abs(s.Hue) > 0.01f;
        float cosA = MathF.Cos(s.Hue * MathF.PI / 180f);
        float sinA = MathF.Sin(s.Hue * MathF.PI / 180f);
        float gray = s.Grayscale;
        float sepia = s.Sepia;
        float blue = s.Blue;
        float vignette = s.Vignette;

        image.ProcessPixelRows(accessor =>
        {
            for (int y = 0; y < h; y++)
            {
                var row = accessor.GetRowSpan(y);
                float ny = (y + 0.5f) / h - 0.5f;
                float ny2 = ny * ny;

                for (int x = 0; x < w; x++)
                {
                    var p = row[x];
                    float r = p.R / 255f;
                    float g = p.G / 255f;
                    float b = p.B / 255f;

                    r *= exposure;
                    g *= exposure;
                    b *= exposure;

                    r *= tempR;
                    b *= tempB;

                    r = MathF.Pow(MathF.Max(r, 0f), invGamma);
                    g = MathF.Pow(MathF.Max(g, 0f), invGamma);
                    b = MathF.Pow(MathF.Max(b, 0f), invGamma);

                    r *= brightness;
                    g *= brightness;
                    b *= brightness;

                    r = (r - 0.5f) * contrast + 0.5f;
                    g = (g - 0.5f) * contrast + 0.5f;
                    b = (b - 0.5f) * contrast + 0.5f;

                    float luma = 0.2126f * r + 0.7152f * g + 0.0722f * b;
                    r = luma + (r - luma) * satK;
                    g = luma + (g - luma) * satK;
                    b = luma + (b - luma) * satK;

                    float mx = MathF.Max(r, MathF.Max(g, b));
                    float mn = MathF.Min(r, MathF.Min(g, b));
                    float vibK = 1f + vibrance * (1f - (mx - mn));
                    luma = 0.2126f * r + 0.7152f * g + 0.0722f * b;
                    r = luma + (r - luma) * vibK;
                    g = luma + (g - luma) * vibK;
                    b = luma + (b - luma) * vibK;

                    if (rotateHue)
                    {
                        float r2 =
                            (0.213f + cosA * 0.787f - sinA * 0.213f) * r +
                            (0.715f - cosA * 0.715f - sinA * 0.715f) * g +
                            (0.072f - cosA * 0.072f + sinA * 0.928f) * b;
                        float g2 =
                            (0.213f - cosA * 0.213f + sinA * 0.143f) * r +
                            (0.715f + cosA * 0.285f + sinA * 0.140f) * g +
                            (0.072f - cosA * 0.072f - sinA * 0.283f) * b;
                        float b2 =
                            (0.213f - cosA * 0.213f - sinA * 0.787f) * r +
                            (0.715f - cosA * 0.715f + sinA * 0.715f) * g +
                            (0.072f + cosA * 0.928f + sinA * 0.072f) * b;
                        r = r2;
                        g = g2;
                        b = b2;
                    }

                    if (gray > 0f)
                    {
                        // Ч/Б микс: базовые веса + поправки ползунков, нормировка.
                        // Синхронно с bwWeights() в editor.js. Верхняя граница клампа
                        // должна быть выше базового веса зелёного (0.7152)!
                        float wr = Math.Clamp(0.2126f + s.BwRed * 0.2f, 0.02f, 0.95f);
                        float wg = Math.Clamp(0.7152f + s.BwGreen * 0.2f, 0.02f, 0.95f);
                        float wb = Math.Clamp(0.0722f + s.BwBlue * 0.2f, 0.02f, 0.95f);
                        float wsum = wr + wg + wb;
                        wr /= wsum;
                        wg /= wsum;
                        wb /= wsum;
                        luma = wr * r + wg * g + wb * b;
                        r += (luma - r) * gray;
                        g += (luma - g) * gray;
                        b += (luma - b) * gray;
                    }

                    if (sepia > 0f)
                    {
                        float sr = 0.393f * r + 0.769f * g + 0.189f * b;
                        float sg = 0.349f * r + 0.686f * g + 0.168f * b;
                        float sb = 0.272f * r + 0.534f * g + 0.131f * b;
                        r += (sr - r) * sepia;
                        g += (sg - g) * sepia;
                        b += (sb - b) * sepia;
                    }

                    // Холодный синий тон: формула синхронна с шейдером (editor.js).
                    if (blue > 0f)
                    {
                        float br = r * 0.80f;
                        float bg = g * 0.92f + 0.015f;
                        float bb = b * 1.02f + 0.085f;
                        r += (br - r) * blue;
                        g += (bg - g) * blue;
                        b += (bb - b) * blue;
                    }

                    if (vignette > 0f)
                    {
                        float nx = (x + 0.5f) / w - 0.5f;
                        float dist = MathF.Sqrt(nx * nx + ny2);
                        float falloff = 1f - vignette * SmoothStep(0.20f, 0.85f, dist);
                        r *= falloff;
                        g *= falloff;
                        b *= falloff;
                    }

                    row[x] = new Rgba32(ToByte(r), ToByte(g), ToByte(b), p.A);
                }
            }
        });
    }

    private static float SmoothStep(float edge0, float edge1, float x)
    {
        float t = Math.Clamp((x - edge0) / (edge1 - edge0), 0f, 1f);
        return t * t * (3f - 2f * t);
    }

    private static byte ToByte(float v)
    {
        int i = (int)(Math.Clamp(v, 0f, 1f) * 255f + 0.5f);
        return (byte)i;
    }

    private static byte[] Encode(Image<Rgba32> image, string? format, int quality)
    {
        using var ms = new MemoryStream();
        switch ((format ?? "jpeg").ToLowerInvariant())
        {
            case "png":
                image.Save(ms, new PngEncoder());
                break;
            case "webp":
                image.Save(ms, new WebpEncoder { Quality = quality });
                break;
            default: // jpeg: прозрачность сводим на белый фон
                using (var flat = image.Clone(x => x.BackgroundColor(Color.White)))
                {
                    flat.Save(ms, new JpegEncoder { Quality = quality });
                }
                break;
        }
        return ms.ToArray();
    }
}
