import { getAccountState, functionCall, getSignerFromPrivateKey } from '@near-js/client';
import { config } from 'dotenv';

// Load environment variables
config();

// NEAR Testnet configuration
const SOLVER_BUS_URL = "https://solver-relay-v2.chaindefuser.com/rpc";
const INTENTS_CONTRACT = "intents.testnet";

const ASSET_MAP = {
  'USDC': { 
    'token_id': 'usdc.fakes.testnet',
    'decimals': 6,
  },
  'NEAR': {
    'token_id': 'wrap.testnet', 
    'decimals': 24,
  }
};

async function testnetSwapTest() {
  console.log('🔄 NEAR Intent Testnet Test\n');
  
  const ACCOUNT_ID = process.env.NEAR_TESTNET_ACCOUNT_ID || 'nearacles.testnet';
  const PRIVATE_KEY = process.env.NEAR_TESTNET_PRIVATE_KEY;
  
  if (!PRIVATE_KEY) {
    console.error('❌ Testnet private key not found in .env');
    return;
  }
  
  console.log(`📋 Testing with account: ${ACCOUNT_ID}\n`);

  try {
    // Check account balance first
    console.log('📡 Connecting to NEAR testnet...');
    
    const signer = getSignerFromPrivateKey(ACCOUNT_ID, 'testnet', PRIVATE_KEY);
    console.log('✅ Connected to NEAR testnet');

    // Check balance
    const account = await getAccountState({
      accountId: ACCOUNT_ID,
      networkId: 'testnet'
    });
    
    const balanceNEAR = parseFloat(account.amount) / 1e24;
    console.log(`💰 Account balance: ${balanceNEAR.toFixed(4)} NEAR\n`);

    // Test Solver Bus API
    console.log('🔍 Testing Solver Bus API...');

    // Query Solver Bus for quotes
    
    const intentRequest = {
      asset_in: ASSET_MAP.NEAR.token_id,
      amount_in: '1000000000000000000000', // 0.001 NEAR
      asset_out: ASSET_MAP.USDC.token_id,
    };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
    
    const response = await fetch(SOLVER_BUS_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        method: 'fetch_options',
        params: [intentRequest]
      }),
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);

    const solverData = await response.json();
    console.log('📊 Solver response:', solverData);

    if (solverData.result && solverData.result.length > 0) {
      console.log(`✅ Found ${solverData.result.length} quotes!`);
      console.log('🎯 Best quote:', solverData.result[0]);
      
      // Show expected output
      const bestQuote = solverData.result[0];
      if (bestQuote.amount_out) {
        const outputUSDC = parseFloat(bestQuote.amount_out) / 1e6;
        console.log(`💱 Expected output: ${outputUSDC.toFixed(6)} USDC`);
      }
      
    } else {
      console.log('❌ No quotes available for testnet');
      console.log('💡 This is normal - testnet may have limited solvers');
    }

  } catch (error) {
    console.error('💥 Error:', error.message);
    
    if (error.name === 'AbortError') {
      console.log('\n⏰ Solver Bus request timed out (10s)');
      console.log('💡 This might indicate:');
      console.log('   - Solver Bus is down');
      console.log('   - Network connectivity issues');
      console.log('   - Testnet solvers are limited');
    } else if (error.message.includes('fetch')) {
      console.log('\n🌐 Network error connecting to Solver Bus');
      console.log('💡 Check your internet connection');
    }
  }
}

// Only run demo if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  testnetSwapTest();
}

export { testnetSwapTest };