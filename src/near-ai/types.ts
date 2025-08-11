/**
<<<<<<< HEAD
 * TypeScript interfaces for NEAR AI Integration
 */

// Core AI Types
export interface AIModel {
  name: string;
  provider: 'near-ai' | 'openai' | 'anthropic' | 'local';
  version: string;
  capabilities: AICapability[];
  max_tokens: number;
  cost_per_token?: number;
}

export type AICapability = 
  | 'text-generation'
  | 'market-analysis'
  | 'risk-assessment'
  | 'sentiment-analysis'
  | 'intent-optimization'
  | 'strategy-generation'
  | 'anomaly-detection';

// AI Agent Configuration
export interface AIAgentConfig {
  model: AIModel;
  temperature: number;
  max_tokens: number;
  system_prompt?: string;
  context_window: number;
  enable_reasoning: boolean;
  enable_memory: boolean;
  risk_tolerance: 'conservative' | 'moderate' | 'aggressive';
}

// Market Analysis Types
export interface MarketData {
  asset_pair: string;
  price: string;
  volume_24h: string;
  price_change_24h: number;
  price_change_7d: number;
  market_cap?: string;
  liquidity_score: number;
  volatility_index: number;
  timestamp: number;
}

export interface TechnicalIndicators {
  rsi: number;
  macd: {
    signal: number;
    histogram: number;
    macd: number;
  };
  bollinger_bands: {
    upper: number;
    middle: number;
    lower: number;
  };
  moving_averages: {
    sma_20: number;
    sma_50: number;
    ema_12: number;
    ema_26: number;
  };
  support_resistance: {
    support_levels: number[];
    resistance_levels: number[];
  };
}

export interface MarketAnalysisResult {
  asset_pair: string;
  market_data: MarketData;
  technical_indicators: TechnicalIndicators;
  sentiment_score: number;
  trend_direction: 'bullish' | 'bearish' | 'neutral';
  strength_score: number;
  recommended_action: 'buy' | 'sell' | 'hold' | 'wait';
  confidence: number;
  reasoning: string[];
  time_horizon: 'immediate' | 'short' | 'medium' | 'long';
  analysis_timestamp: number;
}

// Risk Assessment Types
export interface RiskFactor {
  type: 'market' | 'liquidity' | 'smart_contract' | 'regulatory' | 'operational';
  level: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  impact_score: number;
  probability: number;
  mitigation_strategies: string[];
}

export interface RiskAssessment {
  overall_risk_score: number;
  risk_level: 'low' | 'medium' | 'high' | 'critical';
  risk_factors: RiskFactor[];
  recommendations: string[];
  max_position_size?: string;
  suggested_slippage?: number;
  warning_flags: string[];
  assessment_timestamp: number;
}

// Intent Optimization Types
export interface OptimizationCriteria {
  primary_objective: 'maximize_output' | 'minimize_cost' | 'minimize_time' | 'minimize_risk';
  constraints: {
    max_slippage?: number;
    max_execution_time?: number;
    max_fee?: string;
    preferred_solvers?: string[];
    blacklisted_solvers?: string[];
  };
  preferences: {
    speed_weight: number;
    cost_weight: number;
    reliability_weight: number;
    privacy_weight: number;
  };
}

export interface OptimizationResult {
  original_intent: any;
  optimized_intent: any;
  improvements: {
    estimated_gas_savings?: string;
    estimated_time_savings?: number;
    estimated_output_increase?: string;
    risk_reduction?: number;
  };
  optimization_strategies: string[];
  confidence: number;
  reasoning: string;
}

// Sentiment Analysis Types
export interface SentimentSource {
  type: 'twitter' | 'reddit' | 'news' | 'telegram' | 'discord' | 'github';
  url?: string;
  weight: number;
  credibility_score: number;
}

export interface SentimentData {
  source: SentimentSource;
  content: string;
  sentiment_score: number;
  keywords: string[];
  influence_score: number;
  timestamp: number;
}

export interface SentimentAnalysisResult {
  asset: string;
  overall_sentiment: number;
  sentiment_trend: 'improving' | 'declining' | 'stable';
  sentiment_breakdown: {
    positive: number;
    negative: number;
    neutral: number;
  };
  key_themes: string[];
  influencer_sentiment: number;
  news_sentiment: number;
  social_volume: number;
  analysis_period: {
    start: number;
    end: number;
  };
}

// AI Decision Types
export interface AIDecisionContext {
  user_profile?: {
    risk_tolerance: 'low' | 'medium' | 'high';
    experience_level: 'beginner' | 'intermediate' | 'expert';
    trading_history?: any[];
    preferences?: any;
  };
  market_conditions: {
    volatility: number;
    liquidity: number;
    trend: string;
  };
  portfolio_context?: {
    current_positions: any[];
    available_balance: string;
    diversification_score: number;
  };
}

export interface AIDecision {
  action: 'execute' | 'wait' | 'cancel' | 'modify' | 'split' | 'delay';
  confidence: number;
  reasoning: string[];
  risk_score: number;
  expected_outcome: {
    success_probability: number;
    estimated_return?: string;
    time_to_completion?: number;
  };
  alternative_strategies?: string[];
  monitoring_points: string[];
  execution_params?: any;
}

// Strategy Generation Types
export interface TradingStrategy {
  name: string;
  type: 'arbitrage' | 'dca' | 'momentum' | 'mean_reversion' | 'carry' | 'pairs';
  description: string;
  parameters: any;
  expected_return: number;
  risk_level: number;
  time_horizon: string;
  market_conditions: string[];
  implementation_steps: string[];
}

export interface StrategyRecommendation {
  strategies: TradingStrategy[];
  recommended_allocation: { [strategy: string]: number };
  reasoning: string;
  backtesting_results?: any;
  confidence: number;
}

// AI Memory and Learning Types
export interface AIMemory {
  id: string;
  type: 'decision' | 'outcome' | 'pattern' | 'user_preference';
  content: any;
  importance_score: number;
  access_count: number;
  created_at: number;
  last_accessed: number;
  expires_at?: number;
}

export interface LearningEvent {
  event_type: 'intent_executed' | 'quote_accepted' | 'trade_completed' | 'user_feedback';
  event_data: any;
  outcome: 'positive' | 'negative' | 'neutral';
  lesson_learned?: string;
  confidence_adjustment?: number;
  timestamp: number;
}

// AI Performance Metrics
export interface AIPerformanceMetrics {
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

// Error and Monitoring Types
export interface AIError {
  code: string;
  message: string;
  model: string;
  context?: any;
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: number;
  stack_trace?: string;
}

export interface AIMonitoringEvent {
  type: 'performance' | 'error' | 'usage' | 'cost' | 'anomaly';
  data: any;
  threshold_breached?: boolean;
  alert_level: 'info' | 'warning' | 'error' | 'critical';
  timestamp: number;
}

// Utility Types
export type AITaskStatus = 'pending' | 'in_progress' | 'completed' | 'failed' | 'cancelled';

export interface AITask {
  id: string;
  type: string;
  status: AITaskStatus;
  progress: number;
  created_at: number;
  started_at?: number;
  completed_at?: number;
  result?: any;
  error?: AIError;
}

export interface AIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: AIError;
  metadata?: {
    model_used: string;
    tokens_consumed: number;
    processing_time: number;
    confidence: number;
  };
}
=======
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
>>>>>>> origin/main
