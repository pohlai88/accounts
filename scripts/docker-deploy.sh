#!/bin/bash

# ============================================================================
# AI-BOS Accounting SaaS - Docker Deployment Script
# ============================================================================
# Production deployment script with zero-downtime deployment
# Follows SSOT principles and high-quality standards

set -euo pipefail

# ============================================================================
# Configuration
# ============================================================================
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
COMPOSE_FILE="docker-compose.yml"
COMPOSE_DEV_FILE="docker-compose.dev.yml"
COMPOSE_OVERRIDE_FILE="docker-compose.override.yml"

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
# Deployment Functions
# ============================================================================

check_environment() {
    log "Checking deployment environment..."

    # Check if Docker Compose is available
    if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
        log_error "Docker Compose is not available"
        exit 1
    fi

    # Check if required files exist
    if [[ ! -f "$PROJECT_ROOT/$COMPOSE_FILE" ]]; then
        log_error "Docker Compose file not found: $COMPOSE_FILE"
        exit 1
    fi

    # Check if .env file exists
    if [[ ! -f "$PROJECT_ROOT/.env" ]]; then
        log_warning ".env file not found, using environment variables"
    fi

    log_success "Environment check passed"
}

backup_data() {
    log "Creating backup of existing data..."

    local backup_dir="$PROJECT_ROOT/backups/$(date +%Y%m%d_%H%M%S)"
    mkdir -p "$backup_dir"

    # Backup Redis data
    if docker volume ls | grep -q redis_data; then
        docker run --rm -v redis_data:/data -v "$backup_dir":/backup alpine \
            tar czf /backup/redis_data.tar.gz -C /data . || {
            log_warning "Redis backup failed, continuing..."
        }
    fi

    log_success "Backup created: $backup_dir"
}

pull_latest_images() {
    log "Pulling latest images..."

    local compose_cmd
    if command -v docker-compose &> /dev/null; then
        compose_cmd="docker-compose"
    else
        compose_cmd="docker compose"
    fi

    $compose_cmd -f "$COMPOSE_FILE" pull || {
        log_warning "Some images could not be pulled, continuing with local images"
    }

    log_success "Image pull completed"
}

deploy_services() {
    log "Deploying services..."

    local compose_cmd
    if command -v docker-compose &> /dev/null; then
        compose_cmd="docker-compose"
    else
        compose_cmd="docker compose"
    fi

    # Deploy with zero-downtime strategy
    $compose_cmd -f "$COMPOSE_FILE" up -d --no-deps --build app || {
        log_error "Service deployment failed"
        exit 1
    }

    # Wait for health check
    log "Waiting for services to be healthy..."
    local max_attempts=30
    local attempt=0

    while [[ $attempt -lt $max_attempts ]]; do
        if $compose_cmd -f "$COMPOSE_FILE" ps | grep -q "healthy"; then
            log_success "Services are healthy"
            break
        fi

        ((attempt++))
        log "Health check attempt $attempt/$max_attempts..."
        sleep 10
    done

    if [[ $attempt -eq $max_attempts ]]; then
        log_error "Services failed to become healthy"
        $compose_cmd -f "$COMPOSE_FILE" logs app
        exit 1
    fi

    log_success "Services deployed successfully"
}

verify_deployment() {
    log "Verifying deployment..."

    # Test health endpoints
    local health_urls=(
        "http://localhost:3001/health"
        "http://localhost:3001/api/health"
    )

    for url in "${health_urls[@]}"; do
        if curl -f "$url" &> /dev/null; then
            log_success "Health check passed: $url"
        else
            log_error "Health check failed: $url"
            exit 1
        fi
    done

    # Check service status
    local compose_cmd
    if command -v docker-compose &> /dev/null; then
        compose_cmd="docker-compose"
    else
        compose_cmd="docker compose"
    fi

    $compose_cmd -f "$COMPOSE_FILE" ps

    log_success "Deployment verification completed"
}

cleanup_old_containers() {
    log "Cleaning up old containers and images..."

    # Remove stopped containers
    docker container prune -f

    # Remove unused images
    docker image prune -f

    # Remove unused volumes (be careful with this)
    # docker volume prune -f

    log_success "Cleanup completed"
}

# ============================================================================
# Development Deployment
# ============================================================================

deploy_development() {
    log "Deploying development environment..."

    local compose_cmd
    if command -v docker-compose &> /dev/null; then
        compose_cmd="docker-compose"
    else
        compose_cmd="docker compose"
    fi

    # Use development compose file
    $compose_cmd -f "$COMPOSE_DEV_FILE" up -d --build || {
        log_error "Development deployment failed"
        exit 1
    }

    log_success "Development environment deployed"
    log "Services available at:"
    log "  - API: http://localhost:3001"
    log "  - Redis Commander: http://localhost:8081"
    log "  - PostgreSQL: localhost:5432"
}

# ============================================================================
# Main Execution
# ============================================================================

main() {
    local environment="${1:-production}"

    log "Starting Docker deployment for AI-BOS Accounting SaaS"
    log "Environment: $environment"

    # Change to project root
    cd "$PROJECT_ROOT"

    case "$environment" in
        "production")
            check_environment
            backup_data
            pull_latest_images
            deploy_services
            verify_deployment
            cleanup_old_containers
            ;;
        "development"|"dev")
            check_environment
            deploy_development
            ;;
        *)
            log_error "Invalid environment: $environment"
            log "Usage: $0 [production|development]"
            exit 1
            ;;
    esac

    log_success "Deployment completed successfully!"
}

# Run main function
main "$@"
