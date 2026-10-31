# Installs the kit's skills into the user's Claude skills folder and prepares the NotebookLM venv.
# Usage (PowerShell):  .\install.ps1            (add -SkipVenv to skip creating the virtual environment)
param([switch]$SkipVenv)
$ErrorActionPreference = "Stop"
$kit = Split-Path -Parent $MyInvocation.MyCommand.Path
$dest = Join-Path $env:USERPROFILE ".claude\skills"
New-Item -ItemType Directory -Force -Path $dest | Out-Null
foreach ($name in "notebooklm-skill-master", "notebooklm-presentation-studio") {
    $src = Join-Path $kit "skills\$name"
    $dst = Join-Path $dest $name
    if (Test-Path $dst) {
        Write-Host "Skipping $name (already exists at $dst). Delete it first to overwrite." -ForegroundColor Yellow
    } else {
        Copy-Item -Recurse $src $dst
        Write-Host "Installed $name"
    }
}
$nb = Join-Path $dest "notebooklm-skill-master"
if (-not $SkipVenv -and -not (Test-Path (Join-Path $nb ".venv"))) {
    Push-Location $nb
    python -m venv .venv
    .\.venv\Scripts\python.exe -m pip install -r requirements.txt
    .\.venv\Scripts\python.exe -m patchright install chrome
    Pop-Location
}
Write-Host ""
Write-Host "Next: authenticate once -> cd '$nb'; .\.venv\Scripts\python.exe scripts\run.py auth_manager.py setup" -ForegroundColor Cyan
