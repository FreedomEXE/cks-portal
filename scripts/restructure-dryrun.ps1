$ErrorActionPreference = 'Stop'

Write-Host "=== CKS Refactor Restructure Dry Run ==="

function Test-Dir($p) { if (Test-Path -LiteralPath $p) { "EXISTS" } else { "MISSING" } }

$state = [ordered]@{
  "root/backend" = Test-Dir "backend"
  "root/frontend" = Test-Dir "frontend"
  "root/Database" = Test-Dir "Database"
  "root/Auth" = Test-Dir "Auth"
  "root/REFACTOR/Backend" = Test-Dir "REFACTOR/Backend"
  "root/REFACTOR/Frontend" = Test-Dir "REFACTOR/Frontend"
  "root/REFACTOR/Database" = Test-Dir "REFACTOR/Database"
  "root/Database" = Test-Dir "db"
  "root/legacy-codebase" = Test-Dir "legacy-codebase"
}

$state.GetEnumerator() | ForEach-Object { "{0,-28} : {1}" -f $_.Key, $_.Value } | Write-Host

Write-Host "`nPlanned actions:" -ForegroundColor Cyan
Write-Host "- Move ./backend         -> ./legacy-codebase/backend-og-<timestamp> (if exists)"
Write-Host "- Move ./frontend        -> ./legacy-codebase/frontend-og-<timestamp> (if exists)"
Write-Host "- Move ./Database        -> ./legacy-codebase/Database-og-<timestamp> (if exists)"
Write-Host "- Move ./Auth            -> ./legacy-codebase/Auth-og-<timestamp> (if exists)"
Write-Host "- Move ./REFACTOR/Backend  -> ./Backend"
Write-Host "- Move ./REFACTOR/Frontend -> ./Frontend"
Write-Host "- Move ./REFACTOR/Database -> ./Database"
Write-Host "`nNo changes were made (dry run)."


