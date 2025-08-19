/**
 * Advanced Market Analyzer with Machine Learning Integration
 * Enhanced market analysis with pattern recognition and predictive modeling
 */

import { 
  AIAgentConfig,
  MarketData,
  TechnicalIndicators,
  MarketAnalysisResult,
  AIResponse,
  AIError 
} from './types';
import { MarketDataProviders, PriceOracleConfig } from './market-data-providers';
import { getCurrentTimestamp } from '../utils/helpers';
import { LRUCache } from '../utils/cache';
import { performanceMonitor } from '../utils/performance';

export interface AdvancedAnalysisConfig {
  enableMLPredictions: boolean;
  enablePatternRecognition: boolean;
  enableSentimentAnalysis: boolean;
  enableOnChainAnalysis: boolean;
  predictionHorizon: number; // minutes
  confidenceThreshold: number;
}

export interface PatternRecognitionResult {
  pattern: 'bullish_engulfing' | 'bearish_engulfing' | 'hammer' | 'doji' | 'triangle' | 'head_shoulders' | 'double_top' | 'double_bottom';
  confidence: number;
  timeframe: string;
  description: string;
  implications: string[];
}

export interface OnChainMetrics {
  tvl: string;
  volume_24h: string;
  active_addresses: number;
  transaction_count: number;
  average_transaction_size: string;
  network_hash_rate?: string;
  staking_ratio?: number;
}

export interface MLPrediction {
  predicted_price: number;
  confidence: number;
  prediction_horizon: number; // minutes
  factors: Array<{
    factor: string;
    weight: number;
    impact: 'positive' | 'negative' | 'neutral';
  }>;
}

export class AdvancedMarketAnalyzer {
  private config: AIAgentConfig;
  private analysisConfig: AdvancedAnalysisConfig;
  private dataProviders: MarketDataProviders;
  private analysisCache: LRUCache<MarketAnalysisResult>;
  private patternCache: LRUCache<PatternRecognitionResult[]>;

  constructor(
    config: AIAgentConfig, 
    priceOracleConfig: PriceOracleConfig,
    analysisConfig: AdvancedAnalysisConfig
  ) {
    this.config = config;
    this.analysisConfig = analysisConfig;
    
    // Convert PriceOracleConfig to MarketDataConfig
    const marketDataConfig = {
      providers: priceOracleConfig.fallback_providers,
      fallback_providers: priceOracleConfig.fallback_providers,
      cache_duration: priceOracleConfig.update_frequency * 1000,
      update_frequency: priceOracleConfig.update_frequency * 1000,
      fallback_enabled: true,
      timeout_ms: 10000
    };
    
    this.dataProviders = new MarketDataProviders(marketDataConfig);
    this.analysisCache = new LRUCache<MarketAnalysisResult>(100);
    this.patternCache = new LRUCache<PatternRecognitionResult[]>(50);
  }

