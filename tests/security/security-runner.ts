/**
 * Security Test Runner
 * Orchestrates security testing with reporting and vulnerability management
 */

import fs from 'fs';
import path from 'path';
import { SecurityTestSuite } from './security-test-suite.js';

interface SecurityRunnerConfig {
  contractId?: string;
  outputDir: string;
  generateReport: boolean;
  verbose: boolean;
}

export class SecurityRunner {
  constructor(private config: SecurityRunnerConfig) {
    // Ensure output directory exists
    if (!fs.existsSync(this.config.outputDir)) {
      fs.mkdirSync(this.config.outputDir, { recursive: true });
    }
  }

  async runSecurityTests(): Promise<void> {
    console.log('🛡️  Starting NEAR Oracle Protocol Security Assessment');
    console.log(`Contract: ${this.config.contractId || 'sandbox deployment'}`);
    console.log('─'.repeat(80));

    const startTime = Date.now();

    try {
      const testSuite = new SecurityTestSuite();
      const report = await testSuite.runSecurityTests(this.config.contractId);

      if (this.config.generateReport) {
        await this.generateReports(report);
      }

      await this.displaySecurityAssessment(report);

      const duration = Date.now() - startTime;
      console.log('\n' + '─'.repeat(80));
      console.log(`✅ Security assessment completed in ${duration}ms`);

      // Exit with error code if critical vulnerabilities found
      if (report.summary.critical > 0) {
        console.log('🚨 CRITICAL VULNERABILITIES DETECTED - Review required!');
        process.exit(1);
      } else if (report.summary.high > 0) {
        console.log('⚠️  High severity vulnerabilities found - Address before deployment');
        process.exit(1);
      }

    } catch (error) {
      console.error('❌ Security assessment failed:', error);
      process.exit(1);
    }
  }

  private async generateReports(report: any): Promise<void> {
    console.log('\n📊 Generating security reports...');

    // Save JSON report
    const jsonPath = path.join(this.config.outputDir, `security-report-${Date.now()}.json`);
    fs.writeFileSync(jsonPath, JSON.stringify(report, null, 2));
    console.log(`📄 JSON report: ${jsonPath}`);

    // Generate HTML report
    await this.generateHTMLReport(report);

    // Generate CSV for vulnerability tracking
    await this.generateCSVReport(report);

    // Generate security checklist
    await this.generateSecurityChecklist(report);
  }

  private async generateHTMLReport(report: any): Promise<void> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const htmlPath = path.join(this.config.outputDir, `security-report-${timestamp}.html`);

    const vulnerabilityRows = report.vulnerabilities.map((vuln: any) => `
      <tr class="severity-${vuln.severity}">
        <td>${vuln.testName}</td>
        <td><span class="severity-badge severity-${vuln.severity}">${vuln.severity.toUpperCase()}</span></td>
        <td>${vuln.description}</td>
        <td>
          <ul>
            ${vuln.findings.map((finding: string) => `<li>${finding}</li>`).join('')}
          </ul>
        </td>
        <td>
          <ul>
            ${vuln.recommendations.map((rec: string) => `<li>${rec}</li>`).join('')}
          </ul>
        </td>
      </tr>
    `).join('');

    const riskLevel = report.riskScore < 20 ? 'low' : 
                     report.riskScore < 50 ? 'medium' : 
                     report.riskScore < 80 ? 'high' : 'critical';

