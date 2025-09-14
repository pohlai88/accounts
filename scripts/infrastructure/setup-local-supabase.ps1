# Setup Local Supabase for Testing
# Run this script to set up local Supabase environment

Write-Host "🚀 Setting up Local Supabase for AIBOS Accounts..." -ForegroundColor Green

# Check if Supabase CLI is installed
if (!(Get-Command "supabase" -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Supabase CLI not found. Installing..." -ForegroundColor Red
    Write-Host "Please install Supabase CLI first:" -ForegroundColor Yellow
    Write-Host "npm install -g supabase" -ForegroundColor Yellow
    Write-Host "Or visit: https://supabase.com/docs/guides/cli" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ Supabase CLI found" -ForegroundColor Green

# Check if Docker is running
try {
    docker ps | Out-Null
    Write-Host "✅ Docker is running" -ForegroundColor Green
}
catch {
    Write-Host "❌ Docker is not running. Please start Docker Desktop first." -ForegroundColor Red
    exit 1
}

# Initialize Supabase (if not already done)
if (!(Test-Path "supabase")) {
    Write-Host "📁 Initializing Supabase project..." -ForegroundColor Blue
    supabase init
}

# Start Supabase
Write-Host "🔄 Starting local Supabase..." -ForegroundColor Blue
supabase start

# Apply database schema
Write-Host "📊 Applying database schema..." -ForegroundColor Blue
supabase db reset --debug

Write-Host ""
Write-Host "🎉 Local Supabase is ready!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Connection Details:" -ForegroundColor Yellow
Write-Host "API URL: http://localhost:54321" -ForegroundColor White
Write-Host "Database URL: postgresql://postgres:postgres@localhost:54322/postgres" -ForegroundColor White
Write-Host "Studio URL: http://localhost:54323" -ForegroundColor White
Write-Host ""
Write-Host "🔑 Copy these keys to your .env.local file:" -ForegroundColor Yellow
supabase status

Write-Host ""
Write-Host "🧪 Now you can run tests with:" -ForegroundColor Green
Write-Host "pnpm test:unit" -ForegroundColor White