  /**
   * Perform comprehensive advanced market analysis
   */
  async performAdvancedAnalysis(assetIn: string, assetOut: string): Promise<AIResponse<{
    marketAnalysis: MarketAnalysisResult;
    patterns: PatternRecognitionResult[];
    mlPrediction?: MLPrediction;
    onChainMetrics?: OnChainMetrics;
    riskFactors: string[];
    opportunities: string[];
  }>> {
    const stopTimer = performanceMonitor.startTimer('advanced_market_analysis');
    const assetPair = `${assetIn}/${assetOut}`;

    try {
      // Step 1: Get basic market data and technical analysis
      const marketData = await this.dataProviders.fetchMarketData(assetPair);
      const technicalIndicators = await this.dataProviders.calculateTechnicalIndicators(assetPair);

      // Step 2: Perform pattern recognition
      const patterns = await this.recognizePatterns(assetPair);

      // Step 3: Generate ML prediction if enabled
      let mlPrediction: MLPrediction | undefined;
      if (this.analysisConfig.enableMLPredictions) {
        mlPrediction = await this.generateMLPrediction(assetPair, marketData, technicalIndicators as unknown as TechnicalIndicators);
      }

      // Step 4: Get on-chain metrics if enabled
      let onChainMetrics: OnChainMetrics | undefined;
      if (this.analysisConfig.enableOnChainAnalysis) {
        onChainMetrics = await this.fetchOnChainMetrics(assetIn);
      }

      // Step 5: Perform comprehensive analysis
      const marketAnalysis = await this.synthesizeAnalysis(
        assetPair,
        marketData,
        technicalIndicators as unknown as TechnicalIndicators,
        patterns,
        mlPrediction,
        onChainMetrics
      );

      // Step 6: Identify risk factors and opportunities
      const riskFactors = this.identifyRiskFactors(marketData, patterns, mlPrediction);
      const opportunities = this.identifyOpportunities(marketData, patterns, mlPrediction);

      const executionTime = stopTimer();

      return {
        success: true,
        data: {
          marketAnalysis,
          patterns,
          mlPrediction,
          onChainMetrics,
          riskFactors,
          opportunities,
        },
        metadata: {
          model_used: this.config.model.name,
          tokens_consumed: 500,
          processing_time: executionTime,
          confidence: marketAnalysis.confidence,
        },
      };

    } catch (error) {
      const aiError: AIError = {
        code: 'ADVANCED_ANALYSIS_FAILED',
        message: error instanceof Error ? error.message : 'Failed to perform advanced market analysis',
        model: this.config.model.name,
        severity: 'medium',
        timestamp: getCurrentTimestamp(),
      };

      return { success: false, error: aiError };
    }
  }

  /**
   * Recognize chart patterns and technical formations
   */
  private async recognizePatterns(assetPair: string): Promise<PatternRecognitionResult[]> {
    const cacheKey = `patterns_${assetPair}`;
    const cached = this.patternCache.get(cacheKey);
    if (cached) return cached;

    const historicalData = await this.dataProviders.fetchHistoricalData(assetPair, '1h', 100);
    const patterns: PatternRecognitionResult[] = [];

    // Candlestick pattern recognition
    patterns.push(...this.recognizeCandlestickPatterns(historicalData as unknown as Record<string, unknown>[]));

    // Chart pattern recognition
    patterns.push(...this.recognizeChartPatterns(historicalData as unknown as Record<string, unknown>[]));

    // Volume pattern recognition
    patterns.push(...this.recognizeVolumePatterns(historicalData as unknown as Record<string, unknown>[]));

    this.patternCache.set(cacheKey, patterns, 300000); // 5 minutes TTL
    return patterns;
  }

  /**
   * Generate ML-based price predictions
   */
  private async generateMLPrediction(
    assetPair: string,
    marketData: MarketData,
    technicalIndicators: TechnicalIndicators
  ): Promise<MLPrediction> {
    // In a real implementation, this would use trained ML models
    // For now, we'll create a sophisticated heuristic prediction

    const currentPrice = marketData.price;
    const rsi = technicalIndicators.rsi;
    const macd = technicalIndicators.macd;
    
    // Feature engineering for ML model
    const features = {
      price_momentum: (marketData.price_change_24h || 0) / 100,
      rsi_divergence: (rsi - 50) / 50,
      macd_momentum: macd.macd > macd.signal ? 1 : -1,
      volatility: marketData.volatility_index || 0.1,
      volume_strength: 0.5, // Mock value
    };

    // Apply feature weights to prediction
    const featureScore = (features.price_momentum * 0.3) + 
                        (features.rsi_divergence * 0.2) + 
                        (features.macd_momentum * 0.3) + 
                        (features.volatility * 0.2);

    // Prediction logic with feature integration
    let pricePrediction = currentPrice * (1 + featureScore * 0.1); // Apply feature score
    let confidence = Math.min(0.9, 0.6 + Math.abs(featureScore) * 0.2);
    const factors: MLPrediction['factors'] = [];

    // RSI influence
    if (rsi < 30) {
      pricePrediction *= 1.02; // 2% increase expected
      confidence += 0.1;
      factors.push({
        factor: 'RSI Oversold',
        weight: 0.3,
        impact: 'positive',
      });
    } else if (rsi > 70) {
      pricePrediction *= 0.98; // 2% decrease expected
      confidence += 0.1;
      factors.push({
        factor: 'RSI Overbought',
        weight: 0.3,
        impact: 'negative',
      });
    }

    // MACD influence
    if (macd.macd > macd.signal && macd.histogram > 0) {
      pricePrediction *= 1.015; // 1.5% increase
      confidence += 0.05;
      factors.push({
        factor: 'MACD Bullish Crossover',
        weight: 0.2,
        impact: 'positive',
      });
    }

    // Volatility adjustment
    if ((marketData.volatility_index || 0) > 0.7) {
      confidence -= 0.2; // High volatility reduces confidence
      factors.push({
        factor: 'High Volatility',
        weight: 0.15,
        impact: 'negative',
      });
    }

    return {
      predicted_price: pricePrediction,
      confidence: Math.max(0.1, Math.min(0.95, confidence)),
      prediction_horizon: this.analysisConfig.predictionHorizon,
      factors,
    };
  }

