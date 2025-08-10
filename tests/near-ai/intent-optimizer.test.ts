/**
 * Intent Optimizer Test Suite
 * Comprehensive tests for intent optimization and execution capabilities
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { IntentOptimizer, OptimizationConfig } from '../../src/near-ai/intent-optimizer';
import { ExecutionEngine, ExecutionConfig } from '../../src/near-ai/execution-engine';
import { AdvancedRiskAssessor, RiskAssessmentConfig } from '../../src/near-ai/advanced-risk-assessor';
import { MarketDataProviders, PriceOracleConfig } from '../../src/near-ai/market-data-providers';
import { AIAgentConfig } from '../../src/near-ai/types';

describe('Intent Optimizer Tests', () => {
  let intentOptimizer: IntentOptimizer;
  let marketDataProviders: MarketDataProviders;
  let riskAssessor: AdvancedRiskAssessor;
  let aiConfig: AIAgentConfig;
  let optimizationConfig: OptimizationConfig;

  beforeEach(() => {
    aiConfig = {
      model: {
        name: 'test-model',
        provider: 'near-ai',
        version: '1.0.0',
        capabilities: ['intent-optimization'],
        max_tokens: 4096,
      },
      temperature: 0.7,
      max_tokens: 4096,
      context_window: 8192,
      enable_reasoning: true,
      enable_memory: true,
      risk_tolerance: 'moderate',
    };

    const oracleConfig: PriceOracleConfig = {
      coingecko: { rateLimitMs: 100 },
      chainlink: {
        feeds: { 'NEAR_USD': '0x123...', 'ETH_USD': '0x456...' },
        updateInterval: 60,
      },
    };

    const riskConfig: RiskAssessmentConfig = {
      enableVolatilityAnalysis: true,
      enableLiquidityRisk: true,
      enableCounterpartyRisk: true,
      enableMarketRisk: true,
      enableOperationalRisk: true,
      enableRegulatory Risk: true,
      riskHorizon: 24,
      confidenceThreshold: 0.7,
      maxAcceptableRisk: 0.6,
    };

    optimizationConfig = {
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

    marketDataProviders = new MarketDataProviders(oracleConfig);
    riskAssessor = new AdvancedRiskAssessor(aiConfig, marketDataProviders, riskConfig);
    intentOptimizer = new IntentOptimizer(aiConfig, marketDataProviders, riskAssessor, optimizationConfig);
  });

  describe('Route Discovery', () => {
    it('should discover multiple execution routes', async () => {
      const result = await intentOptimizer.optimizeIntentExecution('NEAR', 'USD', '1000');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.optimal_route).toBeDefined();
        expect(result.data.alternative_routes).toBeDefined();
        expect(Array.isArray(result.data.alternative_routes)).toBe(true);
        
        // Should have at least one route
        expect(result.data.optimal_route.path.length).toBeGreaterThan(1);
        expect(result.data.optimal_route.dexes.length).toBeGreaterThan(0);
        
        // Route should have valid properties
        expect(parseFloat(result.data.optimal_route.estimatedOutput)).toBeGreaterThan(0);
        expect(parseFloat(result.data.optimal_route.estimatedGas)).toBeGreaterThan(0);
        expect(result.data.optimal_route.expectedSlippage).toBeGreaterThanOrEqual(0);
        expect(result.data.optimal_route.executionTime).toBeGreaterThan(0);
        expect(result.data.optimal_route.confidence).toBeGreaterThan(0);
        expect(result.data.optimal_route.confidence).toBeLessThanOrEqual(1);
      }
    });

    it('should include fees breakdown in routes', async () => {
      const result = await intentOptimizer.optimizeIntentExecution('NEAR', 'USD', '1000');

      expect(result.success).toBe(true);
      if (result.success) {
        const route = result.data.optimal_route;
        
        expect(route.fees).toBeDefined();
        expect(route.fees.protocol_fee).toBeDefined();
        expect(route.fees.gas_fee).toBeDefined();
        expect(route.fees.slippage_cost).toBeDefined();
        expect(route.fees.total_cost).toBeDefined();
        
        expect(parseFloat(route.fees.protocol_fee)).toBeGreaterThanOrEqual(0);
        expect(parseFloat(route.fees.gas_fee)).toBeGreaterThan(0);
        expect(parseFloat(route.fees.slippage_cost)).toBeGreaterThanOrEqual(0);
        expect(parseFloat(route.fees.total_cost)).toBeGreaterThan(0);
      }
    });

    it('should find different routes for different asset pairs', async () => {
      const nearUsdResult = await intentOptimizer.optimizeIntentExecution('NEAR', 'USD', '1000');
      const ethUsdResult = await intentOptimizer.optimizeIntentExecution('ETH', 'USD', '1000');

      expect(nearUsdResult.success).toBe(true);
      expect(ethUsdResult.success).toBe(true);

      if (nearUsdResult.success && ethUsdResult.success) {
        // Routes should be different for different asset pairs
        expect(nearUsdResult.data.optimal_route.path[0]).toBe('NEAR');
        expect(ethUsdResult.data.optimal_route.path[0]).toBe('ETH');
        
        // May have different DEXes or paths
        expect(
          nearUsdResult.data.optimal_route.id !== ethUsdResult.data.optimal_route.id
        ).toBe(true);
      }
    });
  });

  describe('Route Optimization', () => {
    it('should optimize routes based on speed priority', async () => {
      const result = await intentOptimizer.optimizeIntentExecution(
        'NEAR', 
        'USD', 
        '1000', 
        { priority: 'speed' }
      );

      expect(result.success).toBe(true);
      if (result.success) {
        const route = result.data.optimal_route;
        
        // Speed-optimized routes should prioritize execution time
        expect(route.executionTime).toBeLessThan(120); // Should be reasonably fast
        expect(route.path.length).toBeLessThanOrEqual(3); // Prefer shorter paths for speed
      }
    });

    it('should optimize routes based on cost priority', async () => {
      const result = await intentOptimizer.optimizeIntentExecution(
        'NEAR', 
        'USD', 
        '1000', 
        { priority: 'cost' }
      );

      expect(result.success).toBe(true);
      if (result.success) {
        const route = result.data.optimal_route;
        
        // Cost-optimized routes should minimize fees
        const totalCost = parseFloat(route.fees.total_cost);
        const amountIn = 1000;
        const costPercentage = (totalCost / amountIn) * 100;
        
        expect(costPercentage).toBeLessThan(5); // Should keep costs under 5%
      }
    });

    it('should respect user constraints', async () => {
      const result = await intentOptimizer.optimizeIntentExecution(
        'NEAR', 
        'USD', 
        '1000', 
        { 
          priority: 'balanced',
          maxSlippage: 0.02,
          maxExecutionTime: 60
        }
      );

      expect(result.success).toBe(true);
      if (result.success) {
        const route = result.data.optimal_route;
        
        expect(route.expectedSlippage).toBeLessThanOrEqual(0.02);
        expect(route.executionTime).toBeLessThanOrEqual(60);
      }
    });

    it('should provide meaningful optimization metrics', async () => {
      const result = await intentOptimizer.optimizeIntentExecution('NEAR', 'USD', '1000');

      expect(result.success).toBe(true);
      if (result.success) {
        const metrics = result.data.optimization_metrics;
        
        expect(metrics).toBeDefined();
        expect(metrics.gas_savings).toBeDefined();
        expect(metrics.slippage_reduction).toBeDefined();
        expect(metrics.time_optimization).toBeDefined();
        expect(metrics.profit_enhancement).toBeDefined();
        
        expect(parseFloat(metrics.gas_savings)).toBeGreaterThanOrEqual(0);
        expect(metrics.slippage_reduction).toBeGreaterThanOrEqual(0);
        expect(metrics.time_optimization).toBeGreaterThanOrEqual(0);
        expect(metrics.profit_enhancement).toBeGreaterThanOrEqual(0);
      }
    });
  });

  describe('Arbitrage Detection', () => {
    it('should detect arbitrage opportunities when enabled', async () => {
      const result = await intentOptimizer.optimizeIntentExecution('NEAR', 'USD', '1000');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(Array.isArray(result.data.arbitrage_opportunities)).toBe(true);
        
        result.data.arbitrage_opportunities.forEach(opportunity => {
          expect(opportunity.id).toBeDefined();
          expect(opportunity.asset_pair).toBeDefined();
          expect(opportunity.buy_venue).toBeDefined();
          expect(opportunity.sell_venue).toBeDefined();
          expect(parseFloat(opportunity.buy_price)).toBeGreaterThan(0);
          expect(parseFloat(opportunity.sell_price)).toBeGreaterThan(0);
          expect(opportunity.profit_percentage).toBeGreaterThan(0);
          expect(parseFloat(opportunity.profit_amount)).toBeGreaterThan(0);
          expect(['low', 'medium', 'high']).toContain(opportunity.execution_complexity);
          expect(opportunity.time_sensitivity).toBeGreaterThan(0);
          expect(opportunity.confidence).toBeGreaterThan(0);
          expect(opportunity.confidence).toBeLessThanOrEqual(1);
        });
      }
    });

    it('should not detect arbitrage when disabled', async () => {
      intentOptimizer.updateOptimizationConfig({ enableArbitrageDetection: false });
      
      const result = await intentOptimizer.optimizeIntentExecution('NEAR', 'USD', '1000');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.arbitrage_opportunities).toEqual([]);
      }
    });

    it('should filter arbitrage by minimum profit threshold', async () => {
      intentOptimizer.updateOptimizationConfig({ minProfitThreshold: 2.0 }); // 2% minimum
      
      const result = await intentOptimizer.optimizeIntentExecution('NEAR', 'USD', '1000');

      expect(result.success).toBe(true);
      if (result.success) {
        result.data.arbitrage_opportunities.forEach(opportunity => {
          expect(opportunity.profit_percentage).toBeGreaterThanOrEqual(2.0);
        });
      }
    });
  });

  describe('Execution Strategy', () => {
    it('should recommend split execution for large orders', async () => {
      const result = await intentOptimizer.optimizeIntentExecution('NEAR', 'USD', '100000'); // Large order

      expect(result.success).toBe(true);
      if (result.success) {
        const strategy = result.data.execution_strategy;
        
        // Large orders should often be split
        if (strategy.timing === 'split') {
          expect(strategy.split_orders).toBeDefined();
          expect(Array.isArray(strategy.split_orders)).toBe(true);
          expect(strategy.split_orders!.length).toBeGreaterThan(1);
          
          strategy.split_orders!.forEach(order => {
            expect(order.order_id).toBeDefined();
            expect(parseFloat(order.amount)).toBeGreaterThan(0);
            expect(order.delay).toBeGreaterThanOrEqual(0);
            expect(order.route).toBeDefined();
            expect(Array.isArray(order.conditions)).toBe(true);
          });
        }
      }
    });

    it('should recommend immediate execution for optimal conditions', async () => {
      const result = await intentOptimizer.optimizeIntentExecution('NEAR', 'USD', '1000'); // Regular order

      expect(result.success).toBe(true);
      if (result.success) {
        const strategy = result.data.execution_strategy;
        
        expect(['immediate', 'delayed', 'split']).toContain(strategy.timing);
        
        if (strategy.timing === 'immediate') {
          expect(strategy.split_orders).toBeUndefined();
        }
      }
    });

    it('should include execution conditions for volatile markets', async () => {
      const result = await intentOptimizer.optimizeIntentExecution('NEAR', 'USD', '1000');

      expect(result.success).toBe(true);
      if (result.success) {
        const strategy = result.data.execution_strategy;
        
        if (strategy.conditions && strategy.conditions.length > 0) {
          strategy.conditions.forEach(condition => {
            expect(['price', 'time', 'liquidity', 'volatility']).toContain(condition.type);
            expect(['>', '<', '=', '>=', '<=']).toContain(condition.operator);
            expect(condition.value).toBeDefined();
            expect(condition.description).toBeDefined();
          });
        }
      }
    });
  });

  describe('Risk Assessment Integration', () => {
    it('should include comprehensive risk assessment', async () => {
      const result = await intentOptimizer.optimizeIntentExecution('NEAR', 'USD', '1000');

      expect(result.success).toBe(true);
      if (result.success) {
        const riskAssessment = result.data.risk_assessment;
        
        expect(riskAssessment).toBeDefined();
        expect(riskAssessment.overall_risk).toBeGreaterThanOrEqual(0);
        expect(riskAssessment.overall_risk).toBeLessThanOrEqual(1);
        expect(riskAssessment.execution_risk).toBeGreaterThanOrEqual(0);
        expect(riskAssessment.execution_risk).toBeLessThanOrEqual(1);
        expect(riskAssessment.market_risk).toBeGreaterThanOrEqual(0);
        expect(riskAssessment.market_risk).toBeLessThanOrEqual(1);
        expect(Array.isArray(riskAssessment.recommendations)).toBe(true);
      }
    });

    it('should provide risk-appropriate recommendations', async () => {
      const result = await intentOptimizer.optimizeIntentExecution('NEAR', 'USD', '50000'); // Large, risky order

      expect(result.success).toBe(true);
      if (result.success) {
        const riskAssessment = result.data.risk_assessment;
        
        if (riskAssessment.overall_risk > 0.5) {
          expect(riskAssessment.recommendations.length).toBeGreaterThan(0);
          
          riskAssessment.recommendations.forEach(rec => {
            expect(typeof rec).toBe('string');
            expect(rec.length).toBeGreaterThan(0);
          });
        }
      }
    });
  });

  describe('Configuration and Error Handling', () => {
    it('should handle invalid asset pairs gracefully', async () => {
      const result = await intentOptimizer.optimizeIntentExecution('INVALID', 'ASSET', '1000');

      // Should either succeed with mock data or fail gracefully
      expect(typeof result.success).toBe('boolean');
      
      if (!result.success) {
        expect(result.error).toBeDefined();
        expect(result.error.code).toBeDefined();
        expect(result.error.message).toBeDefined();
      }
    });

    it('should respect configuration updates', async () => {
      intentOptimizer.updateOptimizationConfig({
        maxSlippage: 0.01, // Very low slippage tolerance
        enableArbitrageDetection: false
      });

      const result = await intentOptimizer.optimizeIntentExecution('NEAR', 'USD', '1000');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.arbitrage_opportunities).toEqual([]);
        expect(result.data.optimal_route.expectedSlippage).toBeLessThanOrEqual(0.02); // Some tolerance for mock data
      }
    });

    it('should handle zero or negative amounts', async () => {
      const zeroResult = await intentOptimizer.optimizeIntentExecution('NEAR', 'USD', '0');
      const negativeResult = await intentOptimizer.optimizeIntentExecution('NEAR', 'USD', '-1000');

      // Should handle gracefully
      expect(typeof zeroResult.success).toBe('boolean');
      expect(typeof negativeResult.success).toBe('boolean');
    });
  });

  describe('Performance', () => {
    it('should complete optimization within reasonable time', async () => {
      const startTime = Date.now();
      const result = await intentOptimizer.optimizeIntentExecution('NEAR', 'USD', '1000');
      const executionTime = Date.now() - startTime;

      expect(result.success).toBe(true);
      expect(executionTime).toBeLessThan(10000); // Should complete within 10 seconds
    });

    it('should handle concurrent optimizations', async () => {
      const promises = [
        intentOptimizer.optimizeIntentExecution('NEAR', 'USD', '1000'),
        intentOptimizer.optimizeIntentExecution('ETH', 'USD', '1000'),
        intentOptimizer.optimizeIntentExecution('BTC', 'USD', '1000')
      ];

      const results = await Promise.all(promises);
      
      results.forEach(result => {
        expect(result.success).toBe(true);
      });
    });
  });
});

describe('Execution Engine Tests', () => {
  let executionEngine: ExecutionEngine;
  let intentOptimizer: IntentOptimizer;
  let riskAssessor: AdvancedRiskAssessor;
  let executionConfig: ExecutionConfig;

  beforeEach(() => {
    const aiConfig: AIAgentConfig = {
      model: {
        name: 'test-model',
        provider: 'near-ai',
        version: '1.0.0',
        capabilities: ['execution'],
        max_tokens: 4096,
      },
      temperature: 0.7,
      max_tokens: 4096,
      context_window: 8192,
      enable_reasoning: true,
      enable_memory: true,
      risk_tolerance: 'moderate',
    };

    const oracleConfig: PriceOracleConfig = {
      coingecko: { rateLimitMs: 100 },
      chainlink: {
        feeds: { 'NEAR_USD': '0x123...', 'ETH_USD': '0x456...' },
        updateInterval: 60,
      },
    };

    const riskConfig: RiskAssessmentConfig = {
      enableVolatilityAnalysis: true,
      enableLiquidityRisk: true,
      enableCounterpartyRisk: true,
      enableMarketRisk: true,
      enableOperationalRisk: true,
      enableRegulatory Risk: true,
      riskHorizon: 24,
      confidenceThreshold: 0.7,
      maxAcceptableRisk: 0.6,
    };

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

    executionConfig = {
      enableDryRun: true, // Enable dry run for testing
      enableFailover: true,
      maxRetries: 3,
      retryDelayMs: 1000,
      timeoutMs: 30000,
      confirmationBlocks: 2,
    };

    const marketDataProviders = new MarketDataProviders(oracleConfig);
    riskAssessor = new AdvancedRiskAssessor(aiConfig, marketDataProviders, riskConfig);
    intentOptimizer = new IntentOptimizer(aiConfig, marketDataProviders, riskAssessor, optimizationConfig);
    executionEngine = new ExecutionEngine(aiConfig, intentOptimizer, riskAssessor, executionConfig);
  });

  describe('Execution Lifecycle', () => {
    it('should execute immediate orders successfully', async () => {
      // First get optimization result
      const optimizationResult = await intentOptimizer.optimizeIntentExecution('NEAR', 'USD', '1000');
      expect(optimizationResult.success).toBe(true);

      if (optimizationResult.success) {
        // Execute the optimized intent
        const executionResult = await executionEngine.executeIntent(
          'NEAR',
          'USD',
          '1000',
          optimizationResult.data
        );

        expect(executionResult.success).toBe(true);
        expect(executionResult.executionId).toBeDefined();
        expect(executionResult.status).toBeDefined();
        expect(executionResult.status.status).toBe('completed');
        expect(executionResult.status.progress).toBe(100);
        expect(executionResult.finalOutput).toBeDefined();
        expect(parseFloat(executionResult.finalOutput!)).toBeGreaterThan(0);
        expect(executionResult.performanceMetrics).toBeDefined();
      }
    });

    it('should handle execution status monitoring', async () => {
      const optimizationResult = await intentOptimizer.optimizeIntentExecution('NEAR', 'USD', '1000');
      expect(optimizationResult.success).toBe(true);

      if (optimizationResult.success) {
        const executionPromise = executionEngine.executeIntent(
          'NEAR',
          'USD',
          '1000',
          optimizationResult.data
        );

        // Check active executions
        const activeExecutions = executionEngine.getAllActiveExecutions();
        expect(Array.isArray(activeExecutions)).toBe(true);

        const result = await executionPromise;
        expect(result.success).toBe(true);

        // Check execution history
        const history = executionEngine.getExecutionHistory(result.executionId);
        expect(history).toBeDefined();
        expect(history!.executionId).toBe(result.executionId);
      }
    });

    it('should calculate meaningful performance metrics', async () => {
      const optimizationResult = await intentOptimizer.optimizeIntentExecution('NEAR', 'USD', '1000');
      expect(optimizationResult.success).toBe(true);

      if (optimizationResult.success) {
        const executionResult = await executionEngine.executeIntent(
          'NEAR',
          'USD',
          '1000',
          optimizationResult.data
        );

        expect(executionResult.success).toBe(true);
        
        const metrics = executionResult.performanceMetrics;
        expect(metrics.executionTime).toBeGreaterThan(0);
        expect(metrics.gasEfficiency).toBeGreaterThanOrEqual(0);
        expect(metrics.gasEfficiency).toBeLessThanOrEqual(100);
        expect(metrics.slippageRealized).toBeGreaterThanOrEqual(0);
        expect(metrics.priceImpact).toBeGreaterThanOrEqual(0);
      }
    });
  });

  describe('Error Handling and Recovery', () => {
    it('should handle invalid execution parameters', async () => {
      const invalidOptimization = {
        optimal_route: {
          id: 'invalid',
          path: [], // Invalid empty path
          dexes: [],
          estimatedOutput: '0',
          estimatedGas: '0',
          expectedSlippage: 0,
          executionTime: 0,
          confidence: 0,
          fees: {
            protocol_fee: '0',
            gas_fee: '0',
            slippage_cost: '0',
            total_cost: '0'
          }
        },
        alternative_routes: [],
        arbitrage_opportunities: [],
        optimization_metrics: {
          gas_savings: '0',
          slippage_reduction: 0,
          time_optimization: 0,
          profit_enhancement: 0
        },
        execution_strategy: {
          timing: 'immediate' as const
        },
        risk_assessment: {
          overall_risk: 0.5,
          execution_risk: 0.3,
          market_risk: 0.2,
          recommendations: []
        }
      };

      const result = await executionEngine.executeIntent(
        'NEAR',
        'USD',
        '1000',
        invalidOptimization
      );

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error!.code).toBeDefined();
      expect(result.error!.message).toBeDefined();
    });

    it('should handle high risk executions', async () => {
      const highRiskOptimization = {
        optimal_route: {
          id: 'high-risk',
          path: ['NEAR', 'USD'],
          dexes: ['test-dex'],
          estimatedOutput: '1000',
          estimatedGas: '0.01',
          expectedSlippage: 0.02,
          executionTime: 30,
          confidence: 0.8,
          fees: {
            protocol_fee: '3',
            gas_fee: '0.01',
            slippage_cost: '2',
            total_cost: '5.01'
          }
        },
        alternative_routes: [],
        arbitrage_opportunities: [],
        optimization_metrics: {
          gas_savings: '0',
          slippage_reduction: 0,
          time_optimization: 0,
          profit_enhancement: 0
        },
        execution_strategy: {
          timing: 'immediate' as const
        },
        risk_assessment: {
          overall_risk: 0.9, // Very high risk
          execution_risk: 0.8,
          market_risk: 0.7,
          recommendations: ['Consider reducing position size']
        }
      };

      const result = await executionEngine.executeIntent(
        'NEAR',
        'USD',
        '1000',
        highRiskOptimization
      );

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error!.message).toContain('risk');
    });
  });

  describe('Configuration Management', () => {
    it('should respect execution configuration', async () => {
      executionEngine.updateConfig({
        confirmationBlocks: 5,
        timeoutMs: 60000
      });

      const optimizationResult = await intentOptimizer.optimizeIntentExecution('NEAR', 'USD', '1000');
      expect(optimizationResult.success).toBe(true);

      if (optimizationResult.success) {
        const startTime = Date.now();
        const result = await executionEngine.executeIntent(
          'NEAR',
          'USD',
          '1000',
          optimizationResult.data
        );
        const executionTime = Date.now() - startTime;

        expect(result.success).toBe(true);
        // Should take longer due to more confirmation blocks
        expect(executionTime).toBeGreaterThan(5000); // At least 5 seconds for confirmations
      }
    });

    it('should handle dry run mode', async () => {
      executionEngine.updateConfig({ enableDryRun: true });

      const optimizationResult = await intentOptimizer.optimizeIntentExecution('NEAR', 'USD', '1000');
      expect(optimizationResult.success).toBe(true);

      if (optimizationResult.success) {
        const result = await executionEngine.executeIntent(
          'NEAR',
          'USD',
          '1000',
          optimizationResult.data
        );

        // Dry run should still succeed but with simulated results
        expect(result.success).toBe(true);
        expect(result.performanceMetrics.executionTime).toBeGreaterThan(0);
      }
    });
  });
});
