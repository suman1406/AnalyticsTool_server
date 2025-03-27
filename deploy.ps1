Write-Host "Deploying local server..."
$process = Get-Process node -ErrorAction SilentlyContinue | Where-Object { $_.Path -like "*server.js" }
if ($process) {
    Write-Host "Stopping existing server process..."
    Stop-Process -Id $process.Id -Force
    Start-Sleep -Seconds 2
} else {
    Write-Host "No existing server process found."
}
Write-Host "Starting the server..."
Start-Process -FilePath "node" -ArgumentList "server.js" -NoNewWindow -RedirectStandardOutput "server.log"
Start-Sleep -Seconds 2
Write-Host "Local deployment complete."