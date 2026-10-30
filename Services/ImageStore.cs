using System.Collections.Concurrent;

namespace PhotoStudio.Services;

public sealed record ImageEntry(string Id, string Path, string Ext, string OriginalName, int Width, int Height);

/// <summary>
/// Хранилище загруженных оригиналов (в файловой системе + в памяти).
/// Файлы считаются временными: чистятся при старте, если старше 12 часов.
/// </summary>
public sealed class ImageStore
{
    private static readonly HashSet<string> AllowedExtensions = new(StringComparer.OrdinalIgnoreCase)
    {
        ".jpg", ".jpeg", ".png", ".webp", ".bmp", ".gif"
    };

    private readonly ConcurrentDictionary<string, ImageEntry> _entries = new();
    private readonly string _directory;

    public ImageStore(IWebHostEnvironment env)
    {
        _directory = Path.Combine(env.ContentRootPath, "App_Data", "uploads");
        Directory.CreateDirectory(_directory);
        CleanupOldFiles();
    }

    public static bool IsAllowedExtension(string? ext) =>
        !string.IsNullOrWhiteSpace(ext) && AllowedExtensions.Contains(ext);

    public static string GetMimeType(string ext) => ext.ToLowerInvariant() switch
    {
        ".jpg" or ".jpeg" => "image/jpeg",
        ".png" => "image/png",
        ".webp" => "image/webp",
        ".bmp" => "image/bmp",
        ".gif" => "image/gif",
        _ => "application/octet-stream"
    };

    /// <summary>Имя файла без расширения, безопасное для Content-Disposition.</summary>
    public static string GetBaseName(string originalName)
    {
        var baseName = Path.GetFileNameWithoutExtension(originalName?.Trim() ?? "");
        foreach (var c in Path.GetInvalidFileNameChars())
            baseName = baseName.Replace(c, '_');
        baseName = baseName.Trim().Trim('.');
        if (baseName.Length > 60)
            baseName = baseName[^60..];
        return string.IsNullOrWhiteSpace(baseName) ? "photo" : baseName;
    }

    public ImageEntry Save(byte[] bytes, string ext, int width, int height, string originalName)
    {
        var id = Guid.NewGuid().ToString("N");
        ext = ext.ToLowerInvariant();
        var path = Path.Combine(_directory, id + ext);
        File.WriteAllBytes(path, bytes);
        var entry = new ImageEntry(id, path, ext, GetBaseName(originalName), width, height);
        _entries[id] = entry;
        return entry;
    }

    public ImageEntry? Get(string id) =>
        !string.IsNullOrWhiteSpace(id) && _entries.TryGetValue(id, out var entry) ? entry : null;

    private void CleanupOldFiles()
    {
        try
        {
            var cutoff = DateTime.UtcNow.AddHours(-12);
            foreach (var file in Directory.EnumerateFiles(_directory))
            {
                if (File.GetLastWriteTimeUtc(file) < cutoff)
                {
                    try { File.Delete(file); } catch (IOException) { }
                }
            }
        }
        catch (IOException)
        {
            // Каталог недоступен — не мешаем старту приложения.
        }
    }
}
