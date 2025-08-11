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