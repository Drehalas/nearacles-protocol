/**
 * Advanced Risk Assessor for NEAR Protocol Intent System
 * Provides sophisticated risk analysis and assessment capabilities
 */

import { AIAgentConfig, RiskFactor } from './types';
import { MarketDataProviders } from './market-data-providers';

export interface RiskAssessmentConfig {
  enableVolatilityAnalysis: boolean;
  enableLiquidityRisk: boolean;
  enableCounterpartyRisk: boolean;
  enableMarketRisk: boolean;
  enableOperationalRisk: boolean;
  enableRegulatoryRisk: boolean;
  riskHorizon: number; // hours
  confidenceThreshold: number;
  maxAcceptableRisk: number; // 0-1 scale
}

export interface RiskMetrics {
  volatility: {
    historical_volatility: number;
    implied_volatility?: number;
    volatility_percentile: number;
    volatility_trend: 'increasing' | 'decreasing' | 'stable';
  };
  liquidity: {
    bid_ask_spread: number;
    market_depth: number;
    slippage_estimate: number;
    liquidity_score: number; // 0-1
  };
  market: {
    correlation_risk: number;
    concentration_risk: number;
    market_stress_indicator: number;
    sentiment_risk: number;
  };
  operational: {
    smart_contract_risk: number;
    bridge_risk?: number;
    oracle_risk: number;
    governance_risk: number;
  };
  counterparty: {
    protocol_risk: number;
    custody_risk: number;
    settlement_risk: number;
    credit_risk: number;
  };
}

export interface RiskAssessment {
  overall_risk_score: number; // 0-1, where 1 is highest risk
  risk_level: 'low' | 'medium' | 'high' | 'critical';
  confidence: number;
  metrics: RiskMetrics;
  risk_factors: RiskFactor[];
  recommendations: Array<{
    action: string;
    priority: 'low' | 'medium' | 'high' | 'urgent';
    rationale: string;
    expected_impact: string;
  }>;
  stress_scenarios: Array<{
    scenario: string;
    probability: number;
    potential_loss: number;
    description: string;
  }>;
}

export class AdvancedRiskAssessor {
  private marketDataProviders: MarketDataProviders;
  private assessmentConfig: RiskAssessmentConfig;

  constructor(
    _aiConfig: AIAgentConfig,
    marketDataProviders: MarketDataProviders,
    assessmentConfig: RiskAssessmentConfig
  ) {
    this.marketDataProviders = marketDataProviders;
    this.assessmentConfig = assessmentConfig;
  }

  /**
   * Perform comprehensive risk assessment for intent execution
   */
  async assessIntentRisk(
    assetIn: string,
    assetOut: string,
    amount: string,
    executionStrategy: string
  ): Promise<{
    success: boolean;
    data?: RiskAssessment;
    error?: { code: string; message: string };
  }> {
    try {
      // Fetch market data for both assets
      const [marketDataIn, marketDataOut] = await Promise.all([
        this.marketDataProviders.fetchMarketData(`${assetIn}/USD`),
        this.marketDataProviders.fetchMarketData(`${assetOut}/USD`)
      ]);

      // Calculate risk metrics
      const riskMetrics = await this.calculateRiskMetrics(
        assetIn,
        assetOut,
        amount,
        marketDataIn as unknown as Record<string, unknown>,
        marketDataOut as unknown as Record<string, unknown>
      );

      // Assess individual risk factors
      const riskFactors = await this.identifyRiskFactors(
        assetIn,
        assetOut,
        amount,
        executionStrategy,
        riskMetrics
      );

      // Generate recommendations
      const recommendations = await this.generateRecommendations(
        riskFactors,
        riskMetrics,
        executionStrategy
      );

      // Perform stress testing
      const stressScenarios = await this.performStressTesting(
        assetIn,
        assetOut,
        amount,
        riskMetrics
      );

      // Calculate overall risk score
      const overallRiskScore = this.calculateOverallRiskScore(riskMetrics, riskFactors);
      const riskLevel = this.determineRiskLevel(overallRiskScore);

      const assessment: RiskAssessment = {
        overall_risk_score: overallRiskScore,
        risk_level: riskLevel,
        confidence: this.calculateConfidence(riskMetrics),
        metrics: riskMetrics,
        risk_factors: riskFactors,
        recommendations,
        stress_scenarios: stressScenarios
      };

      return {
        success: true,
        data: assessment
      };

    } catch (error) {
      return {
        success: false,
        error: {
          code: 'RISK_ASSESSMENT_FAILED',
          message: `Failed to assess risk: ${error instanceof Error ? error.message : 'Unknown error'}`
        }
      };
    }
  }

