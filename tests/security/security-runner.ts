/**
 * Simple Security Test Runner
 * Runs basic security validation tests for testnet deployment
 */

import { SecurityTestSuite } from './security-test-suite.js';

async function runSecurityTests() {
  console.log('Starting Basic Security Testing...\n');

  const securityTester = new SecurityTestSuite();
  const report = await securityTester.runSecurityTests();

  console.log('🔒 Security Test Results:');
  console.log(`Total Tests: ${report.totalTests}`);
  console.log(`Passed: ${report.passed}`);
  console.log(`Failed: ${report.failed}`);
  
  report.tests.forEach(test => {
    const status = test.passed ? '✅' : '❌';
    console.log(`  ${status} ${test.testName}: ${test.description}`);
  });

  const allPassed = report.failed === 0;
  console.log(`\nOverall Status: ${allPassed ? '✅ PASSED' : '❌ FAILED'}`);

  process.exit(allPassed ? 0 : 1);
}

if (require.main === module) {
  runSecurityTests().catch(console.error);
}