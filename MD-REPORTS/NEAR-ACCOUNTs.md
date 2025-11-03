# NEAR Protocol Accounts

## Testnet Accounts

### Main Account
- **Account ID**: `nearacles.testnet`
- **Public Key**: `ed25519:9uh9eZeSXyTwchcnjbevtgS5juqVcrqwCJvcRKdjdRCJ`
- **Private Key**: `ed25519:2EM3bCc1YR7prEuaVT382DpgXFTi3qf1X9V2vs9RAHAUQqQUXJMwkBtUqfzAuuy4ZdmRfw72SVhqjdHgqmMRW9xJ`
- **Purpose**: Main testnet account for deployment and testing

### Oracle Contract v3
- **Account ID**: `oracle-v3.nearacles.testnet`
- **Public Key**: `ed25519:5ppTGPFqFzxg8McdfaxTbaYNrvwVx53VM6q5VkbLiPJq`
- **Contract**: Oracle Intent Contract (Simplified version)
- **Deployed**: 2025-11-03
- **Status**: Active
- **Balance**: ~5 NEAR
- **Purpose**: Production oracle smart contract
- **Features**:
  - Solver registration with stake
  - Minimal implementation focused on core functionality
  - Built with Rust 1.81.0 + WASM 1.0 compatibility flags

### Previous Contract Versions (Deprecated)
- `nearacles.testnet` - Initial deployment (state migration issues)
- `oracle.nearacles.testnet` - Second attempt (state migration issues)

## Mainnet Accounts

### Main Account
- **Account ID**: `nearacles.near`
- **Private Key**: `ed25519:2SQRthkucnzwbwLLoyBhMMigqNJSW4k5MAeMUNQmeL1QYkEX1cmANiizXZMFEmeiYhtugFUb5V4EupUVFGygVKad`
- **Purpose**: Main production account (not yet deployed)

## RPC Endpoints

### Current Configuration
- **Testnet RPC**: `https://test.rpc.fastnear.com`
- **Previous**: `https://rpc.testnet.near.org` (Deprecated)
- **Previous**: `https://near-testnet.lava.build` (403 Forbidden)

## Contract Build Configuration

### Rust Toolchain
- **Version**: 1.81.0 (eeb90cda1 2024-09-04)
- **Target**: wasm32-unknown-unknown
- **Build Flags**: `RUSTFLAGS="-C target-feature=-sign-ext,-bulk-memory,-reference-types"`
- **Purpose**: WASM 1.0 compatibility for NEAR VM

### NEAR SDK
- **Version**: 5.5.0
- **Pattern**: `#[near(serializers = [borsh, json])]`
- **Storage**: HashMap (not UnorderedMap/LookupMap)

## Explorer Links

- Testnet Explorer: https://testnet.nearblocks.io/
- Main Account: https://testnet.nearblocks.io/address/nearacles.testnet
- Oracle v3 Contract: https://testnet.nearblocks.io/address/oracle-v3.nearacles.testnet

## Notes

- All contracts built with WASM 1.0 compatibility to avoid deserialization errors
- Simplified contract structure based on working yetify-agent pattern
- register_solver function tested and working successfully
- Backend uses `.env` file for configuration
