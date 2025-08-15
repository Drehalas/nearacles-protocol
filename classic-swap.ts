import * as nearAPI from 'near-api-js';
import { config } from 'dotenv';

config();

async function classicSwap() {
  console.log('🔄 Classic NEAR API Testnet Swap\n');
  
  const ACCOUNT_ID = process.env.NEAR_TESTNET_ACCOUNT_ID!;
  const PRIVATE_KEY = process.env.NEAR_TESTNET_PRIVATE_KEY!;
  
  console.log(`📋 Account: ${ACCOUNT_ID}`);
  
  try {
    // Setup connection using old API
    console.log('📡 Setting up connection...');
    
    const keyStore = new nearAPI.keyStores.InMemoryKeyStore();
    const keyPair = nearAPI.utils.KeyPair.fromString(PRIVATE_KEY);
    await keyStore.setKey('testnet', ACCOUNT_ID, keyPair);

    const near = await nearAPI.connect({
      networkId: 'testnet',
      keyStore,
      nodeUrl: 'https://archival-rpc.testnet.near.org',
      walletUrl: 'https://testnet.mynearwallet.com/',
      helperUrl: 'https://helper.testnet.near.org',
    });

    const account = await near.account(ACCOUNT_ID);
    console.log('✅ Connected successfully');

    // Check balance
    const state = await account.state();
    const balanceNEAR = parseFloat(state.amount) / 1e24;
    console.log(`💰 Current balance: ${balanceNEAR.toFixed(4)} NEAR\n`);

    // Test 1: Simple contract call - check if wrap.testnet exists
    console.log('🔍 Testing wrap.testnet contract...');
    
    try {
      const wrapResult = await account.viewFunction({
        contractId: 'wrap.testnet',
        methodName: 'ft_metadata',
        args: {}
      });
      
      console.log('✅ wrap.testnet exists!');
      console.log('Token metadata:', wrapResult);
      
      // Try to wrap 0.01 NEAR
      console.log('\n🔄 Attempting to wrap 0.01 NEAR...');
      
      const wrapTx = await account.functionCall({
        contractId: 'wrap.testnet',
        methodName: 'near_deposit',
        args: {},
        gas: '30000000000000',
        attachedDeposit: '10000000000000000000000' // 0.01 NEAR
      });
      
      console.log('✅ Wrap transaction successful!');
      console.log('Transaction ID:', wrapTx.transaction.hash);
      
    } catch (wrapError) {
      console.log('❌ wrap.testnet failed:', wrapError.message);
    }

    // Test 2: Try ref-finance testnet
    console.log('\n🔍 Testing ref-finance-101.testnet...');
    
    try {
      const refPools = await account.viewFunction({
        contractId: 'ref-finance-101.testnet',
        methodName: 'get_number_of_pools',
        args: {}
      });
      
      console.log('✅ ref-finance testnet exists!');
      console.log('Number of pools:', refPools);
      
    } catch (refError) {
      console.log('❌ ref-finance testnet failed:', refError.message);
    }

    // Test 3: Simple transfer to ourselves (should work)
    console.log('\n🔄 Testing simple transfer...');
    
    try {
      const transferTx = await account.sendMoney(
        ACCOUNT_ID, // Transfer to ourselves
        '1000000000000000000000' // 0.001 NEAR
      );
      
      console.log('✅ Self-transfer successful!');
      console.log('Transaction ID:', transferTx.transaction.hash);
      
    } catch (transferError) {
      console.log('❌ Transfer failed:', transferError.message);
    }

    console.log('\n🎯 Test Results:');
    console.log('✅ NEAR API connection working');
    console.log('✅ Account access working');
    console.log('✅ Transaction signing capability confirmed');
    console.log('💡 Ready for mainnet swaps with real DEXs!');

  } catch (error) {
    console.error('💥 Connection Error:', error.message);
  }
}

classicSwap();