  /**
   * Calculate comprehensive risk metrics
   */
  private async calculateRiskMetrics(
    assetIn: string,
    assetOut: string,
    amount: string,
    _marketDataIn: Record<string, unknown>, // eslint-disable-line @typescript-eslint/no-unused-vars, no-unused-vars
    _marketDataOut: Record<string, unknown> // eslint-disable-line @typescript-eslint/no-unused-vars, no-unused-vars
  ): Promise<RiskMetrics> {
    const [volatilityMetrics, liquidityMetrics, marketMetrics, operationalMetrics, counterpartyMetrics] = await Promise.all([
      this.calculateVolatilityMetrics(assetIn, assetOut),
      this.calculateLiquidityMetrics(assetIn, assetOut, amount),
      this.calculateMarketMetrics(assetIn, assetOut),
      this.calculateOperationalMetrics(assetIn, assetOut),
      this.calculateCounterpartyMetrics(assetIn, assetOut)
    ]);

    return {
      volatility: volatilityMetrics,
      liquidity: liquidityMetrics,
      market: marketMetrics,
      operational: operationalMetrics,
      counterparty: counterpartyMetrics
    };
  }

  /**
   * Calculate volatility-related risk metrics
   */
  private async calculateVolatilityMetrics(assetIn: string, assetOut: string) {
    const historicalData = await this.marketDataProviders.fetchHistoricalData(
      `${assetIn}/${assetOut}`,
      '1h',
      168 // 7 days
    );

    const returns = historicalData.slice(1).map((current, index) => {
      const previous = historicalData[index];
      return Math.log(current.close / previous.close);
    });

    const historicalVolatility = this.calculateStandardDeviation(returns) * Math.sqrt(24 * 365);
    const volatilityPercentile = this.calculatePercentile(returns.map(r => Math.abs(r)), 95);

    // Simple trend analysis
    const recentVolatility = this.calculateStandardDeviation(returns.slice(-24)) * Math.sqrt(24 * 365);
    const olderVolatility = this.calculateStandardDeviation(returns.slice(-48, -24)) * Math.sqrt(24 * 365);
    
    let volatilityTrend: 'increasing' | 'decreasing' | 'stable' = 'stable';
    if (recentVolatility > olderVolatility * 1.1) {
      volatilityTrend = 'increasing';
    } else if (recentVolatility < olderVolatility * 0.9) {
      volatilityTrend = 'decreasing';
    }

    return {
      historical_volatility: historicalVolatility,
      volatility_percentile: volatilityPercentile,
      volatility_trend: volatilityTrend
    };
  }

  /**
   * Calculate liquidity-related risk metrics
   */
  private async calculateLiquidityMetrics(assetIn: string, assetOut: string, amount: string) {
    const marketData = await this.marketDataProviders.fetchMarketData(`${assetIn}/${assetOut}`);
    const amountNum = parseFloat(amount);

    // Simulate bid-ask spread (in real implementation, fetch from order book)
    const bidAskSpread = 0.001; // 0.1% default
    
    // Estimate market depth and slippage
    const marketDepth = (marketData.liquidity_score || 0.5) * 1000000; // Simulated depth
    const slippageEstimate = Math.min(amountNum / marketDepth * 0.1, 0.05); // Max 5% slippage

    return {
      bid_ask_spread: bidAskSpread,
      market_depth: marketDepth,
      slippage_estimate: slippageEstimate,
      liquidity_score: marketData.liquidity_score || 0.5
    };
  }