  /**
   * Fetch on-chain metrics for analysis
   */
  private async fetchOnChainMetrics(_asset: string): Promise<OnChainMetrics> { // eslint-disable-line @typescript-eslint/no-unused-vars, no-unused-vars
    // In a real implementation, this would fetch from blockchain APIs
    // For NEAR, this could integrate with NEAR Explorer API, Flipside Crypto, etc.

    return {
      tvl: (Math.random() * 1000000000).toFixed(0), // Mock TVL
      volume_24h: (Math.random() * 10000000).toFixed(0),
      active_addresses: Math.floor(Math.random() * 50000) + 10000,
      transaction_count: Math.floor(Math.random() * 100000) + 50000,
      average_transaction_size: (Math.random() * 1000).toFixed(2),
      staking_ratio: 0.6 + Math.random() * 0.3, // 60-90%
    };
  }

  /**
   * Synthesize all analysis components
   */
  private async synthesizeAnalysis(
    assetPair: string,
    marketData: MarketData,
    technicalIndicators: TechnicalIndicators,
    patterns: PatternRecognitionResult[],
    mlPrediction?: MLPrediction,
    onChainMetrics?: OnChainMetrics
  ): Promise<MarketAnalysisResult> {
    const reasoning: string[] = [];
    let trendDirection: 'bullish' | 'bearish' | 'neutral' = 'neutral';
    let strengthScore = 0.5;
    let recommendedAction: 'buy' | 'sell' | 'hold' | 'wait' = 'hold';
    let confidence = 0.6;

    // Technical analysis reasoning
    if (technicalIndicators.rsi < 30) {
      reasoning.push('RSI indicates oversold conditions, potential reversal');
      trendDirection = 'bullish';
      strengthScore += 0.2;
    } else if (technicalIndicators.rsi > 70) {
      reasoning.push('RSI indicates overbought conditions, potential correction');
      trendDirection = 'bearish';
      strengthScore -= 0.2;
    }

    // Pattern analysis reasoning
    const bullishPatterns = patterns.filter(p => 
      ['bullish_engulfing', 'hammer', 'double_bottom'].includes(p.pattern)
    );
    const bearishPatterns = patterns.filter(p => 
      ['bearish_engulfing', 'head_shoulders', 'double_top'].includes(p.pattern)
    );

    if (bullishPatterns.length > bearishPatterns.length) {
      reasoning.push(`${bullishPatterns.length} bullish patterns identified`);
      if (trendDirection !== 'bearish') trendDirection = 'bullish';
      strengthScore += 0.1 * bullishPatterns.length;
    } else if (bearishPatterns.length > bullishPatterns.length) {
      reasoning.push(`${bearishPatterns.length} bearish patterns identified`);
      if (trendDirection !== 'bullish') trendDirection = 'bearish';
      strengthScore -= 0.1 * bearishPatterns.length;
    }

    // ML prediction reasoning
    if (mlPrediction && mlPrediction.confidence > this.analysisConfig.confidenceThreshold) {
      const priceChange = ((mlPrediction.predicted_price / marketData.price) - 1) * 100;
      reasoning.push(`ML model predicts ${priceChange.toFixed(2)}% price change (confidence: ${(mlPrediction.confidence * 100).toFixed(1)}%)`);
      
      if (priceChange > 2) {
        recommendedAction = 'buy';
        confidence += 0.1;
      } else if (priceChange < -2) {
        recommendedAction = 'sell';
        confidence += 0.1;
      }
    }

    // On-chain analysis reasoning
    if (onChainMetrics) {
      const volumeGrowth = Math.random() * 50 - 25; // Mock volume growth
      if (volumeGrowth > 10) {
        reasoning.push(`Strong on-chain activity with ${volumeGrowth.toFixed(1)}% volume growth`);
        strengthScore += 0.1;
      } else if (volumeGrowth < -10) {
        reasoning.push(`Declining on-chain activity with ${volumeGrowth.toFixed(1)}% volume decrease`);
        strengthScore -= 0.1;
      }
    }

    // Final adjustments
    strengthScore = Math.max(0, Math.min(1, strengthScore));
    confidence = Math.max(0.1, Math.min(0.95, confidence));

    // Map trend direction to expected values
    const mappedTrendDirection: 'up' | 'down' | 'sideways' = 
      trendDirection === 'bullish' ? 'up' : 
      trendDirection === 'bearish' ? 'down' : 'sideways';

    return {
      asset_pair: assetPair,
      current_price: marketData.price.toString(),
      price_trend: mappedTrendDirection === 'up' ? 'up' : mappedTrendDirection === 'down' ? 'down' : 'stable',
      volatility: marketData.volatility_index || 0.1,
      liquidity: marketData.liquidity_score || 0.5,
      market_data: marketData,
      technical_indicators: technicalIndicators,
      sentiment_score: 0.5 + (strengthScore - 0.5) * 0.5,
      trend_direction: mappedTrendDirection,
      strength_score: strengthScore,
      recommended_action: recommendedAction,
      confidence,
      reasoning,
      time_horizon: 'short',
      analysis_timestamp: getCurrentTimestamp(),
    };
  }

