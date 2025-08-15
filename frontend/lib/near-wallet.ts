/**
 * NEAR Wallet Integration for Testnet
 * Handles wallet connection, authentication, and contract interactions
 */

import { WalletConnection, Near, Contract, keyStores, utils } from 'near-api-js';
import { TESTNET_CONFIG, getContractAccountId, getTransactionGas } from '../config/testnet';

// Contract interface for type safety
export interface OracleContract extends Contract {
  // View methods
  get_contract_info(): Promise<any>;
  get_user_profile(args: { user_id: string }): Promise<any>;
  get_solver(args: { solver_id: string }): Promise<any>;
  get_pending_intents(): Promise<any[]>;
  get_intent(args: { intent_id: string }): Promise<any>;
  get_evaluation(args: { evaluation_id: string }): Promise<any>;
  get_storage_stats(): Promise<number[]>;
  get_all_admins(): Promise<string[]>;

  // Change methods
  register_user(args: { role: string }): Promise<void>;
  register_solver(args: {}, options: { attachedDeposit: string }): Promise<void>;
  submit_credibility_intent(
    args: {
      question: string;
      required_sources: number;
      confidence_threshold: number;
      deadline_minutes: number;
    },
    options: { attachedDeposit: string }
  ): Promise<string>;
  accept_intent(args: { intent_id: string }): Promise<boolean>;
  submit_evaluation(
    args: {
      intent_id: string;
      answer: boolean;
      confidence: number;
      sources: Array<{ title: string; url: string }>;
      execution_time_ms: { [key: string]: string };
    },
    options: { attachedDeposit: string }
  ): Promise<string>;
  submit_challenge(
    args: {
      evaluation_id: string;
      counter_sources: Array<{ title: string; url: string }>;
    },
    options: { attachedDeposit: string }
  ): Promise<string>;
}

export class NearWalletService {
  private near: Near | null = null;
  private wallet: WalletConnection | null = null;
  private contract: OracleContract | null = null;
  private accountId: string | null = null;

  constructor() {
    this.initializeNear();
  }

  private async initializeNear(): Promise<void> {
    try {
      // Initialize NEAR connection
      const keyStore = new keyStores.BrowserLocalStorageKeyStore();
      
      this.near = new Near({
        ...TESTNET_CONFIG.network,
        keyStore,
        headers: {},
      });

      // Initialize wallet connection
      this.wallet = new WalletConnection(this.near, 'nearacles-oracle');
      
      // Initialize contract if wallet is signed in
      if (this.wallet.isSignedIn()) {
        this.accountId = this.wallet.getAccountId();
        await this.initializeContract();
      }

    } catch (error) {
      console.error('Failed to initialize NEAR:', error);
      throw new Error('Failed to connect to NEAR network');
    }
  }

  private async initializeContract(): Promise<void> {
    if (!this.wallet || !this.accountId) {
      throw new Error('Wallet not initialized or user not signed in');
    }

    try {
      const account = this.wallet.account();
      this.contract = new Contract(account, getContractAccountId(), {
        viewMethods: [
          'get_contract_info',
          'get_user_profile', 
          'get_solver',
          'get_pending_intents',
          'get_intent',
          'get_evaluation',
          'get_storage_stats',
          'get_all_admins',
        ],
        changeMethods: [
          'register_user',
          'register_solver',
          'submit_credibility_intent',
          'accept_intent',
          'submit_evaluation',
          'submit_challenge',
        ],
      }) as OracleContract;

    } catch (error) {
      console.error('Failed to initialize contract:', error);
      throw new Error('Failed to initialize oracle contract');
    }
  }

  // Authentication methods
  public async signIn(): Promise<void> {
    if (!this.wallet) {
      throw new Error('Wallet not initialized');
    }

    return this.wallet.requestSignIn({
      contractId: getContractAccountId(),
      methodNames: [
        'register_user',
        'register_solver', 
        'submit_credibility_intent',
        'accept_intent',
        'submit_evaluation',
        'submit_challenge',
      ],
      successUrl: `${window.location.origin}/dashboard`,
      failureUrl: `${window.location.origin}?sign_in_error=true`,
    });
  }

  public signOut(): void {
    if (this.wallet) {
      this.wallet.signOut();
      this.accountId = null;
      this.contract = null;
      // Redirect to home page
      window.location.href = '/';
    }
  }

  public isSignedIn(): boolean {
    return this.wallet?.isSignedIn() || false;
  }

  public getAccountId(): string | null {
    return this.accountId;
  }

