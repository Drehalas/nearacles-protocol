#!/bin/bash

# Simple Health Check Script for NEAR Oracle Intent Protocol
# Validates all core services are running and healthy

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
WEBSOCKET_PORT=8080
FRONTEND_PORT=3000
TIMEOUT=10

echo "🏥 NEAR Oracle Intent Protocol - Health Check"
echo "============================================="
echo ""

# Function to check service health
check_service() {
    local service_name="$1"
    local port="$2"
    local endpoint="$3"
    
    echo -n "Checking $service_name (port $port)... "
    
    if curl -f -s --max-time $TIMEOUT "http://localhost:$port$endpoint" > /dev/null 2>&1; then
        echo -e "${GREEN}✓ HEALTHY${NC}"
        return 0
    else
        echo -e "${RED}✗ UNHEALTHY${NC}"
        return 1
    fi
}

# Function to check service with JSON response
check_service_json() {
    local service_name="$1"
    local port="$2"
    local endpoint="$3"
    
    echo -n "Checking $service_name (port $port)... "
    
    local response
    if response=$(curl -f -s --max-time $TIMEOUT "http://localhost:$port$endpoint" 2>/dev/null); then
        local status
        if command -v jq >/dev/null 2>&1; then
            status=$(echo "$response" | jq -r '.status // "unknown"' 2>/dev/null || echo "unknown")
        else
            # Fallback without jq
            status=$(echo "$response" | grep -o '"status":"[^"]*"' | cut -d'"' -f4 || echo "unknown")
        fi
        
        if [ "$status" = "healthy" ]; then
            echo -e "${GREEN}✓ HEALTHY${NC}"
            return 0
        else
            echo -e "${YELLOW}⚠ $status${NC}"
            return 1
        fi
    else
        echo -e "${RED}✗ UNREACHABLE${NC}"
        return 1
    fi
}

# Function to show detailed health info
show_health_details() {
    local service_name="$1"
    local port="$2"
    local endpoint="$3"
    
    echo ""
    echo "$service_name Health Details:"
    echo "----------------------------"
    
    local response
    if response=$(curl -f -s --max-time $TIMEOUT "http://localhost:$port$endpoint" 2>/dev/null); then
        if command -v jq >/dev/null 2>&1; then
            echo "$response" | jq . 2>/dev/null || echo "$response"
        else
            echo "$response"
        fi
    else
        echo "❌ Unable to fetch health details"
    fi
    echo ""
}

# Track overall health
overall_healthy=true

# Check WebSocket Server
if check_service_json "WebSocket Server" "$WEBSOCKET_PORT" "/health"; then
    websocket_healthy=true
else
    websocket_healthy=false
    overall_healthy=false
fi

# Check Frontend (if running)
if check_service "Frontend" "$FRONTEND_PORT" "/"; then
    frontend_healthy=true
else
    frontend_healthy=false
    # Frontend might not be running in all environments, so don't fail overall
    echo -e "${YELLOW}  Note: Frontend check failed - this may be expected in some environments${NC}"
fi

echo ""
echo "📊 Health Summary:"
echo "=================="

if [ "$websocket_healthy" = true ]; then
    echo -e "WebSocket Server: ${GREEN}✓ Healthy${NC}"
else
    echo -e "WebSocket Server: ${RED}✗ Unhealthy${NC}"
fi

if [ "$frontend_healthy" = true ]; then
    echo -e "Frontend: ${GREEN}✓ Healthy${NC}"
else
    echo -e "Frontend: ${YELLOW}⚠ Not responding${NC}"
fi

# Show detailed health if requested
if [ "$1" = "--detailed" ] || [ "$1" = "-d" ]; then
    if [ "$websocket_healthy" = true ]; then
        show_health_details "WebSocket Server" "$WEBSOCKET_PORT" "/health"
    fi
fi

# Overall result
echo ""
if [ "$overall_healthy" = true ]; then
    echo -e "${GREEN}🎉 Overall Status: HEALTHY${NC}"
    echo "All critical services are running normally."
    exit 0
else
    echo -e "${RED}❌ Overall Status: UNHEALTHY${NC}"
    echo "One or more critical services are not responding."
    echo ""
    echo "Troubleshooting:"
    echo "- Check if services are running: ps aux | grep -E 'websocket|node'"
    echo "- Check logs for errors: tail -f logs/*.log"
    echo "- Restart services: npm run start"
    exit 1
fi