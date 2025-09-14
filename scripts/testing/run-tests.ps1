# PowerShell Test Runner Script for Supabase Multi-Tenant System
# This script runs all tests to verify the system is functioning properly

Write-Host "🧪 Starting Comprehensive Test Suite for AI-BOS Accounts..." -ForegroundColor Green

# Check if environment variables are set
if (-not $env:NEXT_PUBLIC_SUPABASE_URL) {
    Write-Host "❌ NEXT_PUBLIC_SUPABASE_URL not set" -ForegroundColor Red
    exit 1
}

if (-not $env:SUPABASE_SERVICE_ROLE_KEY) {
    Write-Host "❌ SUPABASE_SERVICE_ROLE_KEY not set" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Environment variables loaded" -ForegroundColor Green

# Run database connection tests
Write-Host "`n📊 Running Database Connection Tests..." -ForegroundColor Blue
npx vitest run tests/setup/database-connection.test.ts --config tests/setup/vitest.config.ts

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Database connection tests failed" -ForegroundColor Red
    exit 1
}

# Run authentication flow tests
Write-Host "`n🔐 Running Authentication Flow Tests..." -ForegroundColor Blue
npx vitest run tests/setup/auth-flow.test.ts --config tests/setup/vitest.config.ts

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Authentication flow tests failed" -ForegroundColor Red
    exit 1
}

# Run API endpoints tests
Write-Host "`n🔌 Running API Endpoints Tests..." -ForegroundColor Blue
npx vitest run tests/setup/api-endpoints.test.ts --config tests/setup/vitest.config.ts

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ API endpoints tests failed" -ForegroundColor Red
    exit 1
}

# Run storage functionality tests
Write-Host "`n📁 Running Storage Functionality Tests..." -ForegroundColor Blue
npx vitest run tests/setup/storage.test.ts --config tests/setup/vitest.config.ts

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Storage functionality tests failed" -ForegroundColor Red
    exit 1
}

# Run realtime tests
Write-Host "`n🔄 Running Realtime Tests..." -ForegroundColor Blue
npx vitest run tests/setup/realtime.test.ts --config tests/setup/vitest.config.ts

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Realtime tests failed" -ForegroundColor Red
    exit 1
}

# Run integration tests
Write-Host "`n🔗 Running Integration Tests..." -ForegroundColor Blue
npx vitest run tests/setup/integration.test.ts --config tests/setup/vitest.config.ts

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Integration tests failed" -ForegroundColor Red
    exit 1
}

# Run all tests together
Write-Host "`n🚀 Running Complete Test Suite..." -ForegroundColor Blue
npx vitest run tests/setup/ --config tests/setup/vitest.config.ts

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n🎉 All tests passed! Your Supabase multi-tenant system is fully functional!" -ForegroundColor Green
    Write-Host "`n📋 Test Summary:" -ForegroundColor Yellow
    Write-Host "  ✅ Database connectivity" -ForegroundColor Green
    Write-Host "  ✅ Authentication flow" -ForegroundColor Green
    Write-Host "  ✅ API endpoints" -ForegroundColor Green
    Write-Host "  ✅ Storage functionality" -ForegroundColor Green
    Write-Host "  ✅ Realtime updates" -ForegroundColor Green
    Write-Host "  ✅ Integration workflows" -ForegroundColor Green
    Write-Host "`n🚀 Your system is ready for production!" -ForegroundColor Cyan
}
else {
    Write-Host "`n❌ Some tests failed. Please check the output above for details." -ForegroundColor Red
    exit 1
}
