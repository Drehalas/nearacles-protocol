import { getAccountState, functionCall, getSignerFromPrivateKey } from '@near-js/client';
import { InMemoryKeyStore } from '@near-js/keystores';
import { KeyPair } from '@near-js/crypto';
import { config } from 'dotenv';

// Load environment variables
config();

// Real NEAR Intent configuration from Python example
const SOLVER_BUS_URL = "https://solver-relay-v2.chaindefuser.com/rpc";
const INTENTS_CONTRACT = "intents.near";

const ASSET_MAP = {
  'USDC': { 
    'token_id': 'a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48.factory.bridge.near',
    'decimals': 6,
  },
  'NEAR': {
    'token_id': 'wrap.near', 
    'decimals': 24,
  }
};

async function realSwapTest() {
  console.log('🔄 Real NEAR Intent Swap Test\n');
  
  const ACCOUNT_ID = process.env.NEAR_ACCOUNT_ID || 'drehalas.near';
  const PRIVATE_KEY = process.env.NEAR_PRIVATE_KEY;
  
  if (!PRIVATE_KEY) {
    console.error('❌ Set NEAR_PRIVATE_KEY environment variable');
    return;
  }

  try {
    // Setup NEAR connection using modern client
    console.log('📡 Connecting to NEAR mainnet...');
    
    const signer = getSignerFromPrivateKey(ACCOUNT_ID, 'mainnet', PRIVATE_KEY);
    console.log('✅ Connected to NEAR mainnet');

    // Check balance
    const account = await getAccountState({
      accountId: ACCOUNT_ID,
      networkId: 'mainnet'
    });
    
    const balanceNEAR = parseFloat(account.amount) / 1e24;
    console.log(`💰 Account balance: ${balanceNEAR.toFixed(4)} NEAR`);

    // Step 1: Register public key with intents contract (if needed)
    console.log('🔑 Registering with intents contract...');
    try {
      const result = await functionCall({
        contractId: INTENTS_CONTRACT,
        methodName: 'register_public_key',
        args: {},
        gas: '30000000000000',
        attachedDeposit: '0',
        signer
      });
      console.log('✅ Public key registered');
    } catch (e) {
      if (e.message && e.message.includes('already exists')) {
        console.log('✅ Public key already registered');
      } else {
        console.log('⚠️ Registration skipped:', e.message || 'Unknown error');
      }
    }

    // Step 2: Query Solver Bus for quotes
    console.log('🔍 Fetching quotes from Solver Bus...');
    
    const intentRequest = {
      asset_in: ASSET_MAP.NEAR.token_id,
      amount_in: '10000000000000000000000', // 0.01 NEAR
      asset_out: ASSET_MAP.USDC.token_id,
    };

    const response = await fetch(SOLVER_BUS_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        method: 'fetch_options',
        params: [intentRequest]
      })
    });

    const solverData = await response.json();
    console.log('📊 Solver response:', solverData);

    if (solverData.result && solverData.result.length > 0) {
      console.log(`✅ Found ${solverData.result.length} quotes!`);
      console.log('🎯 Best quote:', solverData.result[0]);
    } else {
      console.log('❌ No quotes available');
    }

  } catch (error) {
    console.error('💥 Error:', error.message);
  }
}

realSwapTest();