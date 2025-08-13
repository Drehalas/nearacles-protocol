/**
 * Intent Agent - Main Integration Class for NEAR Intent Protocol
 * Orchestrates all components of the intent system
 */

import { 
  Intent, 
  IntentRequestParams, 
  IntentExecutionStatus,
  QuoteEvaluationCriteria,
  QuoteAnalysis,
  IntentConfig,
  IntentError,
  AsyncResult,
  AIDecision,
  MarketAnalysis 
} from './types';
import { IntentRequest } from './intent-request';
import { AssetManager } from './asset-manager';
import { SolverBus } from './solver-bus';
import { QuoteManager } from './quote-manager';
import { VerifierContract } from './verifier-contract';
import { Account, connect, ConnectConfig, keyStores, utils } from 'near-api-js';
import { getCurrentTimestamp, retry } from '../utils/helpers';


export class IntentAgent {
  private account?: Account;
  private assetManager: AssetManager;
  private solverBus: SolverBus;
  private quoteManager: QuoteManager;
  private verifierContract?: VerifierContract;
  private config: IntentConfig;
  private initialized: boolean = false;

  constructor(config: IntentConfig) {
    this.config = config;
    
    // Initialize components
    this.assetManager = new AssetManager();
    this.solverBus = new SolverBus(config.solver_bus_url);
    this.quoteManager = new QuoteManager(this.solverBus, this.assetManager);
  }

  /**
   * Initialize the Intent Agent
   */
  async initialize(accountId?: string, privateKey?: string): Promise<AsyncResult<void>> {
    try {
      if (accountId && privateKey) {
        await this.connectWithCredentials(accountId, privateKey);
      }

      // Initialize components
      await this.solverBus.connect();
      await this.quoteManager.initialize();

      if (this.account) {
        this.verifierContract = new VerifierContract(this.account, this.config.verifier_contract);
        this.assetManager = new AssetManager(this.account);
      }

      this.initialized = true;
      return { success: true, data: undefined };

    } catch (error) {
      const intentError: IntentError = {
        code: 'INITIALIZATION_FAILED',
        message: error instanceof Error ? error.message : 'Failed to initialize Intent Agent',
        timestamp: getCurrentTimestamp(),
      };
      return { success: false, error: intentError };
    }
  }

  /**
   * Connect with NEAR account credentials
   */
  private async connectWithCredentials(accountId: string, privateKey: string): Promise<void> {
    const keyStore = new keyStores.InMemoryKeyStore();
    const { KeyPair } = await import('near-api-js/lib/utils');
    const keyPair = KeyPair.fromString(privateKey);
    await keyStore.setKey(this.config.network_id, accountId, keyPair);

    const connectionConfig: ConnectConfig = {
      networkId: this.config.network_id,
      keyStore,
      nodeUrl: this.config.node_url,
      walletUrl: this.config.wallet_url,
      helperUrl: this.config.helper_url,
    };

    const near = await connect(connectionConfig);
    this.account = await near.account(accountId);
  }

  /**
   * Create and submit an intent
   */
  async createIntent(params: IntentRequestParams): Promise<AsyncResult<{
    intent: Intent;
    quotes: QuoteAnalysis[];
    recommendation?: QuoteAnalysis;
  }>> {
    if (!this.initialized) {
      return {
        success: false,
        error: {
          code: 'NOT_INITIALIZED',
          message: 'Intent Agent not initialized',
          timestamp: getCurrentTimestamp(),
        }
      };
    }

    try {
      // Step 1: Create intent
      const intentResult = await IntentRequest.fromParams(
        params,
        this.account?.accountId || 'anonymous',
        this.assetManager
      );

      if (!intentResult.success) {
        return { success: false, error: intentResult.error };
      }

      const intent = intentResult.data;

      // Step 2: Submit to on-chain verifier (if connected)
      if (this.verifierContract) {
        const submitResult = await this.verifierContract.submitIntent(intent);
        if (!submitResult.success) {
          return { success: false, error: submitResult.error };
        }
      }

      // Step 3: Request quotes from solver network
      const quotesResult = await this.quoteManager.requestQuotes(
        intent,
        30000, // 30 second timeout
        this.getDefaultQuoteCriteria(params)
      );

      if (!quotesResult.success) {
        return { success: false, error: quotesResult.error };
      }

      const quotes = quotesResult.data;

      // Step 4: Get best recommendation
      const recommendation = this.quoteManager.getBestQuote(
        quotes,
        this.getDefaultQuoteCriteria(params)
      );

      return {
        success: true,
        data: {
          intent,
          quotes,
          recommendation: recommendation || undefined,
        }
      };

    } catch (error) {
      const intentError: IntentError = {
        code: 'INTENT_CREATION_FAILED',
        message: error instanceof Error ? error.message : 'Failed to create intent',
        timestamp: getCurrentTimestamp(),
      };
      return { success: false, error: intentError };
    }
  }

