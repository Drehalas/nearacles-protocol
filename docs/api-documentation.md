# NEAR Oracle Intent Protocol - API Documentation

## Overview

This document provides comprehensive API documentation for the NEAR Oracle Intent Protocol testnet deployment. The system consists of WebSocket services for real-time communication and HTTP endpoints for health monitoring.

## WebSocket API

### Connection Endpoint

```
ws://localhost:8080
```

### Authentication

The WebSocket server detects client types based on User-Agent headers:

- **AI Service**: Include `AI-Service` in User-Agent
- **Frontend**: Connect from `localhost:3000` or testnet domains
- **Solver**: Include `Solver` in User-Agent
- **Unknown**: Default for unidentified clients

### Message Format

All WebSocket messages follow this structure:

```typescript
interface WSMessage {
  type: 'intent' | 'response' | 'ping' | 'ai_request' | 'ai_response';
  data: any;
  timestamp: number;
  client_id?: string;
}
```

### Message Types

#### 1. Intent Submission

**From: Frontend/Solver → Server**

```json
{
  "type": "intent",
  "data": {
    "id": "intent_123456789",
    "user_address": "alice.testnet",
    "intent_type": "swap",
    "source_token": "NEAR",
    "target_token": "USDT",
    "amount": "100000000000000000000000000",
    "slippage_tolerance": "0.01",
    "deadline": 1672531200000,
    "user_risk_tolerance": "medium",
    "user_experience": "intermediate"
  },
  "timestamp": 1672531200000
}
```

#### 2. AI Request

**From: Server → AI Service**

```json
{
  "type": "ai_request",
  "data": {
    "action": "process_intent",
    "intent": {
      "id": "intent_123456789",
      "user_address": "alice.testnet",
      "intent_type": "swap"
    },
    "sender_id": "client_abc123",
    "sender_type": "frontend"
  },
  "timestamp": 1672531200000
}
```

#### 3. AI Response

**From: AI Service → Server**

```json
{
  "type": "ai_response",
  "data": {
    "type": "ai_decision",
    "intent_id": "intent_123456789",
    "decision": {
      "recommended_action": "execute",
      "confidence": 0.85,
      "estimated_gas": "50000000000000",
      "risk_score": 0.2,
      "execution_strategy": "optimal_timing"
    },
    "target_client": "client_abc123"
  },
  "timestamp": 1672531200000
}
```

#### 4. Ping/Pong

**Ping Request:**
```json
{
  "type": "ping",
  "data": {},
  "timestamp": 1672531200000
}
```

**Pong Response:**
```json
{
  "type": "response",
  "data": {
    "type": "pong",
    "timestamp": 1672531200000
  },
  "timestamp": 1672531200000
}
```

#### 5. Connection Established

**From: Server → Client (auto-sent on connection)**

```json
{
  "type": "response",
  "data": {
    "type": "connection_established",
    "client_id": "client_abc123",
    "server_time": 1672531200000
  },
  "timestamp": 1672531200000
}
```

## HTTP API

### Health Endpoint

#### GET /health

Returns the current health status of the WebSocket server.

**Request:**
```http
GET /health HTTP/1.1
Host: localhost:8080
```

**Response:**
```json
{
  "status": "healthy",
  "clients": 3,
  "ai_connected": true,
  "avg_latency_ms": 12,
  "max_latency_ms": 45,
  "uptime_ms": 3600000,
  "total_messages": 1250
}
```

**Response Fields:**
- `status`: Overall server status ("healthy", "degraded", "unhealthy")
- `clients`: Number of connected WebSocket clients
- `ai_connected`: Whether AI service is connected
- `avg_latency_ms`: Average message processing latency
- `max_latency_ms`: Maximum latency in current session
- `uptime_ms`: Server uptime in milliseconds
- `total_messages`: Total messages processed

### Security Headers

All HTTP responses include security headers:

```http
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Referrer-Policy: strict-origin-when-cross-origin
Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; connect-src 'self' ws: wss: https:; img-src 'self' data: https:;
```

### Rate Limiting

HTTP endpoints are rate-limited:

- **Limit**: 100 requests per minute per IP
- **Headers**: 
  - `X-RateLimit-Limit`: Request limit
  - `X-RateLimit-Remaining`: Remaining requests
  - `X-RateLimit-Reset`: Reset timestamp
- **429 Response**: When rate limit exceeded

```json
{
  "error": "Rate limit exceeded"
}
```

## AI Service Integration

### Intent Processing Flow

1. **Intent Submission**: Frontend submits intent via WebSocket
2. **AI Forwarding**: Server forwards intent to AI service
3. **AI Processing**: AI service analyzes intent and market conditions
4. **Decision Response**: AI service returns decision and confidence
5. **Result Broadcasting**: Server broadcasts AI decision to relevant clients

