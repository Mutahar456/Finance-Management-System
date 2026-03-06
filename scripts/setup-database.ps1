# PowerShell Script for Database Setup
# Run this script to help set up your database connection

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Infinity Wave - Database Setup Helper" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if .env exists
if (Test-Path ".env") {
    Write-Host "✓ .env file exists" -ForegroundColor Green
} else {
    Write-Host "✗ .env file NOT found" -ForegroundColor Red
    Write-Host "Creating .env template..." -ForegroundColor Yellow
    
    $envContent = @"
# Database Connection
DATABASE_URL="mysql://root:YOUR_PASSWORD@localhost:3306/infinity_wave_db"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="$(New-Guid).ToString()"

# Cloudinary (Optional)
CLOUDINARY_CLOUD_NAME=""
CLOUDINARY_API_KEY=""
CLOUDINARY_API_SECRET=""
"@
    
    $envContent | Out-File -FilePath ".env" -Encoding UTF8
    Write-Host "✓ Created .env file template" -ForegroundColor Green
    Write-Host "⚠ Please edit .env and add your MySQL credentials!" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Cyan
Write-Host "1. Edit .env file with your MySQL connection details" -ForegroundColor White
Write-Host "2. Make sure MySQL is running" -ForegroundColor White
Write-Host "3. Create database: infinity_wave_db" -ForegroundColor White
Write-Host "4. Run: npm install" -ForegroundColor White
Write-Host "5. Run: npm run db:generate" -ForegroundColor White
Write-Host "6. Run: npm run db:push" -ForegroundColor White
Write-Host ""
Write-Host "For detailed instructions, see: DATABASE_SETUP.md" -ForegroundColor Gray