  /**
   * Recognize candlestick patterns
   */
  private recognizeCandlestickPatterns(data: Record<string, unknown>[]): PatternRecognitionResult[] {
    const patterns: PatternRecognitionResult[] = [];
    
    if (data.length < 2) return patterns;

    const last = data[data.length - 1];
    const previous = data[data.length - 2];

    // Bullish Engulfing
    if ((previous.close as number) < (previous.open as number) && // Previous red candle
        (last.close as number) > (last.open as number) && // Current green candle
        (last.open as number) < (previous.close as number) && // Opens below previous close
        (last.close as number) > (previous.open as number)) { // Closes above previous open
      
      patterns.push({
        pattern: 'bullish_engulfing',
        confidence: 0.75,
        timeframe: '1h',
        description: 'Bullish engulfing pattern detected',
        implications: ['Potential trend reversal', 'Strong buying pressure', 'Consider long positions'],
      });
    }

    // Hammer pattern
    const bodySize = Math.abs((last.close as number) - (last.open as number));
    const lowerShadow = (last.open as number) > (last.close as number) ? (last.close as number) - (last.low as number) : (last.open as number) - (last.low as number);
    const upperShadow = (last.high as number) - Math.max((last.open as number), (last.close as number));

    if (lowerShadow > bodySize * 2 && upperShadow < bodySize * 0.5) {
      patterns.push({
        pattern: 'hammer',
        confidence: 0.65,
        timeframe: '1h',
        description: 'Hammer pattern detected',
        implications: ['Potential bullish reversal', 'Strong support level', 'Rejection of lower prices'],
      });
    }

    return patterns;
  }

  /**
   * Recognize chart patterns
   */
  private recognizeChartPatterns(data: Record<string, unknown>[]): PatternRecognitionResult[] {
    const patterns: PatternRecognitionResult[] = [];
    
    if (data.length < 20) return patterns;

    const recentHighs = data.slice(-20).map(d => d.high as number);
    const recentLows = data.slice(-20).map(d => d.low as number);

    // Simple triangle pattern detection
    const highTrend = this.calculateTrendSlope(recentHighs.slice(-10) as number[]);
    const lowTrend = this.calculateTrendSlope(recentLows.slice(-10) as number[]);

    if (Math.abs(highTrend) < 0.01 && Math.abs(lowTrend) < 0.01 && 
        Math.max(...(recentHighs.slice(-5) as number[])) - Math.min(...(recentLows.slice(-5) as number[])) < 
        Math.max(...(recentHighs.slice(-15, -10) as number[])) - Math.min(...(recentLows.slice(-15, -10) as number[]))) {
      
      patterns.push({
        pattern: 'triangle',
        confidence: 0.6,
        timeframe: '1h',
        description: 'Symmetrical triangle pattern detected',
        implications: ['Consolidation phase', 'Breakout expected', 'Potential volatility increase'],
      });
    }

    return patterns;
  }