  /**
   * Execute an intent with selected quote
   */
  async executeIntent(
    intentId: string, 
    quoteId: string,
    options?: {
      monitor?: boolean;
      onUpdate?: (status: IntentExecutionStatus) => void;
    }
  ): Promise<AsyncResult<{
    transactionHash: string;
    finalStatus?: IntentExecutionStatus;
  }>> {
    if (!this.verifierContract) {
      return {
        success: false,
        error: {
          code: 'NO_CONTRACT_CONNECTION',
          message: 'Verifier contract not connected',
          timestamp: getCurrentTimestamp(),
        }
      };
    }

    try {
      // Execute intent on-chain
      const executeResult = await this.verifierContract.executeIntent(intentId, quoteId);
      if (!executeResult.success) {
        return { success: false, error: executeResult.error };
      }

      const transactionHash = executeResult.data;

      // Monitor execution if requested
      let finalStatus: IntentExecutionStatus | undefined;
      if (options?.monitor) {
        finalStatus = await this.verifierContract.monitorIntentExecution(
          intentId,
          options.onUpdate || (() => {}),
          300000 // 5 minute timeout
        );
      }

      return {
        success: true,
        data: {
          transactionHash,
          finalStatus,
        }
      };

    } catch (error) {
      const intentError: IntentError = {
        code: 'INTENT_EXECUTION_FAILED',
        message: error instanceof Error ? error.message : 'Failed to execute intent',
        timestamp: getCurrentTimestamp(),
      };
      return { success: false, error: intentError };
    }
  }

  /**
   * Get user's intent history
   */
  async getIntentHistory(limit: number = 50): Promise<Intent[]> {
    if (!this.verifierContract) {
      return [];
    }

    try {
      return await this.verifierContract.getUserIntents(undefined, limit);
    } catch (error) {
      console.error('Failed to get intent history:', error);
      return [];
    }
  }

  /**
   * Get asset balances
   */
  async getBalances(): Promise<Record<string, unknown>[]> {
    try {
      return await this.assetManager.getAllBalances();
    } catch (error) {
      console.error('Failed to get balances:', error);
      return [];
    }
  }

  /**
   * Cancel an intent
   */
  async cancelIntent(intentId: string): Promise<AsyncResult<void>> {
    if (!this.verifierContract) {
      return {
        success: false,
        error: {
          code: 'NO_CONTRACT_CONNECTION',
          message: 'Verifier contract not connected',
          timestamp: getCurrentTimestamp(),
        }
      };
    }

    return await this.verifierContract.cancelIntent(intentId);
  }

  /**
   * Get intent status
   */
  async getIntentStatus(intentId: string): Promise<IntentExecutionStatus | null> {
    if (!this.verifierContract) {
      return null;
    }

    return await this.verifierContract.getIntentStatus(intentId);
  }

  /**
   * AI-powered intent creation
   */
  async createSmartIntent(
    description: string,
    preferences?: {
      riskTolerance?: 'low' | 'medium' | 'high';
      speedPreference?: 'fast' | 'normal' | 'slow';
      maxSlippage?: number;
    }
  ): Promise<AsyncResult<{
    intent: Intent;
    reasoning: string;
    quotes: QuoteAnalysis[];
    aiDecision: IntentAIDecision;

  }>> {
    // This would integrate with NEAR AI or external AI services
    // For now, implement a basic pattern matching system

    try {
      // Parse description to extract intent parameters
      const intentParams = await this.parseIntentDescription(description);
      if (!intentParams) {
        return {
          success: false,
          error: {
            code: 'INVALID_DESCRIPTION',
            message: 'Could not parse intent from description',
            timestamp: getCurrentTimestamp(),
          }
        };
      }

      // Apply preferences to criteria
      this.buildCriteriaFromPreferences(preferences);

      // Create intent
      const intentResult = await this.createIntent(intentParams);
      if (!intentResult.success) {
        return { success: false, error: intentResult.error };
      }

      // Generate AI decision

      const aiDecision: AIDecision = await this.generateAIDecision(
        intentResult.data.quotes,
        preferences
      );

      return {
        success: true,
        data: {
          intent: intentResult.data.intent,
          reasoning: `AI analyzed the request: "${description}" and created an intent to swap ${intentParams.amount_in} ${intentParams.asset_in} for ${intentParams.asset_out}`,
          quotes: intentResult.data.quotes,
          aiDecision,
        }
      };

    } catch (error) {
      const intentError: IntentError = {
        code: 'SMART_INTENT_FAILED',
        message: error instanceof Error ? error.message : 'Failed to create smart intent',
        timestamp: getCurrentTimestamp(),
      };
      return { success: false, error: intentError };
    }
  }

