/**
 * Price Aggregator Service
 * Aggregates cryptocurrency prices from multiple API sources
 * Calculates median, mean, and trimmed mean for robust price discovery
 */

import {
  PriceSource,
  AggregatedPrice,
  PriceFeedConfig,
  PriceAggregatorMetrics,
  AssetMetrics,
  APISourceStatus,
} from '../types/price-oracle.js';

export class PriceAggregator {
  private sources: Map<string, PriceSource[]>;
  private metrics: PriceAggregatorMetrics;
  private sourceStatus: Map<string, APISourceStatus>;

  constructor() {
    this.sources = new Map();
    this.sourceStatus = new Map();
    this.metrics = {
      totalUpdates: 0,
      successfulUpdates: 0,
      failedUpdates: 0,
      averageConfidence: 0,
      lastUpdateTime: 0,
      assetMetrics: new Map(),
    };

    this.initializeSources();
  }

  private initializeSources(): void {
    // BTC/USD - 10 sources
    this.sources.set('BTC/USD', [
      {
        name: 'Binance',
        url: 'https://api.binance.com/api/v3/ticker/price?symbol=BTCUSDT',
        parseResponse: (data: any) => parseFloat(data.price),
      },
      {
        name: 'Coinbase',
        url: 'https://api.coinbase.com/v2/prices/BTC-USD/spot',
        parseResponse: (data: any) => parseFloat(data.data.amount),
      },
      {
        name: 'Kraken',
        url: 'https://api.kraken.com/0/public/Ticker?pair=XBTUSD',
        parseResponse: (data: any) => parseFloat(data.result.XXBTZUSD.c[0]),
      },
      {
        name: 'KuCoin',
        url: 'https://api.kucoin.com/api/v1/market/orderbook/level1?symbol=BTC-USDT',
        parseResponse: (data: any) => parseFloat(data.data.price),
      },
      {
        name: 'CoinGecko',
        url: 'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd',
        parseResponse: (data: any) => data.bitcoin.usd,
      },
      {
        name: 'CryptoCompare',
        url: 'https://min-api.cryptocompare.com/data/price?fsym=BTC&tsyms=USD',
        parseResponse: (data: any) => data.USD,
      },
      {
        name: 'Bitfinex',
        url: 'https://api-pub.bitfinex.com/v2/ticker/tBTCUSD',
        parseResponse: (data: any) => data[6], // Last price
      },
      {
        name: 'Huobi',
        url: 'https://api.huobi.pro/market/detail/merged?symbol=btcusdt',
        parseResponse: (data: any) => data.tick.close,
      },
      {
        name: 'OKX',
        url: 'https://www.okx.com/api/v5/market/ticker?instId=BTC-USDT',
        parseResponse: (data: any) => parseFloat(data.data[0].last),
      },
      {
        name: 'Bybit',
        url: 'https://api.bybit.com/v2/public/tickers?symbol=BTCUSDT',
        parseResponse: (data: any) => parseFloat(data.result[0].last_price),
      },
    ]);

    // ETH/USD - 10 sources
    this.sources.set('ETH/USD', [
      {
        name: 'Binance',
        url: 'https://api.binance.com/api/v3/ticker/price?symbol=ETHUSDT',
        parseResponse: (data: any) => parseFloat(data.price),
      },
      {
        name: 'Coinbase',
        url: 'https://api.coinbase.com/v2/prices/ETH-USD/spot',
        parseResponse: (data: any) => parseFloat(data.data.amount),
      },
      {
        name: 'Kraken',
        url: 'https://api.kraken.com/0/public/Ticker?pair=ETHUSD',
        parseResponse: (data: any) => parseFloat(data.result.XETHZUSD.c[0]),
      },
      {
        name: 'KuCoin',
        url: 'https://api.kucoin.com/api/v1/market/orderbook/level1?symbol=ETH-USDT',
        parseResponse: (data: any) => parseFloat(data.data.price),
      },
      {
        name: 'CoinGecko',
        url: 'https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd',
        parseResponse: (data: any) => data.ethereum.usd,
      },
      {
        name: 'CryptoCompare',
        url: 'https://min-api.cryptocompare.com/data/price?fsym=ETH&tsyms=USD',
        parseResponse: (data: any) => data.USD,
      },
      {
        name: 'Bitfinex',
        url: 'https://api-pub.bitfinex.com/v2/ticker/tETHUSD',
        parseResponse: (data: any) => data[6],
      },
      {
        name: 'Huobi',
        url: 'https://api.huobi.pro/market/detail/merged?symbol=ethusdt',
        parseResponse: (data: any) => data.tick.close,
      },
      {
        name: 'OKX',
        url: 'https://www.okx.com/api/v5/market/ticker?instId=ETH-USDT',
        parseResponse: (data: any) => parseFloat(data.data[0].last),
      },
      {
        name: 'Bybit',
        url: 'https://api.bybit.com/v2/public/tickers?symbol=ETHUSDT',
        parseResponse: (data: any) => parseFloat(data.result[0].last_price),
      },
    ]);

    // NEAR/USD - 10 sources
    this.sources.set('NEAR/USD', [
      {
        name: 'Binance',
        url: 'https://api.binance.com/api/v3/ticker/price?symbol=NEARUSDT',
        parseResponse: (data: any) => parseFloat(data.price),
      },
      {
        name: 'Coinbase',
        url: 'https://api.coinbase.com/v2/prices/NEAR-USD/spot',
        parseResponse: (data: any) => parseFloat(data.data.amount),
      },
      {
        name: 'KuCoin',
        url: 'https://api.kucoin.com/api/v1/market/orderbook/level1?symbol=NEAR-USDT',
        parseResponse: (data: any) => parseFloat(data.data.price),
      },
      {
        name: 'CoinGecko',
        url: 'https://api.coingecko.com/api/v3/simple/price?ids=near&vs_currencies=usd',
        parseResponse: (data: any) => data.near.usd,
      },
      {
        name: 'CryptoCompare',
        url: 'https://min-api.cryptocompare.com/data/price?fsym=NEAR&tsyms=USD',
        parseResponse: (data: any) => data.USD,
      },
      {
        name: 'Bitfinex',
        url: 'https://api-pub.bitfinex.com/v2/ticker/tNEARUSD',
        parseResponse: (data: any) => data[6],
      },
      {
        name: 'Huobi',
        url: 'https://api.huobi.pro/market/detail/merged?symbol=nearusdt',
        parseResponse: (data: any) => data.tick.close,
      },
      {
        name: 'OKX',
        url: 'https://www.okx.com/api/v5/market/ticker?instId=NEAR-USDT',
        parseResponse: (data: any) => parseFloat(data.data[0].last),
      },
      {
        name: 'MEXC',
        url: 'https://api.mexc.com/api/v3/ticker/price?symbol=NEARUSDT',
        parseResponse: (data: any) => parseFloat(data.price),
      },
      {
        name: 'Gate.io',
        url: 'https://api.gateio.ws/api/v4/spot/tickers?currency_pair=NEAR_USDT',
        parseResponse: (data: any) => parseFloat(data[0].last),
      },
    ]);

    // Initialize source status for all sources
    for (const [asset, sources] of this.sources.entries()) {
      for (const source of sources) {
        const key = `${asset}-${source.name}`;
        this.sourceStatus.set(key, {
          name: source.name,
          isActive: true,
          lastSuccess: 0,
          lastFailure: 0,
          successRate: 1.0,
          averageResponseTime: 0,
        });
      }
    }
  }

