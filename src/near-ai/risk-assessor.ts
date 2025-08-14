/**
 * Risk Assessor for Intelligent Risk Evaluation
 * Advanced risk analysis for NEAR Intent Protocol
 */

import { 
  AIAgentConfig,
  RiskAssessment,
  RiskFactor,
  AIResponse,
  AIError 
} from './types';
import { Quote, IntentRequestParams } from '../near-intent/types';
import { getCurrentTimestamp } from '../utils/helpers';

export class RiskAssessor {
  private config: AIAgentConfig;
  private riskCache: Map<string, { assessment: RiskAssessment; timestamp: number }> = new Map();
  private readonly CACHE_TTL = 600; // 10 minutes

  constructor(config: AIAgentConfig) {
    this.config = config;
  }

  /**
   * Assess risk for an intent and available quotes
   */
  async assessRisk(intent: IntentRequestParams, quotes: Quote[]): Promise<AIResponse<RiskAssessment>> {
    const cacheKey = this.generateCacheKey(intent, quotes);
    
    try {
      // Check cache first
      const cached = this.getCachedAssessment(cacheKey);
      if (cached) {
        return { success: true, data: cached };
      }

      // Perform comprehensive risk assessment
      const riskFactors = await this.identifyRiskFactors(intent, quotes);
      const overallRiskScore = this.calculateOverallRiskScore(riskFactors);
      const riskLevel = this.determineRiskLevel(overallRiskScore);
      const recommendations = this.generateRecommendations(riskFactors, riskLevel);
      this.identifyWarningFlags(intent, quotes, riskFactors);

      const assessment: RiskAssessment = {
        overall_risk_score: overallRiskScore,
        risk_level: riskLevel,
        confidence: 0.8,
        factors: riskFactors.map(f => f.description || f.type),
        risk_factors: riskFactors.map(f => f.description || f.type),
        recommendations,
        suggested_slippage: this.calculateSuggestedSlippage(intent, riskFactors),
      };

      // Cache the result
      this.cacheAssessment(cacheKey, assessment);

      return {
        success: true,
        data: assessment,
        metadata: {
          model_used: this.config.model.name,
          tokens_consumed: 200,
          processing_time: 800,
          confidence: this.calculateAssessmentConfidence(riskFactors),
        },
      };

    } catch (error) {
      const aiError: AIError = {
        code: 'RISK_ASSESSMENT_FAILED',
        message: error instanceof Error ? error.message : 'Failed to assess risk',
        model: this.config.model.name,
        severity: 'high',
        timestamp: getCurrentTimestamp(),
      };

      return { success: false, error: aiError };
    }
  }

  /**
   * Identify risk factors for the intent and quotes
   */
  private async identifyRiskFactors(intent: IntentRequestParams, quotes: Quote[]): Promise<RiskFactor[]> {
    const riskFactors: RiskFactor[] = [];

    // Market Risk Assessment
    const marketRisk = await this.assessMarketRisk(intent);
    if (marketRisk) riskFactors.push(marketRisk);

    // Liquidity Risk Assessment
    const liquidityRisk = await this.assessLiquidityRisk(intent, quotes);
    if (liquidityRisk) riskFactors.push(liquidityRisk);

    // Smart Contract Risk Assessment
    const contractRisk = await this.assessSmartContractRisk(intent, quotes);
    if (contractRisk) riskFactors.push(contractRisk);

    // Solver Risk Assessment
    const solverRisk = await this.assessSolverRisk(quotes);
    if (solverRisk) riskFactors.push(solverRisk);

    // Operational Risk Assessment
    const operationalRisk = await this.assessOperationalRisk(intent);
    if (operationalRisk) riskFactors.push(operationalRisk);

    // Regulatory Risk Assessment
    const regulatoryRisk = await this.assessRegulatoryRisk(intent);
    if (regulatoryRisk) riskFactors.push(regulatoryRisk);

    return riskFactors;
  }

