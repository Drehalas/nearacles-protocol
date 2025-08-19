#!/bin/bash

# NEAR Oracle Intent Protocol - Testnet Deployment Script
# Deploys and initializes the complete oracle protocol to NEAR testnet

set -e

# Configuration
NEAR_ENV="testnet"
CONTRACT_DIR="contracts/oracle-intent"
WASM_FILE="$CONTRACT_DIR/target/wasm32-unknown-unknown/release/oracle_intent.wasm"
OWNER_ACCOUNT_ID="${OWNER_ACCOUNT_ID:-nearacles.testnet}"
CONTRACT_ACCOUNT_ID="${CONTRACT_ACCOUNT_ID:-oracle-intent.nearacles.testnet}"

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
    
    # Check if near CLI is installed
    if ! command -v near &> /dev/null; then
        log_error "NEAR CLI is not installed. Please install it first:"
        log_error "npm install -g near-cli"
        exit 1
    fi
    
    # Check if logged in to NEAR testnet
    if ! near state $OWNER_ACCOUNT_ID --networkId testnet &> /dev/null; then
        log_error "Not logged in to NEAR testnet or account doesn't exist"
        log_error "Please login with: near login"
        exit 1
    fi
    
    # Check if Rust is installed
    if ! command -v cargo &> /dev/null; then
        log_error "Rust/Cargo is not installed. Please install it first."
        exit 1
    fi
    
    # Check if wasm32 target is installed
    if ! rustup target list --installed | grep -q wasm32-unknown-unknown; then
        log_info "Installing wasm32-unknown-unknown target..."
        rustup target add wasm32-unknown-unknown
    fi
    
    log_success "Prerequisites check passed"
}

# Build the smart contract
build_contract() {
    log_info "Building smart contract..."
    
    cd $CONTRACT_DIR
    
    # Clean previous builds
    cargo clean
    
    # Build the contract
    cargo build --target wasm32-unknown-unknown --release
    
    if [ ! -f "$WASM_FILE" ]; then
        log_error "Contract build failed - WASM file not found"
        exit 1
    fi
    
    # Get the size of the compiled contract
    WASM_SIZE=$(du -h "$WASM_FILE" | cut -f1)
    log_success "Contract built successfully (Size: $WASM_SIZE)"
    
    cd - > /dev/null
}

# Create subaccount for the contract (if it doesn't exist)
create_contract_account() {
    log_info "Creating contract account: $CONTRACT_ACCOUNT_ID"
    
    # Check if account already exists
    if near state $CONTRACT_ACCOUNT_ID --networkId testnet &> /dev/null; then
        log_warning "Contract account $CONTRACT_ACCOUNT_ID already exists"
        return 0
    fi
    
    # Create the subaccount
    near create-account $CONTRACT_ACCOUNT_ID --masterAccount $OWNER_ACCOUNT_ID --initialBalance 10 --networkId testnet
    
    if [ $? -eq 0 ]; then
        log_success "Contract account created successfully"
    else
        log_error "Failed to create contract account"
        exit 1
    fi
}

# Deploy the smart contract
deploy_contract() {
    log_info "Deploying smart contract to $CONTRACT_ACCOUNT_ID..."
    
    near deploy $CONTRACT_ACCOUNT_ID --wasmFile $WASM_FILE --networkId testnet
    
    if [ $? -eq 0 ]; then
        log_success "Contract deployed successfully"
    else
        log_error "Contract deployment failed"
        exit 1
    fi
}

# Initialize the contract
initialize_contract() {
    log_info "Initializing contract with owner: $OWNER_ACCOUNT_ID"
    
    near call $CONTRACT_ACCOUNT_ID new '{"owner": "'$OWNER_ACCOUNT_ID'"}' --accountId $OWNER_ACCOUNT_ID --networkId testnet
    
    if [ $? -eq 0 ]; then
        log_success "Contract initialized successfully"
    else
        log_error "Contract initialization failed"
        exit 1
    fi
}

# Set up initial test data
setup_test_data() {
    log_info "Setting up initial test data..."
    
    # Register owner as admin
    near call $CONTRACT_ACCOUNT_ID register_user '{"role": "Admin"}' --accountId $OWNER_ACCOUNT_ID --networkId testnet
    
    # Create a test solver account (if specified)
    if [ ! -z "$TEST_SOLVER_ACCOUNT" ]; then
        log_info "Registering test solver: $TEST_SOLVER_ACCOUNT"
        near call $CONTRACT_ACCOUNT_ID register_solver '{}' --accountId $TEST_SOLVER_ACCOUNT --depositYocto 2000000000000000000000000 --networkId testnet
    fi
    
    log_success "Test data setup completed"
}

# Verify deployment
verify_deployment() {
    log_info "Verifying deployment..."
    
    # Check contract state
    CONTRACT_STATE=$(near view $CONTRACT_ACCOUNT_ID get_contract_info --networkId testnet)
    
    if [ $? -eq 0 ]; then
        log_success "Contract is responding correctly"
        echo "$CONTRACT_STATE"
    else
        log_error "Contract verification failed"
        exit 1
    fi
    
    # Check storage stats
    STORAGE_STATS=$(near view $CONTRACT_ACCOUNT_ID get_storage_stats --networkId testnet)
    log_info "Storage stats: $STORAGE_STATS"
    
    # Get all admins
    ADMINS=$(near view $CONTRACT_ACCOUNT_ID get_all_admins --networkId testnet)
    log_info "Contract admins: $ADMINS"
}

# Display deployment summary
show_deployment_summary() {
    log_success "🎉 Deployment completed successfully!"
    echo ""
    echo "📋 Deployment Summary:"
    echo "========================"
    echo "Network: NEAR Testnet"
    echo "Contract Account: $CONTRACT_ACCOUNT_ID"
    echo "Owner Account: $OWNER_ACCOUNT_ID"
    echo "Contract Size: $(du -h $WASM_FILE | cut -f1)"
    echo ""
    echo "🔧 Useful Commands:"
    echo "View contract info: near view $CONTRACT_ACCOUNT_ID get_contract_info --networkId testnet"
    echo "View storage stats: near view $CONTRACT_ACCOUNT_ID get_storage_stats --networkId testnet"
    echo "Submit test intent: near call $CONTRACT_ACCOUNT_ID submit_credibility_intent '{\"question\": \"Test question?\", \"required_sources\": 3, \"confidence_threshold\": 0.8, \"deadline_minutes\": 60}' --accountId [YOUR_ACCOUNT] --depositYocto 1000000000000000000000000 --networkId testnet"
    echo ""
    echo "📚 Documentation: https://github.com/Drehalas/nearacles-protocol"
}

# Cleanup function
cleanup() {
    cd "$INITIAL_DIR"
}

# Main deployment flow
main() {
    INITIAL_DIR=$(pwd)
    trap cleanup EXIT
    
    log_info "🚀 Starting NEAR Oracle Intent Protocol Testnet Deployment"
    echo ""
    
    check_prerequisites
    build_contract
    create_contract_account
    deploy_contract
    initialize_contract
    setup_test_data
    verify_deployment
    show_deployment_summary
}

# Run the deployment
main "$@"