/**
 * Testnet Test Runner
 * Orchestrates testnet validation tests with proper setup and reporting
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

interface TestRunConfig {
  networkId: 'testnet' | 'sandbox';
  contractId?: string;
  websocketUrl?: string;
  masterAccount?: string;
  verbose?: boolean;
  timeout?: number;
}

interface TestResult {
  suite: string;
  passed: number;
  failed: number;
  skipped: number;
  duration: number;
  errors: string[];
}

export class TestnetRunner {
  private config: TestRunConfig;
  private results: TestResult[] = [];

  constructor(config: TestRunConfig) {
    this.config = {
      timeout: 300000, // 5 minutes default
      verbose: false,
      ...config
    };
  }

  async runValidationSuite(): Promise<void> {
    console.log('🚀 Starting NEAR Testnet Validation Suite');
    console.log(`Network: ${this.config.networkId}`);
    console.log(`Contract: ${this.config.contractId || 'sandbox deployment'}`);
    console.log('─'.repeat(60));

    const startTime = Date.now();

    try {
      // Setup environment
      await this.setupTestEnvironment();

      // Run test suites
      await this.runTestSuite('End-to-End Validation', 'end-to-end-validation.test.ts');

      // Generate report
      await this.generateTestReport();

      const duration = Date.now() - startTime;
      console.log('─'.repeat(60));
      console.log(`✅ Validation completed in ${duration}ms`);

    } catch (error) {
      console.error('❌ Validation suite failed:', error);
      process.exit(1);
    }
  }

  private async setupTestEnvironment(): Promise<void> {
    console.log('🔧 Setting up test environment...');

    // Set environment variables
    process.env.NEAR_NETWORK_ID = this.config.networkId;
    
    if (this.config.contractId) {
      process.env.ORACLE_CONTRACT_ID = this.config.contractId;
    }
    
    if (this.config.websocketUrl) {
      process.env.WEBSOCKET_URL = this.config.websocketUrl;
    }
    
    if (this.config.masterAccount) {
      process.env.TESTNET_MASTER_ACCOUNT = this.config.masterAccount;
    }

    // Verify dependencies
    await this.verifyDependencies();

    console.log('✅ Test environment ready');
  }

  private async verifyDependencies(): Promise<void> {
    const checks = [
      {
        name: 'NEAR CLI',
        command: 'near --version',
        required: true
      },
      {
        name: 'Contract WASM',
        check: () => fs.existsSync('./contracts/oracle-intent/target/wasm32-unknown-unknown/release/oracle_intent.wasm'),
        required: this.config.networkId === 'sandbox'
      }
    ];

    for (const check of checks) {
      try {
        if (check.command) {
          execSync(check.command, { stdio: 'pipe' });
        } else if (check.check) {
          if (!check.check()) {
            throw new Error('Check failed');
          }
        }
        console.log(`  ✅ ${check.name}`);
      } catch (error) {
        if (check.required) {
          throw new Error(`Missing required dependency: ${check.name}`);
        } else {
          console.log(`  ⚠️  ${check.name} (optional)`);
        }
      }
    }
  }

  private async runTestSuite(suiteName: string, testFile: string): Promise<void> {
    console.log(`\n🧪 Running ${suiteName}...`);

    const testPath = path.join(__dirname, testFile);
    const startTime = Date.now();

    try {
      const jestConfig = {
        testMatch: [testPath],
        testTimeout: this.config.timeout,
        verbose: this.config.verbose,
        detectOpenHandles: true,
        forceExit: true
      };

      const configPath = '/tmp/jest-testnet-config.json';
      fs.writeFileSync(configPath, JSON.stringify(jestConfig, null, 2));

      const jestCommand = `npx jest --config ${configPath} --detectOpenHandles --forceExit`;
      
      if (this.config.verbose) {
        console.log(`Executing: ${jestCommand}`);
      }

      const output = execSync(jestCommand, { 
        stdio: this.config.verbose ? 'inherit' : 'pipe',
        encoding: 'utf8',
        timeout: this.config.timeout
      });

      const duration = Date.now() - startTime;
      
      // Parse Jest output for results
      const result = this.parseJestOutput(output?.toString() || '', suiteName, duration);
      this.results.push(result);

      console.log(`✅ ${suiteName} completed: ${result.passed} passed, ${result.failed} failed`);

    } catch (error) {
      const duration = Date.now() - startTime;
      const errorResult: TestResult = {
        suite: suiteName,
        passed: 0,
        failed: 1,
        skipped: 0,
        duration,
        errors: [error.message || 'Unknown error']
      };
      
      this.results.push(errorResult);
      console.log(`❌ ${suiteName} failed: ${error.message}`);
      
      if (this.config.verbose) {
        console.error(error);
      }
    }
  }

  private parseJestOutput(output: string, suiteName: string, duration: number): TestResult {
    // Simple Jest output parsing - could be enhanced
    const passedMatch = output.match(/(\d+) passed/);
    const failedMatch = output.match(/(\d+) failed/);
    const skippedMatch = output.match(/(\d+) skipped/);

    return {
      suite: suiteName,
      passed: passedMatch ? parseInt(passedMatch[1]) : 0,
      failed: failedMatch ? parseInt(failedMatch[1]) : 0,
      skipped: skippedMatch ? parseInt(skippedMatch[1]) : 0,
      duration,
      errors: []
    };
  }

  private async generateTestReport(): Promise<void> {
    console.log('\n📊 Test Report');
    console.log('─'.repeat(60));

    let totalPassed = 0;
    let totalFailed = 0;
    let totalSkipped = 0;
    let totalDuration = 0;

    for (const result of this.results) {
      totalPassed += result.passed;
      totalFailed += result.failed;
      totalSkipped += result.skipped;
      totalDuration += result.duration;

      console.log(`${result.suite}:`);
      console.log(`  ✅ Passed: ${result.passed}`);
      console.log(`  ❌ Failed: ${result.failed}`);
      console.log(`  ⏭️  Skipped: ${result.skipped}`);
      console.log(`  ⏱️  Duration: ${result.duration}ms`);
      
      if (result.errors.length > 0) {
        console.log(`  🚨 Errors: ${result.errors.length}`);
        for (const error of result.errors) {
          console.log(`    - ${error}`);
        }
      }
      console.log('');
    }

    console.log('Summary:');
    console.log(`  Total Tests: ${totalPassed + totalFailed + totalSkipped}`);
    console.log(`  ✅ Passed: ${totalPassed}`);
    console.log(`  ❌ Failed: ${totalFailed}`);
    console.log(`  ⏭️  Skipped: ${totalSkipped}`);
    console.log(`  ⏱️  Total Duration: ${totalDuration}ms`);

    const successRate = totalPassed / (totalPassed + totalFailed) * 100;
    console.log(`  📈 Success Rate: ${successRate.toFixed(1)}%`);

    // Save detailed report
    const reportPath = './testnet-validation-report.json';
    const report = {
      timestamp: new Date().toISOString(),
      config: this.config,
      results: this.results,
      summary: {
        totalTests: totalPassed + totalFailed + totalSkipped,
        passed: totalPassed,
        failed: totalFailed,
        skipped: totalSkipped,
        duration: totalDuration,
        successRate: successRate
      }
    };

    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`📄 Detailed report saved to: ${reportPath}`);
  }
}

// CLI runner
async function main() {
  const args = process.argv.slice(2);
  const config: TestRunConfig = {
    networkId: 'sandbox' // Default to sandbox
  };

  // Parse command line arguments
  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--network':
        config.networkId = args[++i] as 'testnet' | 'sandbox';
        break;
      case '--contract':
        config.contractId = args[++i];
        break;
      case '--websocket':
        config.websocketUrl = args[++i];
        break;
      case '--master-account':
        config.masterAccount = args[++i];
        break;
      case '--verbose':
        config.verbose = true;
        break;
      case '--timeout':
        config.timeout = parseInt(args[++i]);
        break;
      case '--help':
        console.log(`
NEAR Testnet Validation Runner

Usage: npm run test:testnet [options]

Options:
  --network <testnet|sandbox>  Target network (default: sandbox)
  --contract <account_id>      Contract account ID for testnet
  --websocket <url>           WebSocket server URL
  --master-account <id>       Master account for testnet
  --verbose                   Enable verbose output
  --timeout <ms>              Test timeout in milliseconds
  --help                      Show this help

Examples:
  npm run test:testnet
  npm run test:testnet -- --network testnet --contract oracle.testnet
  npm run test:testnet -- --verbose --timeout 600000
        `);
        process.exit(0);
    }
  }

  const runner = new TestnetRunner(config);
  await runner.runValidationSuite();
}

// Run if called directly
if (require.main === module) {
  main().catch(error => {
    console.error('❌ Test runner failed:', error);
    process.exit(1);
  });
}