  /**
   * Get market analysis for asset pair
   */
  async getMarketAnalysis(assetIn: string, assetOut: string): Promise<MarketAnalysis> {
    // This would integrate with price oracles and market data providers
    const mockAnalysis: MarketAnalysis = {
      asset_pair: `${assetIn}/${assetOut}`,
      current_price: '1.5', // Mock price
      price_trend: 'up',
      volatility: 0.15,
      liquidity: 0.85,
      recommended_action: 'buy',
      confidence: 0.75,
      analysis_timestamp: getCurrentTimestamp(),
    };

    return mockAnalysis;
  }

  /**
   * Batch execute multiple intents
   */
  async batchExecuteIntents(
    executions: Array<{ intentId: string; quoteId: string }>
  ): Promise<AsyncResult<string[]>> {
    if (!this.verifierContract) {
      return {
        success: false,
        error: {
          code: 'NO_CONTRACT_CONNECTION',
          message: 'Verifier contract not connected',
          timestamp: getCurrentTimestamp(),
        }
      };
    }

    return await this.verifierContract.batchExecuteIntents(executions);
  }

  /**
   * Get agent statistics
   */
  async getStatistics(): Promise<Record<string, unknown>> {
    const stats = {
      solver_bus: await this.solverBus.getStatistics(),
      verifier_contract: this.verifierContract ? 
        await this.verifierContract.getStatistics() : null,
      supported_assets: this.assetManager.getAllAssets().length,
      agent_status: this.initialized ? 'active' : 'inactive',
      connected_account: this.account?.accountId || null,
    };

    return stats;
  }

  /**
   * Helper: Get default quote criteria from params
   */
  private getDefaultQuoteCriteria(params: IntentRequestParams): QuoteEvaluationCriteria {
    return {
      maxSlippage: params.slippage_tolerance || 1.0,
      prioritize: params.user_preferences?.execution_speed === 'fast' ? 'speed' : 'balanced',
      riskTolerance: 'medium',
      maxFee: params.user_preferences?.max_fee,
      preferred_solvers: params.user_preferences?.preferred_solvers,
    };
  }

  /**
   * Helper: Parse intent description (simplified AI logic)
   */
  private async parseIntentDescription(description: string): Promise<IntentRequestParams | null> {
    // Very basic pattern matching - in production, use proper NLP/AI
    const swapPattern = /swap\s+(\d+(?:\.\d+)?)\s+(\w+)\s+(?:for|to)\s+(\w+)(?:\s+.*)?/i;
    const match = description.match(swapPattern);

    if (match) {
      return {
        amount_in: this.assetManager.parseAmount(match[2], match[1]),
        asset_in: match[2].toUpperCase(),
        asset_out: match[3].toUpperCase(),
        slippage_tolerance: 1.0,
      };
    }

    return null;
  }

  /**
   * Helper: Build criteria from preferences
   */
  private buildCriteriaFromPreferences(preferences?: Record<string, unknown>): QuoteEvaluationCriteria {
    return {
      riskTolerance: (preferences?.riskTolerance as 'low' | 'medium' | 'high') || 'medium',
      prioritize: preferences?.speedPreference === 'fast' ? 'speed' : 'balanced',
      maxSlippage: (preferences?.maxSlippage as number) || 1.0,
    };
  }

  /**
   * Helper: Generate AI decision
   */
  private async generateAIDecision(
    quotes: QuoteAnalysis[], 
    _preferences?: Record<string, unknown>
  ): Promise<AIDecision> {
    if (quotes.length === 0) {
      return {
        action: 'wait',
        confidence: 0.9,
        reasoning: 'No quotes available, waiting for better market conditions',
        risk_assessment: {
          level: 'low',
          factors: ['No execution risk due to no quotes']
        }
      };
    }

    const bestQuote = quotes[0];
    
    if (bestQuote.recommendation === 'accept' && bestQuote.score > 70) {
      return {
        action: 'execute',
        confidence: 0.85,
        reasoning: `Best quote offers good value with score ${bestQuote.score}/100`,
        parameters: { quoteId: bestQuote.quote.solver_id },
        risk_assessment: {
          level: bestQuote.riskLevel,
          factors: bestQuote.cons
        }
      };
    }

    return {
      action: 'wait',
      confidence: 0.7,
      reasoning: 'Current quotes do not meet quality thresholds',
      risk_assessment: {
        level: 'medium',
        factors: ['Quote quality below threshold']
      }
    };
  }

  /**
   * Cleanup resources
   */
  async dispose(): Promise<void> {
    this.solverBus.disconnect();
    this.initialized = false;
  }
}