/**
 * NEAR Oracle Integration Service
 * Bridges our TypeScript oracle services with NEAR intent infrastructure
 */

import { Account } from '@near-js/accounts';
import { JsonRpcProvider } from '@near-js/providers';
import { KeyPairSigner } from '@near-js/signers';

import { OracleService } from './oracle.js';
// import { IntentBroadcaster } from './intent-broadcaster.js';
import {
  CredibilityEvaluationIntent,
  OracleEvaluationResult,
  NEARIntentMessage,
} from '../types/near-intent.js';
import { CredibilityEvaluation } from '../types/oracle.js';

export interface NEARConfig {
  networkId: 'mainnet' | 'testnet';
  nodeUrl: string;
  contractId: string;
  privateKey: string;
  accountId: string;
}

export interface OracleSolverConfig {
  minStakeAmount: string; // yoctoNEAR
  maxExecutionTime: number; // seconds
  confidenceThreshold: number; // 0-1
  reputationThreshold: number; // 0-1
}

export class NEAROracleIntegration {
  private nearAccount!: Account;
  private oracleService: OracleService;
  // private _intentBroadcaster: IntentBroadcaster;
  private contractId: string;
  private solverConfig: OracleSolverConfig;
  private nearConfig: NEARConfig;
  private initialized: boolean = false;

  constructor(
    nearConfig: NEARConfig,
    openaiApiKey: string,
    solverConfig: OracleSolverConfig = {
      minStakeAmount: '1000000000000000000000000', // 1 NEAR
      maxExecutionTime: 300, // 5 minutes
      confidenceThreshold: 0.8,
      reputationThreshold: 0.7,
    }
  ) {
    this.contractId = nearConfig.contractId;
    this.solverConfig = solverConfig;
    this.nearConfig = nearConfig;
    this.oracleService = new OracleService(openaiApiKey);
    // this._intentBroadcaster = new IntentBroadcaster(nearConfig.privateKey);
  }

  /**
   * Initialize the NEAR connection - must be called before using the service
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;
    this.nearAccount = await this.initializeNearAccount(this.nearConfig);
    this.initialized = true;
  }

  /**
   * Initialize NEAR account connection using modern @near-js packages
   */
  private async initializeNearAccount(config: NEARConfig): Promise<Account> {
    // Create JSON RPC provider
    const provider = new JsonRpcProvider({ url: config.nodeUrl });

    // Create signer from private key string using KeyPairSigner
    const signer = KeyPairSigner.fromSecretKey(config.privateKey as `ed25519:${string}`);

    // Create and return account with provider and signer
    const account = new Account(config.accountId, provider, signer);

    return account;
  }

  /**
   * Register this node as an oracle solver
   */
  async registerAsSolver(): Promise<void> {
    // Check if already registered
    const existingSolver = await this.getSolver(this.nearConfig.accountId);
    if (existingSolver && existingSolver.is_active) {
      console.log(`Already registered as oracle solver (account: ${this.nearConfig.accountId})`);
      console.log(`  Reputation: ${existingSolver.reputation_score}`);
      console.log(`  Total Stake: ${existingSolver.total_stake}`);
      console.log(`  TEE Verified: ${existingSolver.tee_verified}`);
      return;
    }

    try {
      const result = await this.nearAccount.functionCall({
        contractId: this.contractId,
        methodName: 'register_solver',
        args: Buffer.from('{}'),
        attachedDeposit: BigInt(this.solverConfig.minStakeAmount),
        gas: BigInt('30000000000000'), // 30 TGas
      });

      console.log(
        `Successfully registered as oracle solver with stake ${this.solverConfig.minStakeAmount}`
      );
      console.log('Registration result:', result);
    } catch (error) {
      console.error('Failed to register as solver:', error);
      throw error;
    }
  }

  /**
   * Get solver information
   */
  async getSolver(solverId: string): Promise<any> {
    try {
      console.log(`Checking if solver ${solverId} is registered...`);
      const result = await this.nearAccount.viewFunction({
        contractId: this.contractId,
        methodName: 'get_solver',
        args: { solver_id: solverId },
      });

      // Parse if string (sometimes NEAR returns JSON string)
      const solver = typeof result === 'string' ? JSON.parse(result) : result;
      console.log(`Solver found:`, solver);
      return solver;
    } catch (error) {
      // Solver not found
      console.log(`Solver ${solverId} not found or error:`, error);
      return null;
    }
  }

