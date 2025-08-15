/**
 * Simple NEAR Wallet Integration for Testnet  
 * Basic wallet connection and contract interactions
 */

import { TESTNET_CONFIG } from '../config/testnet';

// Simplified interface for basic wallet operations
export class NearWallet {
  private isConnected = false;
  private accountId = '';

  async init(): Promise<void> {
    // Check if wallet is connected (simplified for demo)
    this.isConnected = false;
    this.accountId = '';
  }

  signIn(): void {
    // In a real implementation, this would redirect to NEAR wallet
    const walletUrl = `${TESTNET_CONFIG.network.walletUrl}/login/?contract_id=${TESTNET_CONFIG.contracts.oracleIntent}`;
    window.location.href = walletUrl;
  }

  signOut(): void {
    this.isConnected = false;
    this.accountId = '';
    // Clear any stored wallet data
    localStorage.removeItem('near-wallet-selector');
  }

  isSignedIn(): boolean {
    return this.isConnected;
  }

  getAccountId(): string {
    return this.accountId;
  }
}