/**
 * AI Agent Core Implementation for NEAR Protocol
 * Advanced AI-powered decision making and analysis
 */

import { 
  AIAgentConfig, 
  AIDecision, 
  AIDecisionContext,
  MarketAnalysisResult,
  RiskAssessment,
  AIResponse,
  AIError,
  AIMemory,
  LearningEvent,
  AIPerformanceMetrics
} from './types';
import { Quote, Intent, IntentRequestParams } from '../near-intent/types';
import { OptimizationResult } from './intent-optimizer';
import { getCurrentTimestamp } from '../utils/helpers';
import { MarketAnalyzer } from './market-analyzer';
import { RiskAssessor } from './risk-assessor';
import { IntentOptimizer } from './intent-optimizer';
import { MarketDataProviders } from './market-data-providers';

export class AIAgent {
  private config: AIAgentConfig;
  private marketAnalyzer: MarketAnalyzer;
  private riskAssessor: RiskAssessor;
  private intentOptimizer: IntentOptimizer;
  private memories: Map<string, AIMemory> = new Map();
  private learningEvents: LearningEvent[] = [];
  private performanceMetrics: AIPerformanceMetrics;

  constructor(config: AIAgentConfig) {
    this.config = config;
    this.marketAnalyzer = new MarketAnalyzer(config);
    this.riskAssessor = new RiskAssessor(config);
    
    // Create a MarketDataProviders instance for IntentOptimizer
    const marketDataConfig = {
      providers: ['mock'],
      fallback_providers: ['mock'],
      cache_duration: 300000,
      update_frequency: 300000,
      fallback_enabled: true,
      timeout_ms: 10000
    };
    const marketDataProviders = new MarketDataProviders(marketDataConfig);
    
    // Create optimization config
    const optimizationConfig = {
      enableRouteOptimization: true,
      enableGasOptimization: true,
      enableTimingOptimization: true,
      enableSlippageOptimization: true,
      enableArbitrageDetection: true,
      maxSlippage: 1.0,
      maxGasPrice: '0.1',
      executionTimeLimit: 300,
      minProfitThreshold: 0.001
    };
    
    this.intentOptimizer = new IntentOptimizer(marketDataProviders, optimizationConfig);
    
    this.performanceMetrics = {
      accuracy: 0.75,
      precision: 0.78,
      recall: 0.72,
      f1_score: 0.75,
      total_decisions: 0,
      successful_decisions: 0,
      decision_accuracy: 0.75,
      prediction_accuracy: 0.70,
      risk_assessment_accuracy: 0.80,
      user_satisfaction_score: 0.85,
      execution_success_rate: 0.90,
      average_response_time: 1.2,
      cost_efficiency: 0.88,
      learning_rate: 0.05,
      model_version: config.model.version,
      evaluation_period: {
        start: getCurrentTimestamp() - 86400 * 30, // 30 days
        end: getCurrentTimestamp(),
      },
    };
  }

  /**
   * Convert Intent to IntentRequestParams for internal methods
   */
  private convertIntentToParams(intent: Intent): IntentRequestParams {
    return {
      asset_in: intent.asset_in.token_id,
      asset_out: intent.asset_out.token_id,
      amount_in: intent.amount_in,
      min_amount_out: intent.amount_out_min,
      slippage_tolerance: 0.01, // Default 1%
      deadline: intent.expiry,
    };
  }

  /**
   * Make an AI-powered decision
   */
  async makeDecision(
    intent: Intent,
    quotes: Quote[],
    context?: AIDecisionContext
  ): Promise<AIResponse<AIDecision>> {
    const startTime = Date.now();

    try {
      // Step 1: Analyze market conditions
      const marketAnalysis = await this.marketAnalyzer.analyzeMarket(
        typeof intent.asset_in === 'string' ? intent.asset_in : intent.asset_in?.token_id || 'unknown',
        typeof intent.asset_out === 'string' ? intent.asset_out : intent.asset_out?.token_id || 'unknown'
      );

      // Step 2: Assess risks
      const intentParams = this.convertIntentToParams(intent);
      const riskAssessment = await this.riskAssessor.assessRisk(intentParams, quotes);

      // Step 3: Optimize intent if needed
      const optimization = await this.intentOptimizer.optimizeIntent(
        'NEAR', 'USDC', '100', {
        primary_objective: 'maximize_output',
        constraints: {
          max_slippage: 0.02,
          max_execution_time: 300,
        },
        preferences: {
          speed_weight: 0.3,
          cost_weight: 0.4,
          reliability_weight: 0.3,
          privacy_weight: 0.1,
        },
      });

      // Step 4: Apply learned patterns
      const historicalPattern = this.findSimilarHistoricalDecisions(intentParams);
      
      // Step 5: Generate decision
      const decision = await this.generateDecision(
        intentParams,
        quotes,
        marketAnalysis.data!,
        riskAssessment.data!,
        optimization,
        context,
        historicalPattern
      );

      // Step 6: Store decision for learning
      this.storeDecisionMemory(decision, {
        intent,
        quotes,
        marketAnalysis: marketAnalysis.data,
        riskAssessment: riskAssessment.data,
      });

      const processingTime = Date.now() - startTime;

      return {
        success: true,
        data: decision,
        metadata: {
          model_used: this.config.model.name,
          tokens_consumed: this.estimateTokenUsage(intentParams, quotes),
          processing_time: processingTime,
          confidence: decision.confidence,
        },
      };

    } catch (error) {
      const aiError: AIError = {
        code: 'DECISION_GENERATION_FAILED',
        message: error instanceof Error ? error.message : 'Failed to generate AI decision',
        model: this.config.model.name,
        severity: 'high',
        timestamp: getCurrentTimestamp(),
      };

      return {
        success: false,
        error: aiError,
      };
    }
  }

