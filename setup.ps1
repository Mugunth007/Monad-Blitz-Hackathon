# VoteRush Setup Script
# Run this after installing Foundry and Node.js

Write-Host " VoteRush Project Setup" -ForegroundColor Cyan
Write-Host "=========================" -ForegroundColor Cyan

# Check installations
Write-Host "Checking installations..." -ForegroundColor Yellow
try {
    $nodeVersion = node --version
    Write-Host " Node.js: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host " Node.js not found" -ForegroundColor Red
    exit 1
}

try {
    $forgeVersion = forge --version
    Write-Host " Foundry: $forgeVersion" -ForegroundColor Green
} catch {
    Write-Host " Foundry not found" -ForegroundColor Red
    exit 1
}

# Install npm packages
Write-Host "Installing npm packages..." -ForegroundColor Yellow
npm install

# Initialize Foundry
Write-Host "Setting up Foundry..." -ForegroundColor Yellow
if (!(Test-Path "lib")) {
    forge install foundry-rs/forge-std --no-commit
}

# Compile contracts
Write-Host "Compiling contracts..." -ForegroundColor Yellow
forge build

# Run tests
Write-Host "Running tests..." -ForegroundColor Yellow
forge test -vvv

Write-Host " Setup complete! Ready to deploy VoteRush!" -ForegroundColor Green
