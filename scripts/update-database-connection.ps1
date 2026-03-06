# PowerShell Script to Update Database Connection
# This script helps update your DATABASE_URL with new connection details

param(
    [string]$Host = "",
    [string]$Port = "",
    [string]$Username = "",
    [string]$Password = "",
    [string]$Database = "defaultdb",
    [string]$GeneratePassword = $false
)

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Database Connection Updater" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Generate secure password if requested
if ($GeneratePassword -or $Password -eq "") {
    Write-Host "Generating secure password..." -ForegroundColor Yellow
    $Password = -join ((65..90) + (97..122) + (48..57) | Get-Random -Count 32 | ForEach-Object {[char]$_})
    Write-Host "Generated password: $Password" -ForegroundColor Green
    Write-Host ""
}

# Prompt for missing values
if ($Host -eq "") {
    $Host = Read-Host "Enter database host"
}

if ($Port -eq "") {
    $Port = Read-Host "Enter database port"
}

if ($Username -eq "") {
    $Username = Read-Host "Enter database username"
}

if ($Password -eq "") {
    $Password = Read-Host "Enter database password" -AsSecureString
    $Password = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($Password))
}

if ($Database -eq "") {
    $Database = Read-Host "Enter database name (default: defaultdb)"
    if ($Database -eq "") { $Database = "defaultdb" }
}

# Build connection string
$DatabaseUrl = "mysql://${Username}:${Password}@${Host}:${Port}/${Database}?sslaccept=strict"

Write-Host ""
Write-Host "New DATABASE_URL:" -ForegroundColor Cyan
Write-Host $DatabaseUrl -ForegroundColor White
Write-Host ""

# Update .env file
$envFile = ".env"
if (Test-Path $envFile) {
    $content = Get-Content $envFile -Raw
    $content = $content -replace 'DATABASE_URL=.*', "DATABASE_URL=$DatabaseUrl"
    $content | Set-Content $envFile -NoNewline
    Write-Host "✓ Updated .env file" -ForegroundColor Green
} else {
    Write-Host "✗ .env file not found" -ForegroundColor Red
    Write-Host "Creating new .env file..." -ForegroundColor Yellow
    "DATABASE_URL=$DatabaseUrl" | Out-File -FilePath $envFile -Encoding UTF8
    Write-Host "✓ Created .env file" -ForegroundColor Green
}

Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Verify the connection works" -ForegroundColor White
Write-Host "2. Restart your development server" -ForegroundColor White
Write-Host "3. Run: npm run db:push (if needed)" -ForegroundColor White
Write-Host ""





