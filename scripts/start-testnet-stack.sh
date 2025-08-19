#!/bin/bash

# NEAR Oracle Intent Protocol - Complete Testnet Stack Startup Script
# Starts all services needed for testnet deployment

set -e

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
LOG_DIR="$PROJECT_ROOT/logs"
PID_DIR="$PROJECT_ROOT/pids"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Create necessary directories
create_directories() {
    log_info "Creating necessary directories..."
    mkdir -p "$LOG_DIR" "$PID_DIR"
    log_success "Directories created"
}

# Check if service is running
is_service_running() {
    local service_name=$1
    local pid_file="$PID_DIR/${service_name}.pid"
    
    if [ -f "$pid_file" ]; then
        local pid=$(cat "$pid_file")
        if kill -0 "$pid" 2>/dev/null; then
            return 0
        else
            rm -f "$pid_file"
            return 1
        fi
    fi
    return 1
}

# Start WebSocket server
start_websocket_server() {
    log_info "Starting WebSocket server..."
    
    if is_service_running "websocket"; then
        log_warning "WebSocket server is already running"
        return 0
    fi
    
    cd "$PROJECT_ROOT"
    
    # Start WebSocket server in background
    nohup npx tsx backend/infrastructure/websocket-server.ts > "$LOG_DIR/websocket.log" 2>&1 &
    local pid=$!
    echo $pid > "$PID_DIR/websocket.pid"
    
    # Wait for server to start
    sleep 3
    
    if kill -0 $pid 2>/dev/null; then
        log_success "WebSocket server started (PID: $pid)"
    else
        log_error "Failed to start WebSocket server"
        return 1
    fi
}

# Start AI service
start_ai_service() {
    log_info "Starting AI service..."
    
    if is_service_running "ai"; then
        log_warning "AI service is already running"
        return 0
    fi
    
    cd "$PROJECT_ROOT"
    
    # Start AI service in background
    nohup npx tsx scripts/start-ai-service.ts > "$LOG_DIR/ai-service.log" 2>&1 &
    local pid=$!
    echo $pid > "$PID_DIR/ai.pid"
    
    # Wait for service to start
    sleep 5
    
    if kill -0 $pid 2>/dev/null; then
        log_success "AI service started (PID: $pid)"
    else
        log_error "Failed to start AI service"
        return 1
    fi
}

# Start frontend development server
start_frontend() {
    log_info "Starting frontend development server..."
    
    if is_service_running "frontend"; then
        log_warning "Frontend server is already running"
        return 0
    fi
    
    cd "$PROJECT_ROOT/frontend"
    
    # Install dependencies if needed
    if [ ! -d "node_modules" ]; then
        log_info "Installing frontend dependencies..."
        npm install
    fi
    
    # Start frontend in testnet mode
    nohup npm run dev:testnet > "$LOG_DIR/frontend.log" 2>&1 &
    local pid=$!
    echo $pid > "$PID_DIR/frontend.pid"
    
    # Wait for server to start
    sleep 10
    
    if kill -0 $pid 2>/dev/null; then
        log_success "Frontend server started (PID: $pid)"
    else
        log_error "Failed to start frontend server"
        return 1
    fi
}

# Check service health
check_services_health() {
    log_info "Checking services health..."
    
    local all_healthy=true
    
    # Check WebSocket server
    if curl -s --max-time 5 "http://localhost:8080" >/dev/null 2>&1; then
        log_success "WebSocket server is healthy"
    else
        log_warning "WebSocket server health check failed"
        all_healthy=false
    fi
    
    # Check frontend
    if curl -s --max-time 5 "http://localhost:3000" >/dev/null 2>&1; then
        log_success "Frontend server is healthy"
    else
        log_warning "Frontend server health check failed"
        all_healthy=false
    fi
    
    if [ "$all_healthy" = true ]; then
        log_success "All services are healthy"
    else
        log_warning "Some services may not be fully ready yet"
    fi
}

# Show service status
show_status() {
    echo ""
    echo "📊 Testnet Stack Status:"
    echo "========================"
    
    if is_service_running "websocket"; then
        local pid=$(cat "$PID_DIR/websocket.pid")
        echo "🟢 WebSocket Server: Running (PID: $pid) - ws://localhost:8080"
    else
        echo "🔴 WebSocket Server: Stopped"
    fi
    
    if is_service_running "ai"; then
        local pid=$(cat "$PID_DIR/ai.pid")
        echo "🟢 AI Service: Running (PID: $pid)"
    else
        echo "🔴 AI Service: Stopped"
    fi
    
    if is_service_running "frontend"; then
        local pid=$(cat "$PID_DIR/frontend.pid")
        echo "🟢 Frontend: Running (PID: $pid) - http://localhost:3000"
    else
        echo "🔴 Frontend: Stopped"
    fi
    
    echo ""
    echo "📄 Logs Location: $LOG_DIR/"
    echo "🔧 PID Files: $PID_DIR/"
    echo ""
    echo "🎯 Quick Actions:"
    echo "- View logs: tail -f $LOG_DIR/<service>.log"
    echo "- Stop all services: $0 stop"
    echo "- Restart services: $0 restart"
}

# Stop all services
stop_services() {
    log_info "Stopping all services..."
    
    local services=("frontend" "ai" "websocket")
    
    for service in "${services[@]}"; do
        local pid_file="$PID_DIR/${service}.pid"
        
        if [ -f "$pid_file" ]; then
            local pid=$(cat "$pid_file")
            
            if kill -0 "$pid" 2>/dev/null; then
                log_info "Stopping $service (PID: $pid)..."
                kill -TERM "$pid"
                
                # Wait for graceful shutdown
                local count=0
                while kill -0 "$pid" 2>/dev/null && [ $count -lt 10 ]; do
                    sleep 1
                    count=$((count + 1))
                done
                
                # Force kill if still running
                if kill -0 "$pid" 2>/dev/null; then
                    log_warning "Force killing $service..."
                    kill -KILL "$pid"
                fi
                
                log_success "$service stopped"
            fi
            
            rm -f "$pid_file"
        fi
    done
    
    log_success "All services stopped"
}

# Start all services
start_services() {
    log_info "🚀 Starting NEAR Oracle Intent Protocol Testnet Stack"
    echo ""
    
    create_directories
    start_websocket_server
    start_ai_service
    start_frontend
    
    echo ""
    log_info "Waiting for services to stabilize..."
    sleep 5
    
    check_services_health
    show_status
    
    echo ""
    log_success "🎉 Testnet stack started successfully!"
    echo ""
    echo "🌐 Frontend: http://localhost:3000"
    echo "🔌 WebSocket: ws://localhost:8080"
    echo "🤖 AI Service: Running"
    echo ""
    echo "📚 Next steps:"
    echo "1. Open http://localhost:3000 to access the frontend"
    echo "2. Connect your NEAR testnet wallet"
    echo "3. Submit test intents to verify the complete flow"
    echo ""
}

# Restart all services
restart_services() {
    log_info "Restarting all services..."
    stop_services
    sleep 2
    start_services
}

# Main script logic
case "${1:-start}" in
    start)
        start_services
        ;;
    stop)
        stop_services
        ;;
    restart)
        restart_services
        ;;
    status)
        show_status
        ;;
    *)
        echo "Usage: $0 {start|stop|restart|status}"
        echo ""
        echo "Commands:"
        echo "  start   - Start all testnet services"
        echo "  stop    - Stop all running services"
        echo "  restart - Stop and start all services"
        echo "  status  - Show current service status"
        exit 1
        ;;
esac