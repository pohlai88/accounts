# AI-BOS Accounting SaaS - Docker Quick Reference

## 🚀 Quick Start

### Development

```bash
# Start development environment
docker-compose -f docker-compose.dev.yml up -d

# View logs
docker-compose -f docker-compose.dev.yml logs -f

# Stop
docker-compose -f docker-compose.dev.yml down
```

### Production

```bash
# Build and deploy
./scripts/docker-build.sh
./scripts/docker-deploy.sh production
```

## 📋 Prerequisites

- Docker 20.10+
- Docker Compose v2.0+
- 2GB+ RAM
- `.env` file with required variables

## 🔧 Services

| Service         | Port   | Description          |
| --------------- | ------ | -------------------- |
| API             | 3001   | Main application     |
| Redis           | 6379   | Cache & sessions     |
| PostgreSQL      | 5432   | Database (dev only)  |
| Redis Commander | 8081   | Redis UI (dev only)  |
| Nginx           | 80/443 | Reverse proxy (prod) |

## 🏥 Health Checks

```bash
# Application health
curl http://localhost:3001/health

# API health
curl http://localhost:3001/api/health

# Custom health check
node scripts/docker-healthcheck.js
```

## 📊 Monitoring

```bash
# Container stats
docker stats

# Service logs
docker-compose logs -f app

# Resource usage
docker system df
```

## 🔒 Security Features

- ✅ Non-root user execution
- ✅ Multi-stage builds
- ✅ Vulnerability scanning
- ✅ Resource limits
- ✅ Health checks
- ✅ Signal handling
- ✅ Security headers

## 🛠️ Troubleshooting

### Common Commands

```bash
# Check service status
docker-compose ps

# View logs
docker-compose logs app

# Execute commands
docker-compose exec app pnpm test

# Restart services
docker-compose restart app

# Clean up
docker-compose down -v
docker system prune -f
```

### Debug Mode

```bash
# Enable debug logging
export DEBUG=aibos:*
docker-compose -f docker-compose.dev.yml up
```

## 📚 Documentation

- [Complete Docker Guide](docs/docker-deployment.md)
- [API Documentation](packages/api/README.md)
- [Development Guide](.dev-document/)

## 🆘 Support

1. Check logs: `docker-compose logs -f`
2. Health check: `./scripts/docker-healthcheck.js`
3. Verify config: `docker-compose config`
4. Test services: `docker-compose exec <service> <command>`
