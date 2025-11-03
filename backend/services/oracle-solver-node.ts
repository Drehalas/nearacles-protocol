/**
 * Oracle Solver Node - Automated bidding and execution system
 * Listens for oracle intents, bids competitively, and executes evaluations
 */

import {
  NEAROracleIntegration,
  NEARConfig,
  OracleSolverConfig,
} from './near-oracle-integration.js';
import { OraclePricePusher } from './oracle-price-pusher.js';
import { TEEAttestationService, TEEAttestationConfig } from './tee-attestation.js';
import { ShadeAgentClient, ShadeAgentConfig } from './shade-agent-client.js';
// import { IntentBroadcaster } from './intent-broadcaster.js';
import {
  CredibilityEvaluationIntent,
  OracleQuote,
  NEARIntentMessage,
} from '../types/near-intent.js';

export interface SolverBiddingStrategy {
  name: 'competitive' | 'premium' | 'fast' | 'conservative';
  confidenceMultiplier: number; // Multiplier for confidence guarantee
  stakeMultiplier: number; // Multiplier for required stake
  executionTimeBuffer: number; // Extra time buffer in seconds
  profitMargin: number; // Desired profit margin (0-1)
}

export interface SolverMetrics {
  totalIntentsProcessed: number;
  successfulEvaluations: number;
  failedEvaluations: number;
  totalEarnings: string; // yoctoNEAR
  totalSlashed: string; // yoctoNEAR
  averageExecutionTime: number; // seconds
  currentReputation: number; // 0-1
  activeIntentsCount: number;
  totalPricePushes: number;  // NEW: price oracle metric
  successfulPricePushes: number;  // NEW: price oracle metric
}

export interface IntentExecution {
  intentId: string;
  evaluationId?: string;
  status: 'bidding' | 'executing' | 'completed' | 'failed';
  startTime: number;
  endTime?: number;
  earnings?: string;
  error?: string;
}

export class OracleSolverNode {
  private nearIntegration: NEAROracleIntegration;
  private pricePusher: OraclePricePusher;
  private teeAttestation?: TEEAttestationService;
  private shadeAgent?: ShadeAgentClient;
  // private _intentBroadcaster: IntentBroadcaster;
  private biddingStrategy: SolverBiddingStrategy;
  private metrics: SolverMetrics;
  private activeExecutions: Map<string, IntentExecution>;
  private isRunning: boolean = false;
  private maxConcurrentIntents: number;
  private teeMode: boolean = false;
  private nearConfig: NEARConfig;

  constructor(
    nearConfig: NEARConfig,
    openaiApiKey: string,
    solverConfig?: OracleSolverConfig,
    biddingStrategy: SolverBiddingStrategy = {
      name: 'competitive',
      confidenceMultiplier: 1.0,
      stakeMultiplier: 1.0,
      executionTimeBuffer: 30,
      profitMargin: 0.1,
    },
    maxConcurrentIntents: number = 5
  ) {
    this.nearConfig = nearConfig;
    this.nearIntegration = new NEAROracleIntegration(nearConfig, openaiApiKey, solverConfig);
    // this._intentBroadcaster = new IntentBroadcaster(nearConfig.privateKey);
    this.biddingStrategy = biddingStrategy;
    this.maxConcurrentIntents = maxConcurrentIntents;
    this.activeExecutions = new Map();

    // Initialize price pusher
    this.pricePusher = new OraclePricePusher(this.nearIntegration, {
      updateInterval: 60000, // 1 minute
      assets: ['BTC/USD', 'ETH/USD', 'NEAR/USD'],
      minSources: 5,
    });

    // Check for TEE mode from environment
    this.teeMode = process.env.TEE_MODE === 'enabled';

    // Initialize TEE services if enabled
    if (this.teeMode) {
      console.log('TEE Mode: ENABLED');

      // Initialize TEE Attestation Service
      const teeConfig: TEEAttestationConfig = {
        mode: process.env.TEE_ENV === 'production' ? 'production' : 'development',
        nodeId: nearConfig.accountId,
        dstackApiKey: process.env.DSTACK_API_KEY,
        deploymentId: process.env.DSTACK_DEPLOYMENT_ID,
        deploymentUrl: process.env.DSTACK_DEPLOYMENT_URL,
      };
      this.teeAttestation = new TEEAttestationService(teeConfig);

      // Initialize Shade Agent Client
      const shadeConfig: ShadeAgentConfig = {
        nearAccount: nearConfig.accountId,
        privateKey: nearConfig.privateKey,
        phalaApiKey: process.env.PHALA_API_KEY,
        dstackApiKey: process.env.DSTACK_API_KEY,
        deploymentId: process.env.DSTACK_DEPLOYMENT_ID,
        deploymentUrl: process.env.DSTACK_DEPLOYMENT_URL,
        teeProvider: (process.env.TEE_PROVIDER as 'dstack' | 'phala') || 'dstack',
        mode: process.env.TEE_ENV === 'production' ? 'production' : 'development',
      };
      this.shadeAgent = new ShadeAgentClient(shadeConfig);
    } else {
      console.log('TEE Mode: DISABLED (development mode)');
    }

    this.metrics = {
      totalIntentsProcessed: 0,
      successfulEvaluations: 0,
      failedEvaluations: 0,
      totalEarnings: '0',
      totalSlashed: '0',
      averageExecutionTime: 0,
      currentReputation: 1.0,
      activeIntentsCount: 0,
      totalPricePushes: 0,
      successfulPricePushes: 0,
    };
  }

