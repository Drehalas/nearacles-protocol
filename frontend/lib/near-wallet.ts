/**
 * Simple NEAR Wallet Integration for Testnet
 * Basic wallet connection and contract interactions
 */

import { WalletConnection, Near, Contract, keyStores } from 'near-api-js';
import { TESTNET_CONFIG } from '../config/testnet.js';

// Contract interface for core functionality
export interface OracleContract extends Contract {
  // View methods
  get_contract_info(): Promise<any>;
  get_user_profile(args: { user_id: string }): Promise<any>;
  get_intent(args: { intent_id: string }): Promise<any>;

  // Change methods  
  register_user(args: { role: string }): Promise<void>;
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
}

export class NearWallet {
  public near: Near;
  public wallet: WalletConnection;
  public contract: OracleContract | null = null;

  constructor() {
    const keyStore = new keyStores.BrowserLocalStorageKeyStore();
    
    this.near = new Near({
      keyStore,
      ...TESTNET_CONFIG.network,
      deps: { keyStore }
    });

    this.wallet = new WalletConnection(this.near, 'oracle-intent-protocol');
  }

  async init(): Promise<void> {
    if (this.wallet.isSignedIn()) {
      await this.initContract();
    }
  }

  private async initContract(): Promise<void> {
    this.contract = new Contract(
      this.wallet.account(),
      TESTNET_CONFIG.contracts.oracleIntent,
      {
        viewMethods: ['get_contract_info', 'get_user_profile', 'get_intent'],
        changeMethods: ['register_user', 'submit_credibility_intent', 'accept_intent']
      }
    ) as OracleContract;
  }

  signIn(): void {
    this.wallet.requestSignIn({
      contractId: TESTNET_CONFIG.contracts.oracleIntent,
      methodNames: ['register_user', 'submit_credibility_intent', 'accept_intent']
    });
  }

  signOut(): void {
    this.wallet.signOut();
    this.contract = null;
  }

  isSignedIn(): boolean {
    return this.wallet.isSignedIn();
  }

  getAccountId(): string {
    return this.wallet.getAccountId();
  }
}