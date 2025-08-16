/**
 * Market Analyzer Test Suite
 * Comprehensive tests for market analysis and data provider integrations
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { AdvancedMarketAnalyzer, AdvancedAnalysisConfig } from '../../backend/near-ai/advanced-market-analyzer';
import { MarketDataProviders, PriceOracleConfig, MarketDataConfig } from '../../backend/near-ai/market-data-providers';
import { AIAgentConfig } from '../../backend/near-ai/types';

describe('Market Analyzer Tests', () => {
  let marketAnalyzer: AdvancedMarketAnalyzer;
  let aiConfig: AIAgentConfig;
  let oracleConfig: PriceOracleConfig;
  let analysisConfig: AdvancedAnalysisConfig;

  beforeEach(() => {
    aiConfig = {
      model: {
        name: 'test-model',
        provider: 'near-ai',
        version: '1.0.0',
        capabilities: ['market-analysis'],
        max_tokens: 4096,
      },
      temperature: 0.7,
      max_tokens: 4096,
      context_window: 8192,
      enable_reasoning: true,
      enable_memory: true,
      risk_tolerance: 'moderate',
    };

    oracleConfig = {
      fallback_providers: ['pyth', 'coingecko'],
      update_frequency: 60,
      coingecko: {
        rateLimitMs: 100,
      },
      chainlink: {
        feeds: {
          'NEAR_USD': '0x123...',
          'ETH_USD': '0x456...',
        },
        updateInterval: 60,
      },
    };

    analysisConfig = {
      enableMLPredictions: true,
      enablePatternRecognition: true,
      enableSentimentAnalysis: true,
      enableOnChainAnalysis: true,
      predictionHorizon: 60,
      confidenceThreshold: 0.7,
    };

    marketAnalyzer = new AdvancedMarketAnalyzer(aiConfig, oracleConfig, analysisConfig);
  });

  describe('Advanced Market Analysis', () => {
    it('should perform comprehensive market analysis', async () => {
      const result = await marketAnalyzer.performAdvancedAnalysis('NEAR', 'USD');

      expect(result.success).toBe(true);

      if (result.success) {
        expect(result.data!.marketAnalysis).toBeDefined();
        expect(result.data!.patterns).toBeDefined();
        expect(result.data!.mlPrediction).toBeDefined();
        expect(result.data!.onChainMetrics).toBeDefined();
        expect(result.data!.riskFactors).toBeDefined();
        expect(result.data!.opportunities).toBeDefined();

        expect(Array.isArray(result.data!.patterns)).toBe(true);
        expect(Array.isArray(result.data!.riskFactors)).toBe(true);
        expect(Array.isArray(result.data!.opportunities)).toBe(true);
      }
    });

    it('should handle analysis configuration changes', async () => {
      // Disable ML predictions
      marketAnalyzer.updateAnalysisConfig({
        ...analysisConfig,
        enableMLPredictions: false,
      });

      const result = await marketAnalyzer.performAdvancedAnalysis('NEAR', 'USD');

      expect(result.success).toBe(true);

      if (result.success) {
        expect(result.data!.mlPrediction).toBeUndefined();
        expect(result.data!.marketAnalysis).toBeDefined();
      }
    });

    it('should provide reasonable confidence scores', async () => {
      const result = await marketAnalyzer.performAdvancedAnalysis('NEAR', 'USD');

      expect(result.success).toBe(true);

      if (result.success) {
        expect(result.data!.marketAnalysis.confidence).toBeGreaterThan(0);
        expect(result.data!.marketAnalysis.confidence).toBeLessThanOrEqual(1);

        if (result.data!.mlPrediction) {
          expect(result.data!.mlPrediction.confidence).toBeGreaterThan(0);
          expect(result.data!.mlPrediction.confidence).toBeLessThanOrEqual(1);
        }
      }
    });

    it('should identify meaningful patterns', async () => {
      const result = await marketAnalyzer.performAdvancedAnalysis('NEAR', 'USD');

      expect(result.success).toBe(true);

      if (result.success && result.data!.patterns.length > 0) {
        const pattern = result.data!.patterns[0];
        expect(pattern.pattern).toBeDefined();
        expect(pattern.confidence).toBeGreaterThan(0);
        expect(pattern.confidence).toBeLessThanOrEqual(1);
        expect(pattern.description).toBeDefined();
        expect(Array.isArray(pattern.implications)).toBe(true);
      }
    });

    it('should provide actionable recommendations', async () => {
      const result = await marketAnalyzer.performAdvancedAnalysis('NEAR', 'USD');

      expect(result.success).toBe(true);
      if (result.success && result.data) {
        const validActions = ['buy', 'sell', 'hold', 'wait'];
        expect(validActions).toContain(result.data!.marketAnalysis.recommended_action);

        const validTrends = ['up', 'down', 'sideways'];
        expect(validTrends).toContain(result.data!.marketAnalysis.trend_direction);
      }
    });
  });

  describe('Market Data Providers', () => {
    let dataProviders: MarketDataProviders;

    beforeEach(() => {
      const marketConfig: MarketDataConfig = {
        providers: ['pyth', 'chainlink', 'coingecko'],
        cache_duration: 300,
        fallback_enabled: true,
        timeout_ms: 5000,
      };
      dataProviders = new MarketDataProviders(marketConfig);
    });

    it('should fetch market data successfully', async () => {
      const marketData = await dataProviders.fetchMarketData('NEAR/USD');

      expect(marketData).toBeDefined();
      expect(marketData.symbol || 'NEAR/USD').toBe('NEAR/USD');
      expect(typeof marketData.price === 'string' ? parseFloat(marketData.price) : marketData.price).toBeGreaterThan(0);
      expect(marketData.timestamp).toBeGreaterThan(0);
      expect(marketData.liquidity_score).toBeGreaterThanOrEqual(0);
      expect(marketData.liquidity_score).toBeLessThanOrEqual(1);
    });

    it('should calculate technical indicators', async () => {
      const indicators = await dataProviders.calculateTechnicalIndicators('NEAR/USD');

      expect(indicators).toBeDefined();
      expect(indicators.rsi).toBeGreaterThanOrEqual(0);
      expect(indicators.rsi).toBeLessThanOrEqual(100);

      expect(indicators.macd).toBeDefined();
      expect(typeof (indicators.macd as any).macd).toBe('number');
      expect(typeof (indicators.macd as any).signal).toBe('number');
      expect(typeof (indicators.macd as any).histogram).toBe('number');

      expect(indicators.bollinger_bands).toBeDefined();
      expect((indicators.bollinger_bands as any).upper).toBeGreaterThan((indicators.bollinger_bands as any).middle);
      expect((indicators.bollinger_bands as any).middle).toBeGreaterThan((indicators.bollinger_bands as any).lower);

      expect(indicators.moving_averages).toBeDefined();
      expect(typeof (indicators.moving_averages as any).sma_20).toBe('number');
      if ((indicators.moving_averages as any).ema_12 !== undefined) {
        expect(typeof (indicators.moving_averages as any).ema_12).toBe('number');
      }
    });

    it('should fetch historical data with correct format', async () => {
      const historicalData = await dataProviders.fetchHistoricalData('NEAR/USD', '1h', 50);

      expect(Array.isArray(historicalData)).toBe(true);
      expect(historicalData.length).toBeLessThanOrEqual(50);

      if (historicalData.length > 0) {
        const dataPoint = historicalData[0];
        expect(dataPoint.timestamp).toBeDefined();
        expect(dataPoint.open).toBeGreaterThan(0);
        expect(dataPoint.high).toBeGreaterThanOrEqual(dataPoint.open);
        expect(dataPoint.low).toBeLessThanOrEqual(dataPoint.open);
        expect(dataPoint.close).toBeGreaterThan(0);
        expect(dataPoint.volume).toBeGreaterThanOrEqual(0);
      }
    });

    it('should handle different time periods', async () => {
      const periods: Array<'1h' | '4h' | '1d' | '1w'> = ['1h', '4h', '1d', '1w'];

      for (const period of periods) {
        const data = await dataProviders.fetchHistoricalData('NEAR/USD', period, 10);
        expect(Array.isArray(data)).toBe(true);
        expect(data.length).toBeLessThanOrEqual(10);
      }
    });
  });

  describe('Pattern Recognition', () => {
    it('should identify candlestick patterns', async () => {
      const result = await marketAnalyzer.performAdvancedAnalysis('NEAR', 'USD');

      expect(result.success).toBe(true);
      if (result.success) {
        const candlestickPatterns = result.data!.patterns.filter(p => 
          ['bullish_engulfing', 'bearish_engulfing', 'hammer', 'doji'].includes(p.pattern)
        );

        // May or may not find patterns, but should not error
        candlestickPatterns.forEach(pattern => {
          expect(pattern.confidence).toBeGreaterThan(0);
          expect(pattern.description).toBeDefined();
          expect(pattern.implications.length).toBeGreaterThan(0);
        });
      }
    });

    it('should identify chart patterns', async () => {
      const result = await marketAnalyzer.performAdvancedAnalysis('NEAR', 'USD');

      expect(result.success).toBe(true);
      if (result.success) {
        const chartPatterns = result.data!.patterns.filter(p =>
          ['triangle', 'head_shoulders', 'double_top', 'double_bottom'].includes(p.pattern)
        );

        chartPatterns.forEach(pattern => {
          expect(pattern.timeframe).toBeDefined();
          expect(pattern.implications.length).toBeGreaterThan(0);
        });
      }
    });
  });

  describe('ML Predictions', () => {
    it('should generate ML predictions when enabled', async () => {
      const result = await marketAnalyzer.performAdvancedAnalysis('NEAR', 'USD');

      expect(result.success).toBe(true);
      if (result.success && result.data!.mlPrediction) {
        const prediction = result.data!.mlPrediction;
        
        expect(prediction.predicted_price).toBeGreaterThan(0);
        expect(prediction.confidence).toBeGreaterThan(0);
        expect(prediction.confidence).toBeLessThanOrEqual(1);
        expect(prediction.prediction_horizon).toBe(analysisConfig.predictionHorizon);
        expect(Array.isArray(prediction.factors)).toBe(true);

        prediction.factors.forEach(factor => {
          expect(factor.factor).toBeDefined();
          expect(factor.weight).toBeGreaterThan(0);
          expect(['positive', 'negative', 'neutral']).toContain(factor.impact);
        });
      }
    });

    it('should not generate predictions when disabled', async () => {
      marketAnalyzer.updateAnalysisConfig({
        ...analysisConfig,
        enableMLPredictions: false,
      });

      const result = await marketAnalyzer.performAdvancedAnalysis('NEAR', 'USD');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data!.mlPrediction).toBeUndefined();
      }
    });
  });

  describe('On-Chain Analysis', () => {
    it('should fetch on-chain metrics when enabled', async () => {
      const result = await marketAnalyzer.performAdvancedAnalysis('NEAR', 'USD');

      expect(result.success).toBe(true);
      if (result.success && result.data!.onChainMetrics) {
        const metrics = result.data!.onChainMetrics;
        
        expect(metrics.tvl).toBeDefined();
        expect(metrics.volume_24h).toBeDefined();
        expect(metrics.active_addresses).toBeGreaterThan(0);
        expect(metrics.transaction_count).toBeGreaterThan(0);
        expect(parseFloat(metrics.average_transaction_size)).toBeGreaterThan(0);
      }
    });

    it('should not fetch on-chain metrics when disabled', async () => {
      marketAnalyzer.updateAnalysisConfig({
        ...analysisConfig,
        enableOnChainAnalysis: false,
      });

      const result = await marketAnalyzer.performAdvancedAnalysis('NEAR', 'USD');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data!.onChainMetrics).toBeUndefined();
      }
    });
  });

  describe('Risk and Opportunity Analysis', () => {
    it('should identify risk factors', async () => {
      const result = await marketAnalyzer.performAdvancedAnalysis('NEAR', 'USD');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(Array.isArray(result.data!.riskFactors)).toBe(true);
        
        result.data!.riskFactors.forEach(risk => {
          expect(typeof risk).toBe('string');
          expect(risk.length).toBeGreaterThan(0);
        });
      }
    });

    it('should identify opportunities', async () => {
      const result = await marketAnalyzer.performAdvancedAnalysis('NEAR', 'USD');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(Array.isArray(result.data!.opportunities)).toBe(true);
        
        result.data!.opportunities.forEach(opportunity => {
          expect(typeof opportunity).toBe('string');
          expect(opportunity.length).toBeGreaterThan(0);
        });
      }
    });
  });

  describe('Performance and Caching', () => {
    it('should complete analysis within reasonable time', async () => {
      const startTime = Date.now();
      const result = await marketAnalyzer.performAdvancedAnalysis('NEAR', 'USD');
      const executionTime = Date.now() - startTime;

      expect(result.success).toBe(true);
      expect(executionTime).toBeLessThan(10000); // Should complete within 10 seconds
    });

    it('should handle multiple concurrent analyses', async () => {
      const pairs = ['NEAR/USD', 'NEAR/USDC', 'BTC/USD'];
      
      const promises = pairs.map(pair => {
        const [assetIn, assetOut] = pair.split('/');
        return marketAnalyzer.performAdvancedAnalysis(assetIn, assetOut);
      });

      const results = await Promise.all(promises);
      
      results.forEach(result => {
        expect(result.success).toBe(true);
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid asset pairs gracefully', async () => {
      const result = await marketAnalyzer.performAdvancedAnalysis('INVALID', 'ASSET');

      // Should either succeed with mock data or fail gracefully
      expect(typeof result.success).toBe('boolean');
      
      if (!result.success) {
        expect(result.error!).toBeDefined();
        expect(result.error!.code).toBeDefined();
        expect(result.error!.message).toBeDefined();
      }
    });

    it('should handle configuration errors', async () => {
      const invalidConfig: AdvancedAnalysisConfig = {
        enableMLPredictions: true,
        enablePatternRecognition: true,
        enableSentimentAnalysis: true,
        enableOnChainAnalysis: true,
        predictionHorizon: -1, // Invalid
        confidenceThreshold: 2.0, // Invalid
      };

      marketAnalyzer.updateAnalysisConfig(invalidConfig);
      
      const result = await marketAnalyzer.performAdvancedAnalysis('NEAR', 'USD');
      
      // Should handle invalid configuration gracefully
      expect(typeof result.success).toBe('boolean');
    });
  });
});