    const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>NEAR Oracle Protocol Security Report</title>
    <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 20px; background: #f5f7fa; }
        .container { max-width: 1200px; margin: 0 auto; background: white; border-radius: 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); overflow: hidden; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; }
        .header h1 { margin: 0; font-size: 2.5em; font-weight: 300; }
        .header p { margin: 10px 0 0 0; opacity: 0.9; }
        
        .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; padding: 30px; background: #f8f9fa; }
        .metric { background: white; padding: 20px; border-radius: 8px; text-align: center; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .metric-value { font-size: 2em; font-weight: bold; margin: 10px 0; }
        .metric-label { color: #666; font-size: 0.9em; text-transform: uppercase; letter-spacing: 1px; }
        
        .risk-score { background: linear-gradient(135deg, #${riskLevel === 'low' ? '4CAF50' : riskLevel === 'medium' ? 'FF9800' : riskLevel === 'high' ? 'FF5722' : 'F44336'} 0%, #${riskLevel === 'low' ? '45a049' : riskLevel === 'medium' ? 'f57c00' : riskLevel === 'high' ? 'e64a19' : 'd32f2f'} 100%); color: white; }
        
        .content { padding: 30px; }
        .section { margin-bottom: 40px; }
        .section h2 { color: #333; border-bottom: 2px solid #667eea; padding-bottom: 10px; }
        
        table { width: 100%; border-collapse: collapse; margin-top: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        th { background: #667eea; color: white; padding: 15px; text-align: left; font-weight: 500; }
        td { padding: 15px; border-bottom: 1px solid #eee; vertical-align: top; }
        tr:hover { background: #f8f9fa; }
        
        .severity-badge { padding: 4px 8px; border-radius: 4px; font-size: 0.8em; font-weight: bold; }
        .severity-critical { background: #ffebee; color: #c62828; }
        .severity-high { background: #fff3e0; color: #ef6c00; }
        .severity-medium { background: #fff8e1; color: #f57f17; }
        .severity-low { background: #e8f5e8; color: #2e7d32; }
        
        .severity-critical .severity-badge { background: #c62828; color: white; }
        .severity-high .severity-badge { background: #ef6c00; color: white; }
        .severity-medium .severity-badge { background: #f57f17; color: white; }
        .severity-low .severity-badge { background: #2e7d32; color: white; }
        
        ul { margin: 0; padding-left: 20px; }
        li { margin: 5px 0; }
        
        .no-vulnerabilities { text-align: center; padding: 40px; color: #666; }
        .no-vulnerabilities .icon { font-size: 4em; color: #4CAF50; margin-bottom: 20px; }
        
        .footer { background: #f8f9fa; padding: 20px; text-align: center; color: #666; font-size: 0.9em; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🔒 Security Assessment Report</h1>
            <p>NEAR Oracle Intent Protocol</p>
            <p>Generated: ${new Date(report.timestamp).toLocaleString()}</p>
        </div>

        <div class="summary">
            <div class="metric">
                <div class="metric-value">${report.totalTests}</div>
                <div class="metric-label">Total Tests</div>
            </div>
            <div class="metric">
                <div class="metric-value" style="color: #4CAF50;">${report.passed}</div>
                <div class="metric-label">Passed</div>
            </div>
            <div class="metric">
                <div class="metric-value" style="color: #F44336;">${report.failed}</div>
                <div class="metric-label">Failed</div>
            </div>
            <div class="metric risk-score">
                <div class="metric-value">${report.riskScore}/100</div>
                <div class="metric-label">Risk Score</div>
            </div>
        </div>

        <div class="content">
            <div class="section">
                <h2>Vulnerability Summary</h2>
                <div class="summary">
                    <div class="metric">
                        <div class="metric-value" style="color: #c62828;">${report.summary.critical}</div>
                        <div class="metric-label">Critical</div>
                    </div>
                    <div class="metric">
                        <div class="metric-value" style="color: #ef6c00;">${report.summary.high}</div>
                        <div class="metric-label">High</div>
                    </div>
                    <div class="metric">
                        <div class="metric-value" style="color: #f57f17;">${report.summary.medium}</div>
                        <div class="metric-label">Medium</div>
                    </div>
                    <div class="metric">
                        <div class="metric-value" style="color: #2e7d32;">${report.summary.low}</div>
                        <div class="metric-label">Low</div>
                    </div>
                </div>
            </div>

            <div class="section">
                <h2>Detailed Findings</h2>
                ${report.vulnerabilities.length > 0 ? `
                    <table>
                        <thead>
                            <tr>
                                <th>Test</th>
                                <th>Severity</th>
                                <th>Description</th>
                                <th>Findings</th>
                                <th>Recommendations</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${vulnerabilityRows}
                        </tbody>
                    </table>
                ` : `
                    <div class="no-vulnerabilities">
                        <div class="icon">✅</div>
                        <h3>No Vulnerabilities Detected</h3>
                        <p>All security tests passed successfully.</p>
                    </div>
                `}
            </div>

            <div class="section">
                <h2>Security Recommendations</h2>
                <ul>
                    <li><strong>Regular Security Audits:</strong> Conduct periodic security assessments</li>
                    <li><strong>Input Validation:</strong> Implement comprehensive input validation</li>
                    <li><strong>Access Controls:</strong> Maintain strict role-based access controls</li>
                    <li><strong>Monitoring:</strong> Implement security monitoring and alerting</li>
                    <li><strong>Updates:</strong> Keep dependencies and frameworks updated</li>
                    <li><strong>Testing:</strong> Include security tests in CI/CD pipeline</li>
                </ul>
            </div>
        </div>

        <div class="footer">
            <p>This report was generated by the NEAR Oracle Protocol Security Testing Framework</p>
            <p>For questions or concerns, please review the security documentation</p>
        </div>
    </div>
</body>
</html>`;

    fs.writeFileSync(htmlPath, htmlContent);
    console.log(`📄 HTML report: ${htmlPath}`);
  }

  private async generateCSVReport(report: any): Promise<void> {
    const csvPath = path.join(this.config.outputDir, `vulnerabilities-${Date.now()}.csv`);
    
    const csvContent = [
      'Test,Severity,Description,Findings,Recommendations',
      ...report.vulnerabilities.map((vuln: any) => 
        [
          vuln.testName,
          vuln.severity,
          vuln.description,
          vuln.findings.join('; '),
          vuln.recommendations.join('; ')
        ].map((field: string) => `"${field.replace(/"/g, '""')}"`).join(',')
      )
    ].join('\n');

    fs.writeFileSync(csvPath, csvContent);
    console.log(`📄 CSV report: ${csvPath}`);
  }

  private async generateSecurityChecklist(report: any): Promise<void> {
    const checklistPath = path.join(this.config.outputDir, 'security-checklist.md');
    
    const checklist = `# NEAR Oracle Protocol Security Checklist

Generated: ${new Date(report.timestamp).toLocaleString()}

## Pre-Deployment Security Checklist

### Critical Security Requirements
- [ ] All critical vulnerabilities resolved
- [ ] All high severity vulnerabilities resolved
- [ ] Access control mechanisms tested and verified
- [ ] Input validation implemented for all user inputs
- [ ] Rate limiting and DoS protection implemented

### Code Security
- [ ] Code review completed by security expert
- [ ] Static analysis tools run and issues resolved
- [ ] Dependencies scanned for known vulnerabilities
- [ ] Smart contract logic audited for edge cases
- [ ] Gas optimization and limits verified

### Infrastructure Security
- [ ] Secure key management implemented
- [ ] Network security measures in place
- [ ] Monitoring and alerting configured
- [ ] Backup and recovery procedures tested
- [ ] Incident response plan documented

### Testing and Validation
- [ ] All security tests passing
- [ ] Performance testing completed
- [ ] End-to-end testing successful
- [ ] User acceptance testing completed
- [ ] Security regression testing implemented

## Current Test Results

### Security Test Summary
- **Total Tests:** ${report.totalTests}
- **Passed:** ${report.passed}
- **Failed:** ${report.failed}
- **Risk Score:** ${report.riskScore}/100

### Vulnerabilities by Severity
- **Critical:** ${report.summary.critical}
- **High:** ${report.summary.high}
- **Medium:** ${report.summary.medium}
- **Low:** ${report.summary.low}

${report.vulnerabilities.length > 0 ? `
### Outstanding Issues

${report.vulnerabilities.map((vuln: any) => `
#### ${vuln.testName} (${vuln.severity.toUpperCase()})
**Description:** ${vuln.description}

**Findings:**
${vuln.findings.map((finding: string) => `- ${finding}`).join('\n')}

**Recommendations:**
${vuln.recommendations.map((rec: string) => `- ${rec}`).join('\n')}
`).join('\n')}
` : '### ✅ No Outstanding Security Issues'}

## Deployment Readiness

${report.summary.critical === 0 && report.summary.high === 0 ? 
  '✅ **READY FOR DEPLOYMENT** - No critical or high severity vulnerabilities detected' :
  '❌ **NOT READY FOR DEPLOYMENT** - Critical or high severity vulnerabilities must be resolved first'
}

---

*This checklist should be reviewed and signed off by the security team before deployment.*
`;

    fs.writeFileSync(checklistPath, checklist);
    console.log(`📄 Security checklist: ${checklistPath}`);
  }

  private async displaySecurityAssessment(report: any): Promise<void> {
    console.log('\n🔍 Security Assessment Results');
    console.log('─'.repeat(60));

    // Overall assessment
    if (report.summary.critical > 0) {
      console.log('🚨 SECURITY STATUS: CRITICAL ISSUES DETECTED');
      console.log('   Immediate remediation required before deployment');
    } else if (report.summary.high > 0) {
      console.log('⚠️  SECURITY STATUS: HIGH RISK ISSUES DETECTED');
      console.log('   Address high severity issues before deployment');
    } else if (report.summary.medium > 0) {
      console.log('⚠️  SECURITY STATUS: MEDIUM RISK ISSUES DETECTED');
      console.log('   Review and address medium severity issues');
    } else if (report.summary.low > 0) {
      console.log('✅ SECURITY STATUS: LOW RISK ISSUES DETECTED');
      console.log('   Minor issues found, deployment acceptable with monitoring');
    } else {
      console.log('✅ SECURITY STATUS: SECURE');
      console.log('   No security issues detected, ready for deployment');
    }

    console.log(`\nRisk Score: ${report.riskScore}/100`);
    console.log(`Security Test Coverage: ${report.totalTests} tests executed`);

    // Priority actions
    if (report.vulnerabilities.length > 0) {
      console.log('\n🔧 Priority Actions Required:');
      
      const criticalIssues = report.vulnerabilities.filter((v: any) => v.severity === 'critical');
      const highIssues = report.vulnerabilities.filter((v: any) => v.severity === 'high');
      
      if (criticalIssues.length > 0) {
        console.log('\n  🚨 CRITICAL (Fix Immediately):');
        criticalIssues.forEach((issue: any) => {
          console.log(`    - ${issue.testName}: ${issue.findings[0] || issue.description}`);
        });
      }
      
      if (highIssues.length > 0) {
        console.log('\n  🔴 HIGH (Fix Before Deployment):');
        highIssues.forEach((issue: any) => {
          console.log(`    - ${issue.testName}: ${issue.findings[0] || issue.description}`);
        });
      }
    }

    console.log('\n📋 Next Steps:');
    if (report.summary.critical > 0 || report.summary.high > 0) {
      console.log('  1. Address critical and high severity vulnerabilities');
      console.log('  2. Re-run security tests to verify fixes');
      console.log('  3. Consider external security audit');
      console.log('  4. Update security documentation');
    } else {
      console.log('  1. Review medium and low severity findings');
      console.log('  2. Implement additional monitoring if needed');
      console.log('  3. Schedule regular security assessments');
      console.log('  4. Proceed with deployment when ready');
    }
  }
}

// CLI runner
async function main() {
  const args = process.argv.slice(2);
  
  const config: SecurityRunnerConfig = {
    outputDir: './security-reports',
    generateReport: true,
    verbose: false
  };

  // Parse arguments
  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--contract':
        config.contractId = args[++i];
        break;
      case '--output':
        config.outputDir = args[++i];
        break;
      case '--no-report':
        config.generateReport = false;
        break;
      case '--verbose':
        config.verbose = true;
        break;
      case '--help':
        console.log(`
NEAR Oracle Protocol Security Test Runner

Usage: npm run test:security [options]

Options:
  --contract <id>       Contract account ID (deploys fresh if not provided)
  --output <dir>        Output directory for reports (default: ./security-reports)
  --no-report          Skip generating detailed reports
  --verbose            Enable verbose output
  --help               Show this help

Examples:
  npm run test:security
  npm run test:security -- --contract oracle.testnet --verbose
  npm run test:security -- --output ./audit-reports
        `);
        process.exit(0);
    }
  }

  const runner = new SecurityRunner(config);
  await runner.runSecurityTests();
}

// Run if called directly
if (require.main === module) {
  main();
}