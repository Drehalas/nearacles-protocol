/**
 * Oracle Price Pusher Service
 * Pushes aggregated price data to NEAR smart contract
 * Runs continuously at configured intervals
 */

import { PriceAggregator } from './price-aggregator.js';
import { NEAROracleIntegration } from './near-oracle-integration.js';
import { PriceData, PriceUpdateResult, AggregatedPrice } from '../types/price-oracle.js';

export interface PricePusherConfig {
  updateInterval: number; // milliseconds
  assets: string[];
  minSources: number;
  maxRetries: number;
  retryDelay: number;
}

export interface PricePusherMetrics {
  totalPushes: number;
  successfulPushes: number;
  failedPushes: number;
  lastPushTime: number;
  assetPushes: Map<string, number>;
  errors: string[];
}

export class OraclePricePusher {
  private aggregator: PriceAggregator;
  private nearIntegration: NEAROracleIntegration;
  private config: PricePusherConfig;
  private metrics: PricePusherMetrics;
  private isRunning: boolean = false;
  private intervalId?: NodeJS.Timeout;

  constructor(nearIntegration: NEAROracleIntegration, config?: Partial<PricePusherConfig>) {
    this.nearIntegration = nearIntegration;
    this.aggregator = new PriceAggregator();

    this.config = {
      updateInterval: config?.updateInterval || 60000, // 1 minute default
      assets: config?.assets || ['BTC/USD', 'ETH/USD', 'NEAR/USD'],
      minSources: config?.minSources || 5,
      maxRetries: config?.maxRetries || 3,
      retryDelay: config?.retryDelay || 5000,
    };

    this.metrics = {
      totalPushes: 0,
      successfulPushes: 0,
      failedPushes: 0,
      lastPushTime: 0,
      assetPushes: new Map(),
      errors: [],
    };

    // Initialize asset push counters
    for (const asset of this.config.assets) {
      this.metrics.assetPushes.set(asset, 0);
    }
  }

  /**
   * Start the price pusher
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      console.log('Price pusher is already running');
      return;
    }

    console.log('Starting Oracle Price Pusher...');
    console.log(`  Update Interval: ${this.config.updateInterval / 1000}s`);
    console.log(`  Assets: ${this.config.assets.join(', ')}`);
    console.log(`  Min Sources: ${this.config.minSources}`);

    this.isRunning = true;

    // Push prices immediately on start
    await this.pushAllPrices();

    // Set up interval for continuous pushing
    this.intervalId = setInterval(async () => {
      await this.pushAllPrices();
    }, this.config.updateInterval);

    console.log('Oracle Price Pusher started successfully');
  }

  /**
   * Stop the price pusher
   */
  stop(): void {
    if (!this.isRunning) {
      return;
    }

    console.log('Stopping Oracle Price Pusher...');

    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = undefined;
    }

