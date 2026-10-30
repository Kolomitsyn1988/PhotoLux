using Microsoft.AspNetCore.Mvc;
using PhotoStudio.Models;
using PhotoStudio.Services;
using System.IO.Compression;

namespace PhotoStudio.Controllers;

[ApiController]
[Route("api/images")]
public sealed class ImagesController : ControllerBase
{
    private const long MaxUploadBytes = 40 * 1024 * 1024;

    private readonly ImageStore _store;
    private readonly ImageProcessingService _processor;

    public ImagesController(ImageStore store, ImageProcessingService processor)
    {
        _store = store;
        _processor = processor;
    }

    [HttpPost("upload")]
    [RequestSizeLimit(MaxUploadBytes)]
    public async Task<ActionResult<UploadResult>> Upload(IFormFile? file)
    {
        if (file is null || file.Length == 0)
            return BadRequest(new { error = "Файл не передан." });
        if (file.Length > MaxUploadBytes)
            return BadRequest(new { error = "Файл больше 40 МБ." });

        using var ms = new MemoryStream();
        await file.CopyToAsync(ms);

        try
        {
            return Ok(_processor.Upload(ms.ToArray(), file.FileName));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpGet("{id}/original")]
    public IActionResult GetOriginal(string id)
    {
        var entry = _store.Get(id);
        if (entry is null)
            return NotFound();

        var stream = System.IO.File.OpenRead(entry.Path);
        return File(stream, ImageStore.GetMimeType(entry.Ext));
    }

    [HttpPost("export")]
    public IActionResult Export([FromBody] ExportRequest? request)
    {
        if (request is null || string.IsNullOrWhiteSpace(request.Id))
            return BadRequest(new { error = "Не указан идентификатор изображения." });

        try
        {
            var bytes = _processor.Export(request);
            var ext = request.Format?.ToLowerInvariant() switch
            {
                "png" => ".png",
                "webp" => ".webp",
                _ => ".jpg"
            };
            var baseName = _store.Get(request.Id)?.OriginalName ?? "photo";
            return File(bytes, ImageStore.GetMimeType(ext), $"{baseName}-edit{ext}");
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { error = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpPost("export-archive")]
    public IActionResult ExportArchive([FromBody] GalleryExportRequest? request)
    {
        if (request is null || request.Items is null || request.Items.Count == 0)
            return BadRequest(new { error = "Галерея пуста." });

        using var zipMs = new MemoryStream();
        int exported = 0;
        using (var zip = new ZipArchive(zipMs, ZipArchiveMode.Create, leaveOpen: true))
        {
            var failures = new List<string>();
            var usedNames = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

            string UniqueName(string name)
            {
                if (usedNames.Add(name)) return name;
                for (int i = 2; ; i++)
                {
                    var candidate = $"{Path.GetFileNameWithoutExtension(name)} ({i}){Path.GetExtension(name)}";
                    if (usedNames.Add(candidate)) return candidate;
                }
            }

            foreach (var item in request.Items)
            {
                if (string.IsNullOrWhiteSpace(item?.Id)) continue;
                try
                {
                    var bytes = _processor.Export(new ExportRequest
                    {
                        Id = item.Id,
                        Format = request.Format,
                        Quality = request.Quality,
                        PreviewWidth = item.PreviewWidth,
                        MaxWidth = request.MaxWidth,
                        MaxHeight = request.MaxHeight,
                        Adjustments = item.Adjustments ?? new AdjustmentSettings(),
                        Rotation = item.Rotation
                    });
                    var ext = request.Format?.ToLowerInvariant() switch
                    {
                        "png" => ".png",
                        "webp" => ".webp",
                        _ => ".jpg"
                    };
                    var baseName = _store.Get(item.Id)?.OriginalName ?? "photo";
                    var entry = zip.CreateEntry(UniqueName($"{baseName}-edit{ext}"), CompressionLevel.Fastest);
                    using var entryStream = entry.Open();
                    entryStream.Write(bytes, 0, bytes.Length);
                    exported++;
                }
                catch (Exception ex) when (ex is KeyNotFoundException or InvalidOperationException)
                {
                    failures.Add($"{item.Id}: {ex.Message}");
                }
            }

            if (failures.Count > 0)
            {
                var log = zip.CreateEntry("_ошибки.txt", CompressionLevel.Fastest);
                using var logStream = log.Open();
                using var writer = new StreamWriter(logStream);
                writer.Write("Не удалось обработать часть фотографий:\n" + string.Join("\n", failures));
            }
        }

        if (exported == 0)
            return BadRequest(new { error = "Ни одно фото не удалось обработать (срок хранения истёк?)." });

        return File(zipMs.ToArray(), "application/zip", "photolux-gallery.zip");
    }
}
