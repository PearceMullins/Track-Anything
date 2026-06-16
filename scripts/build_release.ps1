# Build TrackAnything.exe for GitHub Releases.
$ErrorActionPreference = "Stop"
$root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
Set-Location $root

Write-Host "=== Installing build dependencies ===" -ForegroundColor Cyan
python -m pip install -q -r requirements.txt -r requirements-dev.txt

Write-Host "`n=== Building frontend ===" -ForegroundColor Cyan
Set-Location frontend
if (-not (Test-Path node_modules)) { npm install }
npm run build
Set-Location $root

Write-Host "`n=== Packaging executable ===" -ForegroundColor Cyan
python build_exe.py

$exe = Join-Path $root "dist\TrackAnything.exe"
if (-not (Test-Path $exe)) {
    throw "Build failed: $exe was not created."
}

Write-Host "`nRelease binary ready:" -ForegroundColor Green
Write-Host $exe
