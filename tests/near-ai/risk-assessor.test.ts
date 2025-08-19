/**
 * Risk Assessor Test Suite
 * Comprehensive tests for risk assessment and monitoring capabilities
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { AdvancedRiskAssessor, RiskAssessmentConfig } from '../../backend/near-ai/advanced-risk-assessor';
import { RiskMonitoringSystem, MonitoringConfig } from '../../backend/near-ai/risk-monitoring';
import { MarketDataProviders, MarketDataConfig } from '../../backend/near-ai/market-data-providers';
import { AIAgentConfig } from '../../backend/near-ai/types';

describe('Risk Assessor Tests', () => {
  let riskAssessor: AdvancedRiskAssessor;
  let marketDataProviders: MarketDataProviders;
  let aiConfig: AIAgentConfig;
  let assessmentConfig: RiskAssessmentConfig;
  let marketDataConfig: MarketDataConfig;

  beforeEach(() => {
    aiConfig = {
      model: {
        name: 'near-ai',
        provider: 'near-ai',
        version: '1.0.0',
        capabilities: ['risk-assessment'],
        max_tokens: 4096,
      },
      api_key: 'test-key',
      endpoint: 'https://api.near.ai',
      max_tokens: 4096,
      temperature: 0.7,
      context_window: 8192,
    };

    marketDataConfig = {
      providers: ['coingecko', 'chainlink'],
      cache_duration: 60000,
      fallback_enabled: true,
      timeout_ms: 5000,
    };

    assessmentConfig = {
      enableVolatilityAnalysis: true,
      enableLiquidityRisk: true,
      enableCounterpartyRisk: true,
      enableMarketRisk: true,
      enableOperationalRisk: true,
      enableRegulatoryRisk: true,
      riskHorizon: 24,
      confidenceThreshold: 0.7,
      maxAcceptableRisk: 0.6,
    };

    marketDataProviders = new MarketDataProviders(marketDataConfig);
    riskAssessor = new AdvancedRiskAssessor(aiConfig, marketDataProviders, assessmentConfig);
  });

  describe('Risk Assessment', () => {
    it('should perform comprehensive risk assessment', async () => {
      const result = await riskAssessor.assessIntentRisk('NEAR', 'USD', '1000', 'default');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBeDefined();
        expect(result.data!.overall_risk_score).toBeGreaterThanOrEqual(0);
        expect(result.data!.overall_risk_score).toBeLessThanOrEqual(1);
        expect(['low', 'medium', 'high', 'critical']).toContain(result.data!.risk_level);
        expect(result.data!.confidence).toBeGreaterThan(0);
        expect(result.data!.confidence).toBeLessThanOrEqual(1);
      }
    });

    it('should include all risk metrics categories', async () => {
      const result = await riskAssessor.assessIntentRisk('NEAR', 'USD', '1000', 'default');

      expect(result.success).toBe(true);
      if (result.success) {
        const metrics = result.data!.metrics;
        expect(metrics.volatility).toBeDefined();
        expect(metrics.liquidity).toBeDefined();
        expect(metrics.market).toBeDefined();
        expect(metrics.operational).toBeDefined();
        expect(metrics.counterparty).toBeDefined();
      }
    });

    it('should identify risk factors', async () => {
      const result = await riskAssessor.assessIntentRisk('NEAR', 'USD', '10000', 'aggressive');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(Array.isArray(result.data!.risk_factors)).toBe(true);
        
        result.data!.risk_factors.forEach(factor => {
          expect(factor.factor).toBeDefined();
          expect(['low', 'medium', 'high', 'critical']).toContain(factor.severity);
          expect(factor.impact).toBeGreaterThanOrEqual(0);
          expect(factor.impact).toBeLessThanOrEqual(1);
          expect(factor.probability).toBeGreaterThanOrEqual(0);
          expect(factor.probability).toBeLessThanOrEqual(1);
        });
      }
    });

    it('should provide recommendations', async () => {
      const result = await riskAssessor.assessIntentRisk('NEAR', 'USD', '1000', 'default');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(Array.isArray(result.data!.recommendations)).toBe(true);
        
        result.data!.recommendations.forEach(rec => {
          expect(rec.action).toBeDefined();
          expect(['low', 'medium', 'high', 'urgent']).toContain(rec.priority);
          expect(rec.rationale).toBeDefined();
        });
      }
    });

    it('should perform stress testing', async () => {
      const result = await riskAssessor.assessIntentRisk('NEAR', 'USD', '5000', 'default');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(Array.isArray(result.data!.stress_scenarios)).toBe(true);
        expect(result.data!.stress_scenarios.length).toBeGreaterThan(0);
        
        result.data!.stress_scenarios.forEach(scenario => {
          expect(scenario.scenario).toBeDefined();
          expect(scenario.probability).toBeGreaterThanOrEqual(0);
          expect(scenario.probability).toBeLessThanOrEqual(1);
          expect(scenario.potential_loss).toBeGreaterThanOrEqual(0);
        });
      }
    });
  });

  describe('Risk Monitoring System', () => {
    let monitoringSystem: RiskMonitoringSystem;
    let monitoringConfig: MonitoringConfig;

    beforeEach(() => {
      monitoringConfig = {
        enabled: true,
        checkInterval: 10000, // 10 seconds for testing
        alertThresholds: {
          low: 0.3,
          medium: 0.5,
          high: 0.7,
          critical: 0.9,
        },
        enableRealTimeAlerts: true,
        enableHistoricalTracking: true,
        maxHistoryDays: 7,
      };

      monitoringSystem = new RiskMonitoringSystem(
        aiConfig,
        marketDataProviders,
        assessmentConfig,
        monitoringConfig
      );
    });

    it('should start and stop monitoring', async () => {
      const status = monitoringSystem.getMonitoringStatus();
      expect(status.isActive).toBe(false);

      await monitoringSystem.startMonitoring(['NEAR/USD', 'ETH/USD']);
      
      const activeStatus = monitoringSystem.getMonitoringStatus();
      expect(activeStatus.isActive).toBe(true);
      expect(activeStatus.monitoredAssets).toContain('NEAR/USD');
      expect(activeStatus.monitoredAssets).toContain('ETH/USD');

      monitoringSystem.stopMonitoring();
      
      const stoppedStatus = monitoringSystem.getMonitoringStatus();
      expect(stoppedStatus.isActive).toBe(false);
    });
  });
});