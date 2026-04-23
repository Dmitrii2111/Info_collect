$ErrorActionPreference = "Stop"

$projectRoot = "C:\Users\localadmin\Documents\InfoCollect"
$templateRoot = Join-Path $projectRoot "vendor\react-admin-dashboard-template"
$nodeExe = "C:\Users\localadmin\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe"
$viteEntry = Join-Path $templateRoot "node_modules\vite\bin\vite.js"

if (-not (Test-Path $nodeExe)) {
    throw "Node runtime not found: $nodeExe"
}

if (-not (Test-Path $viteEntry)) {
    throw "Vite entry not found. Install template dependencies first in $templateRoot"
}

$existing = Get-NetTCPConnection -LocalPort 4174 -State Listen -ErrorAction SilentlyContinue
if ($existing) {
    Write-Output "Template preview is already running on port 4174."
    exit 0
}

Start-Process -FilePath $nodeExe `
    -ArgumentList "node_modules/vite/bin/vite.js", "--host", "127.0.0.1", "--port", "4174" `
    -WorkingDirectory $templateRoot `
    -WindowStyle Hidden

Start-Sleep -Seconds 6

$result = Invoke-WebRequest -Uri "http://127.0.0.1:4174" -UseBasicParsing
Write-Output "Template preview started. Status: $($result.StatusCode)"
