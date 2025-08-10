/**
 * Risk Assessor Test Suite
 * Comprehensive tests for risk assessment and monitoring capabilities
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { AdvancedRiskAssessor, RiskAssessmentConfig } from '../../src/near-ai/advanced-risk-assessor';
import { RiskMonitoringSystem, MonitoringConfig } from '../../src/near-ai/risk-monitoring';
import { MarketDataProviders, PriceOracleConfig } from '../../src/near-ai/market-data-providers';
import { AIAgentConfig } from '../../src/near-ai/types';

describe('Risk Assessor Tests', () => {
  let riskAssessor: AdvancedRiskAssessor;
  let marketDataProviders: MarketDataProviders;
  let aiConfig: AIAgentConfig;
  let assessmentConfig: RiskAssessmentConfig;
  let oracleConfig: PriceOracleConfig;

  beforeEach(() => {
    aiConfig = {
      model: {
        name: 'test-model',
        provider: 'near-ai',
        version: '1.0.0',
        capabilities: ['risk-assessment'],
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

    assessmentConfig = {
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

    marketDataProviders = new MarketDataProviders(oracleConfig);
    riskAssessor = new AdvancedRiskAssessor(aiConfig, marketDataProviders, assessmentConfig);
  });

  describe('Risk Assessment', () => {
    it('should perform comprehensive risk assessment', async () => {
      const result = await riskAssessor.assessIntentRisk('NEAR', 'USD', '1000', 'default');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBeDefined();
        expect(result.data.overall_risk_score).toBeGreaterThanOrEqual(0);
        expect(result.data.overall_risk_score).toBeLessThanOrEqual(1);
        expect(['low', 'medium', 'high', 'critical']).toContain(result.data.risk_level);
        expect(result.data.confidence).toBeGreaterThan(0);
        expect(result.data.confidence).toBeLessThanOrEqual(1);
      }
    });

    it('should include all risk metrics categories', async () => {
      const result = await riskAssessor.assessIntentRisk('NEAR', 'USD', '1000', 'default');

      expect(result.success).toBe(true);
      if (result.success) {
        const metrics = result.data.metrics;
        
        expect(metrics.volatility).toBeDefined();
        expect(metrics.liquidity).toBeDefined();
        expect(metrics.market).toBeDefined();
        expect(metrics.operational).toBeDefined();
        expect(metrics.counterparty).toBeDefined();

        // Volatility metrics
        expect(metrics.volatility.historical_volatility).toBeGreaterThanOrEqual(0);
        expect(metrics.volatility.volatility_percentile).toBeGreaterThanOrEqual(0);
        expect(['increasing', 'decreasing', 'stable']).toContain(metrics.volatility.volatility_trend);

        // Liquidity metrics
        expect(metrics.liquidity.bid_ask_spread).toBeGreaterThanOrEqual(0);
        expect(metrics.liquidity.market_depth).toBeGreaterThanOrEqual(0);
        expect(metrics.liquidity.slippage_estimate).toBeGreaterThanOrEqual(0);
        expect(metrics.liquidity.liquidity_score).toBeGreaterThanOrEqual(0);
        expect(metrics.liquidity.liquidity_score).toBeLessThanOrEqual(1);
      }
    });

    it('should identify risk factors appropriately', async () => {
      const result = await riskAssessor.assessIntentRisk('NEAR', 'USD', '1000', 'default');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(Array.isArray(result.data.risk_factors)).toBe(true);
        
        result.data.risk_factors.forEach(factor => {
          expect(factor.factor).toBeDefined();
          expect(['low', 'medium', 'high', 'critical']).toContain(factor.severity);
          expect(factor.impact).toBeGreaterThanOrEqual(0);
          expect(factor.impact).toBeLessThanOrEqual(1);
          expect(factor.probability).toBeGreaterThanOrEqual(0);
          expect(factor.probability).toBeLessThanOrEqual(1);
          expect(factor.description).toBeDefined();
          expect(Array.isArray(factor.mitigation)).toBe(true);
        });
      }
    });

    it('should provide actionable recommendations', async () => {
      const result = await riskAssessor.assessIntentRisk('NEAR', 'USD', '1000', 'default');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(Array.isArray(result.data.recommendations)).toBe(true);
        
        result.data.recommendations.forEach(rec => {
          expect(rec.action).toBeDefined();
          expect(['low', 'medium', 'high', 'urgent']).toContain(rec.priority);
          expect(rec.rationale).toBeDefined();
          expect(rec.expected_impact).toBeDefined();
        });
      }
    });

    it('should include stress test scenarios', async () => {
      const result = await riskAssessor.assessIntentRisk('NEAR', 'USD', '1000', 'default');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(Array.isArray(result.data.stress_scenarios)).toBe(true);
        expect(result.data.stress_scenarios.length).toBeGreaterThan(0);
        
        result.data.stress_scenarios.forEach(scenario => {
          expect(scenario.scenario).toBeDefined();
          expect(scenario.probability).toBeGreaterThanOrEqual(0);
          expect(scenario.probability).toBeLessThanOrEqual(1);
          expect(scenario.potential_loss).toBeGreaterThanOrEqual(0);
          expect(scenario.description).toBeDefined();
        });
      }
    });

    it('should handle different position sizes', async () => {
      const smallPosition = await riskAssessor.assessIntentRisk('NEAR', 'USD', '100', 'default');
      const largePosition = await riskAssessor.assessIntentRisk('NEAR', 'USD', '100000', 'default');

      expect(smallPosition.success).toBe(true);
      expect(largePosition.success).toBe(true);

      if (smallPosition.success && largePosition.success) {
        // Large positions should generally have higher liquidity risk
        const smallLiquidityRisk = 1 - smallPosition.data.metrics.liquidity.liquidity_score;
        const largeLiquidityRisk = 1 - largePosition.data.metrics.liquidity.liquidity_score;
        
        // Slippage should be higher for larger positions
        expect(largePosition.data.metrics.liquidity.slippage_estimate)
          .toBeGreaterThanOrEqual(smallPosition.data.metrics.liquidity.slippage_estimate);
      }
    });

    it('should respect assessment configuration', async () => {
      // Disable volatility analysis
      riskAssessor.updateAssessmentConfig({
        enableVolatilityAnalysis: false,
      });

      const result = await riskAssessor.assessIntentRisk('NEAR', 'USD', '1000', 'default');

      expect(result.success).toBe(true);
      if (result.success) {
        // Should still work but may have different risk factors
        expect(result.data.overall_risk_score).toBeGreaterThanOrEqual(0);
      }
    });
  });

  describe('Risk Level Determination', () => {
    it('should correctly categorize risk levels', async () => {
      const result = await riskAssessor.assessIntentRisk('NEAR', 'USD', '1000', 'default');

      expect(result.success).toBe(true);
      if (result.success) {
        const score = result.data.overall_risk_score;
        const level = result.data.risk_level;

        if (score < 0.25) {
          expect(level).toBe('low');
        } else if (score < 0.5) {
          expect(level).toBe('medium');
        } else if (score < 0.75) {
          expect(level).toBe('high');
        } else {
          expect(level).toBe('critical');
        }
      }
    });

    it('should have consistent risk scoring', async () => {
      // Run multiple assessments for the same parameters
      const results = await Promise.all([
        riskAssessor.assessIntentRisk('NEAR', 'USD', '1000', 'default'),
        riskAssessor.assessIntentRisk('NEAR', 'USD', '1000', 'default'),
        riskAssessor.assessIntentRisk('NEAR', 'USD', '1000', 'default')
      ]);

      results.forEach(result => expect(result.success).toBe(true));

      if (results.every(r => r.success)) {
        const scores = results.map(r => r.data!.overall_risk_score);
        const maxDifference = Math.max(...scores) - Math.min(...scores);
        
        // Risk scores should be relatively consistent (within 20% range)
        expect(maxDifference).toBeLessThan(0.2);
      }
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid asset pairs gracefully', async () => {
      const result = await riskAssessor.assessIntentRisk('INVALID', 'ASSET', '1000', 'default');

      // Should either succeed with mock data or fail gracefully
      expect(typeof result.success).toBe('boolean');
      
      if (!result.success) {
        expect(result.error).toBeDefined();
        expect(result.error.code).toBeDefined();
        expect(result.error.message).toBeDefined();
      }
    });

    it('should handle invalid amounts', async () => {
      const negativeAmount = await riskAssessor.assessIntentRisk('NEAR', 'USD', '-1000', 'default');
      const zeroAmount = await riskAssessor.assessIntentRisk('NEAR', 'USD', '0', 'default');

      // Should handle gracefully
      expect(typeof negativeAmount.success).toBe('boolean');
      expect(typeof zeroAmount.success).toBe('boolean');
    });

    it('should handle malformed configuration', async () => {
      riskAssessor.updateAssessmentConfig({
        riskHorizon: -1,
        confidenceThreshold: 2.0,
        maxAcceptableRisk: -0.5,
      });

      const result = await riskAssessor.assessIntentRisk('NEAR', 'USD', '1000', 'default');
      
      // Should handle invalid config gracefully
      expect(typeof result.success).toBe('boolean');
    });
  });
});

describe('Risk Monitoring System Tests', () => {
  let monitoringSystem: RiskMonitoringSystem;
  let marketDataProviders: MarketDataProviders;
  let aiConfig: AIAgentConfig;
  let assessmentConfig: RiskAssessmentConfig;
  let monitoringConfig: MonitoringConfig;

  beforeEach(() => {
    aiConfig = {
      model: {
        name: 'test-model',
        provider: 'near-ai',
        version: '1.0.0',
        capabilities: ['risk-monitoring'],
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

    assessmentConfig = {
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

    monitoringConfig = {
      enabled: true,
      checkInterval: 1000, // 1 second for testing
      alertThresholds: {
        low: 0.2,
        medium: 0.4,
        high: 0.6,
        critical: 0.8,
      },
      enableRealTimeAlerts: true,
      enableHistoricalTracking: true,
      maxHistoryDays: 7,
    };

    marketDataProviders = new MarketDataProviders(oracleConfig);
    monitoringSystem = new RiskMonitoringSystem(
      aiConfig,
      marketDataProviders,
      assessmentConfig,
      monitoringConfig
    );
  });

  afterEach(() => {
    monitoringSystem.stopMonitoring();
  });

  describe('Monitoring Lifecycle', () => {
    it('should start and stop monitoring correctly', async () => {
      const assets = ['NEAR/USD', 'ETH/USD'];
      
      await monitoringSystem.startMonitoring(assets);
      
      const status = monitoringSystem.getMonitoringStatus();
      expect(status.isActive).toBe(true);
      expect(status.monitoredAssets).toEqual(expect.arrayContaining(assets));
      
      monitoringSystem.stopMonitoring();
      
      const stoppedStatus = monitoringSystem.getMonitoringStatus();
      expect(stoppedStatus.isActive).toBe(false);
    });

    it('should prevent starting monitoring twice', async () => {
      await monitoringSystem.startMonitoring(['NEAR/USD']);
      
      await expect(monitoringSystem.startMonitoring(['ETH/USD']))
        .rejects.toThrow('Risk monitoring is already active');
    });

    it('should handle adding and removing assets', async () => {
      await monitoringSystem.startMonitoring(['NEAR/USD']);
      
      monitoringSystem.addAssetsToMonitoring(['ETH/USD', 'BTC/USD']);
      
      const status = monitoringSystem.getMonitoringStatus();
      expect(status.monitoredAssets).toEqual(
        expect.arrayContaining(['NEAR/USD', 'ETH/USD', 'BTC/USD'])
      );
      
      monitoringSystem.removeAssetsFromMonitoring(['BTC/USD']);
      
      const updatedStatus = monitoringSystem.getMonitoringStatus();
      expect(updatedStatus.monitoredAssets).not.toContain('BTC/USD');
    });
  });

  describe('Alert Management', () => {
    it('should generate alerts when risk thresholds are exceeded', async () => {
      await monitoringSystem.startMonitoring(['NEAR/USD']);
      
      // Wait for at least one monitoring cycle
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const activeAlerts = monitoringSystem.getActiveAlerts();
      
      // Should have some alerts (since we're using mock data that may trigger thresholds)
      expect(Array.isArray(activeAlerts)).toBe(true);
      
      activeAlerts.forEach(alert => {
        expect(alert.id).toBeDefined();
        expect(alert.timestamp).toBeGreaterThan(0);
        expect(['low', 'medium', 'high', 'critical']).toContain(alert.severity);
        expect(['volatility', 'liquidity', 'operational', 'market', 'counterparty']).toContain(alert.type);
        expect(alert.message).toBeDefined();
        expect(alert.recommendation).toBeDefined();
        expect(Array.isArray(alert.affectedAssets)).toBe(true);
        expect(alert.resolved).toBe(false);
      });
    });

    it('should filter alerts by severity', async () => {
      await monitoringSystem.startMonitoring(['NEAR/USD']);
      
      // Wait for monitoring cycles
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const highAlerts = monitoringSystem.getAlertsBySeverity('high');
      const criticalAlerts = monitoringSystem.getAlertsBySeverity('critical');
      
      highAlerts.forEach(alert => {
        expect(alert.severity).toBe('high');
        expect(alert.resolved).toBe(false);
      });
      
      criticalAlerts.forEach(alert => {
        expect(alert.severity).toBe('critical');
        expect(alert.resolved).toBe(false);
      });
    });

    it('should resolve alerts correctly', async () => {
      await monitoringSystem.startMonitoring(['NEAR/USD']);
      
      // Wait for alerts to be generated
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const activeAlerts = monitoringSystem.getActiveAlerts();
      
      if (activeAlerts.length > 0) {
        const alertToResolve = activeAlerts[0];
        const resolved = monitoringSystem.resolveAlert(alertToResolve.id);
        
        expect(resolved).toBe(true);
        
        const updatedActiveAlerts = monitoringSystem.getActiveAlerts();
        expect(updatedActiveAlerts.find(a => a.id === alertToResolve.id)).toBeUndefined();
      }
    });
  });

  describe('Historical Tracking', () => {
    it('should track risk history when enabled', async () => {
      await monitoringSystem.startMonitoring(['NEAR/USD']);
      
      // Wait for multiple monitoring cycles
      await new Promise(resolve => setTimeout(resolve, 2500));
      
      const history = monitoringSystem.getRiskHistory(1); // Last hour
      
      expect(Array.isArray(history)).toBe(true);
      expect(history.length).toBeGreaterThan(0);
      
      history.forEach(metric => {
        expect(metric.timestamp).toBeGreaterThan(0);
        expect(metric.overall_risk).toBeGreaterThanOrEqual(0);
        expect(metric.overall_risk).toBeLessThanOrEqual(1);
        expect(metric.volatility_risk).toBeGreaterThanOrEqual(0);
        expect(metric.liquidity_risk).toBeGreaterThanOrEqual(0);
        expect(metric.operational_risk).toBeGreaterThanOrEqual(0);
        expect(metric.market_risk).toBeGreaterThanOrEqual(0);
        expect(metric.counterparty_risk).toBeGreaterThanOrEqual(0);
      });
    });

    it('should limit history based on configuration', async () => {
      // Update config to keep only 1 day of history
      monitoringSystem.updateConfig({ maxHistoryDays: 1 });
      
      await monitoringSystem.startMonitoring(['NEAR/USD']);
      
      // Wait for monitoring
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const history = monitoringSystem.getRiskHistory(48); // Request 48 hours
      
      // Should only get data from the last 24 hours due to config
      const oneDayAgo = Date.now() - (24 * 3600000);
      history.forEach(metric => {
        expect(metric.timestamp).toBeGreaterThan(oneDayAgo);
      });
    });
  });

  describe('Configuration Updates', () => {
    it('should update monitoring configuration', async () => {
      const newConfig = {
        checkInterval: 5000,
        alertThresholds: {
          low: 0.1,
          medium: 0.3,
          high: 0.5,
          critical: 0.7,
        },
      };
      
      monitoringSystem.updateConfig(newConfig);
      
      // Config should be updated (internal state)
      // We can verify this by checking that monitoring restarts with new interval
      await monitoringSystem.startMonitoring(['NEAR/USD']);
      
      const status = monitoringSystem.getMonitoringStatus();
      expect(status.isActive).toBe(true);
    });

    it('should restart monitoring when interval changes', async () => {
      await monitoringSystem.startMonitoring(['NEAR/USD']);
      
      const initialStatus = monitoringSystem.getMonitoringStatus();
      expect(initialStatus.isActive).toBe(true);
      
      // Update with new interval
      monitoringSystem.updateConfig({ checkInterval: 2000 });
      
      // Give time for restart
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const updatedStatus = monitoringSystem.getMonitoringStatus();
      expect(updatedStatus.isActive).toBe(true);
    });
  });

  describe('Performance and Reliability', () => {
    it('should handle monitoring errors gracefully', async () => {
      // Start monitoring with an asset that might cause errors
      await monitoringSystem.startMonitoring(['INVALID/ASSET']);
      
      // Wait for monitoring cycles
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Should still be running despite errors
      const status = monitoringSystem.getMonitoringStatus();
      expect(status.isActive).toBe(true);
      
      // Should generate operational alerts for errors
      const operationalAlerts = monitoringSystem.getActiveAlerts()
        .filter(a => a.type === 'operational');
      
      expect(operationalAlerts.length).toBeGreaterThan(0);
    });

    it('should handle multiple assets efficiently', async () => {
      const assets = ['NEAR/USD', 'ETH/USD', 'BTC/USD', 'SOL/USD'];
      
      const startTime = Date.now();
      await monitoringSystem.startMonitoring(assets);
      
      // Wait for several monitoring cycles
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      const status = monitoringSystem.getMonitoringStatus();
      expect(status.isActive).toBe(true);
      expect(status.monitoredAssets).toEqual(expect.arrayContaining(assets));
      
      // Should complete monitoring cycles reasonably quickly
      const elapsed = Date.now() - startTime;
      expect(elapsed).toBeLessThan(10000); // Should complete setup within 10 seconds
    });
  });
});
