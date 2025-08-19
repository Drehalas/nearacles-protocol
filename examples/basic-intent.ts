/**
 * Basic Intent Creation Example
 */

import { setupTestnet } from '../backend/index';

async function basicIntentExample() {
  // Initialize protocol for testnet
  const { intentAgent, aiAgent } = await setupTestnet();

  try {
    // Create a basic intent
    const result = await intentAgent.createIntent({
      asset_in: 'NEAR',
      asset_out: 'USDC',
      amount_in: '10000000000000000000000000', // 10 NEAR
      slippage_tolerance: 0.01, // 1%
    });

    if (result.success) {
      console.log('Intent created:', result.data.intent.id);
      console.log('Available quotes:', result.data.quotes.length);
      
      if (result.data.recommendation) {
        console.log('Recommended quote score:', result.data.recommendation.score);
      }
    }
  } catch (error) {
    console.error('Error creating intent:', error);
  }
}

basicIntentExample();
