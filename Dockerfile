# ============================================================================
# AI-BOS Accounting SaaS - Production Dockerfile
# ============================================================================
# Multi-stage build for optimized production image
# Follows security best practices and SSOT principles

# ============================================================================
# Base Stage - Common dependencies and setup
# ============================================================================
FROM node:18-alpine AS base

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apk add --no-cache \
  dumb-init \
  && rm -rf /var/cache/apk/*

# Install pnpm globally
RUN npm install -g pnpm@latest

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
  adduser -S aibos -u 1001 -G nodejs

# ============================================================================
# Dependencies Stage - Install all dependencies
# ============================================================================
FROM base AS deps

# Copy package files for dependency installation
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/*/package.json ./packages/*/

# Install dependencies with frozen lockfile for reproducible builds
RUN pnpm install --frozen-lockfile --prod=false

# ============================================================================
# Build Stage - Compile and build application
# ============================================================================
FROM base AS build

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/package.json ./package.json
COPY --from=deps /app/pnpm-lock.yaml ./pnpm-lock.yaml
COPY --from=deps /app/pnpm-workspace.yaml ./pnpm-workspace.yaml

# Copy source code
COPY . .

# Set build environment
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Build the application
RUN pnpm build

# ============================================================================
# Production Stage - Minimal runtime image
# ============================================================================
FROM base AS runtime

# Set production environment
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Copy built application from build stage
COPY --from=build --chown=aibos:nodejs /app/dist ./dist
COPY --from=build --chown=aibos:nodejs /app/package.json ./package.json
COPY --from=build --chown=aibos:nodejs /app/pnpm-lock.yaml ./pnpm-lock.yaml

# Copy only production dependencies
COPY --from=deps --chown=aibos:nodejs /app/node_modules ./node_modules

# Switch to non-root user
USER aibos

# Expose application port
EXPOSE 3001

# Health check configuration
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })" || exit 1

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start the application
CMD ["node", "dist/index.js"]