  /**
   * Generate AI decision based on analysis
   */
  private async generateDecision(
    intent: IntentRequestParams,
    quotes: Quote[],
    marketAnalysis: MarketAnalysisResult,
    riskAssessment: RiskAssessment,
    optimization: OptimizationResult,
    context?: AIDecisionContext,
    historicalPattern?: AIMemory
  ): Promise<AIDecision> {
    const reasoning: string[] = [];
    let confidence = 0.7;
    let action: AIDecision['action'] = 'wait';

    // Market analysis reasoning
    if (marketAnalysis.recommended_action === 'buy' && marketAnalysis.confidence > 0.7) {
      const assetOutSymbol = typeof intent.asset_out === 'string' ? intent.asset_out : (intent.asset_out as any)?.symbol || 'target asset';
      reasoning.push(`Market analysis suggests favorable conditions for ${assetOutSymbol} (confidence: ${(marketAnalysis.confidence * 100).toFixed(1)}%)`);
      confidence += 0.1;
      action = 'execute';
    } else if (marketAnalysis.recommended_action === 'hold') {
      reasoning.push(`Market conditions suggest waiting for better timing`);
      action = 'wait';
    }

    // Risk assessment reasoning
    if (riskAssessment.risk_level === 'low') {
      reasoning.push(`Low risk environment detected (risk score: ${riskAssessment.overall_risk_score.toFixed(2)})`);
      confidence += 0.1;
    } else if (riskAssessment.risk_level === 'high') {
      reasoning.push(`High risk detected: ${(riskAssessment.risk_factors || riskAssessment.factors).join(', ')}`);
      confidence -= 0.2;
      action = 'cancel';
    }

    // Quote quality analysis
    const bestQuote = quotes.find(q => 'recommendation' in q && (q as Quote & { recommendation: string }).recommendation === 'accept');
    if (bestQuote) {
      reasoning.push(`High-quality quote available from ${bestQuote.solver_id || 'unknown'} with score ${('score' in bestQuote ? (bestQuote as Quote & { score: number }).score : 0)}/100`);
      confidence += 0.1;
    } else {
      reasoning.push(`No high-quality quotes available`);
      confidence -= 0.15;
      action = 'wait';
    }

    // Optimization benefits
    if (optimization.arbitrage_opportunities && optimization.arbitrage_opportunities.length > 0) {
      reasoning.push(`Arbitrage opportunities available: ${optimization.arbitrage_opportunities.length} found`);
      confidence += 0.05;
      action = 'modify';
    }

    // User context consideration
    if (context?.user_profile?.risk_tolerance === 'low' && riskAssessment.risk_level !== 'low') {
      reasoning.push(`User risk tolerance (low) doesn't match current risk level (${riskAssessment.risk_level})`);
      confidence -= 0.1;
      action = 'wait';
    }

    // Historical pattern influence
    if (historicalPattern) {
      reasoning.push(`Similar historical pattern found with ${historicalPattern.importance_score > 0.7 ? 'positive' : 'mixed'} outcomes`);
      confidence += historicalPattern.importance_score * 0.1;
    }

    // Confidence bounds
    confidence = Math.max(0.1, Math.min(0.95, confidence));

    // Final action determination
    if (confidence < 0.3) {
      action = 'cancel';
      reasoning.push(`Low confidence (${(confidence * 100).toFixed(1)}%) suggests canceling`);
    } else if (confidence < 0.5) {
      action = 'wait';
      reasoning.push(`Medium confidence suggests waiting for better conditions`);
    }

    return {
      action,
      confidence,
      reasoning: reasoning.join(' '),
      risk_assessment: {
        level: riskAssessment.risk_level,
        factors: riskAssessment.risk_factors || riskAssessment.factors || [],
      },
      risk_score: riskAssessment.overall_risk_score,
      expected_outcome: {
        success_probability: confidence * 0.9, // Slightly more conservative
        estimated_return: bestQuote ? 
          this.calculateEstimatedReturn(intent, bestQuote) : undefined,
        time_to_completion: bestQuote ? bestQuote.execution_time_estimate : undefined,
      },
      alternative_strategies: this.generateAlternativeStrategies(intent, marketAnalysis),
      monitoring_points: [
        'Price volatility changes',
        'Liquidity conditions',
        'Solver reputation updates',
        'Market sentiment shifts',
      ],
      execution_params: action === 'execute' && bestQuote ? {
        quote_id: bestQuote?.solver_id || 'unknown',
        max_slippage: ('suggested_slippage' in riskAssessment ? (riskAssessment as { suggested_slippage: number }).suggested_slippage : null) || 0.01,
        timeout: 300,
      } : undefined,
    };
  }

