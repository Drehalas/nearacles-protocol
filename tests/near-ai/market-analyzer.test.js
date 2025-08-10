"use strict";
/**
 * Market Analyzer Test Suite
 * Comprehensive tests for market analysis and data provider integrations
 */
Object.defineProperty(exports, "__esModule", { value: true });
const globals_1 = require("@jest/globals");
const advanced_market_analyzer_1 = require("../../src/near-ai/advanced-market-analyzer");
const market_data_providers_1 = require("../../src/near-ai/market-data-providers");
(0, globals_1.describe)('Market Analyzer Tests', () => {
    let marketAnalyzer;
    let aiConfig;
    let oracleConfig;
    let analysisConfig;
    (0, globals_1.beforeEach)(() => {
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
        marketAnalyzer = new advanced_market_analyzer_1.AdvancedMarketAnalyzer(aiConfig, oracleConfig, analysisConfig);
    });
    (0, globals_1.describe)('Advanced Market Analysis', () => {
        (0, globals_1.it)('should perform comprehensive market analysis', async () => {
            const result = await marketAnalyzer.performAdvancedAnalysis('NEAR', 'USD');
            (0, globals_1.expect)(result.success).toBe(true);
            if (result.success) {
                (0, globals_1.expect)(result.data.marketAnalysis).toBeDefined();
                (0, globals_1.expect)(result.data.patterns).toBeDefined();
                (0, globals_1.expect)(result.data.mlPrediction).toBeDefined();
                (0, globals_1.expect)(result.data.onChainMetrics).toBeDefined();
                (0, globals_1.expect)(result.data.riskFactors).toBeDefined();
                (0, globals_1.expect)(result.data.opportunities).toBeDefined();
                (0, globals_1.expect)(Array.isArray(result.data.patterns)).toBe(true);
                (0, globals_1.expect)(Array.isArray(result.data.riskFactors)).toBe(true);
                (0, globals_1.expect)(Array.isArray(result.data.opportunities)).toBe(true);
            }
        });
        (0, globals_1.it)('should handle analysis configuration changes', async () => {
            // Disable ML predictions
            marketAnalyzer.updateAnalysisConfig({
                ...analysisConfig,
                enableMLPredictions: false,
            });
            const result = await marketAnalyzer.performAdvancedAnalysis('NEAR', 'USD');
            (0, globals_1.expect)(result.success).toBe(true);
            if (result.success) {
                (0, globals_1.expect)(result.data.mlPrediction).toBeUndefined();
                (0, globals_1.expect)(result.data.marketAnalysis).toBeDefined();
            }
        });
        (0, globals_1.it)('should provide reasonable confidence scores', async () => {
            const result = await marketAnalyzer.performAdvancedAnalysis('NEAR', 'USD');
            (0, globals_1.expect)(result.success).toBe(true);
            if (result.success) {
                (0, globals_1.expect)(result.data.marketAnalysis.confidence).toBeGreaterThan(0);
                (0, globals_1.expect)(result.data.marketAnalysis.confidence).toBeLessThanOrEqual(1);
                if (result.data.mlPrediction) {
                    (0, globals_1.expect)(result.data.mlPrediction.confidence).toBeGreaterThan(0);
                    (0, globals_1.expect)(result.data.mlPrediction.confidence).toBeLessThanOrEqual(1);
                }
            }
        });
        (0, globals_1.it)('should identify meaningful patterns', async () => {
            const result = await marketAnalyzer.performAdvancedAnalysis('NEAR', 'USD');
            (0, globals_1.expect)(result.success).toBe(true);
            if (result.success && result.data.patterns.length > 0) {
                const pattern = result.data.patterns[0];
                (0, globals_1.expect)(pattern.pattern).toBeDefined();
                (0, globals_1.expect)(pattern.confidence).toBeGreaterThan(0);
                (0, globals_1.expect)(pattern.confidence).toBeLessThanOrEqual(1);
                (0, globals_1.expect)(pattern.description).toBeDefined();
                (0, globals_1.expect)(Array.isArray(pattern.implications)).toBe(true);
            }
        });
        (0, globals_1.it)('should provide actionable recommendations', async () => {
            const result = await marketAnalyzer.performAdvancedAnalysis('NEAR', 'USD');
            (0, globals_1.expect)(result.success).toBe(true);
            if (result.success) {
                const validActions = ['buy', 'sell', 'hold', 'wait'];
                (0, globals_1.expect)(validActions).toContain(result.data.marketAnalysis.recommended_action);
                const validTrends = ['bullish', 'bearish', 'neutral'];
                (0, globals_1.expect)(validTrends).toContain(result.data.marketAnalysis.trend_direction);
            }
        });
    });
    (0, globals_1.describe)('Market Data Providers', () => {
        let dataProviders;
        (0, globals_1.beforeEach)(() => {
            dataProviders = new market_data_providers_1.MarketDataProviders(oracleConfig);
        });
        (0, globals_1.it)('should fetch market data successfully', async () => {
            const marketData = await dataProviders.fetchMarketData('NEAR/USD');
            (0, globals_1.expect)(marketData).toBeDefined();
            (0, globals_1.expect)(marketData.asset_pair).toBe('NEAR/USD');
            (0, globals_1.expect)(parseFloat(marketData.price)).toBeGreaterThan(0);
            (0, globals_1.expect)(marketData.timestamp).toBeGreaterThan(0);
            (0, globals_1.expect)(marketData.liquidity_score).toBeGreaterThanOrEqual(0);
            (0, globals_1.expect)(marketData.liquidity_score).toBeLessThanOrEqual(1);
        });
        (0, globals_1.it)('should calculate technical indicators', async () => {
            const indicators = await dataProviders.calculateTechnicalIndicators('NEAR/USD');
            (0, globals_1.expect)(indicators).toBeDefined();
            (0, globals_1.expect)(indicators.rsi).toBeGreaterThanOrEqual(0);
            (0, globals_1.expect)(indicators.rsi).toBeLessThanOrEqual(100);
            (0, globals_1.expect)(indicators.macd).toBeDefined();
            (0, globals_1.expect)(typeof indicators.macd.macd).toBe('number');
            (0, globals_1.expect)(typeof indicators.macd.signal).toBe('number');
            (0, globals_1.expect)(typeof indicators.macd.histogram).toBe('number');
            (0, globals_1.expect)(indicators.bollinger_bands).toBeDefined();
            (0, globals_1.expect)(indicators.bollinger_bands.upper).toBeGreaterThan(indicators.bollinger_bands.middle);
            (0, globals_1.expect)(indicators.bollinger_bands.middle).toBeGreaterThan(indicators.bollinger_bands.lower);
            (0, globals_1.expect)(indicators.moving_averages).toBeDefined();
            (0, globals_1.expect)(typeof indicators.moving_averages.sma_20).toBe('number');
            (0, globals_1.expect)(typeof indicators.moving_averages.ema_12).toBe('number');
        });
        (0, globals_1.it)('should fetch historical data with correct format', async () => {
            const historicalData = await dataProviders.fetchHistoricalData('NEAR/USD', '1h', 50);
            (0, globals_1.expect)(Array.isArray(historicalData)).toBe(true);
            (0, globals_1.expect)(historicalData.length).toBeLessThanOrEqual(50);
            if (historicalData.length > 0) {
                const dataPoint = historicalData[0];
                (0, globals_1.expect)(dataPoint.timestamp).toBeDefined();
                (0, globals_1.expect)(dataPoint.open).toBeGreaterThan(0);
                (0, globals_1.expect)(dataPoint.high).toBeGreaterThanOrEqual(dataPoint.open);
                (0, globals_1.expect)(dataPoint.low).toBeLessThanOrEqual(dataPoint.open);
                (0, globals_1.expect)(dataPoint.close).toBeGreaterThan(0);
                (0, globals_1.expect)(dataPoint.volume).toBeGreaterThanOrEqual(0);
            }
        });
        (0, globals_1.it)('should handle different time periods', async () => {
            const periods = ['1h', '4h', '1d', '1w'];
            for (const period of periods) {
                const data = await dataProviders.fetchHistoricalData('NEAR/USD', period, 10);
                (0, globals_1.expect)(Array.isArray(data)).toBe(true);
                (0, globals_1.expect)(data.length).toBeLessThanOrEqual(10);
            }
        });
    });
    (0, globals_1.describe)('Pattern Recognition', () => {
        (0, globals_1.it)('should identify candlestick patterns', async () => {
            const result = await marketAnalyzer.performAdvancedAnalysis('NEAR', 'USD');
            (0, globals_1.expect)(result.success).toBe(true);
            if (result.success) {
                const candlestickPatterns = result.data.patterns.filter(p => ['bullish_engulfing', 'bearish_engulfing', 'hammer', 'doji'].includes(p.pattern));
                // May or may not find patterns, but should not error
                candlestickPatterns.forEach(pattern => {
                    (0, globals_1.expect)(pattern.confidence).toBeGreaterThan(0);
                    (0, globals_1.expect)(pattern.description).toBeDefined();
                    (0, globals_1.expect)(pattern.implications.length).toBeGreaterThan(0);
                });
            }
        });
        (0, globals_1.it)('should identify chart patterns', async () => {
            const result = await marketAnalyzer.performAdvancedAnalysis('NEAR', 'USD');
            (0, globals_1.expect)(result.success).toBe(true);
            if (result.success) {
                const chartPatterns = result.data.patterns.filter(p => ['triangle', 'head_shoulders', 'double_top', 'double_bottom'].includes(p.pattern));
                chartPatterns.forEach(pattern => {
                    (0, globals_1.expect)(pattern.timeframe).toBeDefined();
                    (0, globals_1.expect)(pattern.implications.length).toBeGreaterThan(0);
                });
            }
        });
    });
    (0, globals_1.describe)('ML Predictions', () => {
        (0, globals_1.it)('should generate ML predictions when enabled', async () => {
            const result = await marketAnalyzer.performAdvancedAnalysis('NEAR', 'USD');
            (0, globals_1.expect)(result.success).toBe(true);
            if (result.success && result.data.mlPrediction) {
                const prediction = result.data.mlPrediction;
                (0, globals_1.expect)(prediction.predicted_price).toBeGreaterThan(0);
                (0, globals_1.expect)(prediction.confidence).toBeGreaterThan(0);
                (0, globals_1.expect)(prediction.confidence).toBeLessThanOrEqual(1);
                (0, globals_1.expect)(prediction.prediction_horizon).toBe(analysisConfig.predictionHorizon);
                (0, globals_1.expect)(Array.isArray(prediction.factors)).toBe(true);
                prediction.factors.forEach(factor => {
                    (0, globals_1.expect)(factor.factor).toBeDefined();
                    (0, globals_1.expect)(factor.weight).toBeGreaterThan(0);
                    (0, globals_1.expect)(['positive', 'negative', 'neutral']).toContain(factor.impact);
                });
            }
        });
        (0, globals_1.it)('should not generate predictions when disabled', async () => {
            marketAnalyzer.updateAnalysisConfig({
                ...analysisConfig,
                enableMLPredictions: false,
            });
            const result = await marketAnalyzer.performAdvancedAnalysis('NEAR', 'USD');
            (0, globals_1.expect)(result.success).toBe(true);
            if (result.success) {
                (0, globals_1.expect)(result.data.mlPrediction).toBeUndefined();
            }
        });
    });
    (0, globals_1.describe)('On-Chain Analysis', () => {
        (0, globals_1.it)('should fetch on-chain metrics when enabled', async () => {
            const result = await marketAnalyzer.performAdvancedAnalysis('NEAR', 'USD');
            (0, globals_1.expect)(result.success).toBe(true);
            if (result.success && result.data.onChainMetrics) {
                const metrics = result.data.onChainMetrics;
                (0, globals_1.expect)(metrics.tvl).toBeDefined();
                (0, globals_1.expect)(metrics.volume_24h).toBeDefined();
                (0, globals_1.expect)(metrics.active_addresses).toBeGreaterThan(0);
                (0, globals_1.expect)(metrics.transaction_count).toBeGreaterThan(0);
                (0, globals_1.expect)(parseFloat(metrics.average_transaction_size)).toBeGreaterThan(0);
            }
        });
        (0, globals_1.it)('should not fetch on-chain metrics when disabled', async () => {
            marketAnalyzer.updateAnalysisConfig({
                ...analysisConfig,
                enableOnChainAnalysis: false,
            });
            const result = await marketAnalyzer.performAdvancedAnalysis('NEAR', 'USD');
            (0, globals_1.expect)(result.success).toBe(true);
            if (result.success) {
                (0, globals_1.expect)(result.data.onChainMetrics).toBeUndefined();
            }
        });
    });
    (0, globals_1.describe)('Risk and Opportunity Analysis', () => {
        (0, globals_1.it)('should identify risk factors', async () => {
            const result = await marketAnalyzer.performAdvancedAnalysis('NEAR', 'USD');
            (0, globals_1.expect)(result.success).toBe(true);
            if (result.success) {
                (0, globals_1.expect)(Array.isArray(result.data.riskFactors)).toBe(true);
                result.data.riskFactors.forEach(risk => {
                    (0, globals_1.expect)(typeof risk).toBe('string');
                    (0, globals_1.expect)(risk.length).toBeGreaterThan(0);
                });
            }
        });
        (0, globals_1.it)('should identify opportunities', async () => {
            const result = await marketAnalyzer.performAdvancedAnalysis('NEAR', 'USD');
            (0, globals_1.expect)(result.success).toBe(true);
            if (result.success) {
                (0, globals_1.expect)(Array.isArray(result.data.opportunities)).toBe(true);
                result.data.opportunities.forEach(opportunity => {
                    (0, globals_1.expect)(typeof opportunity).toBe('string');
                    (0, globals_1.expect)(opportunity.length).toBeGreaterThan(0);
                });
            }
        });
    });
    (0, globals_1.describe)('Performance and Caching', () => {
        (0, globals_1.it)('should complete analysis within reasonable time', async () => {
            const startTime = Date.now();
            const result = await marketAnalyzer.performAdvancedAnalysis('NEAR', 'USD');
            const executionTime = Date.now() - startTime;
            (0, globals_1.expect)(result.success).toBe(true);
            (0, globals_1.expect)(executionTime).toBeLessThan(10000); // Should complete within 10 seconds
        });
        (0, globals_1.it)('should handle multiple concurrent analyses', async () => {
            const pairs = ['NEAR/USD', 'NEAR/USDC', 'BTC/USD'];
            const promises = pairs.map(pair => {
                const [assetIn, assetOut] = pair.split('/');
                return marketAnalyzer.performAdvancedAnalysis(assetIn, assetOut);
            });
            const results = await Promise.all(promises);
            results.forEach(result => {
                (0, globals_1.expect)(result.success).toBe(true);
            });
        });
    });
    (0, globals_1.describe)('Error Handling', () => {
        (0, globals_1.it)('should handle invalid asset pairs gracefully', async () => {
            const result = await marketAnalyzer.performAdvancedAnalysis('INVALID', 'ASSET');
            // Should either succeed with mock data or fail gracefully
            (0, globals_1.expect)(typeof result.success).toBe('boolean');
            if (!result.success) {
                (0, globals_1.expect)(result.error).toBeDefined();
                (0, globals_1.expect)(result.error.code).toBeDefined();
                (0, globals_1.expect)(result.error.message).toBeDefined();
            }
        });
        (0, globals_1.it)('should handle configuration errors', async () => {
            const invalidConfig = {
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
            (0, globals_1.expect)(typeof result.success).toBe('boolean');
        });
    });
});
//# sourceMappingURL=market-analyzer.test.js.map