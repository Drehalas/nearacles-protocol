/**
 * Type definitions for NEAR AI System
 */

// AI Agent Configuration
export interface AIModelInfo {
  name: string;
  provider: string;
  version: string;
  capabilities: string[];
  max_tokens: number;
}

export interface AIAgentConfig {
  model: AIModelInfo;
  api_key?: string;
  endpoint?: string;
  temperature: number;
  context_window: number;
  max_tokens?: number;
  enable_reasoning?: boolean;
  enable_memory?: boolean;
  risk_tolerance?: 'conservative' | 'moderate' | 'aggressive';
}

// AI Decision Types
export interface AIDecision {
  action: 'execute' | 'wait' | 'cancel' | 'modify';
  confidence: number;
  reasoning: string;
  parameters?: Record<string, unknown>;
  risk_assessment: {
    level: 'low' | 'medium' | 'high' | 'critical';
    factors: string[];
  };
  risk_score?: number;
  expected_outcome?: Record<string, unknown>;
  alternative_strategies?: string[];
  monitoring_points?: string[];
  execution_params?: Record<string, unknown>;
}

// Alias for backward compatibility
export type IntentAIDecision = AIDecision;

export interface AIDecisionContext {
  intent_data: Record<string, unknown>;
  market_conditions: Record<string, unknown>;
  historical_performance: Record<string, unknown>;
  risk_tolerance: number;
  user_profile?: Record<string, unknown>;
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
  market_data?: MarketData;
  technical_indicators?: TechnicalIndicators;
  trend_direction?: 'up' | 'down' | 'sideways';
  sentiment_score?: number;
  strength_score?: number;
  reasoning?: string[];
  time_horizon?: string;
}

export interface MarketData {
  symbol: string;
  price: number;
  volume: number;
  high_24h: number;
  low_24h: number;
  change_24h: number;
  market_cap?: number;
  timestamp: number;
  historical_prices?: Array<{ timestamp: number; price: number; volume: number }>;
  // Additional properties for compatibility
  volume_24h?: string;
  price_change_24h?: number;
  liquidity_score?: number;
  volatility_24h?: number;
  volatility_index?: number;
}

export interface TechnicalIndicators {
  rsi: number;
  macd: { signal: number; histogram: number; macd: number };
  bollinger_bands: { upper: number; middle: number; lower: number };
  moving_averages: { sma_20: number; sma_50: number; sma_200: number };
  volume_profile: { support: number; resistance: number };
  momentum_indicators: { stochastic: number; williams_r: number };
}

export interface RiskFactor {
  type: string;
  factor?: string; // Alternative name for type (for backward compatibility)
  level?: 'low' | 'medium' | 'high' | 'critical';
  severity: 'low' | 'medium' | 'high' | 'critical';
  impact: number;
  impact_score?: number;
  probability: number;
  description: string;
  mitigation_strategies?: string[];
}

export interface RiskAssessment {
  overall_risk_score: number;
  risk_level: 'low' | 'medium' | 'high' | 'critical';
  confidence: number;
  factors: string[];
  recommendations: string[];
  risk_factors?: string[];
  suggested_slippage?: number;
}

// AI Model Types
export interface AIModel {
  name: string;
  version: string;
  capabilities: string[];
}

// AI Memory and Learning
export interface AIMemory {
  id?: string;
  decisions: AIDecision[];
  outcomes: Record<string, unknown>[];
  performance_metrics: AIPerformanceMetrics;
  importance_score: number;
  type?: string;
  content?: string;
  access_count?: number;
  created_at?: number;
  last_accessed?: number;
}

export interface LearningEvent {
  type?: string;
  data?: Record<string, unknown>;
  timestamp: number;
  impact?: number;
  outcome?: 'success' | 'failure';
  confidence_adjustment?: number;
  lesson_learned?: string;
  event_type: string;
  event_data: Record<string, unknown>;
}

export interface AIPerformanceMetrics {
  accuracy: number;
  precision: number;
  recall: number;
  f1_score: number;
  total_decisions: number;
  successful_decisions: number;
  decision_accuracy: number;
  prediction_accuracy: number;
  risk_assessment_accuracy: number;
  user_satisfaction_score: number;
  execution_success_rate: number;
  average_response_time: number;
  cost_efficiency: number;
  learning_rate: number;
  model_version: string;
  evaluation_period: {
    start: number;
    end: number;
  };
}

// AI Response
export interface AIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: AIError;
  metadata?: Record<string, unknown>;
}

export interface AIError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
  model?: string;
  severity?: 'low' | 'medium' | 'high' | 'critical';
  timestamp?: number;
}

// Additional types from main branch
export interface OptimizationCriteria {
  priority: 'speed' | 'cost' | 'security' | 'balanced';
  max_slippage: number;
  max_execution_time: number;
  min_confidence: number;
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