  /**
   * Calculate market-related risk metrics
   */
  private async calculateMarketMetrics(_assetIn: string, _assetOut: string) { // eslint-disable-line @typescript-eslint/no-unused-vars, no-unused-vars
    // Correlation with major assets (simplified)
    const correlationRisk = Math.random() * 0.3 + 0.1; // 0.1-0.4 range
    
    // Concentration risk (how concentrated the market is)
    const concentrationRisk = Math.random() * 0.2 + 0.05; // 0.05-0.25 range
    
    // Market stress indicator
    const marketStressIndicator = Math.random() * 0.3; // 0-0.3 range
    
    // Sentiment risk
    const sentimentRisk = Math.random() * 0.25 + 0.1; // 0.1-0.35 range

    return {
      correlation_risk: correlationRisk,
      concentration_risk: concentrationRisk,
      market_stress_indicator: marketStressIndicator,
      sentiment_risk: sentimentRisk
    };
  }

  /**
   * Calculate operational risk metrics
   */
  private async calculateOperationalMetrics(assetIn: string, assetOut: string) {
    // Smart contract risk assessment
    const smartContractRisk = this.assessSmartContractRisk(assetIn, assetOut);
    
    // Oracle risk
    const oracleRisk = Math.random() * 0.15 + 0.05; // 0.05-0.2 range
    
    // Governance risk
    const governanceRisk = Math.random() * 0.1 + 0.02; // 0.02-0.12 range

    return {
      smart_contract_risk: smartContractRisk,
      oracle_risk: oracleRisk,
      governance_risk: governanceRisk
    };
  }

  /**
   * Calculate counterparty risk metrics
   */
  private async calculateCounterpartyMetrics(_assetIn: string, _assetOut: string) { // eslint-disable-line @typescript-eslint/no-unused-vars, no-unused-vars
    // Protocol risk (depends on the specific protocol being used)
    const protocolRisk = Math.random() * 0.2 + 0.05; // 0.05-0.25 range
    
    // Custody risk
    const custodyRisk = Math.random() * 0.1 + 0.02; // 0.02-0.12 range
    
    // Settlement risk
    const settlementRisk = Math.random() * 0.08 + 0.01; // 0.01-0.09 range
    
    // Credit risk
    const creditRisk = Math.random() * 0.15 + 0.03; // 0.03-0.18 range

    return {
      protocol_risk: protocolRisk,
      custody_risk: custodyRisk,
      settlement_risk: settlementRisk,
      credit_risk: creditRisk
    };
  }

  /**
   * Assess smart contract specific risks
   */
  private assessSmartContractRisk(_assetIn: string, _assetOut: string): number { // eslint-disable-line @typescript-eslint/no-unused-vars, no-unused-vars
    // In a real implementation, this would analyze:
    // - Contract audit status
    // - Time since deployment
    // - Total value locked
    // - Historical exploit/bug patterns
    // - Code complexity
    
    const baseRisk = 0.05; // 5% base risk
    const complexityRisk = Math.random() * 0.1; // 0-10% complexity risk
    const auditRisk = Math.random() * 0.08; // 0-8% audit risk
    
    return Math.min(baseRisk + complexityRisk + auditRisk, 0.3); // Cap at 30%
  }

