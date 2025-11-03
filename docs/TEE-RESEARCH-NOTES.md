# TEE, Phala Dstack & Shade Agent Research Notes

**Research Date**: 2025-11-03
**Purpose**: Phase 2 Implementation - TEE Integration for Nearacles Oracle

---

## Overview

This document contains comprehensive research on TEE (Trusted Execution Environment), Phala Dstack, and NEAR Shade Agents for implementing a TEE-secured price oracle.

---

## 1. Phala Dstack

### What is Dstack?

Dstack is a TEE-based infrastructure platform that simplifies deploying confidential applications. It converts standard Docker containers into Confidential VM (CVM) images that run in Trusted Execution Environments.

### Core Features

1. **Container Conversion**
   - Transform standard Docker containers for TEE deployment
   - No TEE-specific code required in application
   - Works with existing Docker images

2. **Remote Attestation**
   - Verification APIs
   - Web interface visualization
   - Cryptographic proof of execution environment

3. **Automatic HTTPS Wrapping**
   - Content-addressed domains: `0xABCD.dstack.host`
   - Automatic SSL certificate management
   - Secure communication by default

4. **Decentralized Root-of-Trust**
   - Separates application execution from hardware
   - Hardware-independent verification
   - Portable across TEE providers

### TEE Architecture

```
┌─────────────────────────────────────────────────┐
│            Confidential VM (CVM)                │
├─────────────────────────────────────────────────┤
│                                                 │
│  ┌──────────────┐  ┌──────────────┐           │
│  │  Container 1 │  │  Container 2 │           │
│  │  (App)       │  │  (App)       │           │
│  └──────────────┘  └──────────────┘           │
│                                                 │
│  ┌─────────────────────────────────────────┐  │
│  │  dstack Component                        │  │
│  │  - Manages CVM environment               │  │
│  │  - Handles remote attestation            │  │
│  │  - Container lifecycle management        │  │
│  └─────────────────────────────────────────┘  │
│                                                 │
│  ┌─────────────────────────────────────────┐  │
│  │  tappd + KMS                             │  │
│  │  - Derives encryption keys               │  │
│  │  - Application storage security          │  │
│  │  - Data integrity                        │  │
│  └─────────────────────────────────────────┘  │
│                                                 │
└─────────────────────────────────────────────────┘
```

### Attestation Mechanism

**Remote Attestation (RA) Report** contains:
- Docker image hashes
- Container arguments
- Environment variables
- Runtime configuration

**Cryptographic Signatures**:
1. **TEE Hardware Key** - Proves execution in genuine TEE
2. **Application-Specific Key** - Proves correct application code

**Verification**:
- Third-party verification through specialized tools
- Web-based explorer for attestation reports
- Programmatic API for verification

### Deployment Process

1. **Build Docker Image**
   ```bash
   docker build -t nearacles-oracle:latest .
   ```

2. **Push to Registry**
   ```bash
   docker push nearacles-oracle:latest
   ```

3. **Deploy to Dstack**
   ```bash
   dstack deploy --image nearacles-oracle:latest
   ```

4. **Receive Attestation**
   ```bash
   dstack get-attestation --deployment <deployment-id>
   ```

### Data Persistence

- **Decentralized KMS**: Manages encryption keys
- **Secure Migration**: Move between hardware without data loss
- **Data Integrity**: Cryptographic guarantees
- **Encrypted Storage**: Application data encrypted at rest

---

## 2. NEAR Shade Agents

### What are Shade Agents?

Shade Agents are verifiable applications built with TypeScript/Hono that run in TEE environments. They are designed for tasks like price oracles, with automatic TEE integration through NEAR tooling.

### Key Characteristics

1. **TEE Abstraction**
   - No TEE-specific code required
   - Framework handles TEE complexity
   - Focus on business logic

2. **Automatic Deployment**
   - Agent contract deployment automated
   - Phala Cloud integration built-in
   - Simple CLI-based deployment

