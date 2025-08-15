import { config } from 'dotenv';

config();

async function rpcTest() {
  console.log('🔄 NEAR RPC Direct Test');
  
  const ACCOUNT_ID = process.env.NEAR_TESTNET_ACCOUNT_ID;
  
  try {
    console.log(`📡 Checking account via RPC: ${ACCOUNT_ID}`);
    
    const response = await fetch('https://archival-rpc.testnet.near.org', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 'dontcare',
        method: 'query',
        params: {
          request_type: 'view_account',
          finality: 'final',
          account_id: ACCOUNT_ID
        }
      })
    });
    
    const data = await response.json();
    
    if (data.result) {
      const balanceNEAR = parseFloat(data.result.amount) / 1e24;
      console.log(`✅ Account exists!`);
      console.log(`💰 Balance: ${balanceNEAR.toFixed(4)} NEAR`);
      console.log(`🏪 Storage used: ${data.result.storage_usage} bytes`);
      
      // Now test Solver Bus
      console.log('\n🔍 Testing Solver Bus...');
      await testSolverBus();
      
    } else {
      console.error('❌ Account not found:', data.error);
    }
    
  } catch (error) {
    console.error('❌ RPC Error:', error.message);
  }
}

async function testSolverBus() {
  try {
    const intentRequest = {
      asset_in: 'wrap.testnet',
      amount_in: '1000000000000000000000', // 0.001 NEAR
      asset_out: 'usdc.fakes.testnet',
    };

    console.log('📤 Sending request to Solver Bus...');
    console.log('Request:', intentRequest);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    const response = await fetch('https://solver-relay-v2.chaindefuser.com/rpc', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        method: 'fetch_options',
        params: [intentRequest]
      }),
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));
    
    const responseText = await response.text();
    console.log('Raw response:', responseText);
    
    let solverData;
    try {
      solverData = JSON.parse(responseText);
      console.log('📊 Solver response:', JSON.stringify(solverData, null, 2));
    } catch (parseError) {
      console.log('❌ JSON parse failed:', parseError.message);
      console.log('Response was not valid JSON');
      return;
    }

    if (solverData.result && solverData.result.length > 0) {
      console.log(`✅ Found ${solverData.result.length} quotes!`);
      console.log('🎯 Best quote:', solverData.result[0]);
    } else {
      console.log('❌ No quotes available');
      console.log('💡 This is normal for testnet - limited solvers');
    }
    
  } catch (error) {
    if (error.name === 'AbortError') {
      console.log('⏰ Solver Bus timeout (5s)');
    } else {
      console.error('❌ Solver Bus error:', error.message);
    }
  }
}

rpcTest();