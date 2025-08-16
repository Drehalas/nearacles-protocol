# NEAR Testnet End-to-End Validation Framework

Comprehensive testing framework for validating the complete NEAR Oracle Intent Protocol on testnet and sandbox environments.

## Overview

This framework provides end-to-end validation of:
- Complete intent lifecycle (submit → accept → evaluate → finalize)
- Challenge and dispute workflows
- Performance and reliability under load
- Real-time WebSocket communication
- Error handling and edge cases

## Quick Start

### Prerequisites

1. **NEAR CLI installed and configured**
   ```bash
   npm install -g near-cli
   near login  # For testnet testing
   ```

2. **Contract built** (for sandbox testing)
   ```bash
   cd contracts/oracle-intent
   cargo build --target wasm32-unknown-unknown --release
   ```

3. **Dependencies installed**
   ```bash
   npm install
   ```

### Running Tests

#### Sandbox Testing (Default)
```bash
# Run basic end-to-end tests in sandbox
npm run test:e2e

# Run with verbose output
npm run test:e2e:verbose
```

#### Testnet Testing
```bash
# Run against NEAR testnet (requires deployed contract)
npm run test:e2e:testnet

# Full testnet validation with verbose output
npm run validate:testnet
```

#### Custom Configuration
```bash
# Run with custom parameters
npm run test:e2e -- --network testnet --contract oracle.testnet --websocket ws://localhost:8080 --verbose
```

## Test Suites

### 1. Complete Intent Flow Validation
Tests the entire intent lifecycle:
- User registration and solver registration
- Intent submission with proper parameters
- Solver accepting and processing intents
- Evaluation submission with sources and confidence
- Intent completion and finalization

### 2. Challenge and Dispute Workflow
Validates the adversarial validation system:
- Challenge submission with counter-sources
- Dispute resolution mechanisms
- Reputation and staking impacts
- Challenge period enforcement

### 3. Performance and Reliability
Tests system performance:
- Concurrent intent submissions
- Data integrity under load
- Storage optimization validation
- Gas usage monitoring

### 4. WebSocket Real-time Monitoring
Validates real-time communication:
- Intent broadcast notifications
- Evaluation update streaming
- Solver coordination messages
- Latency measurement

### 5. Error Handling and Edge Cases
Tests system robustness:
- Invalid input validation
- Insufficient deposit handling
- Intent expiry processing
- Network failure recovery

## Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NEAR_NETWORK_ID` | Target network (`testnet` or `sandbox`) | `sandbox` |
| `ORACLE_CONTRACT_ID` | Contract account ID for testnet | Required for testnet |
| `WEBSOCKET_URL` | WebSocket server URL | `ws://localhost:8080` |
| `TESTNET_MASTER_ACCOUNT` | Master account for testnet operations | Optional |
| `VERBOSE` | Enable verbose logging | `false` |

### Test Configuration File

Create `testnet.env` from `config/testnet.env.example`:
```bash
cp config/testnet.env.example config/testnet.env
# Edit with your configuration
```

## Testnet Deployment Testing

### Prerequisites for Testnet

1. **Deployed contract on testnet**
   ```bash
   # Use the deployment script
   ./scripts/deploy-testnet.sh
   ```

2. **Set up test accounts**
   ```bash
   # Create and configure test accounts
   ./scripts/setup-testnet-accounts.sh
   ```

3. **WebSocket server running** (optional)
   ```bash
   # Start WebSocket server for real-time tests
   npm run start-websocket-server
   ```

### Running Full Testnet Validation

```bash
# Set environment variables
export ORACLE_CONTRACT_ID="oracle-intent.your-account.testnet"
export WEBSOCKET_URL="wss://your-websocket-server.com"

# Run comprehensive validation
npm run validate:testnet
```

## Test Reports

Tests generate detailed reports:

- **Console output**: Real-time test progress and results
- **JSON report**: `testnet-validation-report.json` with detailed metrics
- **Summary file**: `testnet-test-summary.txt` with environment info

### Sample Report Structure
```json
{
  "timestamp": "2024-01-15T10:30:00.000Z",
  "config": {
    "networkId": "testnet",
    "contractId": "oracle-intent.nearacles.testnet"
  },
  "results": [
    {
      "suite": "End-to-End Validation",
      "passed": 5,
      "failed": 0,
      "duration": 45000
    }
  ],
  "summary": {
    "totalTests": 15,
    "passed": 14,
    "failed": 1,
    "successRate": 93.3
  }
}
```

## Troubleshooting

### Common Issues

#### Contract Not Found
```bash
Error: Contract oracle-intent.testnet not found
```
**Solution**: Deploy the contract first using `./scripts/deploy-testnet.sh`

#### WebSocket Connection Failed
```bash
WebSocket connection failed
```
**Solution**: Start the WebSocket server or update `WEBSOCKET_URL`

#### Insufficient Balance
```bash
Error: Insufficient balance for transaction
```
**Solution**: Fund test accounts with testnet NEAR tokens

#### Test Timeout
```bash
Timeout: Test exceeded 300000ms
```
**Solution**: Increase timeout with `--timeout 600000` or check network connectivity

### Debug Mode

Enable verbose logging for troubleshooting:
```bash
npm run test:e2e:verbose
```

This provides:
- Detailed contract call logs
- WebSocket message tracing
- Performance timing data
- Error stack traces

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Testnet Validation

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  testnet-validation:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build contract
        run: |
          cd contracts/oracle-intent
          cargo build --target wasm32-unknown-unknown --release
      
      - name: Run sandbox tests
        run: npm run test:e2e:verbose
      
      - name: Run testnet validation
        if: github.ref == 'refs/heads/main'
        env:
          ORACLE_CONTRACT_ID: ${{ secrets.TESTNET_CONTRACT_ID }}
          WEBSOCKET_URL: ${{ secrets.TESTNET_WEBSOCKET_URL }}
        run: npm run validate:testnet
```

## Contributing

### Adding New Tests

1. Create test files in appropriate suite sections
2. Follow existing naming conventions
3. Include proper setup/teardown
4. Add comprehensive assertions
5. Document expected behavior

### Test Structure

```typescript
describe('New Feature Validation', () => {
  let testAccounts: TestAccounts;
  
  beforeAll(async () => {
    // Test setup
  });
  
  afterAll(async () => {
    // Test cleanup
  });
  
  it('should validate new feature behavior', async () => {
    // Test implementation with clear steps
    console.log('📝 Testing new feature...');
    
    // Arrange
    // Act
    // Assert
    
    console.log('✅ New feature validation successful');
  });
});
```

## Support

For issues with the testing framework:
1. Check the troubleshooting section
2. Review test logs and reports
3. Verify environment configuration
4. Open an issue with detailed error information

## Performance Benchmarks

Target performance metrics for passing tests:
- Intent submission: < 5 seconds
- Solver response time: < 10 seconds
- WebSocket latency: < 100ms
- Challenge processing: < 15 seconds
- Full intent lifecycle: < 60 seconds