3. **Verifiable Execution**
   - Runs in Phala Cloud TEE
   - Remote attestation automatic
   - Cryptographic proof of execution

### Architecture

```
┌─────────────────────────────────────────────────┐
│         NEAR Shade Agent                        │
├─────────────────────────────────────────────────┤
│                                                 │
│  ┌──────────────────────────────────────────┐ │
│  │  Hono TypeScript Application             │ │
│  │  - REST API endpoints                    │ │
│  │  - Business logic (price fetching)       │ │
│  │  - No TEE-specific code                  │ │
│  └──────────────────────────────────────────┘ │
│                                                 │
│  ┌──────────────────────────────────────────┐ │
│  │  Shade Agent Framework                   │ │
│  │  - TEE integration layer                 │ │
│  │  - NEAR account derivation               │ │
│  │  - Attestation handling                  │ │
│  └──────────────────────────────────────────┘ │
│                                                 │
│  ┌──────────────────────────────────────────┐ │
│  │  Phala Cloud TEE Runtime                 │ │
│  │  - Secure execution                      │ │
│  │  - Remote attestation                    │ │
│  │  - Isolated environment                  │ │
│  └──────────────────────────────────────────┘ │
│                                                 │
└─────────────────────────────────────────────────┘
```

### Deployment Process

**Prerequisites**:
- NEAR testnet account + seed phrase
- Phala Cloud account (free) + API key
- Docker installation + login
- NEAR CLI
- Shade Agent CLI

**Local Development**:
```bash
# 1. Clone template
git clone https://github.com/near/shade-agent-template
cd shade-agent-template

# 2. Configure environment
cp .env.example .env
# Edit .env with your credentials

# 3. Run locally
shade-agent-cli &  # Terminal 1
npm run dev        # Terminal 2 - runs on localhost:3000
```

**TEE Deployment**:
```bash
# 1. Update contract ID
# Change prefix to: ac-sandbox.YOUR_NEAR_ACCOUNT.testnet

# 2. Deploy
shade-agent-cli

# 3. Get deployment URL
# CLI outputs: https://0xABCD.dstack.host
```

### Smart Contract Integration

**Agent Capabilities**:
- Derives NEAR account from TEE
- Signs transactions with derived key
- Pushes data to smart contracts
- Verifiable through attestation

**Example Oracle Flow**:
```
1. Fetch prices from APIs (in TEE)
2. Compute median/average
3. Sign price data with derived key
4. Push to NEAR contract
5. Contract verifies attestation
```

**REST API Endpoints**:
- `/api/agent-account` - Get agent's NEAR account
- `/api/eth-account` - Get agent's Ethereum account
- `/api/transaction` - Send transaction
- Custom endpoints for business logic

---

## 3. Implementation Strategy for Nearacles

### Phase 2.1: Research & Setup ✅

**Current Status**: COMPLETED

Research findings:
- Phala Dstack for TEE infrastructure
- Shade Agent for NEAR integration
- Attestation mechanism understood
- Deployment process documented

### Phase 2.2: TEE Attestation Service

**File**: `backend/services/tee-attestation.ts`

**Purpose**: Generate and verify TEE attestations

```typescript
interface TEEAttestation {
  node_id: string;
  attestation_hash: string;
  attestation_proof: string;  // Dstack RA Report
  timestamp: number;
  tee_provider: 'dstack' | 'phala';
  deployment_url: string;     // e.g., https://0xABCD.dstack.host
}

class TEEAttestationService {
  // Call Dstack attestation API
  async generateAttestation(): Promise<TEEAttestation>

  // Verify RA Report cryptographic signature
  async verifyAttestation(attestation: TEEAttestation): Promise<boolean>

  // Refresh attestation periodically
  async refreshAttestation(): Promise<TEEAttestation>
}
```

**Dstack Integration**:
```typescript
// Get attestation from Dstack
const response = await fetch('https://api.dstack.host/v1/attestation', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${DSTACK_API_KEY}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    deployment_id: DEPLOYMENT_ID
  })
});

const attestation = await response.json();
// Returns: { ra_report, signature, timestamp, ... }
```

