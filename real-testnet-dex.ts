import { config } from 'dotenv';

config();

// Real testnet DEX swap using direct calls
async function realTestnetDEX() {
  console.log('🔄 Real Testnet DEX Swap\n');
  
  const ACCOUNT_ID = process.env.NEAR_TESTNET_ACCOUNT_ID!;
  
  try {
    // Test Ref Finance testnet pools
    console.log('🔍 Checking Ref Finance testnet...');
    
    const poolsResponse = await fetch('https://archival-rpc.testnet.near.org', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 'dontcare',
        method: 'query',
        params: {
          request_type: 'call_function',
          finality: 'final',
          account_id: 'ref-finance-101.testnet',
          method_name: 'get_number_of_pools',
          args_base64: Buffer.from('{}').toString('base64')
        }
      })
    });
    
    const poolsData = await poolsResponse.json();
    
    if (poolsData.result?.result) {
      const poolCount = JSON.parse(Buffer.from(poolsData.result.result).toString());
      console.log(`✅ Ref Finance testnet active: ${poolCount} pools`);
      
      // Check available tokens
      console.log('🔍 Checking available tokens...');
      
      const tokensResponse = await fetch('https://archival-rpc.testnet.near.org', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 'dontcare',
          method: 'query',
          params: {
            request_type: 'call_function',
            finality: 'final',
            account_id: 'ref-finance-101.testnet',
            method_name: 'get_whitelisted_tokens',
            args_base64: Buffer.from('{}').toString('base64')
          }
        })
      });
      
      const tokensData = await tokensResponse.json();
      
      if (tokensData.result?.result) {
        const tokens = JSON.parse(Buffer.from(tokensData.result.result).toString());
        console.log(`✅ Available tokens: ${tokens.length}`);
        console.log('First 5 tokens:', tokens.slice(0, 5));
        
        // Check a specific pool (wNEAR/USDC if exists)
        const estimateResponse = await fetch('https://archival-rpc.testnet.near.org', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jsonrpc: '2.0',
            id: 'dontcare',
            method: 'query',
            params: {
              request_type: 'call_function',
              finality: 'final',
              account_id: 'ref-finance-101.testnet',
              method_name: 'get_return',
              args_base64: Buffer.from(JSON.stringify({
                token_in: 'wrap.testnet',
                amount_in: '1000000000000000000000', // 0.001 NEAR
                token_out: tokens[1] || 'usdc.fakes.testnet'
              })).toString('base64')
            }
          })
        });
        
        const estimateData = await estimateResponse.json();
        
        if (estimateData.result?.result) {
          const estimate = JSON.parse(Buffer.from(estimateData.result.result).toString());
          console.log('✅ Swap estimate successful:', estimate);
          
          console.log('\n🎯 Testnet DEX Status:');
          console.log('✅ Ref Finance testnet: ACTIVE');
          console.log('✅ Swap estimation: WORKING');
          console.log('✅ Token pools: AVAILABLE');
          console.log('✅ Ready for real swap!');
          
          return true;
        }
      }
      
    } else {
      console.log('❌ Ref Finance testnet not available');
    }
    
    return false;
    
  } catch (error) {
    console.error('💥 Error:', error.message);
    return false;
  }
}

// Call the function
realTestnetDEX().then(success => {
  if (success) {
    console.log('\n🚀 Next: Execute real swap with transaction!');
  } else {
    console.log('\n💡 Recommendation: Use mainnet for real swap test');
  }
});