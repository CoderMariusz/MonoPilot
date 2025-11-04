# Kill process on port 5000
Write-Host "Checking for processes on port 5000..." -ForegroundColor Yellow

$processes = Get-NetTCPConnection -LocalPort 5000 -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique

if ($processes) {
    foreach ($pid in $processes) {
        Write-Host "Killing process $pid on port 5000" -ForegroundColor Red
        Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue
    }
    Write-Host "Port 5000 freed successfully!" -ForegroundColor Green
} else {
    Write-Host "No process found on port 5000" -ForegroundColor Green
}

