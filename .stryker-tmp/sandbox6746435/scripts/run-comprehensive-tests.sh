#!/bin/bash

# Comprehensive Test Execution Script for Accounting SaaS
# Runs all test suites and generates comprehensive reports

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
BASE_URL=${BASE_URL:-"http://localhost:3000"}
API_KEY=${API_KEY:-"test-api-key"}
TEST_TIMEOUT=${TEST_TIMEOUT:-"30000"}
PARALLEL=${PARALLEL:-"true"}
COVERAGE=${COVERAGE:-"true"}
REPORT=${REPORT:-"true"}
PERFORMANCE=${PERFORMANCE:-"false"}
E2E=${E2E:-"false"}

# Test results
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0
SKIPPED_TESTS=0

# Logging functions
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_section() {
    echo -e "\n${BLUE}========================================${NC}"
    echo -e "${BLUE}  $1${NC}"
    echo -e "${BLUE}========================================${NC}\n"
}

# Test execution functions
run_unit_tests() {
    log_section "RUNNING UNIT TESTS"

    local start_time=$(date +%s)

    if npm run test:unit; then
        local end_time=$(date +%s)
        local duration=$((end_time - start_time))
        log_success "Unit tests completed in ${duration}s"
        return 0
    else
        log_error "Unit tests failed"
        return 1
    fi
}

run_integration_tests() {
    log_section "RUNNING INTEGRATION TESTS"

    local start_time=$(date +%s)

    if npm run test:integration; then
        local end_time=$(date +%s)
        local duration=$((end_time - start_time))
        log_success "Integration tests completed in ${duration}s"
        return 0
    else
        log_error "Integration tests failed"
        return 1
    fi
}

run_performance_tests() {
    if [ "$PERFORMANCE" != "true" ]; then
        log_warning "Performance tests skipped (set PERFORMANCE=true to enable)"
        return 0
    fi

    log_section "RUNNING PERFORMANCE TESTS"

    local start_time=$(date +%s)

    # Run load tests
    log "Running load tests..."
    if k6 run tests/performance/load-testing.js --env BASE_URL=$BASE_URL --env API_KEY=$API_KEY; then
        log_success "Load tests completed"
    else
        log_error "Load tests failed"
        return 1
    fi

    # Run stress tests
    log "Running stress tests..."
    if k6 run tests/performance/stress-testing.js --env BASE_URL=$BASE_URL --env API_KEY=$API_KEY; then
        log_success "Stress tests completed"
    else
        log_error "Stress tests failed"
        return 1
    fi

    # Run endurance tests
    log "Running endurance tests..."
    if k6 run tests/performance/endurance-testing.js --env BASE_URL=$BASE_URL --env API_KEY=$API_KEY; then
        log_success "Endurance tests completed"
    else
        log_error "Endurance tests failed"
        return 1
    fi

    local end_time=$(date +%s)
    local duration=$((end_time - start_time))
    log_success "Performance tests completed in ${duration}s"
    return 0
}

run_e2e_tests() {
    if [ "$E2E" != "true" ]; then
        log_warning "E2E tests skipped (set E2E=true to enable)"
        return 0
    fi

    log_section "RUNNING E2E TESTS"

    local start_time=$(date +%s)

    if npm run test:e2e; then
        local end_time=$(date +%s)
        local duration=$((end_time - start_time))
        log_success "E2E tests completed in ${duration}s"
        return 0
    else
        log_error "E2E tests failed"
        return 1
    fi
}

run_frontend_tests() {
    log_section "RUNNING FRONTEND TESTS"

    local start_time=$(date +%s)

    if npm run test:frontend; then
        local end_time=$(date +%s)
        local duration=$((end_time - start_time))
        log_success "Frontend tests completed in ${duration}s"
        return 0
    else
        log_error "Frontend tests failed"
        return 1
    fi
}

run_compliance_tests() {
    log_section "RUNNING COMPLIANCE TESTS"

    local start_time=$(date +%s)

    if npm run test:compliance; then
        local end_time=$(date +%s)
        local duration=$((end_time - start_time))
        log_success "Compliance tests completed in ${duration}s"
        return 0
    else
        log_error "Compliance tests failed"
        return 1
    fi
}

# Main execution
main() {
    log "Starting Comprehensive Test Suite for Accounting SaaS"
    log "Base URL: $BASE_URL"
    log "API Key: ${API_KEY:0:3}***"
    log "Parallel: $PARALLEL"
    log "Coverage: $COVERAGE"
    log "Report: $REPORT"
    log "Performance: $PERFORMANCE"
    log "E2E: $E2E"

    local overall_start_time=$(date +%s)
    local overall_success=true

    # Run all test suites
    if ! run_unit_tests; then
        overall_success=false
    fi

    if ! run_integration_tests; then
        overall_success=false
    fi

    if ! run_frontend_tests; then
        overall_success=false
    fi

    if ! run_compliance_tests; then
        overall_success=false
    fi

    if ! run_performance_tests; then
        overall_success=false
    fi

    if ! run_e2e_tests; then
        overall_success=false
    fi

    # Generate final report
    local overall_end_time=$(date +%s)
    local overall_duration=$((overall_end_time - overall_start_time))

    log_section "TEST EXECUTION SUMMARY"
    log "Total execution time: ${overall_duration}s"

    if [ "$overall_success" = true ]; then
        log_success "🎉 All tests passed!"
        exit 0
    else
        log_error "❌ Some tests failed!"
        exit 1
    fi
}

# Run if called directly
if [ "${BASH_SOURCE[0]}" = "${0}" ]; then
    main "$@"
fi