  /**
   * Fetch price from a single source with timeout and error handling
   */
  private async fetchPriceFromSource(
    source: PriceSource,
    asset: string,
    timeout: number = 5000
  ): Promise<number | null> {
    const startTime = Date.now();
    const key = `${asset}-${source.name}`;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const response = await fetch(source.url, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'NEARacles-Oracle/1.0',
        },
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      const price = source.parseResponse(data);

      // Update source status
      const status = this.sourceStatus.get(key);
      if (status) {
        status.lastSuccess = Date.now();
        status.isActive = true;
        const responseTime = Date.now() - startTime;
        status.averageResponseTime =
          status.averageResponseTime === 0
            ? responseTime
            : (status.averageResponseTime + responseTime) / 2;
      }

      return price;
    } catch (error) {
      const status = this.sourceStatus.get(key);
      if (status) {
        status.lastFailure = Date.now();
        // Deactivate source if it fails multiple times
        if (Date.now() - status.lastSuccess > 3600000) {
          // 1 hour
          status.isActive = false;
        }
      }

      console.error(`Failed to fetch price from ${source.name} for ${asset}:`, error);
      return null;
    }
  }

  /**
   * Aggregate price from multiple sources
   */
  async aggregatePrice(asset: string, minSources: number = 5): Promise<AggregatedPrice> {
    const sources = this.sources.get(asset);
    if (!sources) {
      throw new Error(`No price sources configured for asset: ${asset}`);
    }

    console.log(`Aggregating price for ${asset} from ${sources.length} sources...`);

    // Fetch from all sources in parallel
    const pricePromises = sources.map((source) => this.fetchPriceFromSource(source, asset));
    const results = await Promise.all(pricePromises);

    // Filter out failed requests
    const prices: number[] = results.filter((price): price is number => price !== null);

    console.log(`Successfully fetched ${prices.length}/${sources.length} prices for ${asset}`);

    if (prices.length < minSources) {
      throw new Error(
        `Insufficient price sources for ${asset}: only ${prices.length}/${minSources} available`
      );
    }

    // Sort prices for median calculation
    const sortedPrices = [...prices].sort((a, b) => a - b);

    // Calculate median (most robust against outliers)
    const medianIndex = Math.floor(sortedPrices.length / 2);
    const median =
      sortedPrices.length % 2 === 0
        ? (sortedPrices[medianIndex - 1] + sortedPrices[medianIndex]) / 2
        : sortedPrices[medianIndex];

    // Calculate mean
    const mean = prices.reduce((sum, price) => sum + price, 0) / prices.length;

    // Calculate trimmed mean (remove top 10% and bottom 10%)
    const trimAmount = Math.floor(prices.length * 0.1);
    const trimmedPrices =
      trimAmount > 0
        ? sortedPrices.slice(trimAmount, sortedPrices.length - trimAmount)
        : sortedPrices;
    const trimmedMean =
      trimmedPrices.reduce((sum, price) => sum + price, 0) / trimmedPrices.length;

    // Calculate confidence based on price spread
    const maxPrice = Math.max(...prices);
    const minPrice = Math.min(...prices);
    const spread = (maxPrice - minPrice) / median;
    const confidence = Math.max(0, Math.min(1, 1 - spread));

    const aggregatedPrice: AggregatedPrice = {
      asset,
      median,
      mean,
      trimmedMean,
      prices,
      sources: prices.length,
      confidence,
      timestamp: Date.now(),
    };

    // Update metrics
    this.updateMetrics(aggregatedPrice);

    console.log(`Price aggregation for ${asset}:`);
    console.log(`  Median: $${median.toFixed(2)}`);
    console.log(`  Mean: $${mean.toFixed(2)}`);
    console.log(`  Trimmed Mean: $${trimmedMean.toFixed(2)}`);
    console.log(`  Sources: ${prices.length}`);
    console.log(`  Confidence: ${(confidence * 100).toFixed(2)}%`);
    console.log(`  Spread: ${(spread * 100).toFixed(2)}%`);

    return aggregatedPrice;
  }

  /**
   * Update aggregator metrics
   */
  private updateMetrics(aggregatedPrice: AggregatedPrice): void {
    this.metrics.totalUpdates++;
    this.metrics.successfulUpdates++;
    this.metrics.lastUpdateTime = aggregatedPrice.timestamp;

    // Update average confidence
    this.metrics.averageConfidence =
      (this.metrics.averageConfidence * (this.metrics.totalUpdates - 1) +
        aggregatedPrice.confidence) /
      this.metrics.totalUpdates;

    // Update asset-specific metrics
    const assetKey = aggregatedPrice.asset;
    let assetMetrics = this.metrics.assetMetrics.get(assetKey);

    if (!assetMetrics) {
      assetMetrics = {
        asset: aggregatedPrice.asset,
        totalFetches: 0,
        successfulFetches: 0,
        averagePrice: 0,
        priceVolatility: 0,
        lastPrice: 0,
        lastUpdateTime: 0,
      };
      this.metrics.assetMetrics.set(assetKey, assetMetrics);
    }

    assetMetrics.totalFetches++;
    assetMetrics.successfulFetches++;
    assetMetrics.lastPrice = aggregatedPrice.median;
    assetMetrics.lastUpdateTime = aggregatedPrice.timestamp;

    // Update average price
    assetMetrics.averagePrice =
      (assetMetrics.averagePrice * (assetMetrics.successfulFetches - 1) +
        aggregatedPrice.median) /
      assetMetrics.successfulFetches;

    // Calculate volatility (simple standard deviation approximation)
    if (assetMetrics.successfulFetches > 1) {
      const priceDiff = Math.abs(aggregatedPrice.median - assetMetrics.averagePrice);
      assetMetrics.priceVolatility =
        (assetMetrics.priceVolatility * (assetMetrics.successfulFetches - 1) + priceDiff) /
        assetMetrics.successfulFetches;
    }
  }

  /**
   * Get aggregator metrics
   */
  getMetrics(): PriceAggregatorMetrics {
    return { ...this.metrics };
  }

  /**
   * Get source status for all sources
   */
  getSourceStatus(): Map<string, APISourceStatus> {
    return new Map(this.sourceStatus);
  }

  /**
   * Get supported assets
   */
  getSupportedAssets(): string[] {
    return Array.from(this.sources.keys());
  }

  /**
   * Get source count for an asset
   */
  getSourceCount(asset: string): number {
    return this.sources.get(asset)?.length || 0;
  }
}
