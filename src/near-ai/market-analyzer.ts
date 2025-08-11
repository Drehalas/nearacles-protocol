/**
 * Market Analyzer for AI-powered Market Analysis
 * Advanced market data analysis and trend prediction
 */

import { 
  AIAgentConfig,
  MarketData,
  TechnicalIndicators,
  MarketAnalysisResult,
  SentimentAnalysisResult,
  AIResponse,
  AIError 
} from './types';
import { getCurrentTimestamp, retry } from '../utils/helpers';

export class MarketAnalyzer {
  private config: AIAgentConfig;
  private dataCache: Map<string, { data: MarketData; timestamp: number }> = new Map();
  private analysisCache: Map<string, { analysis: MarketAnalysisResult; timestamp: number }> = new Map();
  private readonly CACHE_TTL = 300; // 5 minutes

  constructor(config: AIAgentConfig) {
    this.config = config;
  }

  /**
   * Analyze market conditions for an asset pair
   */
  async analyzeMarket(assetIn: string, assetOut: string): Promise<AIResponse<MarketAnalysisResult>> {
    const assetPair = `${assetIn}/${assetOut}`;
    const cacheKey = assetPair;
    
    try {
      // Check cache first
      const cached = this.getCachedAnalysis(cacheKey);
      if (cached) {
        return { success: true, data: cached };
      }

      // Fetch market data
      const marketData = await this.fetchMarketData(assetIn, assetOut);
      if (!marketData.success) {
        return { success: false, error: marketData.error! };
      }

      // Calculate technical indicators
      const technicalIndicators = await this.calculateTechnicalIndicators(marketData.data!);
      
      // Get sentiment analysis
      const sentimentResult = await this.getSentimentAnalysis(assetIn, assetOut);
      const sentimentScore = sentimentResult.success ? sentimentResult.data!.overall_sentiment : 0.5;

      // Perform comprehensive analysis
      const analysis = await this.performMarketAnalysis(
        assetPair,
        marketData.data!,
        technicalIndicators,
        sentimentScore
      );

      // Cache the result
      this.cacheAnalysis(cacheKey, analysis);

      return {
        success: true,
        data: analysis,
        metadata: {
          model_used: this.config.model.name,
          tokens_consumed: 150,
          processing_time: 1200,
          confidence: analysis.confidence,
        },
      };

    } catch (error) {
      const aiError: AIError = {
        code: 'MARKET_ANALYSIS_FAILED',
        message: error instanceof Error ? error.message : 'Failed to analyze market',
        model: this.config.model.name,
        severity: 'medium',
        timestamp: getCurrentTimestamp(),
      };

      return { success: false, error: aiError };
    }
  }

  /**
   * Fetch market data from external sources
   */
  private async fetchMarketData(assetIn: string, assetOut: string): Promise<AIResponse<MarketData>> {
    try {
      // In production, this would integrate with:
      // - CoinGecko API
      // - CoinMarketCap API
      // - DEX APIs (Ref Finance, etc.)
      // - Price oracles (Chainlink, Flux, Pyth)

      const mockData: MarketData = {
        asset_pair: `${assetIn}/${assetOut}`,
        price: this.generateMockPrice(assetIn, assetOut),
        volume_24h: this.generateMockVolume(),
        price_change_24h: Math.random() * 20 - 10, // -10% to +10%
        price_change_7d: Math.random() * 50 - 25, // -25% to +25%
        market_cap: this.generateMockMarketCap(assetIn),
        liquidity_score: Math.random() * 0.5 + 0.5, // 0.5 to 1.0
        volatility_index: Math.random() * 0.8 + 0.1, // 0.1 to 0.9
        timestamp: getCurrentTimestamp(),
      };

      return { success: true, data: mockData };

    } catch (error) {
      const aiError: AIError = {
        code: 'MARKET_DATA_FETCH_FAILED',
        message: error instanceof Error ? error.message : 'Failed to fetch market data',
        model: this.config.model.name,
        severity: 'high',
        timestamp: getCurrentTimestamp(),
      };

      return { success: false, error: aiError };
    }
  }