  /**
   * Start the oracle solver node
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      console.log('Solver node is already running');
      return;
    }

    console.log('Starting Oracle Solver Node...');

    try {
      // Initialize NEAR integration first
      await this.nearIntegration.initialize();
      console.log('NEAR connection initialized');

      // TEE Mode Registration
      if (this.teeMode && this.teeAttestation && this.shadeAgent) {
        console.log('Initializing TEE components...');

        // Register Shade Agent
        const agentRegistration = await this.shadeAgent.register();
        console.log(`Shade Agent registered: ${agentRegistration.agentId}`);
        console.log(`  Deployment URL: ${agentRegistration.deploymentUrl}`);
        console.log(`  TEE Provider: ${agentRegistration.attestation.tee_provider}`);

        // Generate TEE attestation
        const attestation = await this.teeAttestation.generateAttestation();
        console.log(`TEE attestation generated: ${attestation.attestation_hash}`);

        // Register as solver with TEE attestation
        await this.nearIntegration.registerAsSolverWithAttestation(attestation);
        console.log('Registered as TEE-verified oracle solver');

        // Start attestation refresh loop (every 1 hour)
        this.startAttestationRefresh();
      } else {
        // Standard registration without TEE
        await this.nearIntegration.registerAsSolver();
        console.log('Registered as oracle solver (non-TEE mode)');
      }

      // Start price pusher (TEMPORARILY DISABLED - waiting for price oracle contract)
      // TODO: Re-enable once price oracle contract is deployed
      // await this.pricePusher.start();
      console.log('Price oracle pusher DISABLED (contract not ready)');

      // Start intent monitoring
      this.isRunning = true;
      this.startIntentMonitoring();

      console.log('Monitoring for oracle intents...');
      console.log('  Strategy: %s', this.biddingStrategy.name);
      console.log('  Max concurrent intents: %d', this.maxConcurrentIntents);
      console.log('  Price oracle active for: %s', this.pricePusher.getConfig().assets.join(', '));
      console.log('  TEE Mode: %s', this.teeMode ? 'ENABLED' : 'DISABLED');
    } catch (error) {
      console.error('Failed to start solver node:', error);
      throw error;
    }
  }

  /**
   * Stop the oracle solver node
   */
  async stop(): Promise<void> {
    if (!this.isRunning) {
      return;
    }

    console.log('🛑 Stopping Oracle Solver Node...');
    this.isRunning = false;

    // Stop price pusher
    this.pricePusher.stop();
    console.log('✅ Price oracle pusher stopped');

    // Wait for active executions to complete
    while (this.activeExecutions.size > 0) {
      console.log(`⏳ Waiting for ${this.activeExecutions.size} active executions to complete...`);
      await new Promise(resolve => setTimeout(resolve, 5000));
    }

    console.log('✅ Oracle Solver Node stopped');
  }

  /**
   * Start monitoring for oracle intents
   */
  private startIntentMonitoring(): void {
    const monitoringInterval = setInterval(async () => {
      if (!this.isRunning) {
        clearInterval(monitoringInterval);
        return;
      }

      try {
        await this.checkForNewIntents();
        await this.updateActiveExecutions();
        await this.updateMetrics();
      } catch (error) {
        console.error('Error in monitoring cycle:', error);
      }
    }, 5000); // Check every 5 seconds
  }

  /**
   * Check for new oracle intents and bid on them
   */
  private async checkForNewIntents(): Promise<void> {
    if (this.activeExecutions.size >= this.maxConcurrentIntents) {
      return; // At capacity
    }

    try {
      // TODO: Implement get_pending_intents in contract
      // For now, just skip this check to avoid errors
      // The contract is ready to receive intents when implemented
      return;
    } catch (error) {
      console.error('Error checking for new intents:', error);
    }
  }