  /**
   * Learn from execution outcome
   */
  async learnFromOutcome(
    originalDecision: AIDecision,
    actualOutcome: Record<string, unknown>,
    userFeedback?: 'positive' | 'negative' | 'neutral'
  ): Promise<void> {
    const learningEvent: LearningEvent = {
      event_type: 'user_feedback',
      event_data: {
        decision: originalDecision,
        outcome: actualOutcome,
        feedback: userFeedback,
      },
      outcome: this.mapOutcome(userFeedback || this.evaluateOutcome(originalDecision, actualOutcome)),
      timestamp: getCurrentTimestamp(),
    };

    // Calculate confidence adjustment
    if (learningEvent.outcome === 'success') {
      learningEvent.confidence_adjustment = 0.05;
      learningEvent.lesson_learned = 'Decision criteria performed well';
    } else if (learningEvent.outcome === 'failure') {
      learningEvent.confidence_adjustment = -0.1;
      learningEvent.lesson_learned = 'Need to improve decision criteria';
    }

    this.learningEvents.push(learningEvent);
    this.updatePerformanceMetrics(learningEvent);

    // Store as memory for future decisions
    this.storeMemory({
      type: 'outcome',
      content: JSON.stringify(learningEvent),
      importance_score: Math.abs(learningEvent.confidence_adjustment || 0) * 10,
    });
  }

  /**
   * Get AI agent status and performance
   */
  getPerformanceMetrics(): AIPerformanceMetrics {
    return { ...this.performanceMetrics };
  }

  /**
   * Update AI configuration
   */
  updateConfig(newConfig: Partial<AIAgentConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    // Update component configurations
    // TODO: Implement updateConfig methods in analyzers
    // this.marketAnalyzer.updateConfig(this.config);
    // this.riskAssessor.updateConfig(this.config);
    // this.intentOptimizer.updateConfig(this.config);
  }

  /**
   * Helper: Find similar historical decisions
   */
  private findSimilarHistoricalDecisions(intent: IntentRequestParams): AIMemory | undefined {
    const relevantMemories = Array.from(this.memories.values())
      .filter(m => m.type === 'decision')
      .sort((a, b) => b.importance_score - a.importance_score);

    // Simple similarity check based on asset pair
    return relevantMemories.find(m => {
      try {
        const content = typeof m.content === 'string' ? JSON.parse(m.content) : m.content;
        const intentAssetIn = typeof intent.asset_in === 'string' ? intent.asset_in : (intent.asset_in as any)?.token_id;
        const intentAssetOut = typeof intent.asset_out === 'string' ? intent.asset_out : (intent.asset_out as any)?.token_id;
        return content?.intent?.asset_in?.token_id === intentAssetIn &&
               content?.intent?.asset_out?.token_id === intentAssetOut;
      } catch {
        return false;
      }
    });
  }

  /**
   * Helper: Store decision memory
   */
  private storeDecisionMemory(decision: AIDecision, context: Record<string, unknown>): void {
    this.storeMemory({
      type: 'decision',
      content: JSON.stringify({ decision, context }),
      importance_score: decision.confidence,
    });
  }

