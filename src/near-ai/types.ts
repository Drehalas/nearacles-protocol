/**
 * AI Agent Types for NEAR Intent Protocol
 */

export interface AIAgentConfig {
  model: {
    name: string;
    provider: string;
    version: string;
    capabilities: string[];
    max_tokens: number;
  };
  temperature: number;
  max_tokens: number;
  context_window: number;
  enable_reasoning: boolean;
  enable_memory: boolean;
  risk_tolerance: 'low' | 'moderate' | 'high';
}

export interface AIResponse {
  content: string;
  confidence: number;
  reasoning?: string;
  sources?: string[];
  metadata?: Record<string, any>;
}

export interface AIError {
  code: string;
  message: string;
  details?: Record<string, any>;
}

export interface OptimizationCriteria {
  priority: 'speed' | 'cost' | 'security' | 'balanced';
  max_slippage: number;
  max_execution_time: number;
  min_confidence: number;
}

export interface OptimizationResult {
  optimal_route: any;
  alternative_routes: any[];
  arbitrage_opportunities: any[];
  optimization_metrics: {
    gas_savings: string;
    slippage_reduction: number;
    time_optimization: number;
    profit_enhancement: number;
  };
  execution_strategy: {
    timing: 'immediate' | 'delayed' | 'split';
    split_orders?: any[];
    conditions?: any[];
  };
  risk_assessment: {
    overall_risk: number;
    execution_risk: number;
    market_risk: number;
    recommendations: string[];
  };
}

export interface TradingStrategy {
  id: string;
  name: string;
  type: 'arbitrage' | 'market_making' | 'trend_following' | 'mean_reversion';
  parameters: Record<string, any>;
  risk_profile: 'low' | 'medium' | 'high';
}

export interface StrategyRecommendation {
  strategy: TradingStrategy;
  confidence: number;
  expected_return: number;
  risk_score: number;
  reasoning: string;
}