### Phase 2.3: Shade Agent Integration

**File**: `backend/services/shade-agent-client.ts`

**Purpose**: Integrate with Shade Agent framework

```typescript
interface ShadeAgentConfig {
  nearAccount: string;
  privateKey: string;
  phalaApiKey: string;
  teeProvider: 'dstack' | 'phala';
}

class ShadeAgentClient {
  // Register agent with NEAR
  async register(): Promise<{ agentId: string; attestation: TEEAttestation }>

  // Get current attestation
  async getAttestation(): Promise<TEEAttestation>

  // Health check
  async healthCheck(): Promise<{ status: string; teeVerified: boolean }>
}
```

### Phase 2.4: Contract TEE Support

**File**: `contracts/oracle-intent/src/lib.rs`

**New Structures**:
```rust
#[near(serializers = [borsh, json])]
pub struct TEEAttestation {
    pub node_id: AccountId,
    pub attestation_hash: String,
    pub attestation_proof: String,  // Dstack RA Report
    pub timestamp: u64,
    pub tee_provider: String,
    pub deployment_url: String,
}

#[near(serializers = [borsh, json])]
pub struct OracleSolver {
    // ... existing fields ...
    pub attestation: Option<TEEAttestation>,
    pub tee_verified: bool,
    pub last_attestation_update: u64,
}
```

**New Functions**:
```rust
#[payable]
pub fn register_solver_with_attestation(
    &mut self,
    attestation: TEEAttestation
) -> String {
    // 1. Verify attestation proof
    require!(self.verify_tee_attestation(&attestation), "Invalid attestation");

    // 2. Register solver
    let solver = OracleSolver {
        // ... existing fields ...
        attestation: Some(attestation),
        tee_verified: true,
        last_attestation_update: env::block_timestamp_ms(),
    };

    // 3. Store solver
    self.solvers.insert(solver_id.to_string(), solver);
}

fn verify_tee_attestation(&self, attestation: &TEEAttestation) -> bool {
    // 1. Verify signature with Dstack public key
    // 2. Verify timestamp not expired
    // 3. Verify deployment_url matches expected pattern
    // 4. Verify attestation_proof contains correct image hash

    // For now, basic verification:
    !attestation.attestation_proof.is_empty() &&
    attestation.timestamp > 0 &&
    !attestation.deployment_url.is_empty()
}

pub fn refresh_attestation(
    &mut self,
    attestation: TEEAttestation
) -> String {
    let solver_id = env::predecessor_account_id();

    require!(
        self.verify_tee_attestation(&attestation),
        "Invalid attestation"
    );

    if let Some(solver) = self.solvers.get_mut(&solver_id.to_string()) {
        solver.attestation = Some(attestation);
        solver.last_attestation_update = env::block_timestamp_ms();
        "Attestation refreshed".to_string()
    } else {
        "Solver not found".to_string()
    }
}
```

### Phase 2.5: Oracle Solver Node Update

**File**: `backend/services/oracle-solver-node.ts`

**Integration**:
```typescript
import { TEEAttestationService } from './tee-attestation.js';
import { ShadeAgentClient } from './shade-agent-client.js';

export class OracleSolverNode {
  private teeAttestation: TEEAttestationService;
  private shadeAgent: ShadeAgentClient;

  async start(): Promise<void> {
    // ... existing initialization ...

    // NEW: TEE Integration
    if (process.env.TEE_MODE === 'enabled') {
      console.log('TEE Mode: ENABLED');

      // Initialize Shade Agent
      this.shadeAgent = new ShadeAgentClient({
        nearAccount: this.nearConfig.accountId,
        privateKey: this.nearConfig.privateKey,
        phalaApiKey: process.env.PHALA_API_KEY,
        teeProvider: 'dstack',
      });

      // Register agent
      const { agentId, attestation } = await this.shadeAgent.register();
      console.log('✅ Shade Agent registered:', agentId);

      // Generate attestation
      this.teeAttestation = new TEEAttestationService();
      const attestation = await this.teeAttestation.generateAttestation();
      console.log('✅ TEE attestation generated:', attestation.attestation_hash);

      // Register with attestation
      await this.nearIntegration.registerAsSolverWithAttestation(attestation);
      console.log('✅ Registered as TEE-verified solver');

      // Start attestation refresh (every 1 hour)
      this.startAttestationRefresh();
    } else {
      console.log('TEE Mode: DISABLED (development mode)');
      await this.nearIntegration.registerAsSolver();
    }

    // ... existing code ...
  }

  private startAttestationRefresh(): void {
    setInterval(async () => {
      const attestation = await this.teeAttestation.refreshAttestation();
      await this.nearIntegration.refreshAttestation(attestation);
      console.log('✅ Attestation refreshed');
    }, 3600000); // 1 hour
  }
}
```

