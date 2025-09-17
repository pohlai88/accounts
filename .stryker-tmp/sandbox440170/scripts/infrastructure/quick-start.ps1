# PowerShell Quick Start Script for Supabase Setup
# Run this script to quickly set up your Supabase environment

Write-Host "🚀 Starting Supabase Quick Setup for AI-BOS Accounts..." -ForegroundColor Green

# Check if Supabase CLI is installed
try {
    $supabaseVersion = supabase --version
    Write-Host "✅ Supabase CLI found: $supabaseVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Supabase CLI not found. Please install it first:" -ForegroundColor Red
    Write-Host "   npm install -g supabase" -ForegroundColor Yellow
    exit 1
}

# Check if user is logged in
try {
    supabase projects list | Out-Null
    Write-Host "✅ Supabase CLI authenticated" -ForegroundColor Green
} catch {
    Write-Host "❌ Please login to Supabase first:" -ForegroundColor Red
    Write-Host "   supabase login" -ForegroundColor Yellow
    exit 1
}

# Link to existing project
Write-Host "🔗 Linking to existing Supabase project..." -ForegroundColor Blue
supabase link --project-ref dsjxvwhuvnefduvjbmgk

# Deploy database migrations
Write-Host "📊 Deploying database migrations..." -ForegroundColor Blue
supabase db push

# Deploy Edge Functions
Write-Host "⚡ Deploying Edge Functions..." -ForegroundColor Blue
supabase functions deploy auth-hook
supabase functions deploy tenant-management
supabase functions deploy file-upload

# Set up Auth Hook secrets
Write-Host "🔐 Setting up Auth Hook secrets..." -ForegroundColor Blue
$env:SUPABASE_URL = "https://dsjxvwhuvnefduvjbmgk.supabase.co"
$env:SUPABASE_SERVICE_ROLE_KEY = "your-service-role-key-here"

supabase functions secrets set --project-ref dsjxvwhuvnefduvjbmgk `
  SUPABASE_URL="$env:SUPABASE_URL" `
  SUPABASE_SERVICE_ROLE_KEY="$env:SUPABASE_SERVICE_ROLE_KEY"

Write-Host "✅ Supabase setup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Next steps:" -ForegroundColor Yellow
Write-Host "   1. Configure OAuth providers in Supabase dashboard" -ForegroundColor White
Write-Host "   2. Set up email templates for user invitations" -ForegroundColor White
Write-Host "   3. Configure SMS provider (optional)" -ForegroundColor White
Write-Host "   4. Test the multi-tenant functionality" -ForegroundColor White
Write-Host ""
Write-Host "🔗 Supabase Dashboard: https://supabase.com/dashboard/project/dsjxvwhuvnefduvjbmgk" -ForegroundColor Cyan
Write-Host ""
Write-Host "📚 For detailed setup instructions, see: SUPABASE_SETUP_GUIDE.md" -ForegroundColor Cyan
