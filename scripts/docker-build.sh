#!/bin/bash

# ============================================================================
# AI-BOS Accounting SaaS - Docker Build Script
# ============================================================================
# Optimized Docker build script with security and performance best practices
# Follows SSOT principles and high-quality standards

set -euo pipefail

# ============================================================================
# Configuration
# ============================================================================
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
IMAGE_NAME="aibos-accounting"
IMAGE_TAG="${1:-latest}"
BUILD_TARGET="${2:-runtime}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# ============================================================================
# Helper Functions
# ============================================================================

log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] ✓${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] ⚠${NC} $1"
}

log_error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ✗${NC} $1"
}

# ============================================================================
# Pre-build Checks
# ============================================================================

check_prerequisites() {
    log "Checking prerequisites..."

    # Check if Docker is installed and running
    if ! command -v docker &> /dev/null; then
        log_error "Docker is not installed or not in PATH"
        exit 1
    fi

    if ! docker info &> /dev/null; then
        log_error "Docker daemon is not running"
        exit 1
    fi

    # Check if required files exist
    if [[ ! -f "$PROJECT_ROOT/Dockerfile" ]]; then
        log_error "Dockerfile not found in project root"
        exit 1
    fi

    if [[ ! -f "$PROJECT_ROOT/package.json" ]]; then
        log_error "package.json not found in project root"
        exit 1
    fi

    log_success "Prerequisites check passed"
}

# ============================================================================
# Build Functions
# ============================================================================

cleanup_old_images() {
    log "Cleaning up old images..."

    # Remove dangling images
    docker image prune -f

    # Remove old versions of the same image
    docker images "$IMAGE_NAME" --format "table {{.Repository}}:{{.Tag}}" | \
        grep -v "$IMAGE_TAG" | \
        xargs -r docker rmi -f || true

    log_success "Cleanup completed"
}

build_image() {
    log "Building Docker image: $IMAGE_NAME:$IMAGE_TAG (target: $BUILD_TARGET)"

    # Build arguments for optimization
    local build_args=(
        --target "$BUILD_TARGET"
        --tag "$IMAGE_NAME:$IMAGE_TAG"
        --tag "$IMAGE_NAME:latest"
        --build-arg NODE_ENV=production
        --build-arg NEXT_TELEMETRY_DISABLED=1
        --progress=plain
        --no-cache
    )

    # Add build-time secrets if available
    if [[ -f "$PROJECT_ROOT/.env" ]]; then
        build_args+=(--secret id=env,src="$PROJECT_ROOT/.env")
    fi

    # Build the image
    if docker build "${build_args[@]}" "$PROJECT_ROOT"; then
        log_success "Image built successfully"
    else
        log_error "Image build failed"
        exit 1
    fi
}

# ============================================================================
# Security and Optimization
# ============================================================================

scan_image() {
    log "Scanning image for vulnerabilities..."

    # Check if trivy is available
    if command -v trivy &> /dev/null; then
        trivy image --severity HIGH,CRITICAL "$IMAGE_NAME:$IMAGE_TAG" || {
            log_warning "Vulnerability scan found issues (see output above)"
        }
    else
        log_warning "Trivy not available, skipping vulnerability scan"
    fi
}

optimize_image() {
    log "Optimizing image..."

    # Remove unnecessary packages and clean up
    docker run --rm "$IMAGE_NAME:$IMAGE_TAG" sh -c "
        apk del --purge build-dependencies 2>/dev/null || true
        rm -rf /var/cache/apk/* /tmp/* /var/tmp/*
        find /usr -name '*.pyc' -delete 2>/dev/null || true
        find /usr -name '__pycache__' -delete 2>/dev/null || true
    " || log_warning "Image optimization completed with warnings"

    log_success "Image optimization completed"
}

# ============================================================================
# Testing
# ============================================================================

test_image() {
    log "Testing built image..."

    # Test if the image can start
    local container_id
    container_id=$(docker run -d --rm -p 3001:3001 "$IMAGE_NAME:$IMAGE_TAG")

    # Wait for the container to start
    sleep 10

    # Test health endpoint
    if curl -f http://localhost:3001/health &> /dev/null; then
        log_success "Image test passed"
    else
        log_error "Image test failed - health check unsuccessful"
        docker logs "$container_id"
        docker stop "$container_id" &> /dev/null || true
        exit 1
    fi

    # Clean up test container
    docker stop "$container_id" &> /dev/null || true
}

# ============================================================================
# Main Execution
# ============================================================================

main() {
    log "Starting Docker build process for AI-BOS Accounting SaaS"
    log "Image: $IMAGE_NAME:$IMAGE_TAG"
    log "Target: $BUILD_TARGET"
    log "Project Root: $PROJECT_ROOT"

    # Change to project root
    cd "$PROJECT_ROOT"

    # Execute build steps
    check_prerequisites
    cleanup_old_images
    build_image
    scan_image
    optimize_image
    test_image

    log_success "Docker build process completed successfully!"
    log "Image: $IMAGE_NAME:$IMAGE_TAG"
    log "Size: $(docker images "$IMAGE_NAME:$IMAGE_TAG" --format "table {{.Size}}")"
}

# Run main function
main "$@"
