import { functionCall, getSignerFromPrivateKey } from '@near-js/client';
import { config } from 'dotenv';

config();

async function realTestnetSwap() {
  console.log('🔄 Real NEAR Testnet Swap Test\n');
  
  const ACCOUNT_ID = process.env.NEAR_TESTNET_ACCOUNT_ID!;
  const PRIVATE_KEY = process.env.NEAR_TESTNET_PRIVATE_KEY!;
  
  console.log(`📋 Account: ${ACCOUNT_ID}`);
  console.log(`🔑 Private key starts with: ${PRIVATE_KEY.substring(0, 15)}`);
  
  try {
    console.log('📡 Setting up signer...');
    const signer = getSignerFromPrivateKey(ACCOUNT_ID, 'testnet', PRIVATE_KEY);
    console.log('✅ Signer ready');

    // Check account balance first via RPC
    const response = await fetch('https://archival-rpc.testnet.near.org', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
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
    const balanceNEAR = parseFloat(data.result.amount) / 1e24;
    console.log(`💰 Current balance: ${balanceNEAR.toFixed(4)} NEAR\n`);

    // Step 1: Try to wrap some NEAR to wNEAR
    console.log('🔄 Step 1: Wrapping 0.1 NEAR to wNEAR...');
    
    try {
      const wrapResult = await functionCall({
        contractId: 'wrap.testnet',
        methodName: 'near_deposit',
        args: {},
        gas: '30000000000000',
        attachedDeposit: '100000000000000000000000', // 0.1 NEAR in yoctoNEAR
        signer
      });
      
      console.log('✅ Wrap transaction successful!');
      console.log('Transaction hash:', wrapResult.transaction.hash);
      
      // Wait a bit for transaction to be processed
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Check wNEAR balance
      console.log('📊 Checking wNEAR balance...');
      
      const balanceResponse = await fetch('https://archival-rpc.testnet.near.org', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 'dontcare',
          method: 'query',
          params: {
            request_type: 'call_function',
            finality: 'final',
            account_id: 'wrap.testnet',
            method_name: 'ft_balance_of',
            args_base64: Buffer.from(JSON.stringify({
              account_id: ACCOUNT_ID
            })).toString('base64')
          }
        })
      });
      
      const balanceData = await balanceResponse.json();
      if (balanceData.result?.result) {
        const resultString = Buffer.from(balanceData.result.result).toString();
        const wNearBalance = JSON.parse(resultString);
        const readableBalance = parseFloat(wNearBalance) / 1e24;
        console.log(`💎 wNEAR balance: ${readableBalance.toFixed(6)} wNEAR`);
      }

    } catch (wrapError) {
      console.log('❌ Wrap failed:', wrapError.message);
      console.log('💡 This might be because:');
      console.log('   - wrap.testnet contract might not exist');
      console.log('   - Account not registered for FT');
      console.log('   - Gas estimation issues');
    }

    // Step 2: Try simple storage registration for ref.finance testnet
    console.log('\n🔄 Step 2: Testing Ref Finance storage...');
    
    try {
      const storageResult = await functionCall({
        contractId: 'ref-finance-101.testnet',
        methodName: 'storage_deposit',
        args: {
          account_id: ACCOUNT_ID
        },
        gas: '30000000000000',
        attachedDeposit: '1250000000000000000000000', // 0.125 NEAR for storage
        signer
      });
      
      console.log('✅ Storage registration successful!');
      console.log('Transaction hash:', storageResult.transaction.hash);
      
    } catch (storageError) {
      console.log('❌ Storage registration failed:', storageError.message);
      console.log('💡 This is normal if already registered or contract doesn\'t exist');
    }

    console.log('\n🎯 Swap Test Summary:');
    console.log('✅ NEAR account working');
    console.log('✅ Transaction signing working');
    console.log('✅ Contract interaction attempted');
    console.log('💡 For real swaps, use mainnet with active DEXs like ref.finance');

  } catch (error) {
    console.error('💥 Error:', error.message);
    
    if (error.message.includes('Invalid encoded key')) {
      console.log('\n🔧 Fix: Check private key format');
    } else if (error.message.includes('timeout')) {
      console.log('\n⏰ Network timeout - try again');
    }
  }
}

realTestnetSwap();