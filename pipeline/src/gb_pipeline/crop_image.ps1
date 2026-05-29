param(
  [Parameter(Mandatory = $true)][string]$ImagePath,
  [Parameter(Mandatory = $true)][string]$OutPath,
  [int]$X = 0,
  [int]$Y = 0,
  [int]$W = 0,
  [int]$H = 0
)

Add-Type -AssemblyName System.Drawing

$img = [System.Drawing.Image]::FromFile($ImagePath)
if ($W -le 0) { $W = $img.Width - $X }
if ($H -le 0) { $H = $img.Height - $Y }

$cropRect = New-Object System.Drawing.Rectangle $X, $Y, $W, $H
$bmp = New-Object System.Drawing.Bitmap $W, $H
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$g.DrawImage($img, (New-Object System.Drawing.Rectangle 0, 0, $W, $H), $cropRect, [System.Drawing.GraphicsUnit]::Pixel)
$bmp.Save($OutPath, [System.Drawing.Imaging.ImageFormat]::Png)
$g.Dispose()
$bmp.Dispose()
$img.Dispose()

Write-Output "Cropped ${ImagePath}: x=$X y=$Y w=$W h=$H -> $OutPath"