  /**
   * Process a new intent by creating a bid
   */
  private async processNewIntent(intent: CredibilityEvaluationIntent): Promise<void> {
    try {
      const credibilityIntent: CredibilityEvaluationIntent = {
        intent: 'credibility_evaluation',
        question: intent.question,
        required_sources: intent.required_sources || 3,
        confidence_threshold: intent.confidence_threshold || 0.8,
        max_evaluation_time: intent.max_evaluation_time || 300,
        reward: intent.reward,
      };

      // Evaluate if we should bid on this intent
      const shouldBid = this.shouldBidOnIntent(credibilityIntent);
      if (!shouldBid) {
        console.log(`⏭️  Skipping intent ${(intent as any).intent_id} - doesn't match criteria`);
        return;
      }

      // Create competitive quote
      const quote = this.createQuote((intent as any).intent_id, credibilityIntent);

      console.log('💰 Bidding on intent %s', (intent as any).intent_id);
      console.log('   Question: %s', credibilityIntent.question);
      console.log('   Confidence: %s', quote.confidence_guarantee);
      console.log('   Stake: %s', quote.required_stake);
      console.log(`   Time: ${quote.estimated_execution_time}s`);

      // Submit bid and start execution if accepted
      const execution: IntentExecution = {
        intentId: (intent as any).intent_id,
        status: 'bidding',
        startTime: Date.now(),
      };

      this.activeExecutions.set((intent as any).intent_id, execution);

      // Execute the intent directly (simplified - in production would wait for quote acceptance)
      this.executeIntent((intent as any).intent_id, credibilityIntent);
    } catch (error) {
      console.error('Error processing intent %s:', (intent as any).intent_id, error);
    }
  }

  /**
   * Create a competitive quote for an intent
   */
  private createQuote(intentId: string, intent: CredibilityEvaluationIntent): OracleQuote {
    const baseExecutionTime = 60; // Base 60 seconds
    const complexityMultiplier = Math.min(intent.question.length / 100, 2); // Max 2x for complexity
    const estimatedTime = Math.ceil(
      baseExecutionTime * complexityMultiplier + this.biddingStrategy.executionTimeBuffer
    );

    const baseStake = '1000000000000000000000000'; // 1 NEAR
    const requiredStake = (
      (BigInt(baseStake) * BigInt(Math.ceil(this.biddingStrategy.stakeMultiplier * 100))) /
      BigInt(100)
    ).toString();

    const confidenceGuarantee = Math.min(
      (intent.confidence_threshold || 0.8) * this.biddingStrategy.confidenceMultiplier,
      0.95 // Max 95% confidence guarantee
    );

    return {
      solver_id: 'oracle-solver-node', // Would be actual solver ID
      intent_hash: intentId,
      estimated_execution_time: estimatedTime,
      confidence_guarantee: confidenceGuarantee,
      required_stake: requiredStake,
      quote_hash: this.generateQuoteHash(intentId),
      expiration_time: new Date(Date.now() + 300000).toISOString(), // 5 minutes
    };
  }

  /**
   * Execute an oracle intent
   */
  private async executeIntent(
    intentId: string,
    intent: CredibilityEvaluationIntent
  ): Promise<void> {
    const execution = this.activeExecutions.get(intentId);
    if (!execution) return;

    try {
      execution.status = 'executing';
      console.log('⚡ Executing intent %s', intentId);

      // Create dummy NEAR intent message for processing
      const intentMessage: NEARIntentMessage = {
        signer_id: 'user.near', // Would be actual signer
        deadline: new Date(Date.now() + 3600000).toISOString(),
        intents: [intent],
      };

      // Process the intent using NEAR integration
      const evaluationResult = await this.nearIntegration.processCredibilityIntent(
        intentMessage,
        intent
      );

      // Submit result to NEAR contract
      const evaluationId = await this.nearIntegration.submitEvaluationToContract(
        intentId,
        evaluationResult
      );

      execution.evaluationId = evaluationId;
      execution.status = 'completed';
      execution.endTime = Date.now();
      execution.earnings = intent.reward || '0';

      this.metrics.successfulEvaluations++;
      this.metrics.totalEarnings = (
        BigInt(this.metrics.totalEarnings) + BigInt(execution.earnings)
      ).toString();

      console.log('✅ Completed intent %s -> evaluation %s', intentId, evaluationId);
      console.log(`   Execution time: ${(execution.endTime - execution.startTime) / 1000}s`);
      console.log(`   Earnings: ${execution.earnings} yoctoNEAR`);
    } catch (error) {
      execution.status = 'failed';
      execution.endTime = Date.now();
      execution.error = error instanceof Error ? error.message : 'Unknown error';

      this.metrics.failedEvaluations++;

      console.error('❌ Failed to execute intent %s:', intentId, error);
    } finally {
      this.metrics.totalIntentsProcessed++;
      // Remove from active executions after a delay to allow for monitoring
      setTimeout(() => {
        this.activeExecutions.delete(intentId);
      }, 30000); // Keep for 30 seconds
    }
  }