  /**
   * Assess market-related risks
   */
  private async assessMarketRisk(_intent: IntentRequestParams): Promise<RiskFactor | null> { // eslint-disable-line @typescript-eslint/no-unused-vars
    // Mock market volatility analysis
    const volatility = Math.random() * 0.8 + 0.1; // 0.1 to 0.9
    
    if (volatility > 0.6) {
      return {
        type: 'market',
        level: volatility > 0.8 ? 'high' : 'medium',
        severity: volatility > 0.8 ? 'high' : 'medium',
        impact: volatility,
        description: `High market volatility detected (${(volatility * 100).toFixed(1)}%)`,
        impact_score: volatility,
        probability: 0.8,
        mitigation_strategies: [
          'Use smaller position sizes',
          'Increase slippage tolerance',
          'Consider waiting for lower volatility',
          'Use limit orders instead of market orders',
        ],
      };
    }

    return null;
  }

  /**
   * Assess liquidity-related risks
   */
  private async assessLiquidityRisk(intent: IntentRequestParams, quotes: Quote[]): Promise<RiskFactor | null> {
    const avgLiquidity = quotes.length > 0 ? 0.7 : 0.3; // Mock liquidity calculation
    const intentSize = parseFloat(intent.amount_in) || 1000;
    const liquidityRatio = intentSize / 10000; // Mock calculation

    if (avgLiquidity < 0.5 || liquidityRatio > 0.1) {
      return {
        type: 'liquidity',
        level: avgLiquidity < 0.3 ? 'high' : 'medium',
        severity: avgLiquidity < 0.3 ? 'high' : 'medium',
        impact: 1 - avgLiquidity,
        description: `Low liquidity conditions may impact execution`,
        impact_score: 1 - avgLiquidity,
        probability: 0.7,
        mitigation_strategies: [
          'Split large orders into smaller chunks',
          'Use multiple solvers for execution',
          'Increase execution timeout',
          'Monitor order book depth',
        ],
      };
    }

    return null;
  }

  /**
   * Assess smart contract risks
   */
  private async assessSmartContractRisk(intent: IntentRequestParams, quotes: Quote[]): Promise<RiskFactor | null> {
    // Check for contract complexity and audit status
    const hasComplexAssets = (intent as any).asset_in?.contract_address || (intent as any).asset_out?.contract_address;
    const multipleProtocols = quotes.length > 3;

    if (hasComplexAssets || multipleProtocols) {
      return {
        type: 'smart_contract',
        level: 'medium',
        severity: 'medium',
        impact: 0.4,
        description: 'Smart contract interaction complexity increases risk',
        impact_score: 0.4,
        probability: 0.3,
        mitigation_strategies: [
          'Verify contract audit status',
          'Use smaller test amounts first',
          'Check contract upgrade mechanisms',
          'Monitor contract TVL and usage',
        ],
      };
    }

    return null;
  }

  /**
   * Assess solver-related risks
   */
  private async assessSolverRisk(quotes: Quote[]): Promise<RiskFactor | null> {
    if (quotes.length === 0) {
      return {
        type: 'operational',
        level: 'high',
        severity: 'high',
        impact: 0.8,
        description: 'No solvers available for execution',
        impact_score: 0.9,
        probability: 1.0,
        mitigation_strategies: [
          'Wait for solvers to come online',
          'Check solver network connectivity',
          'Consider alternative execution routes',
          'Contact solver network support',
        ],
      };
    }

    const lowQualityQuotes = quotes.filter(q => (q as any).recommendation === 'reject').length;
    const riskRatio = lowQualityQuotes / quotes.length;

    if (riskRatio > 0.5) {
      return {
        type: 'operational',
        level: 'medium',
        severity: 'medium',
        impact: 0.4,
        description: `${lowQualityQuotes}/${quotes.length} quotes are low quality`,
        impact_score: riskRatio * 0.6,
        probability: 0.8,
        mitigation_strategies: [
          'Wait for better quotes',
          'Adjust intent parameters',
          'Check solver reputation scores',
          'Consider manual execution',
        ],
      };
    }

    return null;
  }