  /**
   * Identify specific risk factors
   */
  private async identifyRiskFactors(
    _assetIn: string,
    _assetOut: string,
    _amount: string,
    _executionStrategy: string,
    metrics: RiskMetrics
  ) {
    const riskFactors = [];

    // High volatility risk
    if (metrics.volatility.historical_volatility > 0.5) {
      riskFactors.push({
        type: 'High Volatility',
        factor: 'High Volatility',
        severity: metrics.volatility.historical_volatility > 0.8 ? 'critical' as const : 'high' as const,
        impact: metrics.volatility.historical_volatility,
        probability: 0.8,
        description: `Asset pair shows high historical volatility of ${(metrics.volatility.historical_volatility * 100).toFixed(1)}%`,
        mitigation_strategies: [
          'Consider reducing position size',
          'Implement dynamic slippage tolerance',
          'Use gradual execution strategy'
        ]
      });
    }

    // Liquidity risk
    if (metrics.liquidity.liquidity_score < 0.3) {
      riskFactors.push({
        type: 'Low Liquidity',
        factor: 'Low Liquidity',
        severity: metrics.liquidity.liquidity_score < 0.1 ? 'critical' as const : 'high' as const,
        impact: 1 - metrics.liquidity.liquidity_score,
        probability: 0.9,
        description: `Low liquidity may result in high slippage (estimated ${(metrics.liquidity.slippage_estimate * 100).toFixed(2)}%)`,
        mitigation_strategies: [
          'Split large orders into smaller chunks',
          'Wait for better market conditions',
          'Consider alternative execution venues'
        ]
      });
    }

    // Smart contract risk
    if (metrics.operational.smart_contract_risk > 0.15) {
      riskFactors.push({
        type: 'Smart Contract Risk',
        factor: 'Smart Contract Risk',
        severity: metrics.operational.smart_contract_risk > 0.25 ? 'critical' as const : 'medium' as const,
        impact: metrics.operational.smart_contract_risk,
        probability: 0.3,
        description: 'Elevated smart contract risk due to complexity or audit status',
        mitigation_strategies: [
          'Verify contract audit status',
          'Use only well-established protocols',
          'Consider insurance options'
        ]
      });
    }

    // Market stress
    if (metrics.market.market_stress_indicator > 0.2) {
      riskFactors.push({
        type: 'Market Stress',
        factor: 'Market Stress',
        severity: 'medium' as const,
        impact: metrics.market.market_stress_indicator,
        probability: 0.6,
        description: 'Elevated market stress may increase execution risks',
        mitigation_strategies: [
          'Delay non-urgent transactions',
          'Increase monitoring frequency',
          'Prepare contingency plans'
        ]
      });
    }

    return riskFactors;
  }

  /**
   * Generate risk-based recommendations
   */
  private async generateRecommendations(riskFactors: RiskFactor[], metrics: RiskMetrics, _executionStrategy: string) { // eslint-disable-line @typescript-eslint/no-unused-vars, no-unused-vars
    const recommendations = [];

    const overallRisk = this.calculateOverallRiskScore(metrics, riskFactors);

    if (overallRisk > 0.7) {
      recommendations.push({
        action: 'Postpone Intent Execution',
        priority: 'urgent' as const,
        rationale: 'Overall risk level is too high for safe execution',
        expected_impact: 'Prevent potential significant losses'
      });
    } else if (overallRisk > 0.5) {
      recommendations.push({
        action: 'Reduce Position Size',
        priority: 'high' as const,
        rationale: 'Moderate risk level suggests reducing exposure',
        expected_impact: 'Lower potential loss while maintaining upside'
      });
    }

    if (metrics.liquidity.slippage_estimate > 0.02) {
      recommendations.push({
        action: 'Use Gradual Execution',
        priority: 'high' as const,
        rationale: 'High slippage risk requires careful execution timing',
        expected_impact: 'Reduce market impact and improve execution price'
      });
    }

    if (metrics.volatility.volatility_trend === 'increasing') {
      recommendations.push({
        action: 'Increase Monitoring Frequency',
        priority: 'medium' as const,
        rationale: 'Rising volatility requires closer market observation',
        expected_impact: 'Enable faster response to market changes'
      });
    }

    return recommendations;
  }

