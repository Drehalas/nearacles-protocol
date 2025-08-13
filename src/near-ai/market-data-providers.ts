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
  chainlink?: { 
    rateLimitMs?: number; 
    feeds?: Record<string, string>; 
    updateInterval?: number 
  } | boolean;
  flux?: {
    endpoint: string;
    apiKey?: string;
  };
  pyth?: {
    endpoint: string;
    priceIds: Record<string, string>;
  };
  coingecko?: { 
    rateLimitMs?: number;
    apiKey?: string;
  } | boolean;
  near_oracles?: string[];
  fallback_providers: string[];
  update_frequency: number;
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

// Helper function for retries
async function retry<T>(fn: () => Promise<T>, retries: number, delay: number): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    if (retries <= 0) throw error;
    await new Promise(resolve => setTimeout(resolve, delay));
    return retry(fn, retries - 1, delay);
  }
}

// Helper function for timestamp
function getCurrentTimestamp(): number {
  return Math.floor(Date.now() / 1000);
}

export class MarketDataProviders {
  private config: MarketDataConfig;
  private cache: Map<string, { data: MarketData; timestamp: number }> = new Map();

  constructor(config: MarketDataConfig) {
    this.config = config;
  }

  /**
   * Fetch market data from multiple sources with failover
   */
  async fetchMarketData(assetPair: string): Promise<MarketData> {
    const cacheKey = assetPair;
    const cached = this.getCachedData(cacheKey);
    if (cached) return cached;

    // Try multiple data sources in order of preference
    const sources = [
      () => this.fetchFromChainlink(assetPair),
      () => this.fetchFromFlux(assetPair),
      () => this.fetchFromPyth(assetPair),
      () => this.fetchFromCoinGecko(assetPair),
    ];

    for (const source of sources) {
      try {
        const data = await retry(source, 2, 1000);
        this.cacheData(cacheKey, data);
        return data;
      } catch (error) {
        console.warn(`Market data source failed for ${assetPair}:`, error);
        continue;
      }
    }

    // Fallback to mock data generation if all sources fail
    return this.generateFallbackMarketData(assetPair);
  }

  /**
   * Fetch from Chainlink price feeds
   */
  private async fetchFromChainlink(assetPair: string): Promise<MarketData> {
    if (!this.config.chainlink || this.config.chainlink === true) {
      throw new Error('Chainlink not configured');
    }

    const [baseAsset, quoteAsset] = assetPair.split('/');
    const feedAddress = this.config.chainlink.feeds?.[`${baseAsset}_${quoteAsset}`];
    
    if (!feedAddress) {
      throw new Error(`No Chainlink feed for ${assetPair}`);
    }

    // In a real implementation, this would call the Chainlink contract
    const mockPrice = this.generateMockPrice(baseAsset, quoteAsset);
    
    return {
      symbol: assetPair,
      price: mockPrice,
      volume: Math.random() * 1000000,
      high_24h: mockPrice * 1.05,
      low_24h: mockPrice * 0.95,
      change_24h: (Math.random() - 0.5) * 20,
      market_cap: Math.random() * 10000000,
      timestamp: Date.now(),
      volume_24h: (Math.random() * 1000000).toString(),
      price_change_24h: (Math.random() - 0.5) * 20,
      liquidity_score: 0.8 + Math.random() * 0.2,
      volatility_index: Math.random() * 0.8,
    };
  }

  /**
   * Fetch from Flux Protocol
   */
  private async fetchFromFlux(assetPair: string): Promise<MarketData> {
    if (!this.config.flux) {
      throw new Error('Flux not configured');
    }

    const response = await fetch(`${this.config.flux.endpoint}/prices/${assetPair}`, {
      headers: this.config.flux.apiKey ? {
        'Authorization': `Bearer ${this.config.flux.apiKey}`
      } : {}
    });

    if (!response.ok) {
      throw new Error(`Flux API error: ${response.status}`);
    }

    const data = await response.json();
    
    const marketData = data as any; // Type assertion for external API data
    return {
      symbol: assetPair,
      price: parseFloat(marketData.price),
      volume: parseFloat(marketData.volume_24h || '0'),
      high_24h: parseFloat(marketData.price) * 1.05,
      low_24h: parseFloat(marketData.price) * 0.95,
      change_24h: marketData.price_change_24h || 0,
      market_cap: Math.random() * 10000000,
      timestamp: Date.now(),
      volume_24h: marketData.volume_24h || '0',
      price_change_24h: marketData.price_change_24h || 0,
      liquidity_score: marketData.liquidity_score || 0.5,
      volatility_index: marketData.volatility || 0.3,
    };
  }

