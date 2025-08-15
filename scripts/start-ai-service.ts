#!/usr/bin/env node

/**
 * AI Service Startup Script for NEAR Oracle Intent Protocol
 * Initializes and starts the AI service for testnet deployment
 */

import { AIService, AIServiceConfig } from '../src/infrastructure/ai-service';
import { AIAgentConfig } from '../src/near-ai/types';
import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables
config({ path: resolve(__dirname, '../config/.env') });

// Default AI configuration for testnet
const DEFAULT_AI_CONFIG: AIAgentConfig = {
  model: {
    name: process.env.AI_MODEL_NAME || 'near-ai-v1',
    version: process.env.AI_MODEL_VERSION || '1.0.0',
    provider: process.env.AI_MODEL_PROVIDER || 'local',
    endpoint: process.env.AI_MODEL_ENDPOINT || 'http://localhost:8080',
    api_key: process.env.AI_API_KEY || '',
    max_tokens: parseInt(process.env.AI_MAX_TOKENS || '4096'),
    temperature: parseFloat(process.env.AI_TEMPERATURE || '0.7'),
  },
  capabilities: {
    market_analysis: true,
    risk_assessment: true,
    intent_optimization: true,
    sentiment_analysis: true,
    learning: true,
    prediction: true,
  },
  performance: {
    max_response_time: parseInt(process.env.AI_MAX_RESPONSE_TIME || '5000'),
    cache_ttl: parseInt(process.env.AI_CACHE_TTL || '300'),
    batch_size: parseInt(process.env.AI_BATCH_SIZE || '10'),
    concurrent_requests: parseInt(process.env.AI_CONCURRENT_REQUESTS || '5'),
  },
  security: {
    rate_limit: parseInt(process.env.AI_RATE_LIMIT || '100'),
    allowed_origins: process.env.AI_ALLOWED_ORIGINS?.split(',') || ['localhost'],
    require_auth: process.env.AI_REQUIRE_AUTH === 'true',
    encryption_enabled: process.env.AI_ENCRYPTION_ENABLED === 'true',
  },
};

// AI Service configuration
const AI_SERVICE_CONFIG: AIServiceConfig = {
  websocketUrl: process.env.WEBSOCKET_URL || 'ws://localhost:8080',
  aiConfig: DEFAULT_AI_CONFIG,
  enableLearning: process.env.AI_LEARNING_ENABLED !== 'false',
  logLevel: (process.env.LOG_LEVEL as any) || 'info',
};

let aiService: AIService;

async function startAIService(): Promise<void> {
  try {
    console.log('🤖 Starting NEAR Oracle AI Service...');
    console.log(`Configuration:`);
    console.log(`- WebSocket URL: ${AI_SERVICE_CONFIG.websocketUrl}`);
    console.log(`- AI Model: ${AI_SERVICE_CONFIG.aiConfig.model.name} v${AI_SERVICE_CONFIG.aiConfig.model.version}`);
    console.log(`- Learning Enabled: ${AI_SERVICE_CONFIG.enableLearning}`);
    console.log(`- Log Level: ${AI_SERVICE_CONFIG.logLevel}`);
    
    // Create and start AI service
    aiService = new AIService(AI_SERVICE_CONFIG);
    await aiService.start();
    
    console.log('✅ AI Service started successfully!');
    console.log('📊 Performance metrics available at /metrics endpoint');
    console.log('🔧 Health check available at /health endpoint');
    
    // Log initial metrics
    const metrics = aiService.getPerformanceMetrics();
    console.log(`📈 Initial AI Performance:`);
    console.log(`- Decision Accuracy: ${(metrics.decision_accuracy * 100).toFixed(1)}%`);
    console.log(`- Risk Assessment Accuracy: ${(metrics.risk_assessment_accuracy * 100).toFixed(1)}%`);
    console.log(`- User Satisfaction: ${(metrics.user_satisfaction_score * 100).toFixed(1)}%`);
    
  } catch (error) {
    console.error('❌ Failed to start AI service:', error);
    process.exit(1);
  }
}

async function stopAIService(): Promise<void> {
  if (aiService) {
    console.log('🛑 Stopping AI Service...');
    await aiService.stop();
    console.log('✅ AI Service stopped gracefully');
  }
  process.exit(0);
}

// Handle graceful shutdown
process.on('SIGINT', stopAIService);
process.on('SIGTERM', stopAIService);
process.on('uncaughtException', (error) => {
  console.error('💥 Uncaught exception:', error);
  stopAIService();
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 Unhandled rejection at:', promise, 'reason:', reason);
  stopAIService();
});

// Start the service
if (require.main === module) {
  startAIService().catch((error) => {
    console.error('💥 Failed to start AI service:', error);
    process.exit(1);
  });
}

export { startAIService, stopAIService };