---

## 4. Deployment Architecture

### Development Mode (Local)

```
┌─────────────────────────────────────────┐
│  Developer Machine                      │
├─────────────────────────────────────────┤
│                                         │
│  ┌──────────────────────────────────┐ │
│  │  Oracle Solver Node              │ │
│  │  - TEE_MODE=disabled             │ │
│  │  - Standard registration         │ │
│  │  - No attestation required       │ │
│  └──────────────────────────────────┘ │
│                                         │
└─────────────────────────────────────────┘
           │
           │ NEAR RPC
           ▼
    ┌──────────────┐
    │ NEAR Testnet │
    │  Contract    │
    └──────────────┘
```

### Production Mode (TEE)

```
┌─────────────────────────────────────────────┐
│  Phala Dstack (TEE)                         │
├─────────────────────────────────────────────┤
│                                             │
│  ┌────────────────────────────────────────┐│
│  │  Docker Container                      ││
│  │  - nearacles-oracle:latest             ││
│  │  - TEE_MODE=enabled                    ││
│  │  - https://0xABCD.dstack.host          ││
│  │                                         ││
│  │  ┌──────────────────────────────────┐ ││
│  │  │  Oracle Solver Node              │ ││
│  │  │  - Price Aggregator              │ ││
│  │  │  - Price Pusher                  │ ││
│  │  │  - TEE Attestation Service       │ ││
│  │  │  - Shade Agent Client            │ ││
│  │  └──────────────────────────────────┘ ││
│  └────────────────────────────────────────┘│
│                                             │
│  ┌────────────────────────────────────────┐│
│  │  dstack + tappd                        ││
│  │  - Attestation generation              ││
│  │  - Key derivation                      ││
│  │  - Secure storage                      ││
│  └────────────────────────────────────────┘│
│                                             │
└─────────────────────────────────────────────┘
           │
           │ NEAR RPC (with attestation)
           ▼
    ┌──────────────┐
    │ NEAR Testnet │
    │  Contract    │
    │  - Verifies  │
    │  attestation │
    └──────────────┘
```

---

## 5. Next Implementation Steps

### Step 1: Create TEE Attestation Service ✅ NEXT
- Define interfaces
- Implement mock attestation (for development)
- Prepare for real Dstack integration

### Step 2: Create Shade Agent Client
- Implement Shade Agent SDK integration
- Add registration flow
- Add health checks

### Step 3: Update Smart Contract
- Add TEE structures
- Implement attestation verification
- Add refresh mechanism

### Step 4: Update Oracle Solver Node
- Add TEE mode toggle
- Integrate attestation service
- Add attestation refresh

### Step 5: Dockerfile & Deployment
- Create Dockerfile for oracle node
- Test local Docker build
- Deploy to Dstack testnet

---

## 6. References

- Phala Dstack Docs: https://docs.phala.com/dstack/overview
- NEAR Shade Agents: https://docs.near.org/ai/shade-agents/quickstart/deploying
- Shade Agent Template: https://github.com/near/shade-agent-template
- Phala Cloud: https://cloud.phala.network

---

*Research completed: 2025-11-03*
*Next: Implement TEE Attestation Service*
