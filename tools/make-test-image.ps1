Add-Type -AssemblyName System.Drawing

$w = 2400; $h = 1600
$bmp = New-Object System.Drawing.Bitmap($w, $h)
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.SmoothingMode = 'AntiAlias'

# небесный градиент
$rect = New-Object System.Drawing.Rectangle(0, 0, $w, $h)
$c1 = [System.Drawing.Color]::FromArgb(255, 30, 80, 160)
$c2 = [System.Drawing.Color]::FromArgb(255, 240, 180, 90)
$brush = New-Object System.Drawing.Drawing2D.LinearGradientBrush($rect, $c1, $c2, 90)
$g.FillRectangle($brush, $rect)

# солнце
$g.FillEllipse([System.Drawing.Brushes]::Yellow, 1850, 180, 320, 320)

# горы
$dark = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 40, 55, 80))
$g.FillPolygon($dark, @([System.Drawing.PointF]::new(0, 1600), [System.Drawing.PointF]::new(400, 900), [System.Drawing.PointF]::new(900, 1600)))
$mid = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 70, 90, 120))
$g.FillPolygon($mid, @([System.Drawing.PointF]::new(600, 1600), [System.Drawing.PointF]::new(1200, 780), [System.Drawing.PointF]::new(1900, 1600)))

# цветные круги для проверки насыщенности
$g.FillEllipse([System.Drawing.Brushes]::Red, 200, 1200, 260, 260)
$g.FillEllipse([System.Drawing.Brushes]::Lime, 500, 1200, 260, 260)
$g.FillEllipse([System.Drawing.Brushes]::Blue, 800, 1200, 260, 260)

# текст
$font = New-Object System.Drawing.Font('Arial', 90)
$white = [System.Drawing.Brushes]::White
$g.DrawString('PhotoStudio TEST', $font, $white, 350, 250)
$font.Dispose()

$out = Join-Path $PSScriptRoot 'test-photo.jpg'
$jpegCodec = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object { $_.MimeType -eq 'image/jpeg' }
$encParams = New-Object System.Drawing.Imaging.EncoderParameters(1)
$encParams.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter([System.Drawing.Imaging.Encoder]::Quality, [long]92)
$bmp.Save($out, $jpegCodec, $encParams)

$g.Dispose(); $bmp.Dispose()
Write-Host "OK: $out ($((Get-Item $out).Length) bytes)"