### AI Decision Context

The AI service receives context for decision making:

```typescript
interface AIDecisionContext {
  intent_data: Record<string, unknown>;
  market_conditions: Record<string, unknown>;
  historical_performance: Record<string, unknown>;
  risk_tolerance: number;
  user_profile?: Record<string, unknown>;
}
```

## Client Types and Permissions

### Frontend Clients
- **Connect from**: `localhost:3000`, testnet domains
- **Can send**: Intent submissions, ping
- **Receives**: AI responses, connection status, pongs

### AI Service Clients
- **User-Agent**: Must include "AI-Service"
- **Can send**: AI responses
- **Receives**: AI requests, intent data

### Solver Clients
- **User-Agent**: Must include "Solver"
- **Can send**: Intent responses, ping
- **Receives**: Intent broadcasts, AI decisions, pongs

## Error Handling

### WebSocket Errors

**Invalid JSON:**
```json
{
  "type": "response",
  "data": {
    "type": "error",
    "message": "Invalid JSON format"
  },
  "timestamp": 1672531200000
}
```

**Connection Errors:**
- Automatic reconnection with exponential backoff
- Maximum 5 reconnection attempts
- Connection timeout: 30 seconds

### HTTP Errors

**403 Forbidden (CORS):**
```json
{
  "error": "CORS origin not allowed"
}
```

**404 Not Found:**
```
WebSocket server - use /health for status
```

## Monitoring and Health

### Health Dashboard

Access the web-based health dashboard at:
```
http://localhost:3000/health.html
```

Features:
- Real-time service status
- Latency monitoring
- Connection counts
- System overview
- Auto-refresh every 30 seconds

### Health Check Script

Run automated health checks:

```bash
# Basic health check
./scripts/health-check.sh

# Detailed health information
./scripts/health-check.sh --detailed
```

## Performance Specifications

### Latency Requirements

- **Target**: <100ms message processing latency
- **Monitoring**: Real-time latency tracking
- **Alerting**: Automatic warnings for >100ms latency

### Scalability

- **Connections**: Supports 1000+ concurrent WebSocket connections
- **Throughput**: 10,000+ messages per second
- **Memory**: <512MB base memory usage

## Security Features

### Rate Limiting
- 100 requests per minute per IP
- Distributed rate limiting store
- Configurable limits via environment variables

### CORS Protection
- Configured allowed origins
- No wildcard origins in production
- Preflight request handling

### Security Headers
- Content Security Policy
- XSS Protection
- Frame Options
- Content Type Options

## Environment Configuration

### Required Environment Variables

```bash
# WebSocket Server
WEBSOCKET_PORT=8080

# Security
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=100
ENABLE_CORS=true
ALLOWED_ORIGINS=http://localhost:3000,https://testnet.nearacles.com

# Logging
SERVICE_NAME=nearacles-protocol
LOG_LEVEL=INFO
ENABLE_FILE_LOGGING=true
```

### Optional Environment Variables

```bash
# Remote Logging
ENABLE_REMOTE_LOGGING=false
REMOTE_LOG_ENDPOINT=https://logs.example.com/api

# Performance
MAX_LOG_SIZE=100000000
LOG_RETENTION_DAYS=30

# Development
DEBUG_LOGGING=false
VERBOSE_ERRORS=true
```

## Testing

### WebSocket Testing

```javascript
const ws = new WebSocket('ws://localhost:8080');

ws.onopen = () => {
  ws.send(JSON.stringify({
    type: 'ping',
    data: {},
    timestamp: Date.now()
  }));
};

ws.onmessage = (event) => {
  const message = JSON.parse(event.data);
  console.log('Received:', message);
};
```

### Health Endpoint Testing

```bash
curl -X GET http://localhost:8080/health
```

### Rate Limiting Testing

```bash
# Test rate limiting
for i in {1..110}; do
  curl -w "Response: %{http_code}\n" http://localhost:8080/health
done
```

## Troubleshooting

### Common Issues

1. **WebSocket Connection Failed**
   - Check if server is running on port 8080
   - Verify firewall settings
   - Check security headers and CORS configuration

2. **High Latency Warnings**
   - Monitor system resources
   - Check message queue sizes
   - Verify network connectivity

3. **Rate Limiting Errors**
   - Reduce request frequency
   - Check IP-based limits
   - Review rate limiting configuration

### Debug Commands

```bash
# Check WebSocket server status
ps aux | grep websocket

# View logs
tail -f logs/nearacles-protocol-testnet.log

# Test connectivity
netstat -tlnp | grep 8080

# Monitor real-time connections
ss -tuln | grep 8080
```

### Support

For technical support and issues:
- Check logs in `logs/` directory
- Use health check script for diagnostics
- Monitor dashboard at `/health.html`
- Review this documentation for API specifications