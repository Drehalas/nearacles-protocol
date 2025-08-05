/**
 * Intent broadcasting utilities for NEAR oracle system
 * Handles intent publishing to solver networks and quote management
 */

import { 
  NEARIntentMessage, 
  SignedIntentData, 
  OracleQuote,
  BaseOracleIntent,
  CredibilityEvaluationIntent,
  RefutationChallengeIntent 
} from '../types/near-intent.js';
import { NEARSigningService } from './near-signing.js';

export interface SolverRelayConfig {
  rpcUrl: string;
  timeout: number; // milliseconds
  maxRetries: number;
}

export interface PublishIntentRequest {
  quote_hashes?: string[];
  signed_data: SignedIntentData;
}

export interface PublishIntentResponse {
  intent_id: string;
  status: 'published' | 'pending' | 'error';
  quotes?: OracleQuote[];
  error?: string;
}

export interface QuoteRequest {
  intent_message: NEARIntentMessage;
  intent_hash: string;
  max_quotes: number;
  quote_timeout: number; // seconds
}

export interface QuoteResponse {
  quotes: OracleQuote[];
  total_solvers: number;
  response_time: number; // milliseconds
}

export class IntentBroadcaster {
  private signingService: NEARSigningService;
  private solverRelayConfig: SolverRelayConfig;

  constructor(
    privateKey: string, 
    solverRelayConfig: SolverRelayConfig = {
      rpcUrl: 'https://solver-relay-v2.chaindefuser.com/rpc',
      timeout: 30000,
      maxRetries: 3
    }
  ) {
    this.signingService = new NEARSigningService(privateKey);
    this.solverRelayConfig = solverRelayConfig;
  }

  /**
   * Creates and signs an oracle intent message
   */
  createOracleIntent(
    signerId: string,
    intents: BaseOracleIntent[],
    deadline?: string
  ): SignedIntentData {
    const intentMessage: NEARIntentMessage = {
      signer_id: signerId,
      deadline: deadline || new Date(Date.now() + 3600000).toISOString(), // 1 hour default
      intents
    };

    return this.signingService.createSignedIntent(intentMessage);
  }

  /**
   * Requests quotes from oracle solvers
   */
  async requestQuotes(intentMessage: NEARIntentMessage): Promise<QuoteResponse> {
    const startTime = Date.now();
    const intentHash = this.signingService.createIntentHash(intentMessage);

    const requestBody = {
      id: 'quote_request',
      jsonrpc: '2.0',
      method: 'request_oracle_quotes',
      params: [{
        intent_message: intentMessage,
        intent_hash: intentHash,
        max_quotes: 10,
        quote_timeout: 30
      }]
    };

    try {
      const response = await this.makeRPCCall(requestBody);
      const quotes: OracleQuote[] = response.result?.quotes || [];
      
      return {
        quotes,
        total_solvers: response.result?.total_solvers || 0,
        response_time: Date.now() - startTime
      };
    } catch (error) {
      console.error('Error requesting quotes:', error);
      return {
        quotes: [],
        total_solvers: 0,
        response_time: Date.now() - startTime
      };
    }
  }