  /**
   * Fetch from Pyth Network
   */
  private async fetchFromPyth(assetPair: string): Promise<MarketData> {
    if (!this.config.pyth) {
      throw new Error('Pyth not configured');
    }

    const priceId = this.config.pyth.priceIds[assetPair];
    if (!priceId) {
      throw new Error(`No Pyth price ID for ${assetPair}`);
    }

    const response = await fetch(`${this.config.pyth.endpoint}/api/latest_price_feeds?ids[]=${priceId}`);
    
    if (!response.ok) {
      throw new Error(`Pyth API error: ${response.status}`);
    }

    const data = await response.json();
    const historicalData = data as any[];
    const priceData = historicalData[0];

    const price = priceData.price.price * Math.pow(10, priceData.price.expo);

    return {
      symbol: assetPair,
      price: price,
      volume: 0,
      high_24h: price * 1.02,
      low_24h: price * 0.98,
      change_24h: 0,
      market_cap: 0,
      timestamp: Date.now(),
      volume_24h: '0', // Pyth doesn't provide volume
      price_change_24h: 0,
      liquidity_score: 0.7,
      volatility_index: 0.4,
    };
  }

  /**
   * Fetch from CoinGecko API
   */
  private async fetchFromCoinGecko(assetPair: string): Promise<MarketData> {
    if (!this.config.coingecko || this.config.coingecko === true) {
      throw new Error('CoinGecko not configured');
    }

    const [baseAsset, quoteAsset] = assetPair.split('/');
    const coinId = this.getCoinGeckoId(baseAsset);
    const currency = quoteAsset.toLowerCase();

    const url = `https://api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=${currency}&include_24hr_change=true&include_24hr_vol=true`;
    
    const headers: Record<string, string> = {};
    if (this.config.coingecko.apiKey) {
      headers['x-cg-demo-api-key'] = this.config.coingecko.apiKey;
    }

    const response = await fetch(url, { headers });

    if (!response.ok) {
      throw new Error(`CoinGecko API error: ${response.status}`);
    }

    const data = await response.json();
    const apiData = data as any;
    const coinData = apiData[coinId];

    const price = parseFloat(coinData[currency]);

    return {
      symbol: assetPair,
      price: price,
      volume: parseFloat(coinData[`${currency}_24h_vol`] || '0'),
      high_24h: price * 1.05,
      low_24h: price * 0.95,
      change_24h: coinData[`${currency}_24h_change`] || 0,
      market_cap: Math.random() * 10000000,
      timestamp: Date.now(),
      volume_24h: coinData[`${currency}_24h_vol`]?.toString() || '0',
      price_change_24h: coinData[`${currency}_24h_change`] || 0,
      liquidity_score: 0.6,
      volatility_index: Math.abs(coinData[`${currency}_24h_change`] || 0) / 100,
    };
  }

  /**
   * Generate fallback market data when all sources fail
   */
  private generateFallbackMarketData(assetPair: string): MarketData {
    const [baseAsset, quoteAsset] = assetPair.split('/');
    const basePrice = this.generateMockPrice(baseAsset, quoteAsset);
    
    return {
      symbol: assetPair,
      price: basePrice,
      volume: Math.random() * 1000000,
      high_24h: basePrice * 1.1,
      low_24h: basePrice * 0.9,
      change_24h: (Math.random() - 0.5) * 20,
      market_cap: Math.random() * 10000000,
      timestamp: Date.now(),
      volume_24h: (Math.random() * 1000000).toFixed(2),
      price_change_24h: (Math.random() - 0.5) * 20,
      liquidity_score: Math.random() * 0.8 + 0.2,
      volatility_24h: Math.random() * 0.1 + 0.01,
      volatility_index: Math.random() * 0.15 + 0.05
    };
  }

  /**
   * Fetch historical data for technical analysis
   */
  async fetchHistoricalData(
    symbol: string, 
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
   * Get cached data if still valid
   */
  private getCachedData(key: string): MarketData | null {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.config.cache_duration) {
      return cached.data;
    }
    return null;
  }

  /**
   * Cache market data
   */
  private cacheData(key: string, data: MarketData): void {
    this.cache.set(key, { data, timestamp: Date.now() });
  }

  /**
   * Generate mock price for asset pair
   */
  private generateMockPrice(baseAsset: string, quoteAsset: string): number {
    const basePrices: { [key: string]: number } = {
      'NEAR': 4.50,
      'USDC': 1.00,
      'USDT': 1.00,
      'WETH': 2500,
      'DAI': 1.00,
      'REF': 0.15,
    };

    const inPrice = basePrices[baseAsset] || 1;
    const outPrice = basePrices[quoteAsset] || 1;
    const rate = inPrice / outPrice;
    
    // Add some randomness
    const variation = 1 + (Math.random() - 0.5) * 0.1; // ±5%
    return rate * variation;
  }

  /**
   * Get CoinGecko coin ID from asset symbol
   */
  private getCoinGeckoId(asset: string): string {
    const coinIds: { [key: string]: string } = {
      'NEAR': 'near',
      'USDC': 'usd-coin',
      'USDT': 'tether',
      'WETH': 'weth',
      'DAI': 'dai',
      'REF': 'ref-finance',
    };

    return coinIds[asset] || asset.toLowerCase();
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