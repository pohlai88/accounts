# Attachment Service Test Runner
# V1 compliance: Comprehensive test execution with coverage reporting

param(
    [string]$TestType = "all",
    [switch]$Coverage = $true,
    [switch]$Verbose = $false,
    [switch]$Watch = $false,
    [int]$Timeout = 30000
)

Write-Host "🧪 Running Attachment Service Tests" -ForegroundColor Cyan
Write-Host "=================================" -ForegroundColor Cyan

# Set environment variables
$env:NODE_ENV = "test"
$env:VITEST_TIMEOUT = $Timeout.ToString()

# Change to packages/utils directory
Push-Location "packages/utils"

try {
    # Run different test types
    switch ($TestType.ToLower()) {
        "unit" {
            Write-Host "📋 Running Unit Tests..." -ForegroundColor Yellow
            $testCommand = "npx vitest run test/attachment-service-comprehensive.test.ts --config vitest.config.attachments.ts"
        }
        "schema" {
            Write-Host "📋 Running Schema Tests..." -ForegroundColor Yellow
            $testCommand = "npx vitest run test/attachment-schema.test.ts --config vitest.config.attachments.ts"
        }
        "api" {
            Write-Host "📋 Running API Tests..." -ForegroundColor Yellow
            $testCommand = "npx vitest run test/attachment-api.test.ts --config vitest.config.attachments.ts"
        }
        "all" {
            Write-Host "📋 Running All Attachment Tests..." -ForegroundColor Yellow
            $testCommand = "npx vitest run test/attachment-*.test.ts --config vitest.config.attachments.ts"
        }
        default {
            Write-Host "❌ Invalid test type: $TestType" -ForegroundColor Red
            Write-Host "Valid options: unit, schema, api, all" -ForegroundColor Yellow
            exit 1
        }
    }

    # Add coverage flag if requested
    if ($Coverage) {
        $testCommand += " --coverage"
    }

    # Add verbose flag if requested
    if ($Verbose) {
        $testCommand += " --reporter=verbose"
    }

    # Add watch flag if requested
    if ($Watch) {
        $testCommand = $testCommand -replace " run ", " "
        $testCommand += " --watch"
    }

    Write-Host "🚀 Executing: $testCommand" -ForegroundColor Green
    Write-Host ""

    # Execute the test command
    Invoke-Expression $testCommand

    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "✅ All tests passed successfully!" -ForegroundColor Green
        
        if ($Coverage) {
            Write-Host ""
            Write-Host "📊 Coverage report generated in test-results/coverage/" -ForegroundColor Cyan
            Write-Host "📊 HTML report available at test-results/attachment-service-report.html" -ForegroundColor Cyan
        }
    }
    else {
        Write-Host ""
        Write-Host "❌ Some tests failed!" -ForegroundColor Red
        exit $LASTEXITCODE
    }

}
catch {
    Write-Host ""
    Write-Host "❌ Test execution failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}
finally {
    Pop-Location
}

Write-Host ""
Write-Host "🎉 Test execution completed!" -ForegroundColor Green
