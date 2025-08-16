# NEAR Oracle Protocol Performance Testing Framework

Comprehensive performance testing framework for validating the NEAR Oracle Intent Protocol under various load conditions.

## Overview

This framework provides performance testing for:
- **Load Testing**: Concurrent user scenarios with multiple intents
- **Throughput Measurement**: Operations per second under load  
- **Latency Analysis**: Response time distribution and percentiles
- **WebSocket Performance**: Real-time communication latency
- **Error Rate Monitoring**: System reliability under stress
- **Resource Usage**: Gas consumption and storage efficiency

## Quick Start

### Prerequisites

1. **NEAR environment set up**
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

### Running Performance Tests

#### Quick Performance Check (Medium Load)
```bash
npm run test:performance
```

#### Light Load Testing (Baseline)
```bash
npm run test:performance:light
```

#### Heavy Load Testing (Stress Test)
```bash
npm run test:performance:heavy
```

#### Complete Performance Suite
```bash
npm run test:performance:all
```

#### Custom Configuration
```bash
npm run test:performance -- --scenario burst --websocket ws://localhost:8080 --verbose
```

## Test Scenarios

### 1. Light Load (Baseline)
- **Users**: 5 concurrent
- **Intents per user**: 3
- **Duration**: 2 minutes
- **Ramp-up**: 30 seconds
- **Purpose**: Establish baseline performance metrics

### 2. Medium Load (Normal Usage)
- **Users**: 25 concurrent  
- **Intents per user**: 5
- **Duration**: 5 minutes
- **Ramp-up**: 60 seconds
- **Purpose**: Simulate typical usage patterns

### 3. Heavy Load (Stress Test)
- **Users**: 100 concurrent
- **Intents per user**: 10  
- **Duration**: 10 minutes
- **Ramp-up**: 120 seconds
- **Purpose**: Test system limits and identify bottlenecks

### 4. Burst Load (Traffic Spike)
- **Users**: 50 concurrent
- **Intents per user**: 20
- **Duration**: 3 minutes  
- **Ramp-up**: 15 seconds
- **Purpose**: Simulate sudden traffic spikes

## Performance Benchmarks

### Default Thresholds

| Metric | Threshold | Description |
|--------|-----------|-------------|
| **Max Response Time** | 10,000ms | Maximum acceptable average response time |
| **Min Throughput** | 0.5 ops/sec | Minimum required operations per second |
| **Max Error Rate** | 5% | Maximum acceptable error percentage |
| **Max WebSocket Latency** | 1,000ms | Maximum acceptable real-time latency |

### Custom Benchmarks

You can customize benchmarks in the test runner:

```typescript
const customBenchmarks = {
  maxAcceptableResponseTime: 5000, // 5 seconds
  minThroughputPerSecond: 1.0,     // 1 ops/sec
  maxErrorRate: 0.02,              // 2% max error
  maxWebSocketLatency: 500         // 500ms max latency
};
```

## Metrics Collected

### Core Performance Metrics
- **Total Intents**: Number of intents submitted
- **Success Rate**: Percentage of successful operations
- **Throughput**: Operations per second
- **Response Time**: Average, min, max response times
- **Error Rate**: Percentage of failed operations

### WebSocket Metrics (if enabled)
- **Connections Established**: Number of successful WebSocket connections
- **Messages Received**: Real-time message count
- **Average Latency**: WebSocket message round-trip time

### Gas Usage Analysis
- **Total Gas**: Cumulative gas consumption
- **Average Gas**: Gas per operation
- **Max Gas**: Peak gas usage

## Reports and Analysis

### Report Types

1. **Console Output**: Real-time progress and summary
2. **JSON Reports**: Detailed machine-readable data
3. **HTML Reports**: Visual performance dashboard
4. **Timeline Data**: Performance metrics over time

### Sample Report Structure

```json
{
  "scenario": "medium",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "passed": true,
  "metrics": {
    "totalIntents": 125,
    "successfulIntents": 122,
    "failedIntents": 3,
    "averageResponseTime": 2340,
    "throughputPerSecond": 0.68,
    "errorRate": 0.024,
    "websocketMetrics": {
      "averageLatency": 145
    }
  }
}
```

### HTML Dashboard

The HTML report includes:
- **Performance Summary**: Key metrics overview
- **Timeline Charts**: Performance over time
- **Scenario Comparison**: Side-by-side results
- **Benchmark Analysis**: Pass/fail indicators
- **Error Details**: Failure root cause analysis

