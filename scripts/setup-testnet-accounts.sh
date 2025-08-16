#!/bin/bash

# NEAR Oracle Intent Protocol - Testnet Account Setup Script
# Creates and configures test accounts for protocol testing

set -e

# Load configuration
source "$(dirname "$0")/../config/testnet.env" 2>/dev/null || {
    echo "⚠️  testnet.env not found. Please copy testnet.env.example to testnet.env and configure it."
    exit 1
}

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# Create test accounts with proper funding
create_test_accounts() {
    log_info "Creating test accounts for protocol testing..."
    
    local accounts=(
        "$TEST_SOLVER_ACCOUNT:5"
        "$TEST_USER_ACCOUNT:3"
        "challenger1.$OWNER_ACCOUNT_ID:2"
        "verifier1.$OWNER_ACCOUNT_ID:2"
    )
    
    for account_config in "${accounts[@]}"; do
        IFS=':' read -r account_id balance <<< "$account_config"
        
        if near state "$account_id" --networkId testnet &>/dev/null; then
            log_warning "Account $account_id already exists"
        else
            log_info "Creating account: $account_id with ${balance} NEAR"
            near create-account "$account_id" \
                --masterAccount "$OWNER_ACCOUNT_ID" \
                --initialBalance "$balance" \
                --networkId testnet
            
            if [ $? -eq 0 ]; then
                log_success "Created $account_id"
            else
                log_error "Failed to create $account_id"
                exit 1
            fi
        fi
    done
}

# Register accounts with the oracle contract
register_with_contract() {
    log_info "Registering test accounts with oracle contract..."
    
    # Register solver
    log_info "Registering solver: $TEST_SOLVER_ACCOUNT"
    near call "$CONTRACT_ACCOUNT_ID" register_solver '{}' \
        --accountId "$TEST_SOLVER_ACCOUNT" \
        --depositYocto "$SOLVER_REGISTRATION_DEPOSIT" \
        --networkId testnet
    
    # Set solver specializations
    near call "$CONTRACT_ACCOUNT_ID" update_solver_specialization \
        '{"specialization_areas": ["financial", "technology", "news"]}' \
        --accountId "$TEST_SOLVER_ACCOUNT" \
        --networkId testnet
    
    # Register regular user
    log_info "Registering user: $TEST_USER_ACCOUNT"
    near call "$CONTRACT_ACCOUNT_ID" register_user '{"role": "User"}' \
        --accountId "$TEST_USER_ACCOUNT" \
        --networkId testnet
    
    # Verify user
    near call "$CONTRACT_ACCOUNT_ID" verify_user \
        '{"user_id": "'$TEST_USER_ACCOUNT'", "verification_level": 3}' \
        --accountId "$OWNER_ACCOUNT_ID" \
        --networkId testnet
    
    log_success "Account registration completed"
}

# Create sample intents for testing
create_sample_intents() {
    log_info "Creating sample intents for testing..."
    
    local intents=(
        '{"question": "Is Bitcoin price above $50,000?", "required_sources": 3, "confidence_threshold": 0.85, "deadline_minutes": 120}'
        '{"question": "Will Ethereum 2.0 staking rewards exceed 5% APY?", "required_sources": 5, "confidence_threshold": 0.8, "deadline_minutes": 180}'
        '{"question": "Is the current unemployment rate in the US below 4%?", "required_sources": 4, "confidence_threshold": 0.9, "deadline_minutes": 240}'
    )
    
    for intent in "${intents[@]}"; do
        log_info "Creating intent: $(echo $intent | jq -r .question)"
        near call "$CONTRACT_ACCOUNT_ID" submit_credibility_intent "$intent" \
            --accountId "$TEST_USER_ACCOUNT" \
            --depositYocto "$MINIMUM_INTENT_DEPOSIT" \
            --networkId testnet
    done
    
    log_success "Sample intents created"
}

# Display setup summary
show_setup_summary() {
    log_success "🎉 Testnet account setup completed!"
    echo ""
    echo "📋 Account Summary:"
    echo "==================="
    echo "Owner/Admin: $OWNER_ACCOUNT_ID"
    echo "Contract: $CONTRACT_ACCOUNT_ID"
    echo "Test Solver: $TEST_SOLVER_ACCOUNT"
    echo "Test User: $TEST_USER_ACCOUNT"
    echo ""
    echo "🔧 Useful Commands:"
    echo "View pending intents: near view $CONTRACT_ACCOUNT_ID get_pending_intents --networkId testnet"
    echo "View solver info: near view $CONTRACT_ACCOUNT_ID get_solver '{\"solver_id\": \"$TEST_SOLVER_ACCOUNT\"}' --networkId testnet"
    echo "View user profile: near view $CONTRACT_ACCOUNT_ID get_user_profile '{\"user_id\": \"$TEST_USER_ACCOUNT\"}' --networkId testnet"
}

main() {
    log_info "🏗️  Setting up NEAR Oracle Intent Protocol testnet accounts"
    echo ""
    
    create_test_accounts
    register_with_contract
    create_sample_intents
    show_setup_summary
}

main "$@"