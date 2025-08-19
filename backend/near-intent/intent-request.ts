/**
 * Intent Request Manager for NEAR Intent Protocol
 * Handles creation and management of intent requests
 */

import { 
  Intent, 
  IntentRequestParams, 
  IntentError,
  AsyncResult 
} from './types';
import { AssetManager } from './asset-manager';
import { generateId, getCurrentTimestamp } from '../utils/helpers';

export class IntentRequest {
  private assetManager: AssetManager;
  private request: Partial<Intent>;

  constructor(assetManager: AssetManager) {
    this.assetManager = assetManager;
    this.request = {
      id: generateId(),
      nonce: generateId(),
    };
  }

  /**
   * Set the input asset for the intent
   */
  setAssetIn(tokenId: string, amount: string): IntentRequest {
    const asset = this.assetManager.getAsset(tokenId);
    if (!asset) {
      throw new Error(`Asset ${tokenId} not found`);
    }

    this.request.asset_in = {
      token_id: tokenId,
      decimals: asset.decimals,
      symbol: asset.symbol,
      name: asset.name,
      contract_address: asset.contract_address,
    };
    this.request.amount_in = amount;
    
    return this;
  }

  /**
   * Set the output asset for the intent
   */
  setAssetOut(tokenId: string, minAmount?: string): IntentRequest {
    const asset = this.assetManager.getAsset(tokenId);
    if (!asset) {
      throw new Error(`Asset ${tokenId} not found`);
    }

    this.request.asset_out = {
      token_id: tokenId,
      decimals: asset.decimals,
      symbol: asset.symbol,
      name: asset.name,
      contract_address: asset.contract_address,
    };
    
    if (minAmount) {
      this.request.amount_out_min = minAmount;
    }
    
    return this;
  }

  /**
   * Set the user account for the intent
   */
  setUser(accountId: string): IntentRequest {
    this.request.user = accountId;
    return this;
  }

  /**
   * Set the expiry time for the intent
   */
  setExpiry(expiryTimestamp: number): IntentRequest {
    this.request.expiry = expiryTimestamp;
    return this;
  }

  /**
   * Set minimum output amount with slippage calculation
   */
  setSlippageTolerance(slippagePercent: number, expectedOutput: string): IntentRequest {
    const slippageMultiplier = 1 - (slippagePercent / 100);
    const minOutput = (BigInt(expectedOutput) * BigInt(Math.floor(slippageMultiplier * 10000)) / BigInt(10000)).toString();
    this.request.amount_out_min = minOutput;
    return this;
  }

  /**
   * Build the complete intent object
   */
  build(): AsyncResult<Intent> {
    return new Promise((resolve) => {
      try {
        // Validate required fields
        if (!this.request.user) {
          throw new Error('User account is required');
        }
        if (!this.request.asset_in) {
          throw new Error('Input asset is required');
        }
        if (!this.request.asset_out) {
          throw new Error('Output asset is required');
        }
        if (!this.request.amount_in) {
          throw new Error('Input amount is required');
        }

        // Set defaults
        if (!this.request.amount_out_min) {
          this.request.amount_out_min = '0';
        }
        if (!this.request.expiry) {
          // Default to 1 hour from now
          this.request.expiry = getCurrentTimestamp() + 3600;
        }

        const intent: Intent = {
          id: this.request.id!,
          user: this.request.user!,
          asset_in: this.request.asset_in!,
          asset_out: this.request.asset_out!,
          amount_in: this.request.amount_in!,
          amount_out_min: this.request.amount_out_min!,
          expiry: this.request.expiry!,
          nonce: this.request.nonce!,
        };

        resolve({ success: true, data: intent });
      } catch (error) {
        const intentError: IntentError = {
          code: 'INVALID_INTENT',
          message: error instanceof Error ? error.message : 'Unknown error',
          timestamp: getCurrentTimestamp(),
        };
        resolve({ success: false, error: intentError });
      }
    });
  }

  /**
   * Create an intent from parameters
   */
  static async fromParams(
    params: IntentRequestParams, 
    user: string, 
    assetManager: AssetManager
  ): Promise<AsyncResult<Intent>> {
    const builder = new IntentRequest(assetManager);
    
    try {
      builder
        .setUser(user)
        .setAssetIn(params.asset_in, params.amount_in)
        .setAssetOut(params.asset_out, params.min_amount_out);

      if (params.slippage_tolerance && !params.min_amount_out) {
        // Calculate min amount out based on slippage if not provided
        const expectedOutput = await estimateOutput(
          params.asset_in, 
          params.asset_out, 
          params.amount_in
        );
        builder.setSlippageTolerance(params.slippage_tolerance, expectedOutput);
      }

      if (params.deadline) {
        builder.setExpiry(params.deadline);
      }

      return await builder.build();
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
   * Validate an intent object
   */
  static validateIntent(intent: Intent): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!intent.id) errors.push('Intent ID is required');
    if (!intent.user) errors.push('User is required');
    if (!intent.asset_in) errors.push('Input asset is required');
    if (!intent.asset_out) errors.push('Output asset is required');
    if (!intent.amount_in || BigInt(intent.amount_in) <= 0) {
      errors.push('Input amount must be greater than 0');
    }
    if (!intent.amount_out_min || BigInt(intent.amount_out_min) < 0) {
      errors.push('Minimum output amount cannot be negative');
    }
    if (!intent.expiry || intent.expiry <= getCurrentTimestamp()) {
      errors.push('Expiry must be in the future');
    }
    if (!intent.nonce) errors.push('Nonce is required');

    // Asset validation
    if (intent.asset_in && intent.asset_out) {
      if (intent.asset_in.token_id === intent.asset_out.token_id) {
        errors.push('Input and output assets cannot be the same');
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Calculate intent hash for signing
   */
  static calculateIntentHash(intent: Intent): string {
    const data = {
      id: intent.id,
      user: intent.user,
      asset_in: intent.asset_in.token_id,
      asset_out: intent.asset_out.token_id,
      amount_in: intent.amount_in,
      amount_out_min: intent.amount_out_min,
      expiry: intent.expiry,
      nonce: intent.nonce,
    };
    
    // Simple hash implementation (in production, use proper cryptographic hash)
    return Buffer.from(JSON.stringify(data)).toString('base64');
  }
}

/**
 * Estimate output amount for a given input
 * This would typically call external price oracles or DEX APIs
 */
async function estimateOutput(
  assetIn: string, 
  assetOut: string, 
  amountIn: string
): Promise<string> {
  // Placeholder implementation
  // In a real system, this would query price oracles, DEXes, etc.
  
  // Simple mock calculation for demonstration
  const mockPrice = 1.5; // 1 unit of assetIn = 1.5 units of assetOut
  const outputAmount = BigInt(amountIn) * BigInt(Math.floor(mockPrice * 1000)) / BigInt(1000);
  
  return outputAmount.toString();
}
