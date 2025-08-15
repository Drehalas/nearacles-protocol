import { getAccountState } from '@near-js/client';
import { config } from 'dotenv';

config();

async function accountTest() {
  console.log('🔄 NEAR Account State Test');
  
  const ACCOUNT_ID = process.env.NEAR_TESTNET_ACCOUNT_ID;
  
  try {
    console.log(`📡 Checking account: ${ACCOUNT_ID}`);
    
    const account = await getAccountState({
      accountId: ACCOUNT_ID!,
      networkId: 'testnet'
    });
    
    const balanceNEAR = parseFloat(account.amount) / 1e24;
    console.log(`✅ Account exists!`);
    console.log(`💰 Balance: ${balanceNEAR.toFixed(4)} NEAR`);
    console.log(`🔑 Access keys: ${account.access_keys?.length || 0}`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

accountTest();