  /**
   * Process a credibility evaluation intent
   */
  async processCredibilityIntent(
    _intentMessage: NEARIntentMessage,
    intent: CredibilityEvaluationIntent
  ): Promise<OracleEvaluationResult> {
    const startTime = Date.now();

    try {
      // Validate intent requirements
      this.validateIntent(intent);

      // Execute credibility evaluation using our oracle service
      const evaluation = await this.oracleService.evaluate(intent.question, {
        requireSources: true,
        minimumSources: intent.required_sources || 3,
      });

      // Check if evaluation meets confidence threshold
      const confidence = this.calculateConfidence(evaluation);
      if (confidence < (intent.confidence_threshold || this.solverConfig.confidenceThreshold)) {
        throw new Error(
          `Evaluation confidence ${confidence} below threshold ${intent.confidence_threshold}`
        );
      }

      const executionTime = Date.now() - startTime;

      // Create evaluation result
      const evaluationResult: OracleEvaluationResult = {
        evaluation_hash: evaluation.hash || '',
        question: intent.question,
        answer: evaluation.answer,
        confidence,
        sources: evaluation.sources,
        execution_time: executionTime,
        solver_id: this.nearAccount.accountId,
        timestamp: new Date().toISOString(),
      };

      return evaluationResult;
    } catch (error) {
      console.error('Error processing credibility intent:', error);
      throw error;
    }
  }

  /**
   * Submit evaluation result to NEAR contract
   */
  async submitEvaluationToContract(
    intentId: string,
    evaluationResult: OracleEvaluationResult
  ): Promise<string> {
    try {
      const result = await this.nearAccount.functionCall({
        contractId: this.contractId,
        methodName: 'submit_evaluation',
        args: {
          intent_id: intentId,
          answer: evaluationResult.answer,
          confidence: evaluationResult.confidence,
          sources: evaluationResult.sources,
          execution_time_ms: { $numberLong: evaluationResult.execution_time.toString() },
        },
        attachedDeposit: BigInt(this.solverConfig.minStakeAmount),
        gas: BigInt('50000000000000'), // 50 TGas
      });

      console.log('Evaluation submitted to contract for intent %s', intentId);
      return result as unknown as string;
    } catch (error) {
      console.error('Failed to submit evaluation to contract:', error);
      throw error;
    }
  }

  /**
   * Challenge an evaluation with refutation
   */
  async submitChallenge(
    evaluationId: string,
    challengeStake: string,
    evaluation: CredibilityEvaluation
  ): Promise<string> {
    try {
      // Generate refutation using our oracle service
      const refutation = await this.oracleService.refute(evaluation);

      const result = await this.nearAccount.functionCall({
        contractId: this.contractId,
        methodName: 'submit_challenge',
        args: {
          evaluation_id: evaluationId,
          counter_sources: refutation.sources,
        },
        attachedDeposit: BigInt(challengeStake),
        gas: BigInt('50000000000000'), // 50 TGas
      });

      console.log('Challenge submitted for evaluation %s', evaluationId);
      return result as unknown as string;
    } catch (error) {
      console.error('Failed to submit challenge:', error);
      throw error;
    }
  }

  /**
   * Listen for and process oracle intents
   */
  async startSolverNode(): Promise<void> {
    console.log('Starting oracle solver node...');

    // Register as solver if not already registered
    try {
      await this.registerAsSolver();
    } catch (error) {
      console.log('Already registered as solver or registration failed:', error);
    }

    // Start listening for intents (simplified - in production would use WebSocket or polling)
    setInterval(async () => {
      try {
        await this.checkForPendingIntents();
      } catch (error) {
        console.error('Error checking for pending intents:', error);
      }
    }, 10000); // Check every 10 seconds

    console.log('Oracle solver node is running...');
  }

