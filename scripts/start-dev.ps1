# Stop any existing processes on port 5000 and start the application
Write-Host "Stopping any existing processes on port 5000..." -ForegroundColor Yellow
& "$PSScriptRoot\kill-port-5000.ps1"

Write-Host "`nStarting application on port 5000..." -ForegroundColor Green
Set-Location apps\frontend
pnpm dev

