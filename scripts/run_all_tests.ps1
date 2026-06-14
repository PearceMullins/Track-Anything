# Run all Track Anything automated tests (backend + frontend).
$ErrorActionPreference = "Stop"
$root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
Set-Location $root

Write-Host "=== Python tests ===" -ForegroundColor Cyan
python -m pip install -q -r requirements.txt
python -m pytest tests/ -v
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host "`n=== Frontend tests ===" -ForegroundColor Cyan
Set-Location frontend
if (-not (Test-Path node_modules)) { npm install }
npm test
exit $LASTEXITCODE
