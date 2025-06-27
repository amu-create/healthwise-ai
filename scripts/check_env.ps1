# HealthWise AI Environment Check
Write-Host "============================================" -ForegroundColor Yellow
Write-Host "   HealthWise AI Environment Check" -ForegroundColor Yellow
Write-Host "============================================" -ForegroundColor Yellow
Write-Host ""

$result = @()
$result += "HealthWise AI Environment Check - $(Get-Date)"
$result += "============================================"
$result += ""

# Python Check
Write-Host "[1/5] Checking Python..." -ForegroundColor Cyan
try {
    $pythonVersion = python --version 2>&1
    Write-Host "✓ Python: $pythonVersion" -ForegroundColor Green
    $result += "Python: $pythonVersion"
} catch {
    Write-Host "✗ Python not found" -ForegroundColor Red
    $result += "Python: NOT FOUND"
}
Start-Sleep -Seconds 1

# Node.js Check
Write-Host ""
Write-Host "[2/5] Checking Node.js..." -ForegroundColor Cyan
try {
    $nodeVersion = node --version 2>&1
    $npmVersion = npm --version 2>&1
    Write-Host "✓ Node.js: $nodeVersion" -ForegroundColor Green
    Write-Host "✓ NPM: $npmVersion" -ForegroundColor Green
    $result += "Node.js: $nodeVersion"
    $result += "NPM: $npmVersion"
} catch {
    Write-Host "✗ Node.js not found" -ForegroundColor Red
    $result += "Node.js: NOT FOUND"
}
Start-Sleep -Seconds 1

# Docker Check
Write-Host ""
Write-Host "[3/5] Checking Docker..." -ForegroundColor Cyan
try {
    $dockerVersion = docker --version 2>&1
    $composeVersion = docker-compose --version 2>&1
    Write-Host "✓ Docker: $dockerVersion" -ForegroundColor Green
    Write-Host "✓ Docker Compose: $composeVersion" -ForegroundColor Green
    $result += "Docker: $dockerVersion"
    $result += "Docker Compose: $composeVersion"
} catch {
    Write-Host "✗ Docker not found" -ForegroundColor Red
    $result += "Docker: NOT FOUND"
}
Start-Sleep -Seconds 1

# Git Check
Write-Host ""
Write-Host "[4/5] Checking Git..." -ForegroundColor Cyan
try {
    $gitVersion = git --version 2>&1
    Write-Host "✓ Git: $gitVersion" -ForegroundColor Green
    $result += "Git: $gitVersion"
} catch {
    Write-Host "✗ Git not found" -ForegroundColor Red
    $result += "Git: NOT FOUND"
}
Start-Sleep -Seconds 1

# Port Check
Write-Host ""
Write-Host "[5/5] Checking Ports..." -ForegroundColor Cyan
$result += ""
$result += "Port Status:"

$port3000 = Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue
if ($port3000) {
    Write-Host "✗ Port 3000: IN USE" -ForegroundColor Red
    $result += "Port 3000: IN USE"
} else {
    Write-Host "✓ Port 3000: FREE" -ForegroundColor Green
    $result += "Port 3000: FREE"
}

$port8000 = Get-NetTCPConnection -LocalPort 8000 -ErrorAction SilentlyContinue
if ($port8000) {
    Write-Host "✗ Port 8000: IN USE" -ForegroundColor Red
    $result += "Port 8000: IN USE"
} else {
    Write-Host "✓ Port 8000: FREE" -ForegroundColor Green
    $result += "Port 8000: FREE"
}

$port5432 = Get-NetTCPConnection -LocalPort 5432 -ErrorAction SilentlyContinue
if ($port5432) {
    Write-Host "✗ Port 5432: IN USE" -ForegroundColor Red
    $result += "Port 5432: IN USE"
} else {
    Write-Host "✓ Port 5432: FREE" -ForegroundColor Green
    $result += "Port 5432: FREE"
}

# Save results
$resultFile = "check_result_$(Get-Date -Format 'yyyyMMdd_HHmmss').txt"
$result | Out-File -FilePath $resultFile -Encoding UTF8

Write-Host ""
Write-Host "============================================" -ForegroundColor Yellow
Write-Host "CHECK COMPLETE!" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Yellow
Write-Host ""
Write-Host "Results saved to: $resultFile" -ForegroundColor Cyan
Write-Host ""
Write-Host "Opening result file..."
Start-Sleep -Seconds 2
notepad $resultFile

Write-Host ""
Write-Host "Press any key to exit..." -ForegroundColor Yellow
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")