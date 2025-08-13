/**
 * Asset Manager for NEAR Intent Protocol
 * Manages supported tokens and asset metadata
 */

import { TokenMetadata, AssetBalance, AssetInfo, IntentError } from './types';
import { Account, Contract } from 'near-api-js';
import { formatTokenAmount, parseTokenAmount, stringToBigInt } from '../utils/helpers';

export class AssetManager {
  private assets: Map<string, TokenMetadata> = new Map();
  private balances: Map<string, AssetBalance> = new Map();
  private account?: Account;

  constructor(account?: Account) {
    this.account = account;
    this.initializeDefaultAssets();
  }

  /**
   * Initialize default supported assets based on NEAR ecosystem
   */
  private initializeDefaultAssets(): void {
    // NEAR native token
    this.assets.set('NEAR', {
      token_id: 'NEAR',
      symbol: 'NEAR',
      name: 'NEAR Protocol',
      decimals: 24,
      contract_address: '',
      total_supply: '1000000000',
      is_native: true,
      icon: 'https://near.org/wp-content/themes/near-19/assets/img/brand-icon.png',
    });

    // USDC (Rainbow Bridge)
    this.assets.set('USDC', {
      token_id: 'USDC',
      symbol: 'USDC',
      name: 'USD Coin',
      decimals: 6,
      contract_address: 'a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48.factory.bridge.near',
      is_native: false,
      icon: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48/logo.png',
    });

    // USDT (Rainbow Bridge)
    this.assets.set('USDT', {
      token_id: 'USDT',
      symbol: 'USDT',
      name: 'Tether USD',
      decimals: 6,
      contract_address: 'dac17f958d2ee523a2206206994597c13d831ec7.factory.bridge.near',
      is_native: false,
      icon: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xdAC17F958D2ee523a2206206994597C13D831ec7/logo.png',
    });

    // WETH (Rainbow Bridge)
    this.assets.set('WETH', {
      token_id: 'WETH',
      symbol: 'WETH',
      name: 'Wrapped Ethereum',
      decimals: 18,
      contract_address: 'c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2.factory.bridge.near',
      is_native: false,
      icon: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2/logo.png',
    });

    // DAI (Rainbow Bridge)
    this.assets.set('DAI', {
      token_id: 'DAI',
      symbol: 'DAI',
      name: 'Dai Stablecoin',
      decimals: 18,
      contract_address: '6b175474e89094c44da98b954eedeac495271d0f.factory.bridge.near',
      is_native: false,
      icon: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0x6B175474E89094C44Da98b954EedeAC495271d0F/logo.png',
    });

    // REF Token
    this.assets.set('REF', {
      token_id: 'REF',
      symbol: 'REF',
      name: 'Ref Finance',
      decimals: 18,
      contract_address: 'token.v2.ref-finance.near',
      is_native: false,
      icon: 'https://ref-finance.com/logo192.png',
    });

    // AURORA
    this.assets.set('AURORA', {
      token_id: 'AURORA',
      symbol: 'AURORA',
      name: 'Aurora',
      decimals: 18,
      contract_address: 'aaaaaa20d9e0e2461697782ef11675f668207961.factory.bridge.near',
      is_native: false,
      icon: 'https://aurora.dev/favicon.ico',
    });
  }

  /**
   * Get asset metadata by token ID
   */
  getAsset(tokenId: string): TokenMetadata | undefined {
    return this.assets.get(tokenId);
  }

  /**
   * Get all supported assets
   */
  getAllAssets(): TokenMetadata[] {
    return Array.from(this.assets.values());
  }

  /**
   * Add a new asset to the manager
   */
  addAsset(asset: TokenMetadata): void {
    this.assets.set(asset.token_id, asset);
  }

  /**
   * Remove an asset from the manager
   */
  removeAsset(tokenId: string): boolean {
    return this.assets.delete(tokenId);
  }

  /**
   * Check if an asset is supported
   */
  isAssetSupported(tokenId: string): boolean {
    return this.assets.has(tokenId);
  }

  /**
   * Get asset balance for an account
   */
  async getBalance(tokenId: string, accountId?: string): Promise<AssetBalance | null> {
    if (!this.account && !accountId) {
      throw new Error('Account or accountId required for balance query');
    }

    const asset = this.getAsset(tokenId);
    if (!asset) {
      throw new Error(`Asset ${tokenId} not supported`);
    }

    const targetAccountId = accountId || this.account!.accountId;

    try {
      let balance = '0';
      let available = '0';
      let locked = '0';

      if (asset.is_native) {
        // Get NEAR balance
        const accountState = await this.account!.state();
        balance = accountState.amount;
        available = accountState.amount;
        locked = '0';
      } else {
        // Get FT balance
        const contract = new Contract(
          this.account!,
          asset.contract_address,
          {
            viewMethods: ['ft_balance_of'],
            changeMethods: [],
            useLocalViewExecution: false,
          }
        );

        balance = await (contract as any).ft_balance_of({
          account_id: targetAccountId,
        });
        available = balance;
        locked = '0';
      }

      const assetBalance: AssetBalance = {
        token_id: tokenId,
        balance,
        available,
        locked,
        decimals: asset.decimals,
      };

      this.balances.set(`${targetAccountId}:${tokenId}`, assetBalance);
      return assetBalance;

    } catch (error) {
      console.error(`Failed to get balance for ${tokenId}:`, error);
      return null;
    }
  }

