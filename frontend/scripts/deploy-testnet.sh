#!/bin/bash

# NEAR Oracle Intent Protocol - Frontend Testnet Deployment Script
# Deploys the frontend application to testnet environment

set -e

# Configuration
DEPLOYMENT_ENV="testnet"
BUILD_DIR="out"
TESTNET_CONFIG_FILE="config/testnet.ts"

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

# Check prerequisites
check_prerequisites() {
    log_info "Checking prerequisites..."
    
    # Check if Node.js is installed
    if ! command -v node &> /dev/null; then
        log_error "Node.js is not installed. Please install Node.js 18+ first."
        exit 1
    fi
    
    # Check Node.js version
    NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VERSION" -lt "18" ]; then
        log_error "Node.js version 18+ is required. Current version: $(node --version)"
        exit 1
    fi
    
    # Check if npm is installed
    if ! command -v npm &> /dev/null; then
        log_error "npm is not installed. Please install npm first."
        exit 1
    fi
    
    # Check if testnet config exists
    if [ ! -f "$TESTNET_CONFIG_FILE" ]; then
        log_error "Testnet configuration file not found: $TESTNET_CONFIG_FILE"
        log_error "Please ensure testnet configuration is properly set up."
        exit 1
    fi
    
    log_success "Prerequisites check passed"
}

# Install dependencies
install_dependencies() {
    log_info "Installing frontend dependencies..."
    
    npm ci --only=production
    
    if [ $? -eq 0 ]; then
        log_success "Dependencies installed successfully"
    else
        log_error "Failed to install dependencies"
        exit 1
    fi
}

# Set up testnet environment
setup_testnet_environment() {
    log_info "Setting up testnet environment..."
    
    # Create .env.local for testnet
    cat > .env.local << EOF
# Testnet Environment Configuration
NEXT_PUBLIC_NEAR_NETWORK_ID=testnet
NEXT_PUBLIC_NEAR_NODE_URL=https://rpc.testnet.near.org
NEXT_PUBLIC_NEAR_WALLET_URL=https://testnet.mynearwallet.com
NEXT_PUBLIC_NEAR_HELPER_URL=https://helper.testnet.near.org
NEXT_PUBLIC_ENVIRONMENT=testnet

# Analytics (disabled for testnet)
NEXT_PUBLIC_ANALYTICS_ENABLED=false

# Error tracking (basic logging for testnet)
NEXT_PUBLIC_ERROR_TRACKING_ENABLED=true

# Feature flags for testnet
NEXT_PUBLIC_FEATURE_ADVANCED_ANALYTICS=false
NEXT_PUBLIC_FEATURE_AI_INSIGHTS=true
NEXT_PUBLIC_FEATURE_REAL_TIME_UPDATES=true
EOF

    log_success "Testnet environment configured"
}

# Build the application
build_application() {
    log_info "Building frontend application for testnet..."
    
    # Set environment for build
    export NODE_ENV=production
    export NEXT_PUBLIC_DEPLOYMENT_ENV=testnet
    
    # Build the application
    npm run build
    
    if [ $? -eq 0 ]; then
        BUILD_SIZE=$(du -sh $BUILD_DIR 2>/dev/null | cut -f1 || echo "Unknown")
        log_success "Application built successfully (Size: $BUILD_SIZE)"
    else
        log_error "Application build failed"
        exit 1
    fi
}

# Optimize build for testnet
optimize_build() {
    log_info "Optimizing build for testnet deployment..."
    
    # Remove source maps in production build (keep them for testnet debugging)
    log_info "Keeping source maps for testnet debugging"
    
    # Verify critical files exist
    CRITICAL_FILES=("$BUILD_DIR/index.html" "$BUILD_DIR/_next")
    for file in "${CRITICAL_FILES[@]}"; do
        if [ ! -e "$file" ]; then
            log_error "Critical build file missing: $file"
            exit 1
        fi
    done
    
    log_success "Build optimization completed"
}

# Deploy to Vercel (if configured)
deploy_to_vercel() {
    if command -v vercel &> /dev/null; then
        log_info "Deploying to Vercel..."
        
        # Deploy with testnet environment
        vercel --prod --confirm --env NEXT_PUBLIC_DEPLOYMENT_ENV=testnet
        
        if [ $? -eq 0 ]; then
            log_success "Deployed to Vercel successfully"
        else
            log_warning "Vercel deployment failed or not configured"
        fi
    else
        log_info "Vercel CLI not found, skipping Vercel deployment"
    fi
}

# Generate deployment summary
generate_deployment_summary() {
    log_success "🎉 Frontend testnet deployment completed!"
    echo ""
    echo "📋 Deployment Summary:"
    echo "========================"
    echo "Environment: NEAR Testnet"
    echo "Build Output: $BUILD_DIR/"
    echo "Build Size: $(du -sh $BUILD_DIR 2>/dev/null | cut -f1 || echo "Unknown")"
    echo "Node Version: $(node --version)"
    echo ""
    echo "🔧 Next Steps:"
    echo "1. Upload the '$BUILD_DIR' directory to your hosting provider"
    echo "2. Configure your hosting to serve the static files"
    echo "3. Set up a custom domain pointing to testnet deployment"
    echo "4. Test wallet connectivity with testnet accounts"
    echo ""
    echo "🌐 Testnet Configuration:"
    echo "- Network: NEAR Testnet"
    echo "- RPC: https://rpc.testnet.near.org"
    echo "- Wallet: https://testnet.mynearwallet.com"
    echo ""
    echo "📚 Documentation: See frontend/README.md for testing guidelines"
}

# Cleanup function
cleanup() {
    # Remove temporary environment file if it exists
    [ -f ".env.local.backup" ] && mv .env.local.backup .env.local
}

# Main deployment flow
main() {
    trap cleanup EXIT
    
    log_info "🚀 Starting Frontend Testnet Deployment"
    echo ""
    
    # Backup existing .env.local if it exists
    [ -f ".env.local" ] && cp .env.local .env.local.backup
    
    check_prerequisites
    install_dependencies
    setup_testnet_environment
    build_application
    optimize_build
    deploy_to_vercel
    generate_deployment_summary
}

# Run the deployment
main "$@"