  /**
   * Publishes a signed intent to the solver network
   */
  async publishIntent(
    signedData: SignedIntentData,
    acceptedQuoteHashes?: string[]
  ): Promise<PublishIntentResponse> {
    const requestBody = {
      id: 'publish_intent',
      jsonrpc: '2.0',
      method: 'publish_intent',
      params: [{
        quote_hashes: acceptedQuoteHashes || [],
        signed_data: signedData
      }]
    };

    try {
      const response = await this.makeRPCCall(requestBody);
      
      if (!response.result) {
        throw new Error('No result in response');
      }

      return {
        intent_id: response.result.intent_id,
        status: response.result.status || 'published',
        quotes: response.result.quotes,
      };
    } catch (error) {
      console.error('Error publishing intent:', error);
      return {
        intent_id: '',
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Creates a credibility evaluation intent
   */
  createCredibilityEvaluationIntent(
    signerId: string,
    question: string,
    options: {
      reward?: string;
      requiredSources?: number;
      confidenceThreshold?: number;
      maxEvaluationTime?: number;
      deadline?: string;
    } = {}
  ): SignedIntentData {
    const intent: CredibilityEvaluationIntent = {
      intent: 'credibility_evaluation',
      question,
      reward: options.reward || '1000000000000000000000000', // 1 NEAR default
      required_sources: options.requiredSources || 3,
      confidence_threshold: options.confidenceThreshold || 0.8,
      max_evaluation_time: options.maxEvaluationTime || 300, // 5 minutes
    };

    return this.createOracleIntent(signerId, [intent], options.deadline);
  }

  /**
   * Creates a refutation challenge intent
   */
  createRefutationChallengeIntent(
    signerId: string,
    evaluationHash: string,
    challengeStake: string,
    options: {
      deadline?: string;
    } = {}
  ): SignedIntentData {
    const intent: RefutationChallengeIntent = {
      intent: 'refutation_challenge',
      evaluation_hash: evaluationHash,
      challenge_stake: challengeStake,
      reward: challengeStake, // Challenger risks their stake
    };

    return this.createOracleIntent(signerId, [intent], options.deadline);
  }

  /**
   * Complete flow: request quotes, select best quote, publish intent
   */
  async executeOracleIntent(
    signerId: string,
    intent: BaseOracleIntent,
    quoteSelectionStrategy: 'lowest_stake' | 'highest_confidence' | 'fastest' = 'highest_confidence'
  ): Promise<{
    intentResponse: PublishIntentResponse;
    selectedQuote?: OracleQuote;
    allQuotes: OracleQuote[];
  }> {
    // Create and sign intent
    const signedIntent = this.createOracleIntent(signerId, [intent]);
    const intentMessage = this.signingService.extractIntentMessage(signedIntent);

    // Request quotes from solvers
    const quoteResponse = await this.requestQuotes(intentMessage);

    if (quoteResponse.quotes.length === 0) {
      const intentResponse = await this.publishIntent(signedIntent);
      return {
        intentResponse,
        allQuotes: []
      };
    }

    // Select best quote based on strategy
    const selectedQuote = this.selectBestQuote(quoteResponse.quotes, quoteSelectionStrategy);

    // Publish intent with selected quote
    const intentResponse = await this.publishIntent(signedIntent, [selectedQuote.quote_hash]);

    return {
      intentResponse,
      selectedQuote,
      allQuotes: quoteResponse.quotes
    };
  }

  /**
   * Selects the best quote based on strategy
   */
  private selectBestQuote(quotes: OracleQuote[], strategy: string): OracleQuote {
    switch (strategy) {
      case 'lowest_stake':
        return quotes.reduce((best, current) => 
          parseInt(current.required_stake) < parseInt(best.required_stake) ? current : best
        );
      
      case 'highest_confidence':
        return quotes.reduce((best, current) => 
          current.confidence_guarantee > best.confidence_guarantee ? current : best
        );
      
      case 'fastest':
        return quotes.reduce((best, current) => 
          current.estimated_execution_time < best.estimated_execution_time ? current : best
        );
      
      default:
        return quotes[0];
    }
  }

  /**
   * Makes RPC call to solver relay
   */
  private async makeRPCCall(requestBody: any): Promise<any> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < this.solverRelayConfig.maxRetries; attempt++) {
      try {
        const response = await fetch(this.solverRelayConfig.rpcUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody),
          signal: AbortSignal.timeout(this.solverRelayConfig.timeout)
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const json = await response.json();

        if (json.error) {
          throw new Error(`RPC Error: ${json.error.message || json.error}`);
        }

        return json;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');
        if (attempt < this.solverRelayConfig.maxRetries - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1))); // Exponential backoff
        }
      }
    }

    throw lastError || new Error('Max retries exceeded');
  }
}