  /**
   * Helper: Store memory
   */
  private storeMemory(memory: Partial<AIMemory>): void {
    const memoryId = `mem_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const fullMemory: AIMemory = {
      id: memoryId,
      access_count: 0,
      created_at: getCurrentTimestamp(),
      last_accessed: getCurrentTimestamp(),
      decisions: [],
      outcomes: [],
      performance_metrics: this.performanceMetrics,
      importance_score: 0.5,
      type: 'general',
      content: '',
      ...memory,
    };

    this.memories.set(memoryId, fullMemory);

    // Cleanup old memories if we have too many
    if (this.memories.size > 1000) {
      this.cleanupOldMemories();
    }
  }

  /**
   * Helper: Cleanup old memories
   */
  private cleanupOldMemories(): void {
    const memoriesArray = Array.from(this.memories.entries())
      .sort((a, b) => {
        // Sort by importance and recency
        const scoreA = a[1].importance_score * 0.7 + ((a[1].last_accessed || 0) / getCurrentTimestamp()) * 0.3;
        const scoreB = b[1].importance_score * 0.7 + ((b[1].last_accessed || 0) / getCurrentTimestamp()) * 0.3;
        return scoreB - scoreA;
      });

    // Keep top 800 memories
    const toRemove = memoriesArray.slice(800);
    toRemove.forEach(([id]) => this.memories.delete(id));
  }

  /**
   * Helper: Estimate token usage
   */
  private estimateTokenUsage(intent: IntentRequestParams, quotes: Quote[]): number {
    // Rough estimation based on content size
    const intentTokens = JSON.stringify(intent).length / 4;
    const quotesTokens = JSON.stringify(quotes).length / 4;
    const analysisTokens = 500; // Estimated for analysis prompts
    
    return Math.ceil(intentTokens + quotesTokens + analysisTokens);
  }

  /**
   * Helper: Calculate estimated return
   */
  private calculateEstimatedReturn(intent: IntentRequestParams, quote: Quote): string {
    try {
      const inputAmount = BigInt(intent.amount_in || '0');
      const outputAmount = BigInt(quote.amount_out || '0');
      const fee = BigInt(quote.fee || '0');
      
      // Simple return calculation (output - input - fee) / input
      const netGain = outputAmount - inputAmount - fee;
      const returnPercentage = inputAmount > 0 ? Number(netGain * BigInt(10000) / inputAmount) / 100 : 0;
      
      return `${returnPercentage.toFixed(2)}%`;
    } catch {
      return '0.00%';
    }
  }

  /**
   * Helper: Generate alternative strategies
   */
  private generateAlternativeStrategies(intent: IntentRequestParams, marketAnalysis: MarketAnalysisResult): string[] {
    const strategies: string[] = [];

    if (marketAnalysis.trend_direction === 'down') {
      strategies.push('Wait for market reversal before executing');
      strategies.push('Consider dollar-cost averaging approach');
    }

    if (marketAnalysis.market_data?.volatility_index && marketAnalysis.market_data.volatility_index > 0.5) {
      strategies.push('Split intent into smaller chunks to reduce impact');
      strategies.push('Use limit orders instead of market execution');
    }

    if (marketAnalysis.market_data?.liquidity_score !== undefined && marketAnalysis.market_data.liquidity_score < 0.7) {
      strategies.push('Wait for better liquidity conditions');
      strategies.push('Consider alternative asset pairs with better liquidity');
    }

    return strategies;
  }

  /**
   * Helper: Evaluate outcome automatically
   */
  private evaluateOutcome(decision: AIDecision, outcome: Record<string, unknown>): 'positive' | 'negative' | 'neutral' {
    if (!outcome) return 'neutral';

    // Simple evaluation based on execution success and expected vs actual results
    if (outcome.success && typeof outcome.actual_return === 'number' && outcome.actual_return > 0) {
      return 'positive';
    } else if (!outcome.success || (typeof outcome.actual_return === 'number' && outcome.actual_return < -0.05)) {
      return 'negative';
    }

    return 'neutral';
  }

  /**
   * Helper: Update performance metrics
   */
  private updatePerformanceMetrics(learningEvent: LearningEvent): void {
    const learningRate = this.performanceMetrics.learning_rate;
    
    if (learningEvent.event_type === 'user_feedback') {
      if (learningEvent.outcome === 'success') {
        this.performanceMetrics.user_satisfaction_score = 
          this.performanceMetrics.user_satisfaction_score * (1 - learningRate) + 1.0 * learningRate;
      } else if (learningEvent.outcome === 'failure') {
        this.performanceMetrics.user_satisfaction_score = 
          this.performanceMetrics.user_satisfaction_score * (1 - learningRate) + 0.0 * learningRate;
      }
    }

    // Update evaluation period
    this.performanceMetrics.evaluation_period.end = getCurrentTimestamp();
  }

  /**
   * Map outcome to proper type
   */
  private mapOutcome(outcome: string): 'success' | 'failure' {
    if (outcome === 'positive' || outcome === 'success') {
      return 'success';
    }
    return 'failure';
  }
}
