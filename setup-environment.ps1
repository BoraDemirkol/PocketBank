# PocketBank Environment Setup Script
# This script helps set up environment variables for development

Write-Host "PocketBank Environment Setup" -ForegroundColor Green
Write-Host "=================================" -ForegroundColor Green

# Check if running as administrator
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")

if (-not $isAdmin) {
    Write-Host "Warning: Not running as administrator. Some environment variables may not persist." -ForegroundColor Yellow
}

# Database Configuration
Write-Host "`nDatabase Configuration:" -ForegroundColor Cyan
$dbPassword = Read-Host "Enter your database password" -AsSecureString
$dbPasswordPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($dbPassword))

# JWT Configuration (for Module3)
Write-Host "`nJWT Configuration:" -ForegroundColor Cyan
$jwtSecret = Read-Host "Enter your JWT secret (or press Enter to generate)" -AsSecureString
if ($jwtSecret.Length -eq 0) {
    $jwtSecret = -join ((33..126) | Get-Random -Count 64 | ForEach-Object {[char]$_})
    Write-Host "Generated JWT secret: $jwtSecret" -ForegroundColor Green
} else {
    $jwtSecret = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($jwtSecret))
}

$supabaseKey = Read-Host "Enter your Supabase service key (or press Enter to skip)"

# Set Environment Variables
Write-Host "`nSetting environment variables..." -ForegroundColor Yellow

# System-wide environment variables (requires admin)
if ($isAdmin) {
    [Environment]::SetEnvironmentVariable("DB_PASSWORD", $dbPasswordPlain, "Machine")
    [Environment]::SetEnvironmentVariable("JWT_SECRET", $jwtSecret, "Machine")
    if ($supabaseKey) {
        [Environment]::SetEnvironmentVariable("SUPABASE_KEY", $supabaseKey, "Machine")
    }
    Write-Host "System environment variables set (requires restart to take effect)" -ForegroundColor Green
}

# User environment variables
[Environment]::SetEnvironmentVariable("DB_PASSWORD", $dbPasswordPlain, "User")
[Environment]::SetEnvironmentVariable("JWT_SECRET", $jwtSecret, "User")
if ($supabaseKey) {
    [Environment]::SetEnvironmentVariable("SUPABASE_KEY", $supabaseKey, "User")
}

# Current session environment variables
$env:DB_PASSWORD = $dbPasswordPlain
$env:JWT_SECRET = $jwtSecret
if ($supabaseKey) {
    $env:SUPABASE_KEY = $supabaseKey
}

Write-Host "User environment variables set" -ForegroundColor Green
Write-Host "Current session environment variables set" -ForegroundColor Green

# Create .env file for frontend
Write-Host "`nFrontend Configuration:" -ForegroundColor Cyan
$frontendEnvPath = "module1/frontend/.env"
$frontendEnvContent = @"
VITE_SUPABASE_URL=https://xfrgkzlugacowzcfthwk.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here
VITE_API_BASE_URL=http://localhost:5271/api
"@

Set-Content -Path $frontendEnvPath -Value $frontendEnvContent -Force
Write-Host "Frontend .env file created at: $frontendEnvPath" -ForegroundColor Green

# Verification
Write-Host "`nVerification:" -ForegroundColor Cyan
Write-Host "DB_PASSWORD: $($env:DB_PASSWORD.Substring(0, [Math]::Min(8, $env:DB_PASSWORD.Length)))..." -ForegroundColor Gray
Write-Host "JWT_SECRET: $($env:JWT_SECRET.Substring(0, [Math]::Min(8, $env:JWT_SECRET.Length)))..." -ForegroundColor Gray
if ($supabaseKey) {
    Write-Host "SUPABASE_KEY: $($supabaseKey.Substring(0, [Math]::Min(8, $supabaseKey.Length)))..." -ForegroundColor Gray
}

Write-Host "`nEnvironment setup complete!" -ForegroundColor Green
Write-Host "`nNext steps:" -ForegroundColor Yellow
Write-Host "1. Restart your terminal/IDE to load new environment variables" -ForegroundColor White
Write-Host "2. Update the frontend .env file with your actual Supabase anon key" -ForegroundColor White
Write-Host "3. Test the application to ensure everything works" -ForegroundColor White
Write-Host "4. Consider restarting your computer for system-wide variables" -ForegroundColor White

Write-Host "`nIMPORTANT: Keep your credentials secure and never commit them to source control!" -ForegroundColor Red
