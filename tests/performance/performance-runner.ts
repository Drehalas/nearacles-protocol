/**
 * Simple Performance Test Runner
 * Runs basic load validation tests for testnet deployment
 */

import { LoadTestSuite } from './load-test-suite.js';

async function runPerformanceTests() {
  console.log('Starting Basic Performance Testing...\n');

  const loadTester = new LoadTestSuite();
  const results = await loadTester.runBasicLoadTest();

  console.log('📊 Performance Test Results:');
  console.log(`Total Intents: ${results.totalIntents}`);
  console.log(`Successful: ${results.successfulIntents}`);
  console.log(`Average Response Time: ${results.averageResponseTime}ms`);
  console.log(`Status: ${results.passed ? '✅ PASSED' : '❌ FAILED'}`);

  process.exit(results.passed ? 0 : 1);
}

if (require.main === module) {
  runPerformanceTests().catch(console.error);
}