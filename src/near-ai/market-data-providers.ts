/**
 * Market Data Providers for NEAR Protocol Intent System
 * Aggregates market data from multiple sources
 */

import { MarketData } from './types';

export interface HistoricalDataPoint {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface MarketDataConfig {
  providers: string[];
  cache_duration: number;
  fallback_enabled: boolean;
  timeout_ms: number;
}

export interface PriceOracleConfig {
  pyth_program_id?: string;
  chainlink_feeds?: Record<string, string>;
  chainlink?: { rateLimitMs?: number; feeds?: Record<string, string>; updateInterval?: number } | boolean;
  near_oracles?: string[];
  fallback_providers: string[];
  update_frequency: number;
  coingecko?: { rateLimitMs?: number } | boolean;
}

export class MarketDataProviders {
  private config: MarketDataConfig;
  private cache: Map<string, { data: MarketData; timestamp: number }> = new Map();

  constructor(config: MarketDataConfig) {
    this.config = config;
  }

  /**
   * Fetch current market data for a trading pair
   */
  async fetchMarketData(symbol: string): Promise<MarketData> {
    // Check cache first
    const cached = this.cache.get(symbol);
    if (cached && Date.now() - cached.timestamp < this.config.cache_duration) {
      return cached.data;
    }

    try {
      // In a real implementation, this would aggregate data from multiple providers
      const basePrice = Math.random() * 100 + 1;
      const marketData: MarketData = {
        symbol,
        price: basePrice,
        volume: Math.random() * 1000000,
        high_24h: basePrice * 1.1,
        low_24h: basePrice * 0.9,
        change_24h: (Math.random() - 0.5) * 20,
        market_cap: Math.random() * 10000000,
        timestamp: Date.now(),
        // Additional properties for compatibility
        volume_24h: (Math.random() * 1000000).toFixed(2),
        price_change_24h: (Math.random() - 0.5) * 20,
        liquidity_score: Math.random() * 0.8 + 0.2, // 0.2-1.0
        volatility_24h: Math.random() * 0.1 + 0.01, // 1-10%
        volatility_index: Math.random() * 0.15 + 0.05 // 5-20%
      };

      // Cache the result
      this.cache.set(symbol, { data: marketData, timestamp: Date.now() });
      
      return marketData;
    } catch (error) {
      throw new Error(`Failed to fetch market data for ${symbol}: ${error}`);
    }
  }

  /**
   * Fetch historical data for technical analysis
   */
  async fetchHistoricalData(
    _symbol: string, 
    interval: string, 
    periods: number
  ): Promise<HistoricalDataPoint[]> {
    // Mock historical data generation
    const now = Date.now();
    const intervalMs = this.getIntervalMs(interval);
    const data: HistoricalDataPoint[] = [];
    
    let basePrice = Math.random() * 100 + 50;
    
    for (let i = periods - 1; i >= 0; i--) {
      const timestamp = now - (i * intervalMs);
      const volatility = 0.02; // 2% volatility
      const change = (Math.random() - 0.5) * volatility;
      
      const open = basePrice;
      const close = basePrice * (1 + change);
      const high = Math.max(open, close) * (1 + Math.random() * 0.01);
      const low = Math.min(open, close) * (1 - Math.random() * 0.01);
      const volume = Math.random() * 10000 + 1000;

      data.push({
        timestamp,
        open,
        high,
        low,
        close,
        volume
      });

      basePrice = close;
    }

    return data;
  }

  /**
   * Get multiple symbols market data at once
   */
  async fetchMultipleMarketData(symbols: string[]): Promise<Map<string, MarketData>> {
    const results = new Map<string, MarketData>();
    
    const promises = symbols.map(async (symbol) => {
      try {
        const data = await this.fetchMarketData(symbol);
        results.set(symbol, data);
      } catch (error) {
        console.error(`Failed to fetch data for ${symbol}:`, error);
      }
    });

    await Promise.all(promises);
    return results;
  }

  /**
   * Convert interval string to milliseconds
   */
  private getIntervalMs(interval: string): number {
    const unit = interval.slice(-1);
    const value = parseInt(interval.slice(0, -1));
    
    switch (unit) {
      case 's': return value * 1000;
      case 'm': return value * 60 * 1000;
      case 'h': return value * 60 * 60 * 1000;
      case 'd': return value * 24 * 60 * 60 * 1000;
      default: return 60 * 1000; // Default to 1 minute
    }
  }

  /**
   * Calculate technical indicators for a symbol
   */
  async calculateTechnicalIndicators(symbol: string): Promise<Record<string, unknown>> {
    // Get historical data for calculations
    const historicalData = await this.fetchHistoricalData(symbol, '1h', 50);
    
    if (historicalData.length === 0) {
      throw new Error(`No historical data available for ${symbol}`);
    }

    const prices = historicalData.map(d => d.close);
    
    // Calculate Simple Moving Averages
    const sma20 = this.calculateSMA(prices.slice(-20));
    const sma50 = prices.length >= 50 ? this.calculateSMA(prices.slice(-50)) : sma20;
    
    // Calculate RSI (simplified)
    const rsi = this.calculateRSI(prices.slice(-14));
    
    // Mock other technical indicators
    return {
      rsi,
      macd: { signal: 0, histogram: 0, macd: 0 },
      bollinger_bands: { 
        upper: sma20 * 1.02, 
        middle: sma20, 
        lower: sma20 * 0.98 
      },
      moving_averages: { sma_20: sma20, sma_50: sma50, sma_200: sma50 },
      volume_profile: { 
        support: Math.min(...prices) * 0.98, 
        resistance: Math.max(...prices) * 1.02 
      },
      momentum_indicators: { stochastic: 50, williams_r: -50 }
    };
  }

  /**
   * Calculate Simple Moving Average
   */
  private calculateSMA(prices: number[]): number {
    if (prices.length === 0) return 0;
    return prices.reduce((sum, price) => sum + price, 0) / prices.length;
  }

  /**
   * Calculate RSI (simplified version)
   */
  private calculateRSI(prices: number[]): number {
    if (prices.length < 14) return 50; // Default neutral RSI
    
    let gains = 0;
    let losses = 0;
    
    for (let i = 1; i < prices.length; i++) {
      const change = prices[i] - prices[i - 1];
      if (change > 0) gains += change;
      else losses += Math.abs(change);
    }
    
    const avgGain = gains / 14;
    const avgLoss = losses / 14;
    
    if (avgLoss === 0) return 100;
    const rs = avgGain / avgLoss;
    return 100 - (100 / (1 + rs));
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<MarketDataConfig>): void {
    this.config = { ...this.config, ...config };
  }
}