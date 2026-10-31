# Installs the learning-artifact skill and agent for Claude Code.
# Usage:  .\install.ps1
#         -Dest <folder>  target .claude folder (default: $env:USERPROFILE\.claude)   -Force  overwrite
param([string]$Dest="$env:USERPROFILE\.claude",[switch]$Force)
$ErrorActionPreference="Stop"
$root=Split-Path -Parent $MyInvocation.MyCommand.Path
foreach($kind in "skills","agents"){
  $srcDir=Join-Path $root "en\$kind"
  New-Item -ItemType Directory -Force -Path (Join-Path $Dest $kind) | Out-Null
  foreach($item in Get-ChildItem $srcDir){
    $target=Join-Path (Join-Path $Dest $kind) $item.Name
    if((Test-Path $target) -and -not $Force){Write-Host "Skipping $($item.Name) (exists). Use -Force to overwrite." -ForegroundColor Yellow;continue}
    if(Test-Path $target){Remove-Item -Recurse -Force $target}
    Copy-Item -Recurse $item.FullName $target
    Write-Host "Installed $kind/$($item.Name)"
  }
}
Write-Host "Done. Restart Claude Code, then ask for a learning artifact (see README)." -ForegroundColor Cyan
