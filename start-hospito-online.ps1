param(
    [int]$FrontendPort = 5173,
    [int]$BackendPort = 8080,
    [switch]$NoBrowser
)

$ErrorActionPreference = 'Stop'

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$backendDir = Join-Path $root 'backend'
$frontendDir = Join-Path $root 'frontend'

function Ensure-Command([string]$name) {
    if (-not (Get-Command $name -ErrorAction SilentlyContinue)) {
        throw "Required command '$name' not found in PATH."
    }
}

function Load-EnvFile([string]$path) {
    if (-not (Test-Path $path)) { return }
    Get-Content $path | ForEach-Object {
        $line = $_.Trim()
        if ([string]::IsNullOrWhiteSpace($line)) { return }
        if ($line.StartsWith('#')) { return }
        $idx = $line.IndexOf('=')
        if ($idx -lt 1) { return }

        $key = $line.Substring(0, $idx).Trim()
        $value = $line.Substring($idx + 1)

        [Environment]::SetEnvironmentVariable($key, $value, 'Process')
    }
}

Ensure-Command java
Ensure-Command mvn
Ensure-Command npm

Load-EnvFile (Join-Path $backendDir '.env.local')

if (-not $env:DB_URL) { $env:DB_URL = 'jdbc:postgresql://localhost:5432/hospito' }
if (-not $env:DB_USER) { $env:DB_USER = 'postgres' }
if (-not $env:DB_PASSWORD) { $env:DB_PASSWORD = 'postgres' }
if (-not $env:DDL_AUTO) { $env:DDL_AUTO = 'update' }
if (-not $env:JWT_SECRET) { $env:JWT_SECRET = 'replace-this-with-real-jwt-secret' }
if (-not $env:FIREBASE_SERVICE_ACCOUNT) {
    $defaultFirebasePath = Join-Path $backendDir 'secrets\firebase-service-account.json'
    if (Test-Path $defaultFirebasePath) {
        $env:FIREBASE_SERVICE_ACCOUNT = $defaultFirebasePath
    }
}

$ltPackagePath = Join-Path $frontendDir 'node_modules\localtunnel'
if (-not (Test-Path $ltPackagePath)) {
    Write-Host 'Installing localtunnel dependency...'
    Push-Location $frontendDir
    npm.cmd install -D localtunnel | Out-Host
    Pop-Location
}

Write-Host 'Starting HOSPITO backend...'
$backendCmd = "cd /d `"$backendDir`"; mvn spring-boot:run"
Start-Process powershell -ArgumentList '-NoExit', '-Command', $backendCmd | Out-Null

Write-Host 'Starting HOSPITO frontend...'
$frontendCmd = "cd /d `"$frontendDir`"; npm run dev"
Start-Process powershell -ArgumentList '-NoExit', '-Command', $frontendCmd | Out-Null

Write-Host 'Waiting for frontend startup...'
Start-Sleep -Seconds 12

Write-Host 'Starting public tunnel terminal...'
$tunnelShellCmd = "cd /d `"$frontendDir`"; npx --yes localtunnel --port $FrontendPort"
Start-Process powershell -ArgumentList '-NoExit', '-Command', $tunnelShellCmd | Out-Null

if (-not $NoBrowser) {
    Start-Process "http://localhost:$FrontendPort" | Out-Null
}

Write-Host ''
Write-Host '=========================================' -ForegroundColor Cyan
Write-Host 'HOSPITO Online Demo Started' -ForegroundColor Cyan
Write-Host '=========================================' -ForegroundColor Cyan
Write-Host "Backend Local:  http://localhost:$BackendPort"
Write-Host "Frontend Local: http://localhost:$FrontendPort"
Write-Host ''
Write-Host 'In the tunnel terminal, copy the line:' -ForegroundColor Yellow
Write-Host '  your url is: https://....loca.lt' -ForegroundColor Yellow
Write-Host ''
Write-Host 'Use that URL to access HOSPITO from the internet.' -ForegroundColor Green
Write-Host 'Keep all three terminals running.'

