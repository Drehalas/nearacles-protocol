/**
 * Price Oracle Type Definitions
 * Defines interfaces for multi-source price aggregation and Pyth-compatible data
 */

export interface PriceSource {
  name: string;
  url: string;
  parseResponse: (data: any) => number;
  weight?: number; // Optional weight for weighted average
}

export interface AggregatedPrice {
  asset: string;
  median: number;
  mean: number;
  trimmedMean: number;
  prices: number[];
  sources: number;
  confidence: number; // 0-1, based on price spread
  timestamp: number;
}

export interface PriceData {
  asset_id: string;
  price: string; // u128 as string (8 decimal precision)
  confidence: string; // u64 as string
  expo: number; // i32, usually -8
  publish_time: number; // u64, milliseconds
}

export interface PriceFeedConfig {
  asset: string;
  sources: PriceSource[];
  updateInterval: number; // milliseconds
  minSources: number; // minimum successful sources required
  maxPriceAge: number; // milliseconds
}

export interface PriceUpdateResult {
  asset: string;
  success: boolean;
  transactionHash?: string;
  error?: string;
  priceData?: PriceData;
}

export interface PriceAggregatorMetrics {
  totalUpdates: number;
  successfulUpdates: number;
  failedUpdates: number;
  averageConfidence: number;
  lastUpdateTime: number;
  assetMetrics: Map<string, AssetMetrics>;
}

export interface AssetMetrics {
  asset: string;
  totalFetches: number;
  successfulFetches: number;
  averagePrice: number;
  priceVolatility: number;
  lastPrice: number;
  lastUpdateTime: number;
}

export interface APISourceStatus {
  name: string;
  isActive: boolean;
  lastSuccess: number;
  lastFailure: number;
  successRate: number;
  averageResponseTime: number;
}