  /**
   * Check for pending intents and process them
   */
  private async checkForPendingIntents(): Promise<void> {
    try {
      const pendingIntents = await this.nearAccount.viewFunction({
        contractId: this.contractId,
        methodName: 'get_pending_intents',
        args: {},
      });

      for (const intent of pendingIntents as Record<string, unknown>[]) {
        if (intent.intent_type === 'CredibilityEvaluation' && intent.question) {
          console.log('Processing intent %s: %s', intent.intent_id, intent.question);

          try {
            const credibilityIntent: CredibilityEvaluationIntent = {
              intent: 'credibility_evaluation',
              question: (intent as any).question,
              required_sources: 3,
              confidence_threshold: 0.8,
            };

            const dummyMessage: NEARIntentMessage = {
              signer_id: (intent as any).initiator,
              deadline: new Date((intent as any).deadline * 1000000).toISOString(),
              intents: [credibilityIntent],
            };

            const evaluationResult = await this.processCredibilityIntent(
              dummyMessage,
              credibilityIntent
            );

            await this.submitEvaluationToContract((intent as any).intent_id, evaluationResult);
          } catch (error) {
            console.error('Failed to process intent %s:', intent.intent_id, error);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching pending intents:', error);
    }
  }

  /**
   * Calculate confidence score for evaluation
   */
  private calculateConfidence(evaluation: CredibilityEvaluation): number {
    // Simple confidence calculation based on source count and quality
    const sourceCount = evaluation.sources.length;
    const baseConfidence = Math.min(sourceCount / 5, 1.0); // Max confidence at 5+ sources

    // Could add more sophisticated confidence calculation based on:
    // - Source reliability scores
    // - Consensus among sources
    // - Recency of information
    // - Domain authority

    return Math.max(0.1, Math.min(1.0, baseConfidence));
  }

  /**
   * Validate intent requirements
   */
  private validateIntent(intent: CredibilityEvaluationIntent): void {
    if (!intent.question || intent.question.trim().length === 0) {
      throw new Error('Intent question cannot be empty');
    }

    if (intent.max_evaluation_time && intent.max_evaluation_time < 30) {
      throw new Error('Minimum evaluation time is 30 seconds');
    }

    if (
      intent.confidence_threshold &&
      (intent.confidence_threshold < 0 || intent.confidence_threshold > 1)
    ) {
      throw new Error('Confidence threshold must be between 0 and 1');
    }
  }

  /**
   * Get solver information
   */
  async getSolverInfo(): Promise<Record<string, unknown>> {
    return await this.nearAccount.viewFunction({
      contractId: this.contractId,
      methodName: 'get_solver',
      args: { solver_id: this.nearAccount.accountId },
    });
  }

  /**
   * Get intent by ID
   */
  async getIntent(intentId: string): Promise<Record<string, unknown>> {
    return await this.nearAccount.viewFunction({
      contractId: this.contractId,
      methodName: 'get_intent',
      args: { intent_id: intentId },
    });
  }

  /**
   * Get evaluation by ID
   */
  async getEvaluation(evaluationId: string): Promise<Record<string, unknown>> {
    return await this.nearAccount.viewFunction({
      contractId: this.contractId,
      methodName: 'get_evaluation',
      args: { evaluation_id: evaluationId },
    });
  }

  // ========== PRICE ORACLE FUNCTIONS ==========

  /**
   * Update price data on the contract (Pyth-compatible)
   */
  async updatePriceData(assetId: string, priceData: {
    asset_id: string;
    price: string;
    confidence: string;
    expo: number;
    publish_time: number;
  }): Promise<string> {
    try {
      const result = await this.nearAccount.functionCall({
        contractId: this.contractId,
        methodName: 'update_price_data',
        args: {
          asset_id: assetId,
          price_data: priceData
        },
        gas: BigInt('30000000000000'), // 30 TGas
      });

      console.log(`Price data updated for ${assetId}`);
      return result.transaction.hash;
    } catch (error) {
      console.error(`Failed to update price data for ${assetId}:`, error);
      throw error;
    }
  }

  /**
   * Get price data for an asset
   */
  async getPriceData(assetId: string): Promise<Record<string, unknown> | null> {
    try {
      return await this.nearAccount.viewFunction({
        contractId: this.contractId,
        methodName: 'get_price_data',
        args: { asset_id: assetId },
      });
    } catch (error) {
      console.error(`Failed to get price data for ${assetId}:`, error);
      return null;
    }
  }

  /**
   * Get all assets with price data
   */
  async getAllAssets(): Promise<string[]> {
    try {
      return await this.nearAccount.viewFunction({
        contractId: this.contractId,
        methodName: 'get_all_assets',
        args: {},
      });
    } catch (error) {
      console.error('Failed to get all assets:', error);
      return [];
    }
  }

  /**
   * Check if contract is paused
   */
  async isPaused(): Promise<boolean> {
    try {
      return await this.nearAccount.viewFunction({
        contractId: this.contractId,
        methodName: 'is_paused',
        args: {},
      });
    } catch (error) {
      console.error('Failed to check pause status:', error);
      return false;
    }
  }

  // ========== TEE ATTESTATION FUNCTIONS ==========

  /**
   * Register as solver with TEE attestation
   */
  async registerAsSolverWithAttestation(attestation: {
    node_id: string;
    attestation_hash: string;
    attestation_proof: string;
    timestamp: number;
    tee_provider: string;
    deployment_url?: string;
  }): Promise<void> {
    try {
      const result = await this.nearAccount.functionCall({
        contractId: this.contractId,
        methodName: 'register_solver_with_attestation',
        args: { attestation },
        attachedDeposit: BigInt(this.solverConfig.minStakeAmount),
        gas: BigInt('50000000000000'), // 50 TGas (more gas for attestation verification)
      });

      console.log(
        `Successfully registered as TEE-verified oracle solver (provider: ${attestation.tee_provider})`
      );
      console.log(`Transaction: ${result.transaction.hash}`);
    } catch (error) {
      console.error('Failed to register with TEE attestation:', error);
      throw error;
    }
  }

  /**
   * Refresh TEE attestation
   */
  async refreshAttestation(attestation: {
    node_id: string;
    attestation_hash: string;
    attestation_proof: string;
    timestamp: number;
    tee_provider: string;
    deployment_url?: string;
  }): Promise<string> {
    try {
      const result = await this.nearAccount.functionCall({
        contractId: this.contractId,
        methodName: 'refresh_attestation',
        args: { attestation },
        gas: BigInt('30000000000000'), // 30 TGas
      });

      console.log(`TEE attestation refreshed (provider: ${attestation.tee_provider})`);
      return result.transaction.hash;
    } catch (error) {
      console.error('Failed to refresh attestation:', error);
      throw error;
    }
  }

  /**
   * Check if solver is TEE verified
   */
  async isTEEVerified(solverId?: string): Promise<boolean> {
    try {
      const accountId = solverId || this.nearAccount.accountId;
      return await this.nearAccount.viewFunction({
        contractId: this.contractId,
        methodName: 'is_tee_verified',
        args: { solver_id: accountId },
      });
    } catch (error) {
      console.error('Failed to check TEE verification status:', error);
      return false;
    }
  }

  /**
   * Get TEE attestation for solver
   */
  async getAttestation(solverId?: string): Promise<Record<string, unknown> | null> {
    try {
      const accountId = solverId || this.nearAccount.accountId;
      return await this.nearAccount.viewFunction({
        contractId: this.contractId,
        methodName: 'get_attestation',
        args: { solver_id: accountId },
      });
    } catch (error) {
      console.error('Failed to get attestation:', error);
      return null;
    }
  }

  /**
   * Get TEE status for solver
   */
  async getTEEStatus(solverId?: string): Promise<Record<string, unknown>> {
    try {
      const accountId = solverId || this.nearAccount.accountId;
      const statusString = await this.nearAccount.viewFunction({
        contractId: this.contractId,
        methodName: 'get_tee_status',
        args: { solver_id: accountId },
      });
      return JSON.parse(statusString as string);
    } catch (error) {
      console.error('Failed to get TEE status:', error);
      return {};
    }
  }
}
