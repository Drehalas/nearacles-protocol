/**
 * Market Data Providers for Real-time Price and Trading Data
 * Integrates with multiple data sources for comprehensive market analysis
 */

import { MarketData, TechnicalIndicators } from './types';
import { getCurrentTimestamp, retry } from '../utils/helpers';

export interface PriceOracleConfig {
  chainlink?: {
    feeds: Record<string, string>; // asset -> feed address
    updateInterval: number;
  };
  flux?: {
    endpoint: string;
    apiKey?: string;
  };
  pyth?: {
    endpoint: string;
    priceIds: Record<string, string>;
  };
  coingecko?: {
    apiKey?: string;
    rateLimitMs: number;
  };
}

export class MarketDataProviders {
  private config: PriceOracleConfig;
  private cache: Map<string, { data: MarketData; timestamp: number }> = new Map();
  private readonly CACHE_TTL = 60000; // 1 minute

  constructor(config: PriceOracleConfig) {
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

    throw new Error(`Failed to fetch market data for ${assetPair} from all sources`);
  }

  /**
   * Fetch from Chainlink price feeds
   */
  private async fetchFromChainlink(assetPair: string): Promise<MarketData> {
    if (!this.config.chainlink) {
      throw new Error('Chainlink not configured');
    }

    const [baseAsset, quoteAsset] = assetPair.split('/');
    const feedAddress = this.config.chainlink.feeds[`${baseAsset}_${quoteAsset}`];
    
    if (!feedAddress) {
      throw new Error(`No Chainlink feed for ${assetPair}`);
    }

    // In a real implementation, this would call the Chainlink contract
    const mockPrice = this.generateMockPrice(baseAsset, quoteAsset);
    
    return {
      asset_pair: assetPair,
      price: mockPrice.toString(),
      volume_24h: (Math.random() * 1000000).toString(),
      price_change_24h: (Math.random() - 0.5) * 20,
      price_change_7d: (Math.random() - 0.5) * 50,
      liquidity_score: 0.8 + Math.random() * 0.2,
      volatility_index: Math.random() * 0.8,
      timestamp: getCurrentTimestamp(),
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
      asset_pair: assetPair,
      price: marketData.price,
      volume_24h: marketData.volume_24h || '0',
      price_change_24h: marketData.price_change_24h || 0,
      price_change_7d: marketData.price_change_7d || 0,
      liquidity_score: marketData.liquidity_score || 0.5,
      volatility_index: marketData.volatility || 0.3,
      timestamp: getCurrentTimestamp(),
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

    return {
      asset_pair: assetPair,
      price: (priceData.price.price * Math.pow(10, priceData.price.expo)).toString(),
      volume_24h: '0', // Pyth doesn't provide volume
      price_change_24h: 0,
      price_change_7d: 0,
      liquidity_score: 0.7,
      volatility_index: 0.4,
      timestamp: getCurrentTimestamp(),
    };
  }

  /**
   * Fetch from CoinGecko API
   */
  private async fetchFromCoinGecko(assetPair: string): Promise<MarketData> {
    if (!this.config.coingecko) {
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

    // Rate limiting
    await this.rateLimitDelay();

    const response = await fetch(url, { headers });
    
    if (!response.ok) {
      throw new Error(`CoinGecko API error: ${response.status}`);
    }

    const data = await response.json();
    const apiData = data as any;
    const coinData = apiData[coinId];

    return {
      asset_pair: assetPair,
      price: coinData[currency].toString(),
      volume_24h: coinData[`${currency}_24h_vol`]?.toString() || '0',
      price_change_24h: coinData[`${currency}_24h_change`] || 0,
      price_change_7d: 0, // Not provided by this endpoint
      liquidity_score: 0.6,
      volatility_index: Math.abs(coinData[`${currency}_24h_change`] || 0) / 100,
      timestamp: getCurrentTimestamp(),
    };
  }

  /**
   * Fetch historical data for technical analysis
   */
  async fetchHistoricalData(
    assetPair: string, 
    period: '1h' | '4h' | '1d' | '1w' = '1h',
    limit: number = 100
  ): Promise<Array<{
    timestamp: number;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
  }>> {
    // In a real implementation, this would fetch from historical data APIs
    // For now, generate mock OHLCV data
    const data = [];
    const basePrice = parseFloat(await this.fetchMarketData(assetPair).then(d => d.price));
    
    for (let i = limit; i > 0; i--) {
      const timestamp = getCurrentTimestamp() - (i * this.getPeriodSeconds(period));
      const volatility = 0.02; // 2% volatility
      
      const open = basePrice * (1 + (Math.random() - 0.5) * volatility);
      const close = open * (1 + (Math.random() - 0.5) * volatility);
      const high = Math.max(open, close) * (1 + Math.random() * volatility / 2);
      const low = Math.min(open, close) * (1 - Math.random() * volatility / 2);
      const volume = Math.random() * 1000000;

      data.push({
        timestamp,
        open,
        high,
        low,
        close,
        volume,
      });
    }

    return data;
  }

  /**
   * Calculate technical indicators from historical data
   */
  async calculateTechnicalIndicators(
    assetPair: string,
    period: '1h' | '4h' | '1d' | '1w' = '1h'
  ): Promise<TechnicalIndicators> {
    const historicalData = await this.fetchHistoricalData(assetPair, period, 50);
    const closes = historicalData.map(d => d.close);
    const highs = historicalData.map(d => d.high);
    const lows = historicalData.map(d => d.low);

    return {
      rsi: this.calculateRSI(closes, 14),
      macd: this.calculateMACD(closes),
      bollinger_bands: this.calculateBollingerBands(closes, 20, 2),
      moving_averages: {
        sma_20: this.calculateSMA(closes, 20),
        sma_50: this.calculateSMA(closes, 50),
        ema_12: this.calculateEMA(closes, 12),
        ema_26: this.calculateEMA(closes, 26),
      },
      support_resistance: this.calculateSupportResistance(highs, lows),
    };
  }

  /**
   * Helper methods for technical indicators
   */
  private calculateRSI(prices: number[], period: number): number {
    if (prices.length < period + 1) return 50;

    let gains = 0;
    let losses = 0;

    for (let i = 1; i <= period; i++) {
      const change = prices[prices.length - i] - prices[prices.length - i - 1];
      if (change > 0) gains += change;
      else losses -= change;
    }

    const avgGain = gains / period;
    const avgLoss = losses / period;
    const rs = avgGain / avgLoss;
    
    return 100 - (100 / (1 + rs));
  }

  private calculateMACD(prices: number[]): { signal: number; histogram: number; macd: number } {
    const ema12 = this.calculateEMA(prices, 12);
    const ema26 = this.calculateEMA(prices, 26);
    const macd = ema12 - ema26;
    
    // Simplified signal line calculation
    const signal = macd * 0.9; // Mock signal line
    const histogram = macd - signal;

    return { signal, histogram, macd };
  }

  private calculateBollingerBands(prices: number[], period: number, stdDev: number): {
    upper: number;
    middle: number;
    lower: number;
  } {
    const sma = this.calculateSMA(prices, period);
    const variance = prices.slice(-period).reduce((sum, price) => sum + Math.pow(price - sma, 2), 0) / period;
    const standardDeviation = Math.sqrt(variance);

    return {
      upper: sma + (standardDeviation * stdDev),
      middle: sma,
      lower: sma - (standardDeviation * stdDev),
    };
  }

  private calculateSMA(prices: number[], period: number): number {
    if (prices.length < period) return prices[prices.length - 1] || 0;
    return prices.slice(-period).reduce((sum, price) => sum + price, 0) / period;
  }

  private calculateEMA(prices: number[], period: number): number {
    if (prices.length === 0) return 0;
    if (prices.length === 1) return prices[0];

    const multiplier = 2 / (period + 1);
    let ema = prices[0];

    for (let i = 1; i < prices.length; i++) {
      ema = ((prices[i] - ema) * multiplier) + ema;
    }

    return ema;
  }

  private calculateSupportResistance(highs: number[], lows: number[]): {
    support_levels: number[];
    resistance_levels: number[];
  } {
    const recentHighs = highs.slice(-20);
    const recentLows = lows.slice(-20);

    const resistance_levels = [
      Math.max(...recentHighs),
      recentHighs.sort((a, b) => b - a)[2] || 0,
      recentHighs.sort((a, b) => b - a)[4] || 0,
    ].filter(level => level > 0);

    const support_levels = [
      Math.min(...recentLows),
      recentLows.sort((a, b) => a - b)[2] || 0,
      recentLows.sort((a, b) => a - b)[4] || 0,
    ].filter(level => level > 0);

    return { support_levels, resistance_levels };
  }

  private generateMockPrice(baseAsset: string, quoteAsset: string): number {
    const basePrices: Record<string, number> = {
      'NEAR': 4.50,
      'BTC': 45000,
      'ETH': 2500,
      'USDC': 1.00,
      'USDT': 1.00,
    };

    const basePrice = basePrices[baseAsset] || 1;
    const quotePrice = basePrices[quoteAsset] || 1;
    const rate = basePrice / quotePrice;
    
    // Add some random variation
    return rate * (1 + (Math.random() - 0.5) * 0.02);
  }

  private getCoinGeckoId(asset: string): string {
    const mapping: Record<string, string> = {
      'NEAR': 'near',
      'BTC': 'bitcoin',
      'ETH': 'ethereum',
      'USDC': 'usd-coin',
      'USDT': 'tether',
    };
    return mapping[asset] || asset.toLowerCase();
  }

  private getPeriodSeconds(period: string): number {
    const periods: Record<string, number> = {
      '1h': 3600,
      '4h': 14400,
      '1d': 86400,
      '1w': 604800,
    };
    return periods[period] || 3600;
  }

  private async rateLimitDelay(): Promise<void> {
    if (this.config.coingecko?.rateLimitMs) {
      await new Promise(resolve => setTimeout(resolve, this.config.coingecko!.rateLimitMs));
    }
  }

  private getCachedData(key: string): MarketData | null {
    const cached = this.cache.get(key);
    if (cached && (Date.now() - cached.timestamp) < this.CACHE_TTL) {
      return cached.data;
    }
    return null;
  }

  private cacheData(key: string, data: MarketData): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    });
  }
}