  /**
   * Update active executions status
   */
  private async updateActiveExecutions(): Promise<void> {
    for (const [intentId, execution] of this.activeExecutions.entries()) {
      if (execution.status === 'executing') {
        const executionTime = (Date.now() - execution.startTime) / 1000;

        // Check for timeout
        if (executionTime > 600) {
          // 10 minutes timeout
          execution.status = 'failed';
          execution.endTime = Date.now();
          execution.error = 'Execution timeout';

          this.metrics.failedEvaluations++;
          console.error(`⏰ Intent ${intentId} timed out after ${executionTime}s`);
        }
      }
    }
  }

  /**
   * Update solver metrics
   */
  private async updateMetrics(): Promise<void> {
    try {
      const solverInfo = await this.nearIntegration.getSolverInfo();
      if (solverInfo) {
        this.metrics.currentReputation = (solverInfo as any).reputation_score || 1.0;
      }

      this.metrics.activeIntentsCount = this.activeExecutions.size;

      // Update price pusher metrics
      const pusherMetrics = this.pricePusher.getMetrics();
      this.metrics.totalPricePushes = pusherMetrics.totalPushes;
      this.metrics.successfulPricePushes = pusherMetrics.successfulPushes;

      // Calculate average execution time
      const completedExecutions = Array.from(this.activeExecutions.values()).filter(
        e => e.status === 'completed' && e.endTime
      );

      if (completedExecutions.length > 0) {
        const totalTime = completedExecutions.reduce(
          (sum, e) => sum + (e.endTime! - e.startTime),
          0
        );
        this.metrics.averageExecutionTime = totalTime / completedExecutions.length / 1000;
      }
    } catch (error) {
      console.error('Error updating metrics:', error);
    }
  }

  /**
   * Determine if we should bid on an intent
   */
  private shouldBidOnIntent(intent: CredibilityEvaluationIntent): boolean {
    // Check if question is too complex or outside our capabilities
    if (intent.question.length > 500) {
      return false; // Too complex
    }

    // Check confidence threshold
    if ((intent.confidence_threshold || 0) > 0.9) {
      return false; // Too high confidence requirement
    }

    // Check execution time requirements
    if (intent.max_evaluation_time && intent.max_evaluation_time < 30) {
      return false; // Too fast requirement
    }

    // Check if reward is sufficient
    const rewardAmount = BigInt(intent.reward || '0');
    const minReward = BigInt('500000000000000000000000'); // 0.5 NEAR minimum
    if (rewardAmount < minReward) {
      return false; // Insufficient reward
    }

    return true;
  }

  /**
   * Generate a unique quote hash
   */
  private generateQuoteHash(intentId: string): string {
    const data = `${intentId}_${Date.now()}_${Math.random()}`;
    return Buffer.from(data).toString('base64');
  }

  /**
   * Get current solver metrics
   */
  getMetrics(): SolverMetrics {
    return { ...this.metrics };
  }

  /**
   * Get active executions
   */
  getActiveExecutions(): IntentExecution[] {
    return Array.from(this.activeExecutions.values());
  }

  /**
   * Update bidding strategy
   */
  updateBiddingStrategy(strategy: Partial<SolverBiddingStrategy>): void {
    this.biddingStrategy = { ...this.biddingStrategy, ...strategy };
    console.log('Updated bidding strategy:', this.biddingStrategy);
  }

  /**
   * Start attestation refresh loop (TEE mode)
   */
  private startAttestationRefresh(): void {
    if (!this.teeMode || !this.teeAttestation) {
      return;
    }

    console.log('Starting TEE attestation refresh loop (every 1 hour)...');

    setInterval(async () => {
      try {
        console.log('Refreshing TEE attestation...');

        // Generate new attestation
        const attestation = await this.teeAttestation!.generateAttestation();

        // Submit to NEAR contract
        await this.nearIntegration.refreshAttestation(attestation);

        console.log(`TEE attestation refreshed successfully: ${attestation.attestation_hash}`);
      } catch (error) {
        console.error('Failed to refresh TEE attestation:', error);
      }
    }, 3600000); // 1 hour
  }

  /**
   * Get TEE status (if enabled)
   */
  async getTEEStatus(): Promise<Record<string, unknown> | null> {
    if (!this.teeMode) {
      return null;
    }

    try {
      const status = await this.nearIntegration.getTEEStatus();
      return status;
    } catch (error) {
      console.error('Failed to get TEE status:', error);
      return null;
    }
  }

  /**
   * Check if node is TEE verified
   */
  async isTEEVerified(): Promise<boolean> {
    if (!this.teeMode) {
      return false;
    }

    try {
      return await this.nearIntegration.isTEEVerified();
    } catch (error) {
      console.error('Failed to check TEE verification:', error);
      return false;
    }
  }
}