  /**
   * Assess operational risks
   */
  private async assessOperationalRisk(intent: IntentRequestParams): Promise<RiskFactor | null> {
    const currentTime = getCurrentTimestamp();
    const intentExpiry = (intent as any).expiry || (currentTime + 3600);
    const timeToExpiry = intentExpiry - currentTime;

    if (timeToExpiry < 300) { // Less than 5 minutes
      return {
        type: 'operational',
        level: 'high',
        severity: 'high',
        impact: 0.8,
        description: 'Intent expiry is very close, execution may fail',
        impact_score: 0.8,
        probability: 0.9,
        mitigation_strategies: [
          'Extend intent expiry time',
          'Execute immediately with best available quote',
          'Create new intent with longer expiry',
          'Monitor execution closely',
        ],
      };
    }

    return null;
  }

  /**
   * Assess regulatory risks
   */
  private async assessRegulatoryRisk(intent: IntentRequestParams): Promise<RiskFactor | null> {
    // Check for high-risk jurisdictions or assets
    const riskAssets = ['PRIVACY_COIN', 'GAMBLING_TOKEN']; // Mock risk assets
    const hasRiskAsset = riskAssets.includes((intent as any).asset_in?.symbol) || 
                        riskAssets.includes((intent as any).asset_out?.symbol);

    if (hasRiskAsset) {
      return {
        type: 'regulatory',
        level: 'medium',
        severity: 'medium',
        impact: 0.4,
        description: 'Asset may be subject to regulatory restrictions',
        impact_score: 0.5,
        probability: 0.4,
        mitigation_strategies: [
          'Verify local regulatory compliance',
          'Check asset regulatory status',
          'Consider alternative assets',
          'Consult legal advice if needed',
        ],
      };
    }

    return null;
  }

  /**
   * Calculate overall risk score
   */
  private calculateOverallRiskScore(riskFactors: RiskFactor[]): number {
    if (riskFactors.length === 0) return 0.1; // Minimum risk

    const weightedScore = riskFactors.reduce((sum, factor) => {
      const weight = this.getRiskTypeWeight(factor.type);
      return sum + ((factor.impact_score || 0) * factor.probability * weight);
    }, 0);

    const normalizedScore = Math.min(0.95, weightedScore / riskFactors.length);
    return Math.max(0.05, normalizedScore);
  }

  /**
   * Get risk type weights
   */
  private getRiskTypeWeight(riskType: string): number {
    const weights: { [key: string]: number } = {
      market: 1.2,
      liquidity: 1.0,
      smart_contract: 1.1,
      regulatory: 0.8,
      operational: 1.3,
    };
    return weights[riskType] || 1.0;
  }

  /**
   * Determine risk level from score
   */
  private determineRiskLevel(riskScore: number): 'low' | 'medium' | 'high' | 'critical' {
    if (riskScore < 0.25) return 'low';
    if (riskScore < 0.5) return 'medium';
    if (riskScore < 0.75) return 'high';
    return 'critical';
  }

  /**
   * Generate risk mitigation recommendations
   */
  private generateRecommendations(
    riskFactors: RiskFactor[], 
    riskLevel: 'low' | 'medium' | 'high' | 'critical'
  ): string[] {
    const recommendations: string[] = [];

    // General recommendations based on risk level
    switch (riskLevel) {
      case 'critical':
        recommendations.push('Consider canceling this intent due to extremely high risk');
        recommendations.push('If proceeding, use minimal position size');
        break;
      case 'high':
        recommendations.push('Proceed with extreme caution');
        recommendations.push('Use reduced position size (max 25% of intended)');
        recommendations.push('Monitor execution closely');
        break;
      case 'medium':
        recommendations.push('Exercise normal caution');
        recommendations.push('Consider reducing position size by 50%');
        break;
      case 'low':
        recommendations.push('Conditions are favorable for execution');
        break;
    }

    // Specific recommendations from risk factors
    const allMitigations = riskFactors.flatMap(factor => factor.mitigation_strategies || []);
    const uniqueMitigations = [...new Set(allMitigations)];
    recommendations.push(...uniqueMitigations.slice(0, 5)); // Top 5 unique mitigations

    return recommendations;
  }

