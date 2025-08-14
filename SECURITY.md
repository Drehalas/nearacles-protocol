# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 0.2.x   | :white_check_mark: |
| < 0.2   | :x:                |

## Reporting a Vulnerability

We take security vulnerabilities seriously. If you discover a security vulnerability in Nearacles Protocol, please follow these steps:

### 1. Do NOT create a public GitHub issue

Please do not create a public issue on GitHub as this could potentially expose the vulnerability to malicious actors.

### 2. Contact us privately

Send an email to **security@nearacles.com** with the following information:

- **Subject**: Security Vulnerability Report
- **Description**: Detailed description of the vulnerability
- **Steps to reproduce**: Clear steps to reproduce the issue
- **Impact**: Potential impact and severity
- **Suggested fix**: If you have suggestions for fixing the vulnerability

### 3. Response Timeline

- **Initial Response**: Within 24 hours
- **Vulnerability Assessment**: Within 72 hours
- **Status Updates**: Every 7 days until resolution
- **Resolution**: Based on severity (Critical: 7 days, High: 14 days, Medium: 30 days)

### 4. Responsible Disclosure

We follow responsible disclosure practices:

1. We will acknowledge receipt of your report within 24 hours
2. We will provide an initial assessment within 72 hours
3. We will keep you informed of our progress
4. We will notify you when the vulnerability is fixed
5. We will publicly acknowledge your contribution (unless you prefer to remain anonymous)

## Security Measures

### Code Security

- **Static Analysis**: CodeQL and ESLint security rules
- **Dependency Scanning**: Automated vulnerability scanning with `npm audit`
- **Secrets Scanning**: Trivy secrets detection
- **License Compliance**: Automated license checking

### Infrastructure Security

- **HTTPS Only**: All production deployments use HTTPS
- **Security Headers**: Comprehensive security headers in middleware
- **Content Security Policy**: Strict CSP to prevent XSS
- **CORS**: Properly configured CORS policies

### Development Security

- **Branch Protection**: Main branch requires PR reviews
- **CI/CD Security**: Security checks in all pipelines
- **Environment Isolation**: Separate environments for development, staging, and production
- **Secret Management**: No hardcoded secrets, environment variables only

## Security Best Practices for Contributors

### 1. Code Security

- Never commit secrets, API keys, or sensitive data
- Use environment variables for configuration
- Validate all inputs and sanitize outputs
- Follow the principle of least privilege
- Use secure coding practices

### 2. Dependencies

- Keep dependencies up to date
- Run `npm audit` before committing
- Review dependency licenses
- Avoid unnecessary dependencies

### 3. Environment Variables

```bash
# Required environment variables for production
NODE_ENV=production
NEAR_NETWORK=mainnet
NEAR_RPC_URL=https://rpc.mainnet.near.org
OPENAI_API_KEY=your_openai_api_key_here
ALLOWED_ORIGINS=https://nearacles.com

# Optional security configurations
CSP_REPORT_URI=https://your-csp-report-endpoint.com/report
SECURITY_HEADERS_ENABLED=true
RATE_LIMIT_ENABLED=true
```

### 4. Security Checklist

Before deploying:

- [ ] All dependencies are up to date
- [ ] No hardcoded secrets
- [ ] Security headers are configured
- [ ] HTTPS is enforced
- [ ] Input validation is implemented
- [ ] Error messages don't leak sensitive information
- [ ] Rate limiting is configured
- [ ] Logging doesn't contain sensitive data

## Known Security Considerations

### 1. Oracle Data Sources

- All external data sources should be validated
- Implement circuit breakers for unreliable sources
- Use multiple sources for critical data
- Monitor for anomalous data patterns

### 2. NEAR Protocol Integration

- Always validate transaction signatures
- Implement proper gas estimation
- Use secure key management
- Monitor for unusual account activity

### 3. AI/ML Components

- Validate AI model inputs and outputs
- Implement safeguards against adversarial inputs
- Monitor for bias and fairness issues
- Ensure model versioning and rollback capabilities

## Vulnerability Rewards

We appreciate security researchers who help improve our security. While we don't currently have a formal bug bounty program, we:

- Acknowledge contributors in our security advisories
- Provide public recognition on our website
- Consider financial rewards for critical vulnerabilities (case-by-case basis)

## Contact

- **Security Email**: security@nearacles.com
- **General Contact**: contact@nearacles.com
- **GitHub**: https://github.com/Drehalas/nearacles-protocol

---

*This security policy is regularly reviewed and updated. Last updated: December 2024*
