# NEAR Oracle Protocol Security Testing Framework

Comprehensive security testing framework for identifying vulnerabilities and ensuring the security posture of the NEAR Oracle Intent Protocol.

## Overview

This framework provides automated security testing for:
- **Access Control**: Role-based authorization and privilege escalation prevention
- **Input Validation**: Malicious input handling and sanitization
- **Data Integrity**: Storage consistency and data corruption prevention  
- **Attack Prevention**: Reentrancy, front-running, timing attacks
- **Resource Protection**: Gas exhaustion and storage overflow prevention
- **Authentication**: Unauthorized access and session management

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

### Running Security Tests

#### Basic Security Audit
```bash
npm run test:security
```

#### Verbose Security Assessment  
```bash
npm run test:security:verbose
```

#### Complete Security Audit
```bash
npm run audit:security
```

#### Custom Configuration
```bash
npm run test:security -- --contract oracle.testnet --output ./audit-reports --verbose
```

## Security Test Categories

### 1. Access Control Testing
**Purpose**: Verify proper authorization and role-based access control

**Tests Include**:
- Unauthorized admin function access attempts
- Role escalation prevention (user → admin)
- Cross-user data access restrictions
- Function-level authorization checks

**Example Vulnerabilities Detected**:
- Users self-assigning admin roles
- Cross-user private data access
- Unprotected administrative functions

### 2. Input Validation Testing
**Purpose**: Ensure all user inputs are properly validated and sanitized

**Tests Include**:
- Invalid confidence thresholds (negative, >1.0, NaN)
- Excessive parameter values (sources, deadlines)
- String length limits and buffer overflow prevention
- Special character and injection attempt handling

**Example Vulnerabilities Detected**:
- Acceptance of negative confidence scores
- Unlimited input string lengths
- Unescaped special characters in storage

### 3. Reentrancy Protection Testing
**Purpose**: Verify protection against reentrancy attacks and race conditions

**Tests Include**:
- Rapid successive call handling
- State consistency during concurrent operations
- External call callback protection
- Atomic operation verification

**Example Vulnerabilities Detected**:
- Race conditions in state updates
- Inconsistent storage during rapid calls
- Unprotected external interactions

### 4. Data Integrity Testing  
**Purpose**: Ensure data consistency and prevent corruption

**Tests Include**:
- Storage/retrieval data matching
- Multi-operation consistency checks
- Data type preservation verification
- Concurrent access data integrity

**Example Vulnerabilities Detected**:
- Data corruption during storage
- Inconsistent state across operations
- Type conversion errors

### 5. Privilege Escalation Testing
**Purpose**: Prevent unauthorized privilege increases

**Tests Include**:
- Direct role assignment attempts
- Indirect privilege escalation paths
- Permission boundary violations
- Administrative function protection

**Example Vulnerabilities Detected**:
- Direct admin role self-assignment
- Privilege escalation through helper functions
- Unprotected role modification functions

### 6. Attack Vector Testing
**Purpose**: Test resistance to common blockchain attacks

**Tests Include**:
- Front-running protection (duplicate intent detection)
- Timing attack resistance (constant-time operations)
- Gas exhaustion prevention (operation limits)
- Storage exhaustion protection (usage limits)

**Example Vulnerabilities Detected**:
- Predictable operation timing
- Unlimited gas consumption paths
- Storage space exhaustion vectors

## Security Report Generation

### Report Types Generated

1. **Console Output**: Real-time test results and summary
2. **JSON Report**: Machine-readable detailed findings
3. **HTML Dashboard**: Visual security assessment report  
4. **CSV Export**: Vulnerability tracking spreadsheet
5. **Security Checklist**: Pre-deployment validation checklist

### Sample Security Report

```json
{
  "timestamp": "2024-01-15T10:30:00.000Z",
  "totalTests": 12,
  "passed": 10,
  "failed": 2,
  "riskScore": 25,
  "summary": {
    "critical": 0,
    "high": 1,
    "medium": 1,
    "low": 0
  },
  "vulnerabilities": [
    {
      "testName": "Input Validation",
      "severity": "high",
      "description": "Input validation vulnerabilities detected",
      "findings": ["Accepts negative confidence values"],
      "recommendations": ["Implement proper input range validation"]
    }
  ]
}
```

### HTML Security Dashboard

The HTML report provides:
- **Executive Summary**: Risk score and vulnerability overview
- **Severity Breakdown**: Visual vulnerability distribution
- **Detailed Findings**: Per-test results with recommendations
- **Security Checklist**: Pre-deployment validation items
- **Risk Assessment**: Deployment readiness evaluation

## Security Scoring

### Risk Score Calculation (0-100, lower is better)

- **Critical vulnerabilities**: 25 points each
- **High severity**: 15 points each  
- **Medium severity**: 8 points each
- **Low severity**: 3 points each

### Deployment Readiness Guidelines

| Risk Score | Status | Action Required |
|------------|--------|-----------------|
| 0-20 | ✅ Secure | Ready for deployment |
| 21-40 | ⚠️ Low Risk | Review and monitor |
| 41-70 | 🔶 Medium Risk | Address issues before deployment |
| 71-100 | 🚨 High Risk | Critical remediation required |

### Vulnerability Severity Definitions

#### Critical (Score: 25 each)
- Direct fund loss potential
- Complete system compromise
- Unauthorized admin access
- Data manipulation capabilities

#### High (Score: 15 each)
- Privilege escalation vectors  
- Authentication bypasses
- Data integrity violations
- Service disruption potential