  /**
   * Get all balances for an account
   */
  async getAllBalances(accountId?: string): Promise<AssetBalance[]> {
    const balances: AssetBalance[] = [];
    const targetAccountId = accountId || this.account!.accountId;

    for (const asset of this.assets.values()) {
      try {
        const balance = await this.getBalance(asset.token_id, targetAccountId);
        if (balance && stringToBigInt(balance.balance) > 0n) {
          balances.push(balance);
        }
      } catch (error) {
        console.warn(`Failed to get balance for ${asset.token_id}:`, error);
      }
    }

    return balances;
  }

  /**
   * Format asset amount for display
   */
  formatAmount(tokenId: string, amount: string, displayDecimals: number = 4): string {
    const asset = this.getAsset(tokenId);
    if (!asset) {
      throw new Error(`Asset ${tokenId} not supported`);
    }

    return formatTokenAmount(amount, asset.decimals, displayDecimals);
  }

  /**
   * Parse asset amount from string
   */
  parseAmount(tokenId: string, amount: string): string {
    const asset = this.getAsset(tokenId);
    if (!asset) {
      throw new Error(`Asset ${tokenId} not supported`);
    }

    return parseTokenAmount(amount, asset.decimals);
  }

  /**
   * Convert asset info to AssetInfo type
   */
  toAssetInfo(tokenId: string): AssetInfo | null {
    const asset = this.getAsset(tokenId);
    if (!asset) {
      return null;
    }

    return {
      token_id: asset.token_id,
      decimals: asset.decimals,
      symbol: asset.symbol,
      name: asset.name,
      contract_address: asset.contract_address,
    };
  }

  /**
   * Check storage registration for FT
   */
  async isStorageRegistered(tokenId: string, accountId?: string): Promise<boolean> {
    const asset = this.getAsset(tokenId);
    if (!asset || asset.is_native) {
      return true; // NEAR doesn't need storage registration
    }

    if (!this.account && !accountId) {
      throw new Error('Account required for storage check');
    }

    const targetAccountId = accountId || this.account!.accountId;

    try {
      const contract = new Contract(
        this.account!,
        asset.contract_address,
        {
          viewMethods: ['storage_balance_of'],
          changeMethods: [],
          useLocalViewExecution: false,
        }
      );

      const storageBalance = await (contract as any).storage_balance_of({
        account_id: targetAccountId,
      });

      return storageBalance !== null;
    } catch (error) {
      console.error(`Failed to check storage registration for ${tokenId}:`, error);
      return false;
    }
  }

  /**
   * Register storage for FT
   */
  async registerStorage(tokenId: string, deposit: string = '0.00125'): Promise<boolean> {
    const asset = this.getAsset(tokenId);
    if (!asset || asset.is_native) {
      return true; // NEAR doesn't need storage registration
    }

    if (!this.account) {
      throw new Error('Account required for storage registration');
    }

    try {
      const contract = new Contract(
        this.account,
        asset.contract_address,
        {
          viewMethods: [],
          changeMethods: ['storage_deposit'],
          useLocalViewExecution: false,
        }
      );

      await (contract as any).storage_deposit(
        {
          account_id: this.account.accountId,
          registration_only: true,
        },
        '300000000000000', // 300 TGas
        parseTokenAmount(deposit, 24) // NEAR amount for storage
      );

      return true;
    } catch (error) {
      console.error(`Failed to register storage for ${tokenId}:`, error);
      return false;
    }
  }

  /**
   * Validate token transfer
   */
  async validateTransfer(
    tokenId: string, 
    amount: string, 
    fromAccount?: string
  ): Promise<{ valid: boolean; error?: string }> {
    const asset = this.getAsset(tokenId);
    if (!asset) {
      return { valid: false, error: `Asset ${tokenId} not supported` };
    }

    // Check amount is positive
    if (stringToBigInt(amount) <= 0n) {
      return { valid: false, error: 'Amount must be greater than 0' };
    }

    // Check balance
    const accountId = fromAccount || this.account?.accountId;
    if (accountId) {
      const balance = await this.getBalance(tokenId, accountId);
      if (!balance) {
        return { valid: false, error: 'Failed to get balance' };
      }

      if (stringToBigInt(balance.available) < stringToBigInt(amount)) {
        return { valid: false, error: 'Insufficient balance' };
      }
    }

    // Check storage registration for FT
    if (!asset.is_native && accountId) {
      const isRegistered = await this.isStorageRegistered(tokenId, accountId);
      if (!isRegistered) {
        return { valid: false, error: 'Storage not registered for this token' };
      }
    }

    return { valid: true };
  }

  /**
   * Get asset price from external oracle (placeholder)
   */
  async getAssetPrice(tokenId: string, _quoteCurrency: string = 'USD'): Promise<number | null> {
    // Placeholder implementation
    // In production, this would integrate with price oracles like:
    // - Chainlink
    // - Flux Protocol
    // - Pyth Network
    // - CoinGecko API
    
    const mockPrices: { [key: string]: number } = {
      'NEAR': 4.50,
      'USDC': 1.00,
      'USDT': 1.00,
      'WETH': 2500.00,
      'DAI': 1.00,
      'REF': 0.15,
      'AURORA': 0.08,
    };

    return mockPrices[tokenId] || null;
  }

  /**
   * Calculate USD value of asset amount
   */
  async calculateUSDValue(tokenId: string, amount: string): Promise<number | null> {
    const price = await this.getAssetPrice(tokenId);
    if (!price) return null;

    const asset = this.getAsset(tokenId);
    if (!asset) return null;

    const tokenAmount = Number(formatTokenAmount(amount, asset.decimals));
    return tokenAmount * price;
  }
}
