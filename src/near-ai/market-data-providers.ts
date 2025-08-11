/**
 * Market Data Providers for NEAR Protocol Intent System
 * Aggregates market data from multiple sources
 */

export interface MarketData {
  symbol: string;
  price: string;
  volume_24h: string;
  price_change_24h: number;
  market_cap: string;
  liquidity_score: number;
  volatility_24h: number;
  timestamp: number;
}

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
      const marketData: MarketData = {
        symbol,
        price: (Math.random() * 100 + 1).toFixed(6),
        volume_24h: (Math.random() * 1000000).toFixed(2),
        price_change_24h: (Math.random() - 0.5) * 20,
        market_cap: (Math.random() * 10000000).toFixed(0),
        liquidity_score: Math.random() * 0.8 + 0.2, // 0.2-1.0
        volatility_24h: Math.random() * 0.1 + 0.01, // 1-10%
        timestamp: Date.now()
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