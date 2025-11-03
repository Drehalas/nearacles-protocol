import { OracleSolverNode } from './dist/services/oracle-solver-node.js';
import dotenv from 'dotenv';

dotenv.config();

async function startBackend() {
  console.log('🚀 Starting Nearacles Backend Oracle Solver...\n');

  const nearConfig = {
    networkId: process.env.NEAR_NETWORK || 'testnet',
    nodeUrl: process.env.NEAR_NODE_URL || 'https://rpc.testnet.near.org',
    contractId: process.env.NEAR_CONTRACT_ID || 'oracle-intent.testnet',
    privateKey: process.env.NEAR_TESTNET_PRIVATE_KEY || process.env.NEAR_PRIVATE_KEY || '',
    accountId: process.env.NEAR_TESTNET_ACCOUNT_ID || process.env.NEAR_ACCOUNT_ID || ''
  };

  const openaiApiKey = process.env.OPENAI_API_KEY || '';

  console.log('Configuration:');
  console.log(`  Network: ${nearConfig.networkId}`);
  console.log(`  Account: ${nearConfig.accountId}`);
  console.log(`  Contract: ${nearConfig.contractId}`);
  console.log(`  OpenAI Key: ${openaiApiKey ? 'Configured ✓' : 'Missing ✗'}\n`);

  if (!nearConfig.privateKey) {
    console.error('❌ Error: NEAR_PRIVATE_KEY or NEAR_TESTNET_PRIVATE_KEY is required');
    process.exit(1);
  }

  if (!nearConfig.accountId) {
    console.error('❌ Error: NEAR_ACCOUNT_ID or NEAR_TESTNET_ACCOUNT_ID is required');
    process.exit(1);
  }

  if (!openaiApiKey) {
    console.error('❌ Error: OPENAI_API_KEY is required');
    process.exit(1);
  }

  try {
    const solver = new OracleSolverNode(
      nearConfig,
      openaiApiKey,
      {
        minStakeAmount: '1000000000000000000000000',
        maxExecutionTime: 300,
        confidenceThreshold: 0.8,
        reputationThreshold: 0.7
      },
      {
        name: 'competitive',
        confidenceMultiplier: 1.0,
        stakeMultiplier: 1.0,
        executionTimeBuffer: 30,
        profitMargin: 0.1,
      },
      5
    );

    await solver.start();

    console.log('\n✅ Backend is running! Press Ctrl+C to stop.\n');

    process.on('SIGINT', async () => {
      console.log('\n🛑 Shutting down backend...');
      await solver.stop();
      process.exit(0);
    });

  } catch (error) {
    console.error('❌ Failed to start backend:', error);
    process.exit(1);
  }
}

startBackend().catch(console.error);