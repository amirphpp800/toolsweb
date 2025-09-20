# Automated Deployment Script for GlassBlack Project
# This script automates the setup and deployment process

Write-Host "🚀 Starting automated deployment for GlassBlack project..." -ForegroundColor Green

# Check if wrangler is installed
try {
    $wranglerVersion = wrangler --version
    Write-Host "✅ Wrangler found: $wranglerVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Wrangler not found. Installing..." -ForegroundColor Red
    npm install -g wrangler
}

# Check if user is logged in to Cloudflare
Write-Host "🔐 Checking Cloudflare authentication..." -ForegroundColor Yellow
try {
    wrangler whoami
    Write-Host "✅ Already authenticated with Cloudflare" -ForegroundColor Green
} catch {
    Write-Host "🔑 Please login to Cloudflare..." -ForegroundColor Yellow
    wrangler login
}

# Generate JWT secret if not exists
$jwtSecret = [System.Web.Security.Membership]::GeneratePassword(32, 8)
Write-Host "🔑 Generated JWT Secret: $jwtSecret" -ForegroundColor Cyan

# Set secrets in Cloudflare Pages (these should match your environment variables)
Write-Host "🔧 Setting up secrets..." -ForegroundColor Yellow

# Note: For Pages, secrets are set via dashboard, but we can prepare the commands
Write-Host "📝 Please set these secrets in your Cloudflare Pages dashboard:" -ForegroundColor Cyan
Write-Host "   JWT_SECRET: $jwtSecret" -ForegroundColor White
Write-Host "   ADMIN_USERNAME: amir0012A_amir0012A#" -ForegroundColor White
Write-Host "   ADMIN_PASSWORD: amir0012A_amir0012A#" -ForegroundColor White

# Deploy to Pages
Write-Host "🚀 Deploying to Cloudflare Pages..." -ForegroundColor Green
try {
    wrangler pages deploy . --project-name tools
    Write-Host "✅ Deployment successful!" -ForegroundColor Green
} catch {
    Write-Host "❌ Deployment failed. Please check your configuration." -ForegroundColor Red
    Write-Host "Make sure you have:" -ForegroundColor Yellow
    Write-Host "1. Created a Pages project named 'tools'" -ForegroundColor White
    Write-Host "2. Set up the KV namespace binding 'USERS_KV'" -ForegroundColor White
    Write-Host "3. Configured environment variables in Pages dashboard" -ForegroundColor White
}

Write-Host "🎉 Setup complete! Your application should be available at your Pages URL." -ForegroundColor Green
Write-Host "📋 Next steps:" -ForegroundColor Cyan
Write-Host "1. Visit your Cloudflare Pages dashboard" -ForegroundColor White
Write-Host "2. Verify KV namespace binding is set to 'USERS_KV' -> 'main'" -ForegroundColor White
Write-Host "3. Confirm environment variables are properly set" -ForegroundColor White
Write-Host "4. Test the authentication flow" -ForegroundColor White