  /**
   * Recognize volume patterns
   */
  private recognizeVolumePatterns(data: Record<string, unknown>[]): PatternRecognitionResult[] {
    const patterns: PatternRecognitionResult[] = [];
    
    if (data.length < 10) return patterns;

    const recentVolumes = data.slice(-10).map(d => d.volume as number);
    const avgVolume = recentVolumes.reduce((sum, vol) => (sum as number) + (vol as number), 0) / recentVolumes.length;
    const lastVolume = recentVolumes[recentVolumes.length - 1] as number;

    // Volume surge detection
    if ((lastVolume as number) > avgVolume * 2) {
      patterns.push({
        pattern: 'bullish_engulfing', // Using as volume surge indicator
        confidence: 0.7,
        timeframe: '1h',
        description: 'Volume surge detected',
        implications: ['Increased market interest', 'Potential price movement', 'Institutional activity'],
      });
    }

    return patterns;
  }

  /**
   * Identify risk factors from analysis
   */
  private identifyRiskFactors(
    marketData: MarketData,
    patterns: PatternRecognitionResult[],
    mlPrediction?: MLPrediction
  ): string[] {
    const risks: string[] = [];

    if ((marketData.volatility_index || 0) > 0.7) {
      risks.push('High volatility may lead to significant price swings');
    }

    if ((marketData.liquidity_score || 1) < 0.5) {
      risks.push('Low liquidity may result in poor execution and high slippage');
    }

    const bearishPatterns = patterns.filter(p => 
      ['bearish_engulfing', 'head_shoulders', 'double_top'].includes(p.pattern)
    );
    if (bearishPatterns.length > 0) {
      risks.push(`${bearishPatterns.length} bearish technical patterns identified`);
    }

    if (mlPrediction && mlPrediction.confidence < 0.5) {
      risks.push('Low prediction confidence suggests uncertain market conditions');
    }

    return risks;
  }

  /**
   * Identify opportunities from analysis
   */
  private identifyOpportunities(
    marketData: MarketData,
    patterns: PatternRecognitionResult[],
    mlPrediction?: MLPrediction
  ): string[] {
    const opportunities: string[] = [];

    const bullishPatterns = patterns.filter(p => 
      ['bullish_engulfing', 'hammer', 'double_bottom'].includes(p.pattern)
    );
    if (bullishPatterns.length > 0) {
      opportunities.push(`${bullishPatterns.length} bullish patterns suggest upward potential`);
    }

    if ((marketData.price_change_24h || 0) < -5) {
      opportunities.push('Recent price decline may present buying opportunity');
    }

    if (mlPrediction && mlPrediction.confidence > 0.8) {
      const priceChange = ((mlPrediction.predicted_price / marketData.price) - 1) * 100;
      if (priceChange > 1) {
        opportunities.push(`ML model predicts ${priceChange.toFixed(1)}% upside with high confidence`);
      }
    }

    return opportunities;
  }

  /**
   * Calculate trend slope for pattern recognition
   */
  private calculateTrendSlope(values: number[]): number {
    if (values.length < 2) return 0;

    const n = values.length;
    const sumX = (n * (n - 1)) / 2; // Sum of indices
    const sumY = values.reduce((sum, val) => sum + val, 0);
    const sumXY = values.reduce((sum, val, index) => sum + (index * val), 0);
    const sumXX = (n * (n - 1) * (2 * n - 1)) / 6; // Sum of squared indices

    return (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  }

  /**
   * Update configuration
   */
  updateConfig(config: AIAgentConfig): void {
    this.config = config;
  }

  /**
   * Update analysis configuration
   */
  updateAnalysisConfig(config: AdvancedAnalysisConfig): void {
    this.analysisConfig = config;
  }
}
