#!/bin/bash

# NEAR Oracle Intent Protocol - Load Balancer Setup Script
# Sets up NGINX load balancer for testnet deployment

set -e

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
NGINX_CONFIG_SOURCE="$PROJECT_ROOT/nginx/testnet-load-balancer.conf"
NGINX_CONFIG_DEST="/etc/nginx/sites-available/nearacles-testnet"
NGINX_ENABLED_DEST="/etc/nginx/sites-enabled/nearacles-testnet"

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

# Check if running as root/sudo
check_permissions() {
    if [ "$EUID" -ne 0 ]; then
        log_error "This script must be run as root or with sudo"
        echo "Usage: sudo $0"
        exit 1
    fi
}

# Check if NGINX is installed
check_nginx_installed() {
    log_info "Checking if NGINX is installed..."
    
    if ! command -v nginx &> /dev/null; then
        log_error "NGINX is not installed"
        echo ""
        echo "To install NGINX:"
        echo "  Ubuntu/Debian: sudo apt update && sudo apt install nginx"
        echo "  CentOS/RHEL:   sudo yum install nginx"
        echo "  macOS:         brew install nginx"
        exit 1
    fi
    
    log_success "NGINX is installed: $(nginx -v 2>&1)"
}

# Backup existing configuration
backup_existing_config() {
    if [ -f "$NGINX_CONFIG_DEST" ]; then
        log_info "Backing up existing NGINX configuration..."
        cp "$NGINX_CONFIG_DEST" "${NGINX_CONFIG_DEST}.backup.$(date +%Y%m%d_%H%M%S)"
        log_success "Existing configuration backed up"
    fi
}

# Install NGINX configuration
install_nginx_config() {
    log_info "Installing NGINX configuration..."
    
    if [ ! -f "$NGINX_CONFIG_SOURCE" ]; then
        log_error "Source configuration file not found: $NGINX_CONFIG_SOURCE"
        exit 1
    fi
    
    # Copy configuration
    cp "$NGINX_CONFIG_SOURCE" "$NGINX_CONFIG_DEST"
    
    # Enable site
    if [ ! -L "$NGINX_ENABLED_DEST" ]; then
        ln -s "$NGINX_CONFIG_DEST" "$NGINX_ENABLED_DEST"
    fi
    
    log_success "NGINX configuration installed"
}

# Test NGINX configuration
test_nginx_config() {
    log_info "Testing NGINX configuration..."
    
    if nginx -t; then
        log_success "NGINX configuration is valid"
    else
        log_error "NGINX configuration test failed"
        exit 1
    fi
}

# Create log directories
create_log_directories() {
    log_info "Creating log directories..."
    
    mkdir -p /var/log/nginx
    chown www-data:www-data /var/log/nginx 2>/dev/null || chown nginx:nginx /var/log/nginx 2>/dev/null || true
    
    log_success "Log directories created"
}

# Remove default NGINX site (if exists)
remove_default_site() {
    if [ -L "/etc/nginx/sites-enabled/default" ]; then
        log_info "Removing default NGINX site..."
        rm -f "/etc/nginx/sites-enabled/default"
        log_success "Default site removed"
    fi
}

# Start/reload NGINX
restart_nginx() {
    log_info "Restarting NGINX..."
    
    if systemctl is-active --quiet nginx; then
        systemctl reload nginx
        log_success "NGINX reloaded"
    else
        systemctl start nginx
        systemctl enable nginx
        log_success "NGINX started and enabled"
    fi
}

# Check service status
check_service_status() {
    log_info "Checking service status..."
    
    if systemctl is-active --quiet nginx; then
        log_success "NGINX is running"
        
        # Test HTTP endpoint
        if curl -s --max-time 5 "http://localhost/health" >/dev/null 2>&1; then
            log_success "Load balancer health check passed"
        else
            log_warning "Load balancer health check failed (this is normal if backend services are not running)"
        fi
    else
        log_error "NGINX is not running"
        exit 1
    fi
}

# Show status and instructions
show_status() {
    echo ""
    echo "📊 Load Balancer Status:"
    echo "========================"
    echo "🟢 NGINX: $(systemctl is-active nginx)"
    echo "📁 Config: $NGINX_CONFIG_DEST"
    echo "📄 Logs: /var/log/nginx/"
    echo ""
    echo "🌐 Endpoints:"
    echo "- Frontend:  http://localhost/"
    echo "- WebSocket: ws://localhost/ws"
    echo "- Health:    http://localhost/health"
    echo ""
    echo "🔧 Management Commands:"
    echo "- Test config:   sudo nginx -t"
    echo "- Reload config: sudo systemctl reload nginx"
    echo "- View logs:     sudo tail -f /var/log/nginx/testnet_access.log"
    echo "- Stop service:  sudo systemctl stop nginx"
    echo ""
    echo "⚠️  Note: Backend services (WebSocket server on :8080, Frontend on :3000) must be running"
    echo "   Use: $PROJECT_ROOT/scripts/start-testnet-stack.sh"
}

# Uninstall function
uninstall_load_balancer() {
    log_info "Uninstalling load balancer configuration..."
    
    # Stop NGINX
    systemctl stop nginx 2>/dev/null || true
    
    # Remove configuration
    rm -f "$NGINX_ENABLED_DEST"
    rm -f "$NGINX_CONFIG_DEST"
    
    # Restore default site if backup exists
    if [ -f "/etc/nginx/sites-available/default" ] && [ ! -L "/etc/nginx/sites-enabled/default" ]; then
        ln -s "/etc/nginx/sites-available/default" "/etc/nginx/sites-enabled/default"
    fi
    
    systemctl start nginx 2>/dev/null || true
    
    log_success "Load balancer configuration removed"
}

# Main script logic
case "${1:-install}" in
    install)
        log_info "🚀 Setting up NGINX Load Balancer for NEAR Oracle Testnet"
        echo ""
        
        check_permissions
        check_nginx_installed
        backup_existing_config
        create_log_directories
        remove_default_site
        install_nginx_config
        test_nginx_config
        restart_nginx
        check_service_status
        show_status
        
        echo ""
        log_success "🎉 Load balancer setup completed successfully!"
        ;;
    uninstall)
        check_permissions
        uninstall_load_balancer
        ;;
    status)
        show_status
        ;;
    test)
        check_permissions
        test_nginx_config
        ;;
    *)
        echo "Usage: $0 {install|uninstall|status|test}"
        echo ""
        echo "Commands:"
        echo "  install   - Install and configure NGINX load balancer"
        echo "  uninstall - Remove load balancer configuration"
        echo "  status    - Show current load balancer status"
        echo "  test      - Test NGINX configuration"
        exit 1
        ;;
esac