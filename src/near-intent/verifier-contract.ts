/**
 * Verifier Contract Integration for NEAR Intent Protocol
 * Handles on-chain intent verification and execution
 */

import { 
  Intent, 
  Quote, 
  VerifierContractMethods, 
  IntentExecutionStatus,
  IntentError,
  AsyncResult 
} from './types';
import { Account, Contract, transactions, utils } from 'near-api-js';
import { getCurrentTimestamp, retry, parseNearAmount } from '../utils/helpers';

export class VerifierContract {
  private account: Account;
  private contract: Contract & VerifierContractMethods;
  private contractId: string;

  constructor(account: Account, contractId: string) {
    this.account = account;
    this.contractId = contractId;
    this.contract = new Contract(
      account,
      contractId,
      {
        viewMethods: [
          'get_intent',
          'get_user_intents',
          'get_solver_quotes',
          'is_registered',
          'get_intent_status',
          'get_statistics',
          'get_supported_assets',
        ],
        changeMethods: [
          'register_user',
          'submit_intent',
          'submit_quote',
          'execute_intent',
          'cancel_intent',
          'update_solver_reputation',
          'add_supported_asset',
        ],
      }
    ) as Contract & VerifierContractMethods;
  }

  /**
   * Check if user is registered
   */
  async isRegistered(accountId?: string): Promise<boolean> {
    try {
      const targetAccount = accountId || this.account.accountId;
      return await this.contract.is_registered({ account_id: targetAccount });
    } catch (error) {
      console.error('Failed to check registration:', error);
      return false;
    }
  }

  /**
   * Register user with the verifier contract
   */
  async registerUser(): Promise<AsyncResult<void>> {
    try {
      if (await this.isRegistered()) {
        return { success: true, data: undefined };
      }

      await this.contract.register_user(
        {},
        '300000000000000', // 300 TGas
        parseNearAmount('0.1') // 0.1 NEAR for storage
      );

      return { success: true, data: undefined };

    } catch (error) {
      const intentError: IntentError = {
        code: 'REGISTRATION_FAILED',
        message: error instanceof Error ? error.message : 'Failed to register user',
        timestamp: getCurrentTimestamp(),
      };
      return { success: false, error: intentError };
    }
  }

  /**
   * Submit an intent to the verifier contract
   */
  async submitIntent(intent: Intent): Promise<AsyncResult<string>> {
    try {
      // Ensure user is registered
      const registrationResult = await this.registerUser();
      if (!registrationResult.success) {
        return registrationResult as AsyncResult<string>;
      }

      // Calculate storage deposit
      const storageDeposit = parseNearAmount('0.01'); // Base storage for intent

      const result = await this.contract.submit_intent(
        { intent },
        '300000000000000', // 300 TGas
        storageDeposit
      );

      return { success: true, data: intent.id };

    } catch (error) {
      const intentError: IntentError = {
        code: 'INTENT_SUBMISSION_FAILED',
        message: error instanceof Error ? error.message : 'Failed to submit intent',
        timestamp: getCurrentTimestamp(),
      };
      return { success: false, error: intentError };
    }
  }

