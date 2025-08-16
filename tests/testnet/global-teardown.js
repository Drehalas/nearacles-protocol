/**
 * Global teardown for testnet tests
 * Cleans up the test environment after all tests complete
 */

module.exports = async () => {
  console.log('🧹 Running global testnet test teardown...');

  try {
    // Cleanup any test data or connections
    
    // Note: For testnet, we generally don't clean up accounts/contracts
    // as they can be useful for debugging and manual testing
    
    const networkId = process.env.NEAR_NETWORK_ID || 'sandbox';
    
    if (networkId === 'sandbox') {
      console.log('🏗️  Sandbox environment - cleanup handled by near-workspaces');
    } else {
      console.log('🌐 Testnet environment - leaving test data for inspection');
      console.log('   View test accounts and contracts on NEAR Explorer:');
      console.log('   https://explorer.testnet.near.org');
    }

    // Stop any background services if we started them
    if (process.env.WEBSOCKET_STARTED === 'true') {
      console.log('🔌 Stopping WebSocket server...');
      // Cleanup WebSocket server if we started it
    }

    // Generate final test summary
    const summaryFile = './testnet-test-summary.txt';
    const summary = `
NEAR Testnet Validation Summary
===============================
Timestamp: ${new Date().toISOString()}
Network: ${networkId}
Environment: ${JSON.stringify(process.env.ORACLE_CONTRACT_ID ? {
  contractId: process.env.ORACLE_CONTRACT_ID,
  websocketUrl: process.env.WEBSOCKET_URL
} : 'sandbox', null, 2)}

Test execution completed. Check individual test results for details.

For testnet deployments, you can inspect:
- Contracts on NEAR Explorer: https://explorer.testnet.near.org
- WebSocket server logs for real-time communication testing
- Performance metrics if monitoring was enabled
`;

    require('fs').writeFileSync(summaryFile, summary);
    console.log(`📄 Test summary written to: ${summaryFile}`);

    console.log('✅ Global teardown completed');

  } catch (error) {
    console.error('❌ Global teardown failed:', error.message);
    // Don't throw - teardown failures shouldn't fail the tests
  }
};