#### Medium (Score: 8 each)
- Information disclosure
- Input validation gaps
- Rate limiting bypasses
- Minor privilege issues

#### Low (Score: 3 each)
- Informational findings
- Best practice violations
- Minor configuration issues
- Documentation gaps

## Configuration Options

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `SECURITY_CONTRACT_ID` | Target contract for testing | Sandbox deployment |
| `SECURITY_OUTPUT_DIR` | Report output directory | `./security-reports` |
| `SECURITY_VERBOSE` | Enable detailed logging | `false` |

### Command Line Options

```bash
Options:
  --contract <id>       Contract account ID (deploys fresh if not provided)
  --output <dir>        Output directory for reports  
  --no-report          Skip generating detailed reports
  --verbose            Enable verbose output and detailed findings
  --help               Show help and usage information
```

## Integration with Development Workflow

### Pre-Commit Security Checks

```bash
# Add to git hooks or CI/CD
npm run test:security
if [ $? -ne 0 ]; then
  echo "Security tests failed - commit blocked"
  exit 1
fi
```

### CI/CD Pipeline Integration

```yaml
name: Security Testing

on: [push, pull_request]

jobs:
  security:
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
      
      - name: Run security tests
        run: npm run audit:security
      
      - name: Upload security reports
        uses: actions/upload-artifact@v3
        with:
          name: security-reports
          path: security-reports/
      
      - name: Check for critical vulnerabilities
        run: |
          if grep -q '"critical":[1-9]' security-reports/*.json; then
            echo "Critical vulnerabilities detected!"
            exit 1
          fi
```

### Testnet Security Validation

```bash
# Deploy to testnet
./scripts/deploy-testnet.sh

# Run security tests against testnet contract
npm run test:security -- \
  --contract oracle-intent.nearacles.testnet \
  --verbose \
  --output ./testnet-security-reports
```

## Advanced Security Testing

### Custom Vulnerability Tests

Extend the framework with custom tests:

```typescript
// Add to SecurityTestSuite class
private async testCustomVulnerability(): Promise<void> {
  console.log('🔍 Testing custom vulnerability...');
  
  const findings: string[] = [];
  const recommendations: string[] = [];
  
  try {
    // Custom test logic here
    
    this.addResult({
      testName: 'Custom Vulnerability Test',
      passed: findings.length === 0,
      severity: 'medium',
      description: 'Custom security test description',
      findings,
      recommendations
    });
  } catch (error) {
    // Handle test errors
  }
}
```

### Security Test Automation

```bash
# Schedule regular security scans
0 2 * * * /path/to/project && npm run audit:security

# Integrate with monitoring
npm run test:security --output /var/log/security/ --no-report
```

## Troubleshooting

### Common Issues

#### Contract Deployment Failures
```
Error: Contract deployment failed
```
**Solutions**: 
- Verify contract builds successfully
- Check NEAR account balance
- Validate network connectivity

#### Test Environment Setup Errors
```
Error: Failed to create test accounts
```
**Solutions**:
- Ensure near-workspaces dependency is installed
- Verify sufficient test account funds
- Check sandbox initialization

#### Permission Denied Errors
```
Error: Unauthorized access to contract function
```
**Solutions**:
- Verify contract is properly initialized
- Check account registrations
- Validate test account setup

### Debug Mode

Enable verbose logging for detailed analysis:

```bash
npm run test:security:verbose
```

This provides:
- Individual test step details
- Contract interaction logs
- Error stack traces
- Timing information
- State change tracking

### Security Best Practices

#### Development
- Run security tests during development
- Review all external function calls
- Validate all user inputs
- Implement proper access controls
- Use secure randomness sources

#### Testing
- Test with malicious inputs
- Verify edge cases and error conditions
- Check state consistency
- Validate gas usage patterns
- Test concurrent access scenarios

#### Deployment
- Complete security audit before mainnet
- Implement monitoring and alerting
- Establish incident response procedures
- Plan for security updates
- Document security assumptions

## Compliance and Auditing

### Security Documentation

Generated reports include:
- **Vulnerability Inventory**: Complete findings catalog
- **Risk Assessment**: Business impact analysis  
- **Remediation Guidance**: Step-by-step fix instructions
- **Compliance Checklist**: Security standard verification
- **Executive Summary**: High-level security posture

### Audit Trail

All security tests generate:
- Timestamped execution logs
- Reproducible test configurations
- Version-controlled test results
- Change tracking for security fixes
- Compliance evidence documentation

## Support and Enhancement

### Adding New Security Tests

1. Identify security concern or attack vector
2. Implement test in `SecurityTestSuite` class
3. Define appropriate severity and scoring
4. Add documentation and examples
5. Update test categorization

### Reporting Security Issues

For security vulnerabilities discovered:
1. Document the vulnerability completely
2. Assess potential impact and exploitability
3. Develop proof-of-concept if applicable
4. Create remediation recommendations
5. Track fix implementation and verification

### Contributing Security Improvements

Security enhancements welcome:
- New vulnerability detection tests
- Improved risk scoring algorithms
- Enhanced reporting capabilities
- Integration with security tools
- Performance optimizations

## Resources

### Security References
- [NEAR Security Best Practices](https://docs.near.org/security)
- [Smart Contract Security Patterns](https://consensys.github.io/smart-contract-best-practices/)
- [OWASP Blockchain Security](https://owasp.org/www-project-blockchain-security/)

### Tools Integration
- Static analysis with Slither/Mythril
- Dependency scanning with npm audit
- Automated security testing in CI/CD
- Security monitoring and alerting

---

*This security framework provides foundational security testing. Consider professional security audits for production deployments.*