## Configuration Options

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NEAR_NETWORK_ID` | Target network (`testnet` or `sandbox`) | `sandbox` |
| `ORACLE_CONTRACT_ID` | Contract account ID | Deploys fresh contract |
| `WEBSOCKET_URL` | WebSocket server URL | Not tested |
| `PERFORMANCE_OUTPUT_DIR` | Report output directory | `./performance-reports` |

### Command Line Options

```bash
Options:
  --scenario <name>     Test scenario: light|medium|heavy|burst|all
  --websocket <url>     WebSocket server URL for real-time testing
  --contract <id>       Contract account ID (deploys fresh if not provided)
  --verbose             Enable verbose output and detailed logging
  --output <dir>        Output directory for reports
  --help                Show help and usage information
```

## Integration Testing

### With Testnet Deployment

```bash
# Deploy to testnet first
./scripts/deploy-testnet.sh

# Run performance tests against testnet
npm run test:performance -- \
  --contract oracle-intent.nearacles.testnet \
  --websocket wss://websocket.nearacles.app \
  --scenario heavy
```

### With CI/CD Pipeline

```yaml
name: Performance Testing

jobs:
  performance:
    runs-on: ubuntu-latest
    steps:
      - name: Run Performance Tests
        run: npm run test:performance:all
      
      - name: Upload Reports
        uses: actions/upload-artifact@v3
        with:
          name: performance-reports
          path: performance-reports/
      
      - name: Check Performance Thresholds
        run: |
          if grep -q '"passed":false' performance-reports/*.json; then
            echo "Performance tests failed!"
            exit 1
          fi
```

## WebSocket Performance Testing

### Setup

1. **Start WebSocket Server**
   ```bash
   npm run start-websocket-server
   ```

2. **Run Tests with WebSocket**
   ```bash
   npm run test:performance -- --websocket ws://localhost:8080
   ```

### WebSocket Metrics

The framework measures:
- **Connection Success Rate**: Percentage of successful WebSocket connections
- **Message Latency**: Round-trip time for messages
- **Message Throughput**: Messages per second
- **Connection Stability**: Reconnection frequency

## Troubleshooting

### Common Issues

#### High Response Times
```
Error: Response time 15000ms exceeds 10000ms threshold
```
**Causes**: Network latency, contract complexity, insufficient gas
**Solutions**: Optimize contract calls, increase gas limits, check network

#### Low Throughput
```
Error: Throughput 0.2 ops/sec below 0.5 ops/sec threshold
```
**Causes**: Resource constraints, network bottlenecks, concurrency limits
**Solutions**: Reduce concurrent users, optimize contract logic

#### WebSocket Connection Failures
```
Warning: WebSocket connection failed
```
**Causes**: Server not running, incorrect URL, firewall issues
**Solutions**: Verify server status, check URL, test connectivity

#### Gas Limit Exceeded
```
Error: Transaction exceeded gas limit
```
**Causes**: Complex contract operations, insufficient gas allocation
**Solutions**: Optimize contract methods, increase gas limits

### Debug Mode

Enable verbose logging for detailed analysis:

```bash
npm run test:performance -- --verbose
```

This provides:
- Individual transaction details
- Gas usage breakdown  
- WebSocket message tracing
- Timeline event logging
- Error stack traces

### Performance Optimization Tips

1. **Contract Optimization**
   - Minimize storage operations
   - Batch multiple operations
   - Optimize data structures
   - Use efficient algorithms

2. **Network Optimization**
   - Use connection pooling
   - Implement retry logic
   - Monitor network latency
   - Use appropriate timeouts

3. **Load Distribution**
   - Implement rate limiting
   - Use load balancers
   - Scale horizontally
   - Monitor resource usage

## Benchmarking Best Practices

### Consistent Environment
- Use dedicated test environments
- Consistent hardware specifications
- Stable network conditions
- Isolated test execution

### Meaningful Metrics
- Define realistic performance targets
- Consider user experience impact
- Account for peak usage scenarios
- Monitor trends over time

### Automated Monitoring
- Integrate with CI/CD pipelines
- Set up performance alerts
- Track performance regressions
- Compare against baselines

## Contributing

### Adding New Scenarios

1. Define scenario configuration in `performanceTestScenarios`
2. Update benchmark thresholds if needed
3. Add scenario to npm scripts
4. Document expected behavior

### Custom Metrics

Add custom metrics to the load tester:

```typescript
interface CustomMetrics {
  customMetric: number;
}

// In load tester
this.metrics.customMetric = calculateCustomMetric();
```

### Extending Reports

Modify the report generator to include custom visualizations:

```typescript
// Add custom charts or metrics to HTML report
const customChart = generateCustomChart(results);
htmlTemplate += customChart;
```

## Support

For issues with performance testing:
1. Check system requirements and dependencies
2. Review configuration and environment variables
3. Examine error logs and reports
4. Test with lighter load scenarios first
5. Open an issue with performance report data