    this.isRunning = false;
    console.log('Oracle Price Pusher stopped');
  }

  /**
   * Push prices for all configured assets
   */
  private async pushAllPrices(): Promise<void> {
    console.log(`\n[${new Date().toISOString()}] Pushing prices for ${this.config.assets.length} assets...`);

    const results = await Promise.allSettled(
      this.config.assets.map(asset => this.pushPriceWithRetry(asset))
    );

    let successCount = 0;
    let failCount = 0;

    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        if (result.value.success) {
          successCount++;
        } else {
          failCount++;
        }
      } else {
        failCount++;
        console.error(`Failed to push price for ${this.config.assets[index]}:`, result.reason);
      }
    });

    console.log(`Price push complete: ${successCount} successful, ${failCount} failed`);
  }

  /**
   * Push price for a single asset with retry logic
   */
  private async pushPriceWithRetry(asset: string): Promise<PriceUpdateResult> {
    let lastError: Error | undefined;

    for (let attempt = 1; attempt <= this.config.maxRetries; attempt++) {
      try {
        return await this.pushPrice(asset);
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        console.warn(`Attempt ${attempt}/${this.config.maxRetries} failed for ${asset}: ${lastError.message}`);

        if (attempt < this.config.maxRetries) {
          await new Promise(resolve => setTimeout(resolve, this.config.retryDelay));
        }
      }
    }

    // All retries failed
    this.metrics.failedPushes++;
    this.recordError(`Failed to push ${asset} after ${this.config.maxRetries} attempts: ${lastError?.message}`);

    return {
      asset,
      success: false,
      error: lastError?.message || 'Unknown error',
    };
  }

  /**
   * Push price for a single asset
   */
  private async pushPrice(asset: string): Promise<PriceUpdateResult> {
    try {
      // Step 1: Aggregate price from multiple sources
      const aggregatedPrice = await this.aggregator.aggregatePrice(asset, this.config.minSources);

      console.log(`\n${asset}:`);
      console.log(`  Median Price: $${aggregatedPrice.median.toFixed(8)}`);
      console.log(`  Sources: ${aggregatedPrice.sources}`);
      console.log(`  Confidence: ${(aggregatedPrice.confidence * 100).toFixed(2)}%`);

      // Step 2: Convert to Pyth-compatible format
      const priceData = this.toPythFormat(aggregatedPrice);

      // Step 3: Push to NEAR contract
      const transactionHash = await this.nearIntegration.updatePriceData(
        asset.replace('/', '_'),
        priceData
      );

      // Update metrics
      this.metrics.totalPushes++;
      this.metrics.successfulPushes++;
      this.metrics.lastPushTime = Date.now();

      const assetPushCount = this.metrics.assetPushes.get(asset) || 0;
      this.metrics.assetPushes.set(asset, assetPushCount + 1);

      console.log(`  Transaction: ${transactionHash}`);
      console.log(`  Status: SUCCESS`);

      return {
        asset,
        success: true,
        transactionHash,
        priceData,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`  Status: FAILED - ${errorMessage}`);
      throw error;
    }
  }

  /**
   * Convert aggregated price to Pyth-compatible format
   */
  private toPythFormat(aggregated: AggregatedPrice): PriceData {
    // Use median as the primary price (most robust)
    const price = Math.floor(aggregated.median * 1e8); // 8 decimal precision

    // Confidence is the price spread (lower spread = higher confidence)
    const maxPrice = Math.max(...aggregated.prices);
    const minPrice = Math.min(...aggregated.prices);
    const spread = maxPrice - minPrice;
    const confidence = Math.floor(spread * 1e8);

    return {
      asset_id: aggregated.asset.replace('/', '_'),
      price: price.toFixed(0), // Convert to string without scientific notation
      confidence: confidence.toFixed(0), // Convert to string without scientific notation
      expo: -8,
      publish_time: aggregated.timestamp,
    };
  }

  /**
   * Record error in metrics
   */
  private recordError(error: string): void {
    this.metrics.errors.push(`[${new Date().toISOString()}] ${error}`);

    // Keep only last 100 errors
    if (this.metrics.errors.length > 100) {
      this.metrics.errors = this.metrics.errors.slice(-100);
    }
  }

  /**
   * Get pusher metrics
   */
  getMetrics(): PricePusherMetrics {
    return {
      ...this.metrics,
      assetPushes: new Map(this.metrics.assetPushes),
      errors: [...this.metrics.errors],
    };
  }

  /**
   * Get aggregator metrics
   */
  getAggregatorMetrics() {
    return this.aggregator.getMetrics();
  }

  /**
   * Get source status
   */
  getSourceStatus() {
    return this.aggregator.getSourceStatus();
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<PricePusherConfig>): void {
    this.config = { ...this.config, ...config };
    console.log('Price pusher configuration updated:', this.config);

    // Restart if running with new config
    if (this.isRunning) {
      this.stop();
      this.start();
    }
  }

  /**
   * Get current configuration
   */
  getConfig(): PricePusherConfig {
    return { ...this.config };
  }

  /**
   * Check if pusher is running
   */
  isActive(): boolean {
    return this.isRunning;
  }

  /**
   * Manually trigger price push (useful for testing)
   */
  async triggerPush(asset?: string): Promise<PriceUpdateResult | PriceUpdateResult[]> {
    if (asset) {
      return await this.pushPriceWithRetry(asset);
    } else {
      const results = await Promise.allSettled(
        this.config.assets.map(a => this.pushPriceWithRetry(a))
      );

      return results.map((result, index) => {
        if (result.status === 'fulfilled') {
          return result.value;
        } else {
          return {
            asset: this.config.assets[index],
            success: false,
            error: result.reason?.message || 'Unknown error',
          };
        }
      });
    }
  }
}
