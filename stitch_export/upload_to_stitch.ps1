param(
    [string]$ApiKey = $env:STITCH_API_KEY
)

$ProjectId = "12359657743223843691"

Write-Host "====================================================" -ForegroundColor Cyan
Write-Host " Motofix -> Google Stitch Project Sync" -ForegroundColor Cyan
Write-Host " Target Project: projects/$ProjectId" -ForegroundColor Cyan
Write-Host "====================================================`n" -ForegroundColor Cyan

if (-not $ApiKey) {
    Write-Host "❌ Error: API Key tidak ditemukan." -ForegroundColor Red
    Write-Host "`nCara mendapatkan Stitch API Key:" -ForegroundColor Yellow
    Write-Host "1. Buka https://stitch.withgoogle.com"
    Write-Host "2. Klik Profile / Settings -> Copy API Key"
    Write-Host "3. Jalankan kembali dengan perintah:"
    Write-Host "   .\stitch_export\upload_to_stitch.ps1 -ApiKey 'KUNCI_API_ANDA'" -ForegroundColor Green
    Write-Host "   Atau set env: `$env:STITCH_API_KEY = 'KUNCI_API_ANDA'`n"
    exit 1
}

$env:STITCH_API_KEY = $ApiKey

$screens = @(
    @{ File = "splash_screen.html"; Title = "01 - Splash & Mechanical Odometer" },
    @{ File = "garage_screen.html"; Title = "02 - Garage Vehicle Inventory" },
    @{ File = "home_screen.html"; Title = "03 - Vehicle Telemetry Dashboard" },
    @{ File = "workshop_screen.html"; Title = "04 - Workshop & Maintenance Directive" },
    @{ File = "help_screen.html"; Title = "05 - Operating Manual & System Help" }
)

foreach ($screen in $screens) {
    $filePath = Join-Path (Get-Location) "stitch_export\$($screen.File)"
    if (Test-Path $filePath) {
        Write-Host "🚀 Mengunggah [$($screen.Title)]..." -ForegroundColor Yellow
        npx @_davideast/stitch-mcp upload -p $ProjectId -f "$filePath" --title "$($screen.Title)"
        Write-Host "✅ Selesai: $($screen.Title)`n" -ForegroundColor Green
    } else {
        Write-Host "⚠ File tidak ditemukan: $filePath" -ForegroundColor DarkYellow
    }
}

Write-Host "`n🎉 Sinkronisasi selesai!" -ForegroundColor Green
Write-Host "Lihat hasil design di Google Stitch:" -ForegroundColor Cyan
Write-Host "https://stitch.withgoogle.com/projects/$ProjectId" -ForegroundColor Blue
