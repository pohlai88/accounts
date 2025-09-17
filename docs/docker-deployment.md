# AI-BOS Accounting SaaS - Docker Deployment Guide

## Overview

This guide provides comprehensive instructions for deploying the AI-BOS Accounting SaaS application using Docker containers. The deployment follows security best practices, SSOT (Single Source of Truth) principles, and maintains high codebase quality.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Production Deployment](#production-deployment)
- [Development Environment](#development-environment)
- [Configuration](#configuration)
- [Health Checks](#health-checks)
- [Monitoring](#monitoring)
- [Troubleshooting](#troubleshooting)
- [Security Considerations](#security-considerations)

## Prerequisites

### System Requirements

- **Docker**: Version 20.10+ with Docker Compose v2.0+
- **Memory**: Minimum 2GB RAM (4GB recommended for production)
- **Storage**: Minimum 10GB free space
- **OS**: Linux, macOS, or Windows with WSL2

### Required Environment Variables

Create a `.env` file in the project root with the following variables:

```bash
# Database Configuration
DATABASE_URL=postgresql://user:password@host:port/database
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Redis Configuration
REDIS_PASSWORD=your-redis-password

# Application Configuration
NODE_ENV=production
PORT=3001
CORS_ORIGIN=https://your-frontend-domain.com

# Security
TRUST_PROXY=true
```

## Quick Start

### Development Environment

```bash
# Clone the repository
git clone <repository-url>
cd aibos-accounts

# Start development environment
docker-compose -f docker-compose.dev.yml up -d

# View logs
docker-compose -f docker-compose.dev.yml logs -f

# Stop environment
docker-compose -f docker-compose.dev.yml down
```

### Production Environment

```bash
# Build and deploy
./scripts/docker-build.sh
./scripts/docker-deploy.sh production
```

## Production Deployment

### 1. Multi-Stage Dockerfile

The production Dockerfile uses a multi-stage build process:

```dockerfile
# Base stage - Common dependencies
FROM node:18-alpine AS base

# Dependencies stage - Install all packages
FROM base AS deps

# Build stage - Compile application
FROM base AS build

# Runtime stage - Minimal production image
FROM base AS runtime
```

**Key Features:**

- **Security**: Non-root user execution
- **Optimization**: Multi-stage build reduces image size
- **Health Checks**: Built-in health monitoring
- **Signal Handling**: Proper signal handling with dumb-init

### 2. Production Docker Compose

The production `docker-compose.yml` includes:

- **Application Service**: Main API server
- **Redis Service**: Caching and session storage
- **Nginx Service**: Reverse proxy and load balancer
- **Health Checks**: Comprehensive health monitoring
- **Resource Limits**: Memory and CPU constraints
- **Logging**: Structured logging configuration

### 3. Deployment Process

```bash
# 1. Build the application
./scripts/docker-build.sh latest runtime

# 2. Deploy to production
./scripts/docker-deploy.sh production

# 3. Verify deployment
curl http://localhost:3001/health
```

## Development Environment

### Features

- **Hot Reload**: Source code changes trigger automatic rebuilds
- **Debug Support**: Node.js debugging on port 9229
- **Database**: Local PostgreSQL instance
- **Redis UI**: Redis Commander for cache management
- **Volume Mounting**: Source code mounted for development

### Services

| Service         | Port | Description               |
| --------------- | ---- | ------------------------- |
| API             | 3001 | Main application server   |
| Redis           | 6379 | Cache and session storage |
| PostgreSQL      | 5432 | Local database            |
| Redis Commander | 8081 | Redis management UI       |

### Usage

```bash
# Start development environment
docker-compose -f docker-compose.dev.yml up -d

# View specific service logs
docker-compose -f docker-compose.dev.yml logs -f app

# Execute commands in running container
docker-compose -f docker-compose.dev.yml exec app pnpm test

# Stop and remove containers
docker-compose -f docker-compose.dev.yml down -v
```

## Configuration

### Environment Variables

#### Application Configuration

| Variable      | Default      | Description             |
| ------------- | ------------ | ----------------------- |
| `NODE_ENV`    | `production` | Application environment |
| `PORT`        | `3001`       | Application port        |
| `HOST`        | `0.0.0.0`    | Application host        |
| `API_VERSION` | `1.0.0`      | API version             |

#### Database Configuration

| Variable                    | Required | Description                  |
| --------------------------- | -------- | ---------------------------- |
| `DATABASE_URL`              | Yes      | PostgreSQL connection string |
| `SUPABASE_URL`              | Yes      | Supabase project URL         |
| `SUPABASE_ANON_KEY`         | Yes      | Supabase anonymous key       |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes      | Supabase service role key    |

#### Redis Configuration

| Variable         | Default | Description           |
| ---------------- | ------- | --------------------- |
| `REDIS_HOST`     | `redis` | Redis hostname        |
| `REDIS_PORT`     | `6379`  | Redis port            |
| `REDIS_PASSWORD` | -       | Redis password        |
| `REDIS_DB`       | `0`     | Redis database number |

#### Security Configuration

| Variable                  | Default                 | Description                |
| ------------------------- | ----------------------- | -------------------------- |
| `TRUST_PROXY`             | `false`                 | Trust proxy headers        |
| `CORS_ORIGIN`             | `http://localhost:3000` | Allowed CORS origins       |
| `RATE_LIMIT_WINDOW_MS`    | `900000`                | Rate limit window (15 min) |
| `RATE_LIMIT_MAX_REQUESTS` | `100`                   | Max requests per window    |

### Docker Compose Override

For local development, create `docker-compose.override.yml`:

```yaml
version: "3.8"
services:
  app:
    environment:
      - NODE_ENV=development
      - DEBUG=aibos:*
    volumes:
      - .:/app
      - /app/node_modules
```

## Health Checks

### Application Health Checks

The application provides multiple health check endpoints:

- **`/health`**: Basic application health
- **`/api/health`**: API-specific health check

### Docker Health Checks

Each service includes Docker health checks:

```yaml
healthcheck:
  test:
    [
      "CMD",
      "node",
      "-e",
      "require('http').get('http://localhost:3001/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })",
    ]
  interval: 30s
  timeout: 10s
  retries: 3
  start_period: 40s
```

### Custom Health Check Script

Use the provided health check script:

```bash
# Basic health check
node scripts/docker-healthcheck.js

# Verbose health check
HEALTH_CHECK_VERBOSE=true node scripts/docker-healthcheck.js

# Custom URL
HEALTH_CHECK_URL=http://localhost:3001 node scripts/docker-healthcheck.js
```

## Monitoring

### Log Management

Docker Compose is configured with log rotation:

```yaml
logging:
  driver: "json-file"
  options:
    max-size: "10m"
    max-file: "3"
```

### Resource Monitoring

Monitor container resources:

```bash
# View resource usage
docker stats

# View specific container stats
docker stats aibos-accounting-api

# View container resource limits
docker inspect aibos-accounting-api | grep -A 10 "Resources"
```

### Application Metrics

The application exposes metrics at `/api/metrics`:

- Request counts and response times
- Cache hit/miss ratios
- Rate limiting statistics
- Memory usage

## Troubleshooting

### Common Issues

#### 1. Container Won't Start

```bash
# Check container logs
docker-compose logs app

# Check container status
docker-compose ps

# Inspect container
docker inspect aibos-accounting-api
```

#### 2. Health Check Failures

```bash
# Test health endpoint manually
curl -v http://localhost:3001/health

# Check application logs
docker-compose logs app | grep -i error

# Verify environment variables
docker-compose exec app env | grep -E "(DATABASE|REDIS|SUPABASE)"
```

#### 3. Database Connection Issues

```bash
# Test database connectivity
docker-compose exec app node -e "
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
pool.query('SELECT 1').then(() => console.log('DB OK')).catch(console.error);
"
```

#### 4. Redis Connection Issues

```bash
# Test Redis connectivity
docker-compose exec redis redis-cli ping

# Check Redis logs
docker-compose logs redis
```

### Debug Mode

Enable debug mode for detailed logging:

```bash
# Set debug environment
export DEBUG=aibos:*
export NODE_ENV=development

# Start with debug logging
docker-compose -f docker-compose.dev.yml up
```

### Performance Issues

#### Memory Usage

```bash
# Check memory usage
docker stats --no-stream

# Increase memory limits in docker-compose.yml
deploy:
  resources:
    limits:
      memory: 1G
```

#### CPU Usage

```bash
# Monitor CPU usage
docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}"

# Increase CPU limits
deploy:
  resources:
    limits:
      cpus: '1.0'
```

## Security Considerations

### Container Security

1. **Non-root User**: Application runs as non-root user
2. **Minimal Base Image**: Uses Alpine Linux for smaller attack surface
3. **No Package Manager**: Production image doesn't include package managers
4. **Read-only Filesystem**: Consider using read-only root filesystem

### Network Security

1. **Internal Networks**: Services communicate over internal Docker networks
2. **Port Exposure**: Only necessary ports are exposed
3. **Reverse Proxy**: Nginx handles SSL termination and request filtering

### Secrets Management

1. **Environment Variables**: Sensitive data passed via environment variables
2. **Docker Secrets**: Consider using Docker secrets for production
3. **Volume Mounting**: Avoid mounting sensitive files as volumes

### Image Security

1. **Vulnerability Scanning**: Use Trivy or similar tools
2. **Base Image Updates**: Regularly update base images
3. **Multi-stage Builds**: Reduce attack surface with minimal runtime images

### Best Practices

1. **Regular Updates**: Keep Docker and base images updated
2. **Resource Limits**: Set appropriate memory and CPU limits
3. **Health Checks**: Implement comprehensive health monitoring
4. **Logging**: Use structured logging for better observability
5. **Backup**: Regular backup of persistent data

## Advanced Configuration

### Custom Nginx Configuration

Modify `nginx.conf` for custom routing and SSL configuration.

### SSL/TLS Setup

1. Place SSL certificates in `./ssl/` directory
2. Uncomment HTTPS server block in `nginx.conf`
3. Update environment variables for HTTPS

### Scaling

Scale services horizontally:

```bash
# Scale application instances
docker-compose up -d --scale app=3

# Use load balancer (Nginx) to distribute traffic
```

### Backup and Recovery

```bash
# Backup Redis data
docker run --rm -v redis_data:/data -v $(pwd)/backup:/backup alpine \
  tar czf /backup/redis-$(date +%Y%m%d).tar.gz -C /data .

# Restore Redis data
docker run --rm -v redis_data:/data -v $(pwd)/backup:/backup alpine \
  tar xzf /backup/redis-20240101.tar.gz -C /data
```

## Support

For additional support and troubleshooting:

1. Check the application logs: `docker-compose logs -f`
2. Review the health check output: `./scripts/docker-healthcheck.js`
3. Verify environment configuration: `docker-compose config`
4. Test individual services: `docker-compose exec <service> <command>`