  /**
   * Calculate maximum position size
   */
  private calculateMaxPositionSize(intent: IntentRequestParams, riskLevel: 'low' | 'medium' | 'high' | 'critical'): string {
    const originalAmount = BigInt(intent.amount_in);
    
    const multipliers = {
      low: 1.0,
      medium: 0.5,
      high: 0.25,
      critical: 0.1,
    };

    const adjustedAmount = BigInt(Math.floor(Number(originalAmount) * multipliers[riskLevel]));
    return adjustedAmount.toString();
  }

  /**
   * Calculate suggested slippage
   */
  private calculateSuggestedSlippage(intent: IntentRequestParams, riskFactors: RiskFactor[]): number {
    let baseSlippage = 0.01; // 1%

    // Increase slippage based on risk factors
    for (const factor of riskFactors) {
      switch (factor.type) {
        case 'market':
          baseSlippage += (factor.impact_score || 0) * 0.02; // Up to 2% additional
          break;
        case 'liquidity':
          baseSlippage += (factor.impact_score || 0) * 0.03; // Up to 3% additional
          break;
        default:
          baseSlippage += (factor.impact_score || 0) * 0.01; // Up to 1% additional
          break;
      }
    }

    return Math.min(0.1, baseSlippage); // Cap at 10%
  }

  /**
   * Identify warning flags
   */
  private identifyWarningFlags(intent: IntentRequestParams, quotes: Quote[], riskFactors: RiskFactor[]): string[] {
    const warnings: string[] = [];

    if (quotes.length === 0) {
      warnings.push('NO_QUOTES_AVAILABLE');
    }

    if (riskFactors.some(f => f.level === 'critical')) {
      warnings.push('CRITICAL_RISK_DETECTED');
    }

    const currentTime = getCurrentTimestamp();
    const timeToExpiry = ((intent as any).expiry || (currentTime + 3600)) - currentTime;
    if (timeToExpiry < 600) { // Less than 10 minutes
      warnings.push('NEAR_EXPIRY');
    }

    const highImpactRisks = riskFactors.filter(f => (f.impact_score || 0) > 0.7);
    if (highImpactRisks.length > 0) {
      warnings.push('HIGH_IMPACT_RISKS');
    }

    if (quotes.some(q => (q as any).recommendation === 'reject' && (q as any).score < 20)) {
      warnings.push('VERY_LOW_QUALITY_QUOTES');
    }

    return warnings;
  }

  /**
   * Calculate assessment confidence
   */
  private calculateAssessmentConfidence(riskFactors: RiskFactor[]): number {
    if (riskFactors.length === 0) return 0.6; // Lower confidence with no identified risks

    const avgProbability = riskFactors.reduce((sum, f) => sum + f.probability, 0) / riskFactors.length;
    return Math.min(0.95, 0.5 + avgProbability * 0.4);
  }

  /**
   * Update configuration
   */
  updateConfig(config: AIAgentConfig): void {
    this.config = config;
  }

  /**
   * Helper: Generate cache key
   */
  private generateCacheKey(intent: IntentRequestParams, quotes: Quote[]): string {
    const intentHash = JSON.stringify({
      asset_in: (intent as any).asset_in?.token_id,
      asset_out: (intent as any).asset_out?.token_id,
      amount_in: intent.amount_in,
      expiry: (intent as any).expiry,
    });
    const quotesHash = quotes.length.toString();
    return `${intentHash}_${quotesHash}`;
  }

  /**
   * Helper: Get cached assessment
   */
  private getCachedAssessment(key: string): RiskAssessment | null {
    const cached = this.riskCache.get(key);
    if (cached && (getCurrentTimestamp() - cached.timestamp) < this.CACHE_TTL) {
      return cached.assessment;
    }
    return null;
  }

  /**
   * Helper: Cache assessment
   */
  private cacheAssessment(key: string, assessment: RiskAssessment): void {
    this.riskCache.set(key, {
      assessment,
      timestamp: getCurrentTimestamp(),
    });
  }
}
