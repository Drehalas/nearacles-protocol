/**
 * NEAR Oracle Integration Service
 * Bridges our TypeScript oracle services with NEAR intent infrastructure
 */

import { Account, Connection, KeyPair } from 'near-api-js';
import { InMemoryKeyStore } from 'near-api-js/lib/key_stores';
import { JsonRpcProvider } from 'near-api-js/lib/providers';
import { InMemorySigner } from 'near-api-js';

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
    this.oracleService = new OracleService(openaiApiKey);
    // this._intentBroadcaster = new IntentBroadcaster(nearConfig.privateKey);

    // Initialize NEAR connection (will be set async)
    this.initializeNearAccount(nearConfig).then(account => {
      this.nearAccount = account;
    });
  }

  /**
   * Initialize NEAR account connection
   */
  private async initializeNearAccount(config: NEARConfig): Promise<Account> {
    const keyStore = new InMemoryKeyStore();
    const keyPair = KeyPair.fromString(config.privateKey as any);
    await keyStore.setKey(config.networkId, config.accountId, keyPair);

    const provider = new JsonRpcProvider({ url: config.nodeUrl });
    const signer = new InMemorySigner(keyStore);
    const connection = new Connection(config.networkId, provider, signer, config.accountId);

    return new Account(connection, config.accountId);
  }

  /**
   * Register this node as an oracle solver
   */
  async registerAsSolver(): Promise<void> {
    try {
      await this.nearAccount.functionCall({
        contractId: this.contractId,
        methodName: 'register_solver',
        args: {},
        attachedDeposit: BigInt(this.solverConfig.minStakeAmount),
        gas: BigInt('30000000000000'), // 30 TGas
      });

      console.log(
        `Successfully registered as oracle solver with stake ${this.solverConfig.minStakeAmount}`
      );
    } catch (error) {
      console.error('Failed to register as solver:', error);
      throw error;
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

      console.log(`Evaluation submitted to contract for intent ${intentId}`);
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

      console.log(`Challenge submitted for evaluation ${evaluationId}`);
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
          console.log(`Processing intent ${intent.intent_id}: ${intent.question}`);

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
            console.error(`Failed to process intent ${intent.intent_id}:`, error);
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
}
