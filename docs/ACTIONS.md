# GitHub Actions Integration Plan

## Overview

This document outlines the recommended GitHub Actions workflows for the Nearacles Protocol project. The integration plan is organized in phases, prioritizing immediate value and building up to advanced automation features.

## Project Analysis

**Key Characteristics:**
- TypeScript/Node.js with strict type checking requirements  
- NEAR Protocol smart contract integration
- OpenAI API integration for AI research
- Complex multi-service architecture (oracle solvers, intent broadcasters, signing services)
- Economic mechanisms with staking/rewards
- Package publishing potential (`nearacles-protocol`)

**Current Development Practices:**
- `npm run build` for compilation
- `npm run type-check` or `tsc --noEmit` for type validation  
- ESLint and Prettier for code quality
- Strict git workflow with explicit file staging

## Phase 1: Core CI/CD Pipeline (Immediate Value)

### 1. Build & Type Check Workflow
**File:** `.github/workflows/ci.yml`

```yaml
name: CI
on: [push, pull_request]

jobs:
  build:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        node-version: [18.x, 20.x, latest]
    
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node-version }}
          cache: 'npm'
      
      - run: npm ci
      - run: npm run build
      - run: npm run type-check
      - run: npm test
```

**Benefits:**
- Ensures TypeScript compilation works across Node.js versions
- Catches type errors early in development
- Faster builds with npm cache

### 2. Code Quality Enforcement
**File:** `.github/workflows/code-quality.yml`

```yaml
name: Code Quality
on: [push, pull_request]

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'
      
      - run: npm ci
      - run: npm run lint
      - run: npm run format:check
      
      # Auto-fix for PRs
      - name: Auto-fix code style
        if: github.event_name == 'pull_request'
        run: |
          npm run lint:fix
          npm run format
        continue-on-error: true
```

**Benefits:**
- Enforces consistent code style
- Auto-fixes formatting issues in PRs
- Maintains TypeScript strict mode compliance

### 3. Security Scanning
**File:** `.github/workflows/security.yml`

```yaml
name: Security
on: [push, pull_request]

jobs:
  security:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'
      
      - run: npm ci
      - run: npm audit --audit-level=moderate
      
      # NEAR private key validation
      - name: Check for leaked secrets
        run: |
          ! grep -r "ed25519:" src/ || exit 1
          ! grep -r "PRIVATE_KEY" src/ || exit 1
      
      # CodeQL Analysis
      - uses: github/codeql-action/init@v3
        with:
          languages: typescript
      - uses: github/codeql-action/analyze@v3
```

**Benefits:**
- Prevents API key and private key leaks
- Scans for dependency vulnerabilities
- Advanced security analysis with CodeQL

## Phase 2: NEAR Protocol Specific (High Value)

### 4. Smart Contract CI
**File:** `.github/workflows/contracts.yml`

```yaml
name: NEAR Contracts
on: [push, pull_request]

jobs:
  contracts:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions-rs/toolchain@v1
        with:
          toolchain: stable
      
      - name: Install NEAR CLI
        run: npm install -g near-cli
      
      - name: Build contracts
        run: |
          cd contracts
          cargo build --target wasm32-unknown-unknown --release
      
      - name: Test contracts
        run: |
          cd contracts
          cargo test
      
      - name: Contract size check
        run: |
          wasm_size=$(wc -c < contracts/target/wasm32-unknown-unknown/release/*.wasm)
          if [ $wasm_size -gt 4000000 ]; then
            echo "Contract too large: ${wasm_size} bytes"
            exit 1
          fi
```

**Benefits:**
- Validates smart contract compilation
- Ensures contracts stay within size limits
- Automated testing for contract logic

### 5. Oracle Integration Testing
**File:** `.github/workflows/oracle-tests.yml`

```yaml
name: Oracle Integration
on: [push, pull_request]

jobs:
  oracle-tests:
    runs-on: ubuntu-latest
    env:
      NEAR_ENV: testnet
      OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY_TEST }}
    
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'
      
      - run: npm ci
      - run: npm run test:integration
      
      - name: Oracle response time benchmark
        run: |
          npm run benchmark:oracle
          if [ $? -ne 0 ]; then
            echo "Oracle performance below threshold"
            exit 1
          fi
```

**Benefits:**
- End-to-end testing with NEAR testnet
- Performance benchmarks for oracle services
- Integration validation with OpenAI API

## Phase 3: Automation & Maintenance (Medium Value)

### 6. Dependency Management
**File:** `.github/dependabot.yml`