  /**
   * Perform stress testing scenarios
   */
  private async performStressTesting(
    _assetIn: string,
    _assetOut: string,
    amount: string,
    metrics: RiskMetrics
  ) {
    const amountNum = parseFloat(amount);
    
    return [
      {
        scenario: 'Market Crash (-30%)',
        probability: 0.05,
        potential_loss: amountNum * 0.3,
        description: 'Severe market downturn affecting all assets'
      },
      {
        scenario: 'Liquidity Crisis',
        probability: 0.1,
        potential_loss: amountNum * metrics.liquidity.slippage_estimate * 3,
        description: 'Sudden liquidity shortage causing high slippage'
      },
      {
        scenario: 'Oracle Failure',
        probability: 0.02,
        potential_loss: amountNum * 0.05,
        description: 'Price oracle malfunction causing execution at wrong prices'
      },
      {
        scenario: 'High Volatility Spike',
        probability: 0.15,
        potential_loss: amountNum * metrics.volatility.historical_volatility * 0.5,
        description: 'Sudden volatility increase during execution'
      }
    ];
  }

  /**
   * Calculate overall risk score
   */
  private calculateOverallRiskScore(metrics: RiskMetrics, riskFactors: RiskFactor[]): number {
    const weights = {
      volatility: 0.25,
      liquidity: 0.25,
      market: 0.2,
      operational: 0.2,
      counterparty: 0.1
    };

    const volatilityScore = Math.min(metrics.volatility.historical_volatility, 1);
    const liquidityScore = 1 - metrics.liquidity.liquidity_score;
    const marketScore = (metrics.market.correlation_risk + metrics.market.market_stress_indicator) / 2;
    const operationalScore = metrics.operational.smart_contract_risk;
    const counterpartyScore = metrics.counterparty.protocol_risk;

    const baseScore = 
      volatilityScore * weights.volatility +
      liquidityScore * weights.liquidity +
      marketScore * weights.market +
      operationalScore * weights.operational +
      counterpartyScore * weights.counterparty;

    // Factor in identified risk factors
    const riskFactorImpact = riskFactors.reduce((total, factor) => {
      const severityMultiplier: Record<string, number> = {
        'low': 0.1,
        'medium': 0.25,
        'high': 0.5,
        'critical': 1.0
      };
      const multiplier = severityMultiplier[factor.severity] || 0.5;
      
      return total + (factor.impact * factor.probability * multiplier);
    }, 0);

    return Math.min(baseScore + riskFactorImpact * 0.3, 1);
  }

  /**
   * Determine risk level from score
   */
  private determineRiskLevel(score: number): 'low' | 'medium' | 'high' | 'critical' {
    if (score < 0.25) return 'low';
    if (score < 0.5) return 'medium';
    if (score < 0.75) return 'high';
    return 'critical';
  }

  /**
   * Calculate confidence in risk assessment
   */
  private calculateConfidence(metrics: RiskMetrics): number {
    // Higher confidence with more data points and lower uncertainty
    const liquidityConfidence = metrics.liquidity.liquidity_score;
    const volatilityConfidence = 1 - Math.min(metrics.volatility.historical_volatility / 2, 0.5);
    
    return (liquidityConfidence + volatilityConfidence) / 2;
  }

  /**
   * Utility function to calculate standard deviation
   */
  private calculateStandardDeviation(values: number[]): number {
    const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
    const squaredDifferences = values.map(value => Math.pow(value - mean, 2));
    const variance = squaredDifferences.reduce((sum, value) => sum + value, 0) / values.length;
    return Math.sqrt(variance);
  }

  /**
   * Utility function to calculate percentile
   */
  private calculatePercentile(values: number[], percentile: number): number {
    const sorted = values.slice().sort((a, b) => a - b);
    const index = (percentile / 100) * (sorted.length - 1);
    const floor = Math.floor(index);
    const ceil = Math.ceil(index);
    
    if (floor === ceil) {
      return sorted[floor];
    }
    
    return sorted[floor] * (ceil - index) + sorted[ceil] * (index - floor);
  }

  /**
   * Update risk assessment configuration
   */
  updateAssessmentConfig(config: Partial<RiskAssessmentConfig>): void {
    this.assessmentConfig = { ...this.assessmentConfig, ...config };
  }
}
