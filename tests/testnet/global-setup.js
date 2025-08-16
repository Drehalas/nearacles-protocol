/**
 * Global setup for testnet tests
 * Prepares the test environment before running any tests
 */

const { execSync } = require('child_process');
const fs = require('fs');

module.exports = async () => {
  console.log('🚀 Setting up global testnet test environment...');

  try {
    // Check if we're using testnet or sandbox
    const networkId = process.env.NEAR_NETWORK_ID || 'sandbox';
    
    if (networkId === 'testnet') {
      console.log('🌐 Using NEAR testnet - verifying connectivity...');
      
      // Verify testnet connectivity
      try {
        execSync('near state nearacles.testnet --networkId testnet', { stdio: 'pipe' });
        console.log('✅ Testnet connectivity verified');
      } catch (error) {
        console.warn('⚠️  Testnet connectivity check failed - tests may fail');
      }
    } else {
      console.log('🏗️  Using sandbox environment - checking contract build...');
      
      // Verify contract is built for sandbox
      const wasmPath = './contracts/oracle-intent/target/wasm32-unknown-unknown/release/oracle_intent.wasm';
      if (!fs.existsSync(wasmPath)) {
        console.log('📦 Building contract for sandbox testing...');
        try {
          execSync('cd contracts/oracle-intent && cargo build --target wasm32-unknown-unknown --release', 
                  { stdio: 'inherit' });
          console.log('✅ Contract built successfully');
        } catch (error) {
          throw new Error('Failed to build contract for sandbox testing');
        }
      } else {
        console.log('✅ Contract WASM found');
      }
    }

    // Start WebSocket server if needed (for real-time testing)
    if (process.env.START_WEBSOCKET === 'true') {
      console.log('🔌 Starting WebSocket server for real-time tests...');
      // Note: In a real implementation, you'd start the WebSocket server here
      // For now, we'll assume it's started separately
    }

    console.log('✅ Global setup completed');

  } catch (error) {
    console.error('❌ Global setup failed:', error.message);
    throw error;
  }
};