namespace PhotoStudio.Models;

/// <summary>
/// Параметры коррекции изображения. Значения в тех же единицах,
/// что и униформы шейдера предпросмотра (см. wwwroot/js/editor.js).
/// </summary>
public class AdjustmentSettings
{
    public float Exposure { get; set; }      // -3..3 (EV)
    public float Brightness { get; set; }    // -1..1
    public float Contrast { get; set; }      // -1..1
    public float Gamma { get; set; } = 1f;   // 0.2..2.2
    public float Temperature { get; set; }   // -1..1
    public float Hue { get; set; }           // -180..180 (градусы)
    public float Saturation { get; set; }    // -1..1
    public float Vibrance { get; set; }      // -1..1
    public float Sharpen { get; set; }       // 0..1
    public float Blur { get; set; }          // 0..10 (px предпросмотра)
    public float Skin { get; set; }          // 0..1 (смягчение кожи)
    public float Glow { get; set; }          // 0..1 (мягкое сияние)
    public float Vignette { get; set; }      // 0..1
    public float Grayscale { get; set; }     // 0..1
    public float Sepia { get; set; }         // 0..1
    public float Blue { get; set; }          // 0..1 (холодный синий тон)
    public float BwRed { get; set; }         // -1..1 (поправка веса красного в Ч/Б)
    public float BwGreen { get; set; }       // -1..1
    public float BwBlue { get; set; }        // -1..1

    public static AdjustmentSettings Default { get; } = new();

    public AdjustmentSettings Clamped() => new()
    {
        Exposure = Math.Clamp(Exposure, -3f, 3f),
        Brightness = Math.Clamp(Brightness, -1f, 1f),
        Contrast = Math.Clamp(Contrast, -1f, 1f),
        Gamma = Math.Clamp(Gamma <= 0f ? 1f : Gamma, 0.2f, 2.2f),
        Temperature = Math.Clamp(Temperature, -1f, 1f),
        Hue = Math.Clamp(Hue, -180f, 180f),
        Saturation = Math.Clamp(Saturation, -1f, 1f),
        Vibrance = Math.Clamp(Vibrance, -1f, 1f),
        Sharpen = Math.Clamp(Sharpen, 0f, 1f),
        Blur = Math.Clamp(Blur, 0f, 10f),
        Skin = Math.Clamp(Skin, 0f, 1f),
        Glow = Math.Clamp(Glow, 0f, 1f),
        Vignette = Math.Clamp(Vignette, 0f, 1f),
        Grayscale = Math.Clamp(Grayscale, 0f, 1f),
        Sepia = Math.Clamp(Sepia, 0f, 1f),
        Blue = Math.Clamp(Blue, 0f, 1f),
        BwRed = Math.Clamp(BwRed, -1f, 1f),
        BwGreen = Math.Clamp(BwGreen, -1f, 1f),
        BwBlue = Math.Clamp(BwBlue, -1f, 1f),
    };

    /// <summary>Все цветовые параметры в нейтральном положении.</summary>
    public bool IsColorIdentity =>
        Exposure == 0f && Brightness == 0f && Contrast == 0f && Gamma == 1f &&
        Temperature == 0f && Hue == 0f && Saturation == 0f && Vibrance == 0f &&
        Vignette == 0f && Grayscale == 0f && Sepia == 0f && Blue == 0f &&
        BwRed == 0f && BwGreen == 0f && BwBlue == 0f;
}

/// <summary>Один элемент галереи для пакетного экспорта.</summary>
public class GalleryExportItem
{
    public string Id { get; set; } = "";
    public AdjustmentSettings Adjustments { get; set; } = new();
    public float PreviewWidth { get; set; }
    public int Rotation { get; set; }
}

public class ExportRequest
{
    public string Id { get; set; } = "";
    public string Format { get; set; } = "jpeg";   // jpeg | png | webp
    public int Quality { get; set; } = 90;         // 1..100
    public float PreviewWidth { get; set; }        // ширина текстуры предпросмотра (для масштаба эффектов)
    public int? MaxWidth { get; set; }
    public int? MaxHeight { get; set; }
    public int Rotation { get; set; }              // 0..3 (поворот по часовой, шаг 90°)
    public AdjustmentSettings Adjustments { get; set; } = new();
}

public record UploadResult(string Id, string Name, int Width, int Height, string Ext, string Url);

/// <summary>Пакетный экспорт всей галереи в ZIP.</summary>
public class GalleryExportRequest
{
    public List<GalleryExportItem> Items { get; set; } = new();
    public string Format { get; set; } = "jpeg";
    public int Quality { get; set; } = 90;
    public int? MaxWidth { get; set; }
    public int? MaxHeight { get; set; }
}
