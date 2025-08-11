/**
 * Type definitions for NEAR AI System
 */

// AI Agent Configuration
export interface AIAgentConfig {
  model: 'gpt-4' | 'claude-3' | 'near-ai';
  api_key?: string;
  endpoint?: string;
  max_tokens: number;
  temperature: number;
  context_window: number;
}

// AI Decision Types
export interface AIDecision {
  action: 'execute' | 'wait' | 'cancel' | 'modify';
  confidence: number;
  reasoning: string;
  parameters?: any;
  risk_assessment: {
    level: 'low' | 'medium' | 'high' | 'critical';
    factors: string[];
  };
}

export interface AIDecisionContext {
  intent_data: any;
  market_conditions: any;
  historical_performance: any;
  risk_tolerance: number;
}

// Market Analysis Types
export interface MarketAnalysisResult {
  asset_pair: string;
  current_price: string;
  price_trend: 'up' | 'down' | 'stable';
  volatility: number;
  liquidity: number;
  recommended_action: 'buy' | 'sell' | 'hold';
  confidence: number;
  analysis_timestamp: number;
}

export interface RiskAssessment {
  overall_risk_score: number;
  risk_level: 'low' | 'medium' | 'high' | 'critical';
  confidence: number;
  factors: string[];
  recommendations: string[];
}

// AI Model Types
export interface AIModel {
  name: string;
  version: string;
  capabilities: string[];
}

// AI Memory and Learning
export interface AIMemory {
  decisions: AIDecision[];
  outcomes: any[];
  performance_metrics: AIPerformanceMetrics;
}

export interface LearningEvent {
  type: string;
  data: any;
  timestamp: number;
  impact: number;
}

export interface AIPerformanceMetrics {
  accuracy: number;
  precision: number;
  recall: number;
  f1_score: number;
  total_decisions: number;
  successful_decisions: number;
}

// AI Response
export interface AIResponse {
  success: boolean;
  data?: any;
  error?: AIError;
}

export interface AIError {
  code: string;
  message: string;
  details?: any;
}

// Additional types from main branch
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