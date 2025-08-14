import { setupMainnet } from './src';

async function simpleSwap() {
  console.log('🔄 Simple NEAR → USDC swap on MAINNET\n');
  
  // Mainnet account credentials
  const ACCOUNT_ID = 'drehalas.near';
  const PRIVATE_KEY = process.env.NEAR_PRIVATE_KEY;
  
  try {
    if (!PRIVATE_KEY) {
      console.error('❌ Set NEAR_PRIVATE_KEY environment variable');
      return;
    }
    
    // Initialize
    console.log('📡 Connecting to NEAR Mainnet...');
    const { intentAgent } = await setupMainnet(ACCOUNT_ID, PRIVATE_KEY);
    
    // Wait for initialization
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Create simple swap intent: 0.1 NEAR → USDC
    console.log('⚡ Creating swap intent...');
    const result = await intentAgent.createIntent({
      asset_in: 'NEAR',
      asset_out: 'USDC', 
      amount_in: '100000000000000000000000', // 0.1 NEAR
      min_amount_out: '400000', // Min 0.4 USDC
      slippage_tolerance: 0.02, // 2%
      deadline: Date.now() + 300000 // 5 min
    });
    
    if (result.success) {
      console.log('✅ Intent created!');
      console.log('📋 Intent ID:', result.data.intent.intent_id);
      console.log('💱 Quotes:', result.data.quotes.length);
    } else {
      console.error('❌ Failed:', result.error);
    }
    
  } catch (error) {
    console.error('💥 Error:', error);
  }
}

simpleSwap();