  /**
   * Calculate technical indicators
   */
  private async calculateTechnicalIndicators(marketData: MarketData): Promise<TechnicalIndicators> {
    // Mock technical indicators calculation
    // In production, this would use historical price data to calculate real indicators

    const basePrice = parseFloat(marketData.price);
    const volatility = marketData.volatility_index;

    return {
      rsi: 30 + Math.random() * 40, // 30-70 range
      macd: {
        signal: (Math.random() - 0.5) * 0.1,
        histogram: (Math.random() - 0.5) * 0.05,
        macd: (Math.random() - 0.5) * 0.08,
      },
      bollinger_bands: {
        upper: basePrice * (1 + volatility * 0.1),
        middle: basePrice,
        lower: basePrice * (1 - volatility * 0.1),
      },
      moving_averages: {
        sma_20: basePrice * (0.98 + Math.random() * 0.04),
        sma_50: basePrice * (0.95 + Math.random() * 0.1),
        ema_12: basePrice * (0.99 + Math.random() * 0.02),
        ema_26: basePrice * (0.97 + Math.random() * 0.06),
      },
      support_resistance: {
        support_levels: [
          basePrice * 0.95,
          basePrice * 0.90,
          basePrice * 0.85,
        ],
        resistance_levels: [
          basePrice * 1.05,
          basePrice * 1.10,
          basePrice * 1.15,
        ],
      },
    };
  }

  /**
   * Get sentiment analysis for asset pair
   */
  private async getSentimentAnalysis(assetIn: string, assetOut: string): Promise<AIResponse<SentimentAnalysisResult>> {
    try {
      // Mock sentiment analysis
      // In production, this would analyze:
      // - Social media sentiment (Twitter, Reddit, Telegram)
      // - News sentiment
      // - Developer activity (GitHub)
      // - Community metrics

      const sentimentResult: SentimentAnalysisResult = {
        asset: `${assetIn}/${assetOut}`,
        overall_sentiment: 0.3 + Math.random() * 0.4, // 0.3 to 0.7
        sentiment_trend: Math.random() > 0.5 ? 'improving' : 'declining',
        sentiment_breakdown: {
          positive: 0.4 + Math.random() * 0.3,
          negative: 0.1 + Math.random() * 0.3,
          neutral: 0.3 + Math.random() * 0.2,
        },
        key_themes: [
          'DeFi adoption',
          'Market volatility',
          'Institutional interest',
          'Regulatory clarity',
        ],
        influencer_sentiment: 0.5 + Math.random() * 0.3,
        news_sentiment: 0.4 + Math.random() * 0.4,
        social_volume: Math.random() * 1000,
        analysis_period: {
          start: getCurrentTimestamp() - 86400, // 24 hours ago
          end: getCurrentTimestamp(),
        },
      };

      return { success: true, data: sentimentResult };

    } catch (error) {
      const aiError: AIError = {
        code: 'SENTIMENT_ANALYSIS_FAILED',
        message: error instanceof Error ? error.message : 'Failed to analyze sentiment',
        model: this.config.model.name,
        severity: 'medium',
        timestamp: getCurrentTimestamp(),
      };

      return { success: false, error: aiError };
    }
  }

