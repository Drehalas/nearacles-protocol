/**
 * NEAR AI Integration for Nearacles Protocol
 * Advanced AI-powered decision making and market analysis
 */

export * from './ai-agent';
export * from './market-analyzer';
export * from './intent-optimizer';
export * from './risk-assessor';
export * from './sentiment-analyzer';
export * from './types';

// Re-export main components
export { AIAgent } from './ai-agent';
export { MarketAnalyzer } from './market-analyzer';
export { IntentOptimizer } from './intent-optimizer';
export { RiskAssessor } from './risk-assessor';
export { SentimentAnalyzer } from './sentiment-analyzer';

// AI Configuration
export const NEAR_AI_CONFIG = {
  DEFAULT_MODEL: 'near-ai-v1',
  OPENAI_MODEL: 'gpt-4-turbo',
  CLAUDE_MODEL: 'claude-3-sonnet',
  MAX_TOKENS: 4096,
  TEMPERATURE: 0.7,
  CONFIDENCE_THRESHOLD: 0.75,
  ANALYSIS_CACHE_TTL: 300, // 5 minutes
} as const;

// AI Endpoints
export const AI_ENDPOINTS = {
  NEAR_AI: 'https://api.near.ai/v1',
  OPENAI: 'https://api.openai.com/v1',
  ANTHROPIC: 'https://api.anthropic.com/v1',
  LOCAL: 'http://localhost:8080',
} as const;

// Version info
export const AI_VERSION = '1.0.0';
export const PROTOCOL_VERSION = 'v1';
