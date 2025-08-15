import { config } from 'dotenv';

// Load environment variables
config();

async function quickTest() {
  console.log('🔄 Quick NEAR Testnet Test');
  
  const ACCOUNT_ID = process.env.NEAR_TESTNET_ACCOUNT_ID;
  const PRIVATE_KEY = process.env.NEAR_TESTNET_PRIVATE_KEY;
  
  console.log('Account ID:', ACCOUNT_ID);
  console.log('Private Key starts with:', PRIVATE_KEY?.substring(0, 15));
  
  if (!PRIVATE_KEY) {
    console.error('❌ No private key found');
    return;
  }
  
  console.log('✅ Environment variables loaded correctly');
  
  // Test simple fetch to a public API
  try {
    console.log('🌐 Testing network connection...');
    const response = await fetch('https://rpc.testnet.near.org/status');
    const data = await response.json();
    console.log('✅ NEAR testnet RPC is accessible');
    console.log('Chain ID:', data.chain_id);
  } catch (error) {
    console.error('❌ Network error:', error.message);
  }
}

quickTest();