/**
 * Simplified Intent Optimizer Tests
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { IntentOptimizer, OptimizationConfig } from '../../src/near-ai/intent-optimizer';
import { MarketDataProviders } from '../../src/near-ai/market-data-providers';

describe('Intent Optimizer Basic Tests', () => {
  let intentOptimizer: IntentOptimizer;
  let marketDataProviders: MarketDataProviders;

  beforeEach(() => {
    const optimizationConfig: OptimizationConfig = {
      enableRouteOptimization: true,
      enableGasOptimization: true,
      enableTimingOptimization: true,
      enableSlippageOptimization: true,
      enableArbitrageDetection: true,
      maxSlippage: 0.05,
      maxGasPrice: '1.0',
      executionTimeLimit: 300,
      minProfitThreshold: 0.5,
    };

    marketDataProviders = new MarketDataProviders({
      providers: ['test-provider'],
      cache_duration: 5000,
      fallback_enabled: true,
      timeout_ms: 10000
    });
    intentOptimizer = new IntentOptimizer(marketDataProviders, optimizationConfig);
  });

  it('should create intent optimizer successfully', () => {
    expect(intentOptimizer).toBeDefined();
  });

  it('should optimize intent execution', async () => {
    const result = await intentOptimizer.optimizeIntentExecution('NEAR', 'USD', '1000');

    expect(result.success).toBe(true);
    if (result.success && result.data) {
      expect(result.data).toBeDefined();
      expect(result.data.optimal_route).toBeDefined();
      expect(result.data.optimal_route.path.length).toBeGreaterThan(1);
    }
  });

  it('should update optimization config', () => {
    intentOptimizer.updateOptimizationConfig({ maxSlippage: 0.02 });
    expect(intentOptimizer).toBeDefined();
  });
});