# deploy.ps1
Write-Output "Deploying local server..."

# Look for any node processes running server.js and stop them.
$existing = Get-CimInstance Win32_Process -Filter "Name = 'node.exe'" | Where-Object { $_.CommandLine -match "server\.js" }

if ($existing) {
    Write-Output "Found running server process(es). Stopping them..."
    $existing | ForEach-Object { Stop-Process -Id $_.ProcessId -Force }
} else {
    Write-Output "No existing server process found."
}

# Start the new server in a new process.
Write-Output "Starting the server..."
Start-Process "node" "server.js" -WorkingDirectory (Get-Location)

Write-Output "Local deployment complete."