  /**
   * Submit a quote to the verifier contract
   */
  async submitQuote(quote: Quote): Promise<AsyncResult<void>> {
    try {
      // Ensure solver is registered
      const registrationResult = await this.registerUser();
      if (!registrationResult.success) {
        return registrationResult;
      }

      const storageDeposit = parseNearAmount('0.005'); // Storage for quote

      await this.contract.submit_quote(
        { quote },
        '200000000000000', // 200 TGas
        storageDeposit
      );

      return { success: true, data: undefined };

    } catch (error) {
      const intentError: IntentError = {
        code: 'QUOTE_SUBMISSION_FAILED',
        message: error instanceof Error ? error.message : 'Failed to submit quote',
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
    gasLimit?: string,
    deposit?: string
  ): Promise<AsyncResult<string>> {
    try {
      // Get intent to validate
      const intent = await this.getIntent(intentId);
      if (!intent) {
        const error: IntentError = {
          code: 'INTENT_NOT_FOUND',
          message: `Intent ${intentId} not found`,
          timestamp: getCurrentTimestamp(),
        };
        return { success: false, error };
      }

      // Calculate appropriate gas and deposit
      const gas = gasLimit || '300000000000000'; // 300 TGas
      const executionDeposit = deposit || parseNearAmount('0.1'); // Base deposit

      const result = await retry(async () => {
        return await this.contract.execute_intent(
          { intent_id: intentId, quote_id: quoteId },
          gas,
          executionDeposit
        );
      }, 3, 2000);

      // The result should contain transaction hash
      const txHash = result?.transaction?.hash || 'unknown';

      return { success: true, data: txHash };

    } catch (error) {
      const intentError: IntentError = {
        code: 'INTENT_EXECUTION_FAILED',
        message: error instanceof Error ? error.message : 'Failed to execute intent',
        details: error,
        timestamp: getCurrentTimestamp(),
      };
      return { success: false, error: intentError };
    }
  }

  /**
   * Cancel an intent
   */
  async cancelIntent(intentId: string): Promise<AsyncResult<void>> {
    try {
      await this.contract.cancel_intent(
        { intent_id: intentId },
        '200000000000000' // 200 TGas
      );

      return { success: true, data: undefined };

    } catch (error) {
      const intentError: IntentError = {
        code: 'INTENT_CANCELLATION_FAILED',
        message: error instanceof Error ? error.message : 'Failed to cancel intent',
        timestamp: getCurrentTimestamp(),
      };
      return { success: false, error: intentError };
    }
  }

  /**
   * Get intent by ID
   */
  async getIntent(intentId: string): Promise<Intent | null> {
    try {
      return await this.contract.get_intent({ intent_id: intentId });
    } catch (error) {
      console.error(`Failed to get intent ${intentId}:`, error);
      return null;
    }
  }

  /**
   * Get user intents
   */
  async getUserIntents(
    user?: string, 
    limit: number = 50
  ): Promise<Intent[]> {
    try {
      const targetUser = user || this.account.accountId;
      return await this.contract.get_user_intents({ 
        user: targetUser, 
        limit 
      });
    } catch (error) {
      console.error('Failed to get user intents:', error);
      return [];
    }
  }

  /**
   * Get quotes for an intent
   */
  async getIntentQuotes(intentId: string): Promise<Quote[]> {
    try {
      return await this.contract.get_solver_quotes({ intent_id: intentId });
    } catch (error) {
      console.error(`Failed to get quotes for intent ${intentId}:`, error);
      return [];
    }
  }

  /**
   * Get intent execution status
   */
  async getIntentStatus(intentId: string): Promise<IntentExecutionStatus | null> {
    try {
      return await (this.contract as any).get_intent_status({ intent_id: intentId });
    } catch (error) {
      console.error(`Failed to get status for intent ${intentId}:`, error);
      return null;
    }
  }

  /**
   * Batch execute multiple intents
   */
  async batchExecuteIntents(
    executions: Array<{ intentId: string; quoteId: string }>
  ): Promise<AsyncResult<string[]>> {
    const results: string[] = [];
    const errors: IntentError[] = [];

    for (const execution of executions) {
      try {
        const result = await this.executeIntent(execution.intentId, execution.quoteId);
        if (result.success) {
          results.push(result.data);
        } else {
          errors.push(result.error);
        }
      } catch (error) {
        errors.push({
          code: 'BATCH_EXECUTION_ERROR',
          message: `Failed to execute intent ${execution.intentId}`,
          details: error,
          timestamp: getCurrentTimestamp(),
        });
      }
    }

    if (errors.length > 0) {
      return { 
        success: false, 
        error: {
          code: 'BATCH_EXECUTION_PARTIAL_FAILURE',
          message: `${errors.length} out of ${executions.length} executions failed`,
          details: errors,
          timestamp: getCurrentTimestamp(),
        }
      };
    }

    return { success: true, data: results };
  }

  /**
   * Estimate gas for intent execution
   */
  async estimateExecutionGas(intentId: string, quoteId: string): Promise<string> {
    try {
      // This would typically call a view method that simulates execution
      // For now, return a conservative estimate
      const baseGas = '200000000000000'; // 200 TGas
      const complexityMultiplier = 1.5; // Account for complex swaps
      
      return (BigInt(baseGas) * BigInt(Math.floor(complexityMultiplier * 100)) / BigInt(100)).toString();
    } catch (error) {
      console.error('Failed to estimate gas:', error);
      return '300000000000000'; // Fallback to 300 TGas
    }
  }

  /**
   * Get contract statistics
   */
  async getStatistics(): Promise<any> {
    try {
      return await (this.contract as any).get_statistics();
    } catch (error) {
      console.error('Failed to get contract statistics:', error);
      return null;
    }
  }

  /**
   * Update solver reputation (for contract admin)
   */
  async updateSolverReputation(
    solverId: string, 
    newReputation: number
  ): Promise<AsyncResult<void>> {
    try {
      await (this.contract as any).update_solver_reputation(
        { 
          solver_id: solverId, 
          reputation: newReputation 
        },
        '100000000000000' // 100 TGas
      );

      return { success: true, data: undefined };

    } catch (error) {
      const intentError: IntentError = {
        code: 'REPUTATION_UPDATE_FAILED',
        message: error instanceof Error ? error.message : 'Failed to update solver reputation',
        timestamp: getCurrentTimestamp(),
      };
      return { success: false, error: intentError };
    }
  }

  /**
   * Add supported asset (for contract admin)
   */
  async addSupportedAsset(
    tokenId: string, 
    contractAddress: string
  ): Promise<AsyncResult<void>> {
    try {
      await (this.contract as any).add_supported_asset(
        { 
          token_id: tokenId, 
          contract_address: contractAddress 
        },
        '100000000000000' // 100 TGas
      );

      return { success: true, data: undefined };

    } catch (error) {
      const intentError: IntentError = {
        code: 'ASSET_ADDITION_FAILED',
        message: error instanceof Error ? error.message : 'Failed to add supported asset',
        timestamp: getCurrentTimestamp(),
      };
      return { success: false, error: intentError };
    }
  }

  /**
   * Get supported assets
   */
  async getSupportedAssets(): Promise<string[]> {
    try {
      return await (this.contract as any).get_supported_assets();
    } catch (error) {
      console.error('Failed to get supported assets:', error);
      return [];
    }
  }

  /**
   * Monitor intent execution
   */
  async monitorIntentExecution(
    intentId: string,
    onUpdate: (status: IntentExecutionStatus) => void,
    timeoutMs: number = 300000 // 5 minutes
  ): Promise<IntentExecutionStatus> {
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeoutMs) {
      try {
        const status = await this.getIntentStatus(intentId);
        if (status) {
          onUpdate(status);
          
          if (status.status === 'completed' || 
              status.status === 'failed' || 
              status.status === 'expired') {
            return status;
          }
        }
        
        // Wait 5 seconds before checking again
        await new Promise(resolve => setTimeout(resolve, 5000));
      } catch (error) {
        console.error('Error monitoring intent execution:', error);
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
    }

    // Timeout reached
    const timeoutStatus: IntentExecutionStatus = {
      intent_id: intentId,
      status: 'failed',
      error: 'Monitoring timeout reached',
    };
    onUpdate(timeoutStatus);
    return timeoutStatus;
  }

  /**
   * Get account state
   */
  async getAccountState(): Promise<any> {
    try {
      return await this.account.state();
    } catch (error) {
      console.error('Failed to get account state:', error);
      return null;
    }
  }

  /**
   * Get contract account ID
   */
  getContractId(): string {
    return this.contractId;
  }

  /**
   * Get connected account ID
   */
  getAccountId(): string {
    return this.account.accountId;
  }
}
