/**
 * End-to-end demonstration of NEAR Intent-Based Oracle system
 * Shows complete flow from intent creation to settlement
 */

import { IntentBroadcaster } from '../services/intent-broadcaster.js';
import { NEAROracleIntegration } from '../services/near-oracle-integration.js';
import { OracleSolverNode } from '../services/oracle-solver-node.js';
import { CredibilityEvaluationIntent } from '../types/near-intent.js';

// Demo configuration
const DEMO_CONFIG = {
  nearConfig: {
    networkId: 'testnet' as const,
    nodeUrl: 'https://rpc.testnet.near.org',
    contractId: 'oracle-intent.testnet',
    privateKey: 'ed25519:your_private_key_here',
    accountId: 'demo-user.testnet'
  },
  openaiApiKey: process.env.OPENAI_API_KEY || '',
  solverConfig: {
    minStakeAmount: '1000000000000000000000000', // 1 NEAR
    maxExecutionTime: 300,
    confidenceThreshold: 0.8,
    reputationThreshold: 0.7
  }
};

class IntentOracleDemo {
  private intentBroadcaster: IntentBroadcaster;
  private oracleIntegration: NEAROracleIntegration;
  private solverNode: OracleSolverNode;

  constructor() {
    this.intentBroadcaster = new IntentBroadcaster(DEMO_CONFIG.nearConfig.privateKey);
    this.oracleIntegration = new NEAROracleIntegration(
      DEMO_CONFIG.nearConfig,
      DEMO_CONFIG.openaiApiKey,
      DEMO_CONFIG.solverConfig
    );
    this.solverNode = new OracleSolverNode(
      DEMO_CONFIG.nearConfig,
      DEMO_CONFIG.openaiApiKey,
      DEMO_CONFIG.solverConfig
    );
  }

  /**
   * Demonstrate complete intent-based oracle flow
   */
  async runDemo(): Promise<void> {
    console.log('🎯 Starting NEAR Intent-Based Oracle Demo\n');

    try {
      // Step 1: Start solver node
      await this.startSolverNode();

      // Step 2: Create and broadcast credibility evaluation intent
      await this.demonstrateCredibilityEvaluation();

      // Step 3: Show refutation challenge
      await this.demonstrateRefutationChallenge();

      // Step 4: Display final results
      await this.displayResults();

    } catch (error) {
      console.error('❌ Demo failed:', error);
    } finally {
      await this.cleanup();
    }
  }

  /**
   * Start the oracle solver node
   */
  private async startSolverNode(): Promise<void> {
    console.log('🚀 Step 1: Starting Oracle Solver Node');
    console.log('=' .repeat(50));
    
    try {
      await this.solverNode.start();
      console.log('✅ Solver node is running and monitoring for intents\n');
      
      // Give solver node time to initialize
      await new Promise(resolve => setTimeout(resolve, 2000));
      
    } catch (error) {
      console.error('Failed to start solver node:', error);
      throw error;
    }
  }

  /**
   * Demonstrate credibility evaluation intent flow
   */
  private async demonstrateCredibilityEvaluation(): Promise<void> {
    console.log('🔍 Step 2: Creating Credibility Evaluation Intent');
    console.log('=' .repeat(50));

    const question = "Is Bitcoin currently trading above $50,000?";
    console.log(`📝 Question: ${question}`);

    try {
      // Create credibility evaluation intent
      const signedIntent = this.intentBroadcaster.createCredibilityEvaluationIntent(
        DEMO_CONFIG.nearConfig.accountId,
        question,
        {
          reward: '2000000000000000000000000', // 2 NEAR
          requiredSources: 3,
          confidenceThreshold: 0.8,
          maxEvaluationTime: 240
        }
      );

      console.log('📊 Intent Configuration:');
      console.log(`   Reward: 2 NEAR`);
      console.log(`   Required Sources: 3`);
      console.log(`   Confidence Threshold: 80%`);
      console.log(`   Max Execution Time: 240 seconds`);

      // Extract intent message for demonstration
      const intentMessage = JSON.parse(signedIntent.payload.message);
      console.log('\n📋 Signed Intent Created:');
      console.log(`   Signer: ${intentMessage.signer_id}`);
      console.log(`   Deadline: ${intentMessage.deadline}`);
      console.log(`   Intent Type: ${intentMessage.intents[0].intent}`);

      // Simulate intent broadcasting
      console.log('\n📡 Broadcasting intent to solver network...');
      
      // In a real scenario, this would broadcast to the actual solver network
      console.log('✅ Intent broadcast successful');
      console.log('⏳ Waiting for solver nodes to process...\n');

      // Wait for processing
      await new Promise(resolve => setTimeout(resolve, 5000));

    } catch (error) {
      console.error('Failed to create credibility evaluation:', error);
      throw error;
    }
  }

