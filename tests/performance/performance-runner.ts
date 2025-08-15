/**
 * Performance Test Runner
 * Orchestrates performance testing with reporting and benchmarking
 */

import fs from 'fs';
import path from 'path';
import { PerformanceLoadTester, performanceTestScenarios, LoadTestConfig, LoadTestResult } from './load-test-suite.js';

interface PerformanceBenchmarks {
  maxAcceptableResponseTime: number; // ms
  minThroughputPerSecond: number;
  maxErrorRate: number; // percentage
  maxWebSocketLatency: number; // ms
}

interface PerformanceTestSuite {
  name: string;
  scenarios: LoadTestConfig[];
  benchmarks: PerformanceBenchmarks;
}

export class PerformanceRunner {
  private results: Array<{
    scenario: string;
    result: LoadTestResult;
    passed: boolean;
    failureReasons: string[];
  }> = [];

  constructor(private outputDir: string = './performance-reports') {
    // Ensure output directory exists
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }
  }

  async runPerformanceTestSuite(
    suiteName: string,
    scenarios: Record<string, LoadTestConfig>,
    benchmarks: PerformanceBenchmarks,
    options: {
      websocketUrl?: string;
      contractId?: string;
      verbose?: boolean;
    } = {}
  ): Promise<void> {
    console.log('🚀 Starting NEAR Oracle Protocol Performance Test Suite');
    console.log(`Suite: ${suiteName}`);
    console.log(`Scenarios: ${Object.keys(scenarios).join(', ')}`);
    console.log('─'.repeat(80));

    const startTime = Date.now();

    try {
      for (const [scenarioName, config] of Object.entries(scenarios)) {
        console.log(`\n🧪 Running scenario: ${scenarioName}`);
        console.log(`Config: ${JSON.stringify(config, null, 2)}`);
        
        await this.runScenario(scenarioName, {
          ...config,
          websocketUrl: options.websocketUrl,
          contractId: options.contractId
        }, benchmarks, options.verbose);
      }

      await this.generateSuiteReport(suiteName, benchmarks);

      const duration = Date.now() - startTime;
      console.log('\n' + '─'.repeat(80));
      console.log(`✅ Performance test suite completed in ${duration}ms`);

    } catch (error) {
      console.error('❌ Performance test suite failed:', error);
      throw error;
    }
  }

  private async runScenario(
    scenarioName: string,
    config: LoadTestConfig,
    benchmarks: PerformanceBenchmarks,
    verbose: boolean = false
  ): Promise<void> {
    const tester = new PerformanceLoadTester();
    
    if (verbose) {
      tester.on('progress', (data) => {
        console.log(`  📊 Progress: ${JSON.stringify(data)}`);
      });
    }

    try {
      const result = await tester.runLoadTest(config);
      const { passed, failureReasons } = this.evaluatePerformance(result, benchmarks);
      
      this.results.push({
        scenario: scenarioName,
        result,
        passed,
        failureReasons
      });

      // Save individual scenario report
      await this.saveScenarioReport(scenarioName, result, passed, failureReasons);

      // Log scenario results
      console.log(`\n📊 Scenario Results: ${scenarioName}`);
      console.log(`  ✅ Success Rate: ${((1 - result.metrics.errorRate) * 100).toFixed(1)}%`);
      console.log(`  ⚡ Throughput: ${result.metrics.throughputPerSecond.toFixed(2)} ops/sec`);
      console.log(`  ⏱️  Avg Response: ${result.metrics.averageResponseTime.toFixed(0)}ms`);
      console.log(`  📈 Performance: ${passed ? '✅ PASSED' : '❌ FAILED'}`);
      
      if (!passed) {
        console.log(`  🚨 Failures: ${failureReasons.join(', ')}`);
      }

      if (result.metrics.websocketMetrics) {
        console.log(`  🔌 WebSocket Latency: ${result.metrics.websocketMetrics.averageLatency.toFixed(0)}ms`);
      }

    } catch (error) {
      console.error(`❌ Scenario ${scenarioName} failed:`, error.message);
      
      this.results.push({
        scenario: scenarioName,
        result: null as any,
        passed: false,
        failureReasons: [error.message]
      });
    }
  }

  private evaluatePerformance(
    result: LoadTestResult,
    benchmarks: PerformanceBenchmarks
  ): { passed: boolean; failureReasons: string[] } {
    const failureReasons: string[] = [];

    // Check response time
    if (result.metrics.averageResponseTime > benchmarks.maxAcceptableResponseTime) {
      failureReasons.push(
        `Response time ${result.metrics.averageResponseTime}ms exceeds ${benchmarks.maxAcceptableResponseTime}ms`
      );
    }

    // Check throughput
    if (result.metrics.throughputPerSecond < benchmarks.minThroughputPerSecond) {
      failureReasons.push(
        `Throughput ${result.metrics.throughputPerSecond.toFixed(2)} ops/sec below ${benchmarks.minThroughputPerSecond} ops/sec`
      );
    }

    // Check error rate
    if (result.metrics.errorRate > benchmarks.maxErrorRate) {
      failureReasons.push(
        `Error rate ${(result.metrics.errorRate * 100).toFixed(1)}% exceeds ${(benchmarks.maxErrorRate * 100).toFixed(1)}%`
      );
    }

    // Check WebSocket latency if available
    if (result.metrics.websocketMetrics && 
        result.metrics.websocketMetrics.averageLatency > benchmarks.maxWebSocketLatency) {
      failureReasons.push(
        `WebSocket latency ${result.metrics.websocketMetrics.averageLatency}ms exceeds ${benchmarks.maxWebSocketLatency}ms`
      );
    }

    return {
      passed: failureReasons.length === 0,
      failureReasons
    };
  }

  private async saveScenarioReport(
    scenarioName: string,
    result: LoadTestResult,
    passed: boolean,
    failureReasons: string[]
  ): Promise<void> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `${scenarioName}-${timestamp}.json`;
    const filepath = path.join(this.outputDir, filename);

    const report = {
      scenario: scenarioName,
      timestamp: new Date().toISOString(),
      passed,
      failureReasons,
      result
    };

    fs.writeFileSync(filepath, JSON.stringify(report, null, 2));
    console.log(`  📄 Report saved: ${filepath}`);
  }

  private async generateSuiteReport(
    suiteName: string,
    benchmarks: PerformanceBenchmarks
  ): Promise<void> {
    console.log('\n📊 Generating Performance Test Suite Report');
    console.log('─'.repeat(60));

    const passed = this.results.filter(r => r.passed).length;
    const failed = this.results.filter(r => !r.passed).length;
    const total = this.results.length;

    console.log(`Suite: ${suiteName}`);
    console.log(`Total Scenarios: ${total}`);
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`📈 Success Rate: ${((passed / total) * 100).toFixed(1)}%`);

    // Performance summary
    const validResults = this.results.filter(r => r.result).map(r => r.result);
    if (validResults.length > 0) {
      const avgThroughput = validResults.reduce((sum, r) => sum + r.metrics.throughputPerSecond, 0) / validResults.length;
      const avgResponseTime = validResults.reduce((sum, r) => sum + r.metrics.averageResponseTime, 0) / validResults.length;
      const avgErrorRate = validResults.reduce((sum, r) => sum + r.metrics.errorRate, 0) / validResults.length;

      console.log('\nPerformance Summary:');
      console.log(`  ⚡ Avg Throughput: ${avgThroughput.toFixed(2)} ops/sec`);
      console.log(`  ⏱️  Avg Response Time: ${avgResponseTime.toFixed(0)}ms`);
      console.log(`  📊 Avg Error Rate: ${(avgErrorRate * 100).toFixed(1)}%`);
    }

    // Failed scenarios details
    const failedScenarios = this.results.filter(r => !r.passed);
    if (failedScenarios.length > 0) {
      console.log('\n🚨 Failed Scenarios:');
      for (const failed of failedScenarios) {
        console.log(`  - ${failed.scenario}: ${failed.failureReasons.join(', ')}`);
      }
    }

    // Benchmark comparison
    console.log('\n📏 Benchmark Comparison:');
    console.log(`  Max Response Time: ${benchmarks.maxAcceptableResponseTime}ms`);
    console.log(`  Min Throughput: ${benchmarks.minThroughputPerSecond} ops/sec`);
    console.log(`  Max Error Rate: ${(benchmarks.maxErrorRate * 100).toFixed(1)}%`);
    console.log(`  Max WebSocket Latency: ${benchmarks.maxWebSocketLatency}ms`);

    // Save comprehensive report
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const suiteReportPath = path.join(this.outputDir, `suite-${suiteName}-${timestamp}.json`);

    const suiteReport = {
      suiteName,
      timestamp: new Date().toISOString(),
      benchmarks,
      summary: {
        total,
        passed,
        failed,
        successRate: (passed / total) * 100
      },
      results: this.results
    };

    fs.writeFileSync(suiteReportPath, JSON.stringify(suiteReport, null, 2));
    console.log(`\n📄 Suite report saved: ${suiteReportPath}`);

    // Generate HTML report
    await this.generateHTMLReport(suiteName, suiteReport);
  }

  private async generateHTMLReport(suiteName: string, suiteReport: any): Promise<void> {
    const htmlTemplate = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Performance Test Report - ${suiteName}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 30px; }
        .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 30px; }
        .metric { background: #f8f9fa; padding: 20px; border-radius: 6px; text-align: center; border-left: 4px solid #007bff; }
        .metric.failed { border-left-color: #dc3545; }
        .metric.passed { border-left-color: #28a745; }
        .scenario { margin-bottom: 20px; padding: 15px; border: 1px solid #ddd; border-radius: 6px; }
        .scenario.passed { border-left: 4px solid #28a745; }
        .scenario.failed { border-left: 4px solid #dc3545; }
        .timeline { height: 300px; background: #f8f9fa; margin: 20px 0; padding: 20px; border-radius: 6px; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th, td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
        th { background-color: #f8f9fa; font-weight: bold; }
        .status-passed { color: #28a745; font-weight: bold; }
        .status-failed { color: #dc3545; font-weight: bold; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>NEAR Oracle Protocol Performance Test Report</h1>
            <h2>${suiteName}</h2>
            <p>Generated: ${suiteReport.timestamp}</p>
        </div>

        <div class="summary">
            <div class="metric ${suiteReport.summary.passed === suiteReport.summary.total ? 'passed' : 'failed'}">
                <h3>Success Rate</h3>
                <div style="font-size: 24px; font-weight: bold;">${suiteReport.summary.successRate.toFixed(1)}%</div>
            </div>
            <div class="metric">
                <h3>Total Scenarios</h3>
                <div style="font-size: 24px; font-weight: bold;">${suiteReport.summary.total}</div>
            </div>
            <div class="metric passed">
                <h3>Passed</h3>
                <div style="font-size: 24px; font-weight: bold;">${suiteReport.summary.passed}</div>
            </div>
            <div class="metric failed">
                <h3>Failed</h3>
                <div style="font-size: 24px; font-weight: bold;">${suiteReport.summary.failed}</div>
            </div>
        </div>

        <h3>Benchmark Thresholds</h3>
        <table>
            <tr><th>Metric</th><th>Threshold</th><th>Description</th></tr>
            <tr><td>Max Response Time</td><td>${suiteReport.benchmarks.maxAcceptableResponseTime}ms</td><td>Maximum acceptable average response time</td></tr>
            <tr><td>Min Throughput</td><td>${suiteReport.benchmarks.minThroughputPerSecond} ops/sec</td><td>Minimum required operations per second</td></tr>
            <tr><td>Max Error Rate</td><td>${(suiteReport.benchmarks.maxErrorRate * 100).toFixed(1)}%</td><td>Maximum acceptable error percentage</td></tr>
            <tr><td>Max WebSocket Latency</td><td>${suiteReport.benchmarks.maxWebSocketLatency}ms</td><td>Maximum acceptable WebSocket latency</td></tr>
        </table>

        <h3>Scenario Results</h3>
        ${suiteReport.results.map(result => `
            <div class="scenario ${result.passed ? 'passed' : 'failed'}">
                <h4>${result.scenario} <span class="status-${result.passed ? 'passed' : 'failed'}">${result.passed ? 'PASSED' : 'FAILED'}</span></h4>
                ${result.result ? `
                    <p><strong>Throughput:</strong> ${result.result.metrics.throughputPerSecond.toFixed(2)} ops/sec</p>
                    <p><strong>Avg Response Time:</strong> ${result.result.metrics.averageResponseTime.toFixed(0)}ms</p>
                    <p><strong>Error Rate:</strong> ${(result.result.metrics.errorRate * 100).toFixed(1)}%</p>
                    <p><strong>Total Intents:</strong> ${result.result.metrics.totalIntents}</p>
                    ${result.result.metrics.websocketMetrics ? `
                        <p><strong>WebSocket Latency:</strong> ${result.result.metrics.websocketMetrics.averageLatency.toFixed(0)}ms</p>
                    ` : ''}
                ` : ''}
                ${result.failureReasons.length > 0 ? `
                    <p><strong>Failures:</strong> ${result.failureReasons.join(', ')}</p>
                ` : ''}
            </div>
        `).join('')}
    </div>
</body>
</html>`;

    const htmlPath = path.join(this.outputDir, `${suiteName}-report.html`);
    fs.writeFileSync(htmlPath, htmlTemplate);
    console.log(`📄 HTML report saved: ${htmlPath}`);
  }
}

// CLI runner for performance tests
async function main() {
  const args = process.argv.slice(2);
  
  const config = {
    scenario: 'medium', // default scenario
    websocketUrl: undefined as string | undefined,
    contractId: undefined as string | undefined,
    verbose: false,
    outputDir: './performance-reports'
  };

  // Parse arguments
  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--scenario':
        config.scenario = args[++i];
        break;
      case '--websocket':
        config.websocketUrl = args[++i];
        break;
      case '--contract':
        config.contractId = args[++i];
        break;
      case '--verbose':
        config.verbose = true;
        break;
      case '--output':
        config.outputDir = args[++i];
        break;
      case '--help':
        console.log(`
NEAR Oracle Protocol Performance Test Runner

Usage: npm run test:performance [options]

Options:
  --scenario <name>     Test scenario: light|medium|heavy|burst|all (default: medium)
  --websocket <url>     WebSocket server URL for real-time testing
  --contract <id>       Contract account ID (deploys fresh if not provided)
  --verbose             Enable verbose output
  --output <dir>        Output directory for reports (default: ./performance-reports)
  --help                Show this help

Examples:
  npm run test:performance
  npm run test:performance -- --scenario heavy --verbose
  npm run test:performance -- --scenario all --websocket ws://localhost:8080
        `);
        process.exit(0);
    }
  }

  const runner = new PerformanceRunner(config.outputDir);
  
  // Define benchmarks
  const benchmarks = {
    maxAcceptableResponseTime: 10000, // 10 seconds
    minThroughputPerSecond: 0.5, // 0.5 ops/sec minimum
    maxErrorRate: 0.05, // 5% max error rate
    maxWebSocketLatency: 1000 // 1 second max WebSocket latency
  };

  try {
    if (config.scenario === 'all') {
      await runner.runPerformanceTestSuite(
        'Complete Performance Suite',
        performanceTestScenarios,
        benchmarks,
        {
          websocketUrl: config.websocketUrl,
          contractId: config.contractId,
          verbose: config.verbose
        }
      );
    } else {
      const scenarioConfig = performanceTestScenarios[config.scenario as keyof typeof performanceTestScenarios];
      if (!scenarioConfig) {
        throw new Error(`Unknown scenario: ${config.scenario}`);
      }

      await runner.runPerformanceTestSuite(
        `${config.scenario} Performance Test`,
        { [config.scenario]: scenarioConfig },
        benchmarks,
        {
          websocketUrl: config.websocketUrl,
          contractId: config.contractId,
          verbose: config.verbose
        }
      );
    }
  } catch (error) {
    console.error('❌ Performance testing failed:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}