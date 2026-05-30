param(
  [Parameter(Mandatory = $true)][string]$ImagePath,
  [Parameter(Mandatory = $true)][string]$OutPath,
  [int]$X = 0,
  [int]$Y = 0,
  [int]$W = 0,
  [int]$H = 0,
  [int]$WhiteThreshold = 235
)

# Crop a region of $ImagePath and chroma-key near-white pixels to fully
# transparent so the cut-out drops cleanly onto the coloured PPP lane.
# The threshold defaults to 235 (any pixel with R, G, B all above this
# becomes alpha=0). Lighter clothing edges survive.

Add-Type -AssemblyName System.Drawing

$src = [System.Drawing.Bitmap]::FromFile($ImagePath)
if ($W -le 0) { $W = $src.Width - $X }
if ($H -le 0) { $H = $src.Height - $Y }

$cropRect = New-Object System.Drawing.Rectangle $X, $Y, $W, $H
$bmp = New-Object System.Drawing.Bitmap $W, $H, ([System.Drawing.Imaging.PixelFormat]::Format32bppArgb)

$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$g.DrawImage($src, (New-Object System.Drawing.Rectangle 0, 0, $W, $H), $cropRect, [System.Drawing.GraphicsUnit]::Pixel)
$g.Dispose()

# Walk every pixel and zero alpha on near-white.
for ($y = 0; $y -lt $H; $y++) {
  for ($x = 0; $x -lt $W; $x++) {
    $c = $bmp.GetPixel($x, $y)
    if ($c.R -ge $WhiteThreshold -and $c.G -ge $WhiteThreshold -and $c.B -ge $WhiteThreshold) {
      $bmp.SetPixel($x, $y, [System.Drawing.Color]::FromArgb(0, 255, 255, 255))
    }
  }
}

$bmp.Save($OutPath, [System.Drawing.Imaging.ImageFormat]::Png)
$bmp.Dispose()
$src.Dispose()

Write-Output "Cropped + chroma-keyed -> $OutPath  ($W x $H, threshold=$WhiteThreshold)"