  public async getAccountBalance(): Promise<string> {
    if (!this.wallet || !this.accountId) {
      throw new Error('User not signed in');
    }

    try {
      const account = this.wallet.account();
      const balance = await account.getAccountBalance();
      return utils.format.formatNearAmount(balance.available);
    } catch (error) {
      console.error('Failed to get account balance:', error);
      throw new Error('Failed to retrieve account balance');
    }
  }

  // Contract interaction methods
  public async registerUser(role: 'User' | 'Solver' | 'Verifier'): Promise<void> {
    if (!this.contract) {
      throw new Error('Contract not initialized');
    }

    try {
      await this.contract.register_user({ role });
    } catch (error) {
      console.error('Failed to register user:', error);
      throw new Error('Failed to register user');
    }
  }

  public async registerSolver(): Promise<void> {
    if (!this.contract) {
      throw new Error('Contract not initialized');
    }

    try {
      await this.contract.register_solver(
        {},
        { attachedDeposit: TESTNET_CONFIG.solver.registrationDeposit }
      );
    } catch (error) {
      console.error('Failed to register solver:', error);
      throw new Error('Failed to register as solver');
    }
  }

  public async submitIntent(
    question: string,
    requiredSources: number = TESTNET_CONFIG.intent.defaultRequiredSources,
    confidenceThreshold: number = TESTNET_CONFIG.intent.defaultConfidenceThreshold,
    deadlineMinutes: number = TESTNET_CONFIG.intent.defaultDeadlineMinutes
  ): Promise<string> {
    if (!this.contract) {
      throw new Error('Contract not initialized');
    }

    try {
      return await this.contract.submit_credibility_intent(
        {
          question,
          required_sources: requiredSources,
          confidence_threshold: confidenceThreshold,
          deadline_minutes: deadlineMinutes,
        },
        { attachedDeposit: TESTNET_CONFIG.transaction.attachedDeposit }
      );
    } catch (error) {
      console.error('Failed to submit intent:', error);
      throw new Error('Failed to submit credibility intent');
    }
  }

  public async acceptIntent(intentId: string): Promise<boolean> {
    if (!this.contract) {
      throw new Error('Contract not initialized');
    }

    try {
      return await this.contract.accept_intent({ intent_id: intentId });
    } catch (error) {
      console.error('Failed to accept intent:', error);
      throw new Error('Failed to accept intent');
    }
  }

  public async submitEvaluation(
    intentId: string,
    answer: boolean,
    confidence: number,
    sources: Array<{ title: string; url: string }>,
    executionTimeMs: number
  ): Promise<string> {
    if (!this.contract) {
      throw new Error('Contract not initialized');
    }

    try {
      return await this.contract.submit_evaluation(
        {
          intent_id: intentId,
          answer,
          confidence,
          sources,
          execution_time_ms: { '0': executionTimeMs.toString() },
        },
        { attachedDeposit: TESTNET_CONFIG.transaction.attachedDeposit }
      );
    } catch (error) {
      console.error('Failed to submit evaluation:', error);
      throw new Error('Failed to submit evaluation');
    }
  }

  // View methods
  public async getUserProfile(userId?: string): Promise<any> {
    if (!this.contract) {
      throw new Error('Contract not initialized');
    }

    try {
      const targetUserId = userId || this.accountId;
      if (!targetUserId) {
        throw new Error('No user ID available');
      }
      
      return await this.contract.get_user_profile({ user_id: targetUserId });
    } catch (error) {
      console.error('Failed to get user profile:', error);
      throw new Error('Failed to retrieve user profile');
    }
  }

  public async getPendingIntents(): Promise<any[]> {
    if (!this.contract) {
      throw new Error('Contract not initialized');
    }

    try {
      return await this.contract.get_pending_intents();
    } catch (error) {
      console.error('Failed to get pending intents:', error);
      throw new Error('Failed to retrieve pending intents');
    }
  }

  public async getIntent(intentId: string): Promise<any> {
    if (!this.contract) {
      throw new Error('Contract not initialized');
    }

    try {
      return await this.contract.get_intent({ intent_id: intentId });
    } catch (error) {
      console.error('Failed to get intent:', error);
      throw new Error('Failed to retrieve intent');
    }
  }

  public async getContractInfo(): Promise<any> {
    if (!this.contract) {
      throw new Error('Contract not initialized');
    }

    try {
      return await this.contract.get_contract_info();
    } catch (error) {
      console.error('Failed to get contract info:', error);
      throw new Error('Failed to retrieve contract information');
    }
  }
}

// Export singleton instance
export const nearWallet = new NearWalletService();