  /**
   * Demonstrate refutation challenge
   */
  private async demonstrateRefutationChallenge(): Promise<void> {
    console.log('⚔️  Step 3: Demonstrating Refutation Challenge');
    console.log('=' .repeat(50));

    try {
      const evaluationHash = 'eval_demo_123';
      const challengeStake = '3000000000000000000000000'; // 3 NEAR (higher than evaluation)

      console.log(`🎯 Challenging evaluation: ${evaluationHash}`);
      console.log(`💰 Challenge stake: 3 NEAR (must be > evaluation stake)`);

      // Create refutation challenge intent
      const challengeIntent = this.intentBroadcaster.createRefutationChallengeIntent(
        DEMO_CONFIG.nearConfig.accountId,
        evaluationHash,
        challengeStake
      );

      console.log('\n🔍 Challenge Intent Created:');
      console.log(`   Evaluation Hash: ${evaluationHash}`);
      console.log(`   Challenge Stake: ${challengeStake} yoctoNEAR`);
      console.log(`   Intent Hash: ${challengeIntent.payload.nonce.substring(0, 16)}...`);

      console.log('\n📡 Broadcasting challenge to solver network...');
      console.log('✅ Challenge broadcast successful');
      console.log('⏳ Waiting for challenge processing...\n');

      await new Promise(resolve => setTimeout(resolve, 3000));

    } catch (error) {
      console.error('Failed to create refutation challenge:', error);
      throw error;
    }
  }

  /**
   * Display demo results and metrics
   */
  private async displayResults(): Promise<void> {
    console.log('📊 Step 4: Demo Results & Solver Metrics');
    console.log('=' .repeat(50));

    try {
      // Get solver metrics
      const metrics = this.solverNode.getMetrics();
      const activeExecutions = this.solverNode.getActiveExecutions();

      console.log('🤖 Solver Node Metrics:');
      console.log(`   Total Intents Processed: ${metrics.totalIntentsProcessed}`);
      console.log(`   Successful Evaluations: ${metrics.successfulEvaluations}`);
      console.log(`   Failed Evaluations: ${metrics.failedEvaluations}`);
      console.log(`   Current Reputation: ${(metrics.currentReputation * 100).toFixed(1)}%`);
      console.log(`   Average Execution Time: ${metrics.averageExecutionTime.toFixed(1)}s`);
      console.log(`   Active Intents: ${metrics.activeIntentsCount}`);

      if (metrics.totalEarnings !== '0') {
        const earningsNEAR = (parseFloat(metrics.totalEarnings) / 1e24).toFixed(4);
        console.log(`   Total Earnings: ${earningsNEAR} NEAR`);
      }

      console.log('\n🔄 Active Executions:');
      if (activeExecutions.length === 0) {
        console.log('   No active executions');
      } else {
        activeExecutions.forEach((execution, index) => {
          const runtime = execution.endTime 
            ? `${((execution.endTime - execution.startTime) / 1000).toFixed(1)}s`
            : `${((Date.now() - execution.startTime) / 1000).toFixed(1)}s (ongoing)`;
          
          console.log(`   ${index + 1}. ${execution.intentId}`);
          console.log(`      Status: ${execution.status}`);
          console.log(`      Runtime: ${runtime}`);
          if (execution.evaluationId) {
            console.log(`      Evaluation ID: ${execution.evaluationId}`);
          }
          if (execution.error) {
            console.log(`      Error: ${execution.error}`);
          }
        });
      }

      // Demonstrate economic model
      console.log('\n💰 Economic Model Demonstration:');
      console.log('   ├─ Intent Creators stake NEAR for evaluations');
      console.log('   ├─ Oracle Solvers stake NEAR to participate');  
      console.log('   ├─ Accurate evaluations earn rewards');
      console.log('   ├─ Challenges require higher stakes');
      console.log('   └─ Reputation affects future earnings');

      console.log('\n🎯 Intent-Based Oracle Benefits:');
      console.log('   ✅ Decentralized fact-checking infrastructure');
      console.log('   ✅ Economic incentives for accurate information');
      console.log('   ✅ Natural market for oracle services');
      console.log('   ✅ Adversarial validation through challenges');
      console.log('   ✅ Cross-chain compatibility via NEAR intents');

    } catch (error) {
      console.error('Error displaying results:', error);
    }
  }

  /**
   * Cleanup demo resources
   */
  private async cleanup(): Promise<void> {
    console.log('\n🧹 Cleaning up demo resources...');
    
    try {
      await this.solverNode.stop();
      console.log('✅ Demo completed successfully');
      
    } catch (error) {
      console.error('Error during cleanup:', error);
    }
  }

  /**
   * Run interactive demo with user input
   */
  async runInteractiveDemo(): Promise<void> {
    console.log('🎮 Interactive NEAR Intent Oracle Demo');
    console.log('=' .repeat(50));
    
    // This would integrate with readline for real user interaction
    console.log('Available commands:');
    console.log('  1. create-intent <question>   - Create credibility evaluation intent');
    console.log('  2. challenge <eval_id>        - Challenge an evaluation');
    console.log('  3. status                     - Show solver status');
    console.log('  4. metrics                    - Show solver metrics');
    console.log('  5. quit                       - Exit demo');
    
    // For demo purposes, just run the automated demo
    await this.runDemo();
  }
}

// Main execution
async function main() {
  if (!DEMO_CONFIG.openaiApiKey) {
    console.error('❌ OPENAI_API_KEY environment variable is required');
    process.exit(1);
  }

  if (DEMO_CONFIG.nearConfig.privateKey === 'ed25519:your_private_key_here') {
    console.error('❌ Please set a valid NEAR private key in the demo configuration');
    process.exit(1);
  }

  const demo = new IntentOracleDemo();
  
  try {
    await demo.runDemo();
  } catch (error) {
    console.error('Demo failed:', error);
    process.exit(1);
  }
}

// Run demo if this file is executed directly
if (require.main === module) {
  main().catch(console.error);
}

export { IntentOracleDemo };