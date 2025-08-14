#!/usr/bin/env tsx

/**
 * Test script for NEAR Intent Protocol
 * Demonstrates real on-chain intent creation and execution
 */

import { setupTestnet, IntentAgent, AIAgent } from '../src';

async function main() {
  console.log('🚀 Testing NEAR Intent Protocol...\n');

  // IMPORTANT: Replace with your testnet account credentials
  const ACCOUNT_ID = process.env.NEAR_ACCOUNT_ID || 'your-account.testnet';
  const PRIVATE_KEY = process.env.NEAR_PRIVATE_KEY || 'ed25519:...';

  if (!ACCOUNT_ID || !PRIVATE_KEY || PRIVATE_KEY === 'ed25519:...') {
    console.error('❌ Please set NEAR_ACCOUNT_ID and NEAR_PRIVATE_KEY environment variables');
    console.log('Example:');
    console.log('export NEAR_ACCOUNT_ID=your-account.testnet');
    console.log('export NEAR_PRIVATE_KEY=ed25519:your_private_key_here');
    process.exit(1);
  }

  try {
    // 1. Initialize the protocol
    console.log('📡 Initializing NEAR Intent Protocol...');
    const { intentAgent, aiAgent } = await setupTestnet(ACCOUNT_ID, PRIVATE_KEY);
    console.log('✅ Protocol initialized\n');

    // 2. Check account balance
    console.log('💰 Checking account balances...');
    const balances = await intentAgent.getAssetManager().getAllBalances(ACCOUNT_ID);
    console.log('Account balances:', balances);
    console.log('');

    // 3. Create a swap intent: 1 NEAR → USDC
    console.log('🔄 Creating swap intent: 1 NEAR → USDC...');
    
    const intentParams = {
      asset_in: 'NEAR',
      asset_out: 'USDC',
      amount_in: '1000000000000000000000000', // 1 NEAR in yoctoNEAR
      min_amount_out: '4000000', // Minimum 4 USDC (6 decimals)
      slippage_tolerance: 0.01, // 1% slippage
      deadline: Date.now() + 300000, // 5 minutes from now
    };

    const intentResult = await intentAgent.createIntent(intentParams);
    
    if (!intentResult.success) {
      console.error('❌ Failed to create intent:', intentResult.error);
      return;
    }

    console.log('✅ Intent created:', intentResult.data.intent.intent_id);
    console.log('📊 Quotes received:', intentResult.data.quotes.length);
    console.log('');

    // 4. Let AI analyze and make decision
    console.log('🤖 AI analyzing market conditions...');
    
    const aiDecision = await aiAgent.makeDecision(
      intentResult.data.intent,
      intentResult.data.quotes
    );

    if (!aiDecision.success) {
      console.error('❌ AI decision failed:', aiDecision.error);
      return;
    }

    console.log('🧠 AI Decision:', aiDecision.data.action);
    console.log('📈 Confidence:', (aiDecision.data.confidence * 100).toFixed(1) + '%');
    console.log('💭 Reasoning:', aiDecision.data.reasoning.join(', '));
    console.log('');

    // 5. Execute if AI recommends
    if (aiDecision.data.action === 'execute') {
      console.log('⚡ Executing intent...');
      
      const executionResult = await intentAgent.executeIntent(
        intentResult.data.intent.intent_id,
        aiDecision.data.execution_params!
      );

      if (executionResult.success) {
        console.log('✅ Intent executed successfully!');
        console.log('🔗 Transaction:', executionResult.data.transaction_hash);
        console.log('📊 Final status:', executionResult.data.status);
      } else {
        console.error('❌ Execution failed:', executionResult.error);
      }
    } else {
      console.log('⏸️  AI recommended not to execute:', aiDecision.data.action);
    }

  } catch (error) {
    console.error('💥 Error:', error);
  }
}

// Helper function to check if we're in a Node.js environment
if (typeof require !== 'undefined' && require.main === module) {
  main().catch(console.error);
}

export { main };