  /**
   * Perform comprehensive market analysis
   */
  private async performMarketAnalysis(
    assetPair: string,
    marketData: MarketData,
    technicalIndicators: TechnicalIndicators,
    sentimentScore: number
  ): Promise<MarketAnalysisResult> {
    const reasoning: string[] = [];
    let trendDirection: 'bullish' | 'bearish' | 'neutral' = 'neutral';
    let strengthScore = 0.5;
    let recommendedAction: 'buy' | 'sell' | 'hold' | 'wait' = 'hold';
    let confidence = 0.6;

    // Price trend analysis
    if (marketData.price_change_24h > 5) {
      trendDirection = 'bullish';
      strengthScore += 0.2;
      reasoning.push(`Strong 24h price increase of ${marketData.price_change_24h.toFixed(2)}%`);
    } else if (marketData.price_change_24h < -5) {
      trendDirection = 'bearish';
      strengthScore -= 0.2;
      reasoning.push(`Significant 24h price decline of ${marketData.price_change_24h.toFixed(2)}%`);
    }

    // Technical indicators analysis
    if (technicalIndicators.rsi < 30) {
      recommendedAction = 'buy';
      reasoning.push(`RSI indicates oversold conditions (${technicalIndicators.rsi.toFixed(1)})`);
      confidence += 0.1;
    } else if (technicalIndicators.rsi > 70) {
      recommendedAction = 'sell';
      reasoning.push(`RSI indicates overbought conditions (${technicalIndicators.rsi.toFixed(1)})`);
      confidence += 0.1;
    }

    // MACD analysis
    if (technicalIndicators.macd.macd > technicalIndicators.macd.signal) {
      if (trendDirection !== 'bearish') {
        trendDirection = 'bullish';
        reasoning.push('MACD shows bullish momentum');
        strengthScore += 0.1;
      }
    } else {
      if (trendDirection !== 'bullish') {
        trendDirection = 'bearish';
        reasoning.push('MACD shows bearish momentum');
        strengthScore -= 0.1;
      }
    }

    // Moving averages analysis
    const currentPrice = parseFloat(marketData.price);
    if (currentPrice > technicalIndicators.moving_averages.sma_20 && 
        technicalIndicators.moving_averages.sma_20 > technicalIndicators.moving_averages.sma_50) {
      reasoning.push('Price above key moving averages (bullish structure)');
      if (recommendedAction === 'hold') recommendedAction = 'buy';
      confidence += 0.1;
    }

    // Volatility analysis
    if (marketData.volatility_index > 0.7) {
      reasoning.push(`High volatility detected (${(marketData.volatility_index * 100).toFixed(1)}%) - exercise caution`);
      confidence -= 0.1;
      if (recommendedAction === 'buy') recommendedAction = 'wait';
    }

    // Liquidity analysis
    if (marketData.liquidity_score < 0.6) {
      reasoning.push(`Low liquidity (${(marketData.liquidity_score * 100).toFixed(1)}%) may impact execution`);
      confidence -= 0.15;
      if (recommendedAction === 'buy') recommendedAction = 'wait';
    }

    // Sentiment integration
    if (sentimentScore > 0.7) {
      reasoning.push(`Very positive market sentiment (${(sentimentScore * 100).toFixed(1)}%)`);
      confidence += 0.1;
    } else if (sentimentScore < 0.3) {
      reasoning.push(`Negative market sentiment (${(sentimentScore * 100).toFixed(1)}%)`);
      confidence -= 0.1;
    }

    // Final adjustments
    strengthScore = Math.max(0, Math.min(1, strengthScore));
    confidence = Math.max(0.1, Math.min(0.95, confidence));

    // Time horizon determination
    let timeHorizon: 'immediate' | 'short' | 'medium' | 'long' = 'short';
    if (marketData.volatility_index > 0.6) {
      timeHorizon = 'immediate';
    } else if (trendDirection === 'bullish' || trendDirection === 'bearish') {
      timeHorizon = 'medium';
    }

    return {
      asset_pair: assetPair,
      market_data: marketData,
      technical_indicators: technicalIndicators,
      sentiment_score: sentimentScore,
      trend_direction: trendDirection,
      strength_score: strengthScore,
      recommended_action: recommendedAction,
      confidence,
      reasoning,
      time_horizon: timeHorizon,
      analysis_timestamp: getCurrentTimestamp(),
    };
  }

  /**
   * Update configuration
   */
  updateConfig(config: AIAgentConfig): void {
    this.config = config;
  }

  /**
   * Helper: Get cached analysis
   */
  private getCachedAnalysis(key: string): MarketAnalysisResult | null {
    const cached = this.analysisCache.get(key);
    if (cached && (getCurrentTimestamp() - cached.timestamp) < this.CACHE_TTL) {
      return cached.analysis;
    }
    return null;
  }

  /**
   * Helper: Cache analysis result
   */
  private cacheAnalysis(key: string, analysis: MarketAnalysisResult): void {
    this.analysisCache.set(key, {
      analysis,
      timestamp: getCurrentTimestamp(),
    });
  }

  /**
   * Helper: Generate mock price
   */
  private generateMockPrice(assetIn: string, assetOut: string): string {
    const basePrices: { [key: string]: number } = {
      'NEAR': 4.50,
      'USDC': 1.00,
      'USDT': 1.00,
      'WETH': 2500,
      'DAI': 1.00,
      'REF': 0.15,
    };

    const inPrice = basePrices[assetIn] || 1;
    const outPrice = basePrices[assetOut] || 1;
    const rate = inPrice / outPrice;
    
    // Add some randomness
    const variation = 1 + (Math.random() - 0.5) * 0.1; // ±5%
    return (rate * variation).toFixed(6);
  }

  /**
   * Helper: Generate mock volume
   */
  private generateMockVolume(): string {
    const baseVolume = 100000 + Math.random() * 900000; // 100K to 1M
    return baseVolume.toFixed(0);
  }

  /**
   * Helper: Generate mock market cap
   */
  private generateMockMarketCap(asset: string): string {
    const baseMarketCaps: { [key: string]: number } = {
      'NEAR': 5000000000, // 5B
      'USDC': 50000000000, // 50B
      'USDT': 80000000000, // 80B
      'WETH': 300000000000, // 300B
      'DAI': 10000000000, // 10B
      'REF': 50000000, // 50M
    };

    const baseCap = baseMarketCaps[asset] || 1000000; // 1M default
    const variation = 1 + (Math.random() - 0.5) * 0.2; // ±10%
    return (baseCap * variation).toFixed(0);
  }
}
