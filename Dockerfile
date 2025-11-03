# Nearacles Oracle Node - TEE-Ready Dockerfile
# Multi-stage build for optimized production image

# Stage 1: Build TypeScript backend
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY backend/package*.json ./backend/
COPY backend/tsconfig.json ./backend/

# Install dependencies
WORKDIR /app/backend
RUN npm ci --only=production

# Copy source code
COPY backend/services ./services/
COPY backend/types ./types/
COPY backend/utils ./utils/
COPY backend/index.ts ./

# Build TypeScript
RUN npm install -g typescript
RUN npm run build || tsc --outDir dist

# Stage 2: Production image
FROM node:20-alpine

# Install security updates
RUN apk update && apk upgrade && \
    apk add --no-cache tini curl

# Create non-root user
RUN addgroup -g 1001 nearacles && \
    adduser -D -u 1001 -G nearacles nearacles

WORKDIR /app

# Copy built files from builder
COPY --from=builder --chown=nearacles:nearacles /app/backend/node_modules ./node_modules
COPY --from=builder --chown=nearacles:nearacles /app/backend/dist ./dist
COPY --from=builder --chown=nearacles:nearacles /app/backend/package*.json ./

# Switch to non-root user
USER nearacles

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD node -e "require('http').get('http://localhost:' + (process.env.PORT || 3000) + '/health', (r) => process.exit(r.statusCode === 200 ? 0 : 1))"

# Expose port (configurable via environment)
EXPOSE 3000

# Use tini as init system
ENTRYPOINT ["/sbin/tini", "--"]

# Start the oracle node
CMD ["node", "dist/index.js"]

# Labels for metadata
LABEL maintainer="Nearacles Team"
LABEL version="1.0.0"
LABEL description="TEE-secured Oracle Node for NEAR Protocol"
LABEL org.opencontainers.image.source="https://github.com/nearacles/nearacles-protocol"
