$ErrorActionPreference = 'Stop'

Write-Host "=== CKS Refactor Restructure ===" -ForegroundColor Cyan

function Ensure-Dir($p) {
  if ([string]::IsNullOrWhiteSpace($p)) { return }
  if (!(Test-Path -LiteralPath $p)) { New-Item -ItemType Directory -Path $p | Out-Null }
}

function Move-Safe($src,$dst) {
  if (Test-Path -LiteralPath $src) {
    $parent = Split-Path -Parent $dst
    Ensure-Dir $parent
    if (Test-Path -LiteralPath $dst) {
      Write-Host "Destination exists, skipping: $dst" -ForegroundColor Yellow
    } else {
      Write-Host "Move $src -> $dst"
      Move-Item -LiteralPath $src -Destination $dst -Force
    }
  } else {
    Write-Host "Skip (missing): $src" -ForegroundColor DarkGray
  }
}

$stamp = Get-Date -Format 'yyyyMMdd-HHmmss'
Ensure-Dir 'legacy-codebase'

# Move OG into legacy with timestamp
Move-Safe 'backend'   ("legacy-codebase/backend-og-" + $stamp)
Move-Safe 'frontend'  ("legacy-codebase/frontend-og-" + $stamp)
Move-Safe 'Database'  ("legacy-codebase/Database-og-" + $stamp)
Move-Safe 'Auth'      ("legacy-codebase/Auth-og-" + $stamp)

# Promote refactor into canonical paths
Move-Safe 'REFACTOR/Backend'  'Backend'
Move-Safe 'REFACTOR/Frontend' 'Frontend'
Move-Safe 'REFACTOR/Database' 'Database'

Write-Host "Done. Review results and run npm install in backend/ and frontend/." -ForegroundColor Green