```yaml
version: 2
updates:
  - package-ecosystem: "npm"
    directory: "/"
    schedule:
      interval: "weekly"
    open-pull-requests-limit: 5
    
  - package-ecosystem: "cargo"
    directory: "/contracts"
    schedule:
      interval: "weekly"
    open-pull-requests-limit: 3
```

**Benefits:**
- Automated security patches
- Regular dependency updates
- NEAR API version compatibility tracking

### 7. Release Automation
**File:** `.github/workflows/release.yml`

```yaml
name: Release
on:
  push:
    tags: ['v*']

jobs:
  release:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'
      
      - run: npm ci
      - run: npm run build
      
      - name: Publish to NPM
        if: startsWith(github.ref, 'refs/tags/')
        run: npm publish
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
      
      - name: Create GitHub Release
        uses: actions/create-release@v1
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        with:
          tag_name: ${{ github.ref }}
          release_name: Release ${{ github.ref }}
          draft: false
          prerelease: false
```

**Benefits:**
- Semantic versioning automation
- NPM package publishing
- Automated changelog generation

## Phase 4: Advanced Features (Lower Priority)

### 8. Documentation Automation
**File:** `.github/workflows/docs.yml`

```yaml
name: Documentation
on: [push]

jobs:
  docs:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'
      
      - run: npm ci
      
      - name: Generate API docs
        run: npm run docs:generate
      
      - name: Validate README links
        run: |
          npm install -g markdown-link-check
          markdown-link-check README.md
      
      - name: Update oracle metrics
        run: npm run metrics:update
```

### 9. Performance & Monitoring
**File:** `.github/workflows/performance.yml`

```yaml
name: Performance
on: [push, pull_request]

jobs:
  performance:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'
      
      - run: npm ci
      
      - name: Gas cost analysis
        run: npm run analyze:gas-costs
      
      - name: Load test solver network
        run: npm run test:load
      
      - name: Generate cost report
        run: npm run report:costs
```

### 10. Deployment Pipeline
**File:** `.github/workflows/deploy.yml`

```yaml
name: Deploy
on:
  push:
    branches: [main]
  workflow_dispatch:

jobs:
  deploy-testnet:
    runs-on: ubuntu-latest
    environment: testnet
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'
      
      - run: npm ci
      - run: npm run build
      
      - name: Deploy to testnet
        run: npm run deploy:testnet
        env:
          NEAR_ENV: testnet
          DEPLOY_KEY: ${{ secrets.TESTNET_DEPLOY_KEY }}
      
      - name: Health check
        run: npm run health-check:testnet

  deploy-mainnet:
    needs: deploy-testnet
    runs-on: ubuntu-latest
    environment: production
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'
      
      - run: npm ci
      - run: npm run build
      
      - name: Deploy to mainnet
        run: npm run deploy:mainnet
        env:
          NEAR_ENV: mainnet
          DEPLOY_KEY: ${{ secrets.MAINNET_DEPLOY_KEY }}
      
      - name: Health check
        run: npm run health-check:mainnet
```

## Implementation Recommendations

### Start with Phase 1
1. **Immediate setup:** `ci.yml`, `code-quality.yml`, `security.yml`
2. **Configure secrets:** `OPENAI_API_KEY_TEST`, `NPM_TOKEN`
3. **Add npm scripts:** `lint`, `format:check`, `type-check`

### Phase 2 Prerequisites
- Smart contracts in `contracts/` directory
- Integration test suite
- Benchmark scripts for oracle performance

### Required Secrets
- `OPENAI_API_KEY_TEST`: Test API key for integration tests
- `NPM_TOKEN`: For package publishing
- `TESTNET_DEPLOY_KEY`: NEAR testnet deployment key
- `MAINNET_DEPLOY_KEY`: NEAR mainnet deployment key

### Branch Protection Rules
```yaml
Required status checks:
- CI / build (ubuntu-latest, 18.x)
- CI / build (ubuntu-latest, 20.x) 
- Code Quality / lint
- Security / security

Require review: 1 reviewer
Dismiss stale reviews: enabled
Require up-to-date branches: enabled
```

## Benefits Summary

- **Quality Assurance:** Prevents TypeScript errors and style issues
- **Security:** Protects against leaked keys and vulnerable dependencies  
- **NEAR Integration:** Validates smart contracts and oracle performance
- **Automation:** Reduces manual testing and deployment overhead
- **Reliability:** Ensures consistent builds across environments
- **Maintenance:** Keeps dependencies updated and secure