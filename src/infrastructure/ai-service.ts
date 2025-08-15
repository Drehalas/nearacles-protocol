/**
 * AI Service Integration for NEAR Oracle Intent Protocol
 * Connects AI components to WebSocket infrastructure for testnet deployment
 */

import { AIAgent } from '../near-ai/ai-agent';
import { AIAgentConfig } from '../near-ai/types';
import { getCurrentTimestamp } from '../utils/helpers';
import WebSocket from 'ws';
import { WSMessage } from './websocket-server';

export interface AIServiceConfig {
  websocketUrl: string;
  aiConfig: AIAgentConfig;
  enableLearning: boolean;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
}

export class AIService {
  private aiAgent: AIAgent;
  private wsClient?: WebSocket;
  private config: AIServiceConfig;
  private isRunning = false;
  private reconnectInterval?: NodeJS.Timeout;

  constructor(config: AIServiceConfig) {
    this.config = config;
    this.aiAgent = new AIAgent(config.aiConfig);
  }

  /**
   * Start the AI service
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      this.log('info', 'AI service is already running');
      return;
    }

    try {
      this.log('info', 'Starting AI service...');
      this.isRunning = true;
      
      await this.connectToWebSocket();
      
      this.log('info', `AI service started successfully, connected to ${this.config.websocketUrl}`);
      
    } catch (error) {
      this.log('error', `Failed to start AI service: ${error instanceof Error ? error.message : 'Unknown error'}`);
      this.isRunning = false;
      throw error;
    }
  }

  /**
   * Stop the AI service
   */
  async stop(): Promise<void> {
    if (!this.isRunning) {
      return;
    }

    this.log('info', 'Stopping AI service...');
    this.isRunning = false;
    
    if (this.reconnectInterval) {
      clearInterval(this.reconnectInterval);
      this.reconnectInterval = undefined;
    }
    
    if (this.wsClient) {
      this.wsClient.close();
      this.wsClient = undefined;
    }
    
    this.log('info', 'AI service stopped');
  }

  /**
   * Connect to WebSocket server
   */
  private async connectToWebSocket(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.wsClient = new WebSocket(this.config.websocketUrl, {
          headers: {
            'User-Agent': 'AI-Service/1.0.0',
          },
        });

        this.wsClient.on('open', () => {
          this.log('info', 'Connected to WebSocket server');
          this.sendSystemMessage('AI service online and ready for intent processing');
          resolve();
        });

        this.wsClient.on('message', (data: string) => {
          try {
            const message = JSON.parse(data);
            this.handleWebSocketMessage(message);
          } catch (error) {
            this.log('error', `Failed to parse WebSocket message: ${error}`);
          }
        });

        this.wsClient.on('close', () => {
          this.log('warn', 'WebSocket connection closed');
          if (this.isRunning) {
            this.scheduleReconnect();
          }
        });

        this.wsClient.on('error', (error) => {
          this.log('error', `WebSocket error: ${error.message}`);
          reject(error);
        });

      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Handle incoming WebSocket messages
   */
  private async handleWebSocketMessage(message: any): Promise<void> {
    this.log('debug', `Received WebSocket message: ${message.type}`);

    switch (message.type) {
      case 'ai_request':
        await this.handleAIRequest(message);
        break;
      case 'intent':
        await this.handleIntent(message);
        break;
      case 'ping':
        this.sendPong();
        break;
      default:
        this.log('debug', `Unknown message type: ${message.type}`);
    }
  }

  /**
   * Handle AI requests
   */
  private async handleAIRequest(message: any): Promise<void> {
    const { action, intent, sender_id } = message.data;

    switch (action) {
      case 'process_intent':
        try {
          const result = await this.processIntent(intent);
          this.sendAIResponse({
            type: 'intent_processed',
            result,
            original_request_id: message.data.sender_id,
            target_client: sender_id,
          });
        } catch (error) {
          this.sendAIResponse({
            type: 'error',
            error: error instanceof Error ? error.message : 'Unknown error',
            original_request_id: message.data.sender_id,
            target_client: sender_id,
          });
        }
        break;
      default:
        this.log('warn', `Unknown AI action: ${action}`);
    }
  }

  /**
   * Handle direct intent messages
   */
  private async handleIntent(message: any): Promise<void> {
    try {
      const result = await this.processIntent(message.data);
      this.sendAIResponse({
        type: 'ai_analysis',
        result,
        intent_id: message.data.id,
      });
    } catch (error) {
      this.log('error', `Failed to process intent: ${error}`);
    }
  }

  /**
   * Send AI response via WebSocket
   */
  private sendAIResponse(data: any): void {
    if (this.wsClient && this.wsClient.readyState === WebSocket.OPEN) {
      const message = {
        type: 'ai_response',
        data,
        timestamp: getCurrentTimestamp(),
      };
      this.wsClient.send(JSON.stringify(message));
    }
  }

  /**
   * Send system message
   */
  private sendSystemMessage(message: string): void {
    if (this.wsClient && this.wsClient.readyState === WebSocket.OPEN) {
      const wsMessage = {
        type: 'response',
        data: {
          type: 'system',
          message,
        },
        timestamp: getCurrentTimestamp(),
      };
      this.wsClient.send(JSON.stringify(wsMessage));
    }
  }

  /**
   * Send pong response
   */
  private sendPong(): void {
    if (this.wsClient && this.wsClient.readyState === WebSocket.OPEN) {
      const message = {
        type: 'response',
        data: { type: 'pong', timestamp: getCurrentTimestamp() },
        timestamp: getCurrentTimestamp(),
      };
      this.wsClient.send(JSON.stringify(message));
    }
  }

  /**
   * Schedule reconnection
   */
  private scheduleReconnect(): void {
    if (!this.reconnectInterval) {
      this.log('info', 'Scheduling WebSocket reconnection...');
      this.reconnectInterval = setTimeout(() => {
        this.reconnectInterval = undefined;
        if (this.isRunning) {
          this.connectToWebSocket().catch((error) => {
            this.log('error', `Reconnection failed: ${error.message}`);
            this.scheduleReconnect();
          });
        }
      }, 5000); // Reconnect after 5 seconds
    }
  }

  /**
   * Process an intent using AI analysis
   */
  async processIntent(intentData: any): Promise<any> {
    if (!this.isRunning) {
      throw new Error('AI service is not running');
    }

    try {
      this.log('debug', `Processing intent: ${intentData.id || 'unknown'}`);
      
      // Convert intent data to proper format
      const intent = this.convertToIntent(intentData);
      const quotes = intentData.quotes || [];
      
      // Get AI decision
      const aiResponse = await this.aiAgent.makeDecision(intent, quotes, {
        intent_data: intentData,
        historical_performance: {},
        risk_tolerance: 0.5, // Convert from string to number
        user_profile: {
          risk_tolerance: intentData.user_risk_tolerance || 'medium',
          experience_level: intentData.user_experience || 'intermediate',
        },
        market_conditions: {
          volatility: intentData.market_volatility || 'normal',
          liquidity: intentData.market_liquidity || 'good',
        },
      });

      if (!aiResponse.success) {
        throw new Error(`AI decision failed: ${aiResponse.error?.message}`);
      }

      // Broadcast AI decision to solvers
      this.broadcastAIDecision(intentData.id, aiResponse.data!);
      
      this.log('info', `Intent processed successfully with action: ${aiResponse.data!.action}`);
      
      return {
        intent_id: intentData.id,
        ai_decision: aiResponse.data,
        metadata: aiResponse.metadata,
        timestamp: getCurrentTimestamp(),
      };

    } catch (error) {
      this.log('error', `Failed to process intent: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw error;
    }
  }

  /**
   * Learn from intent outcome
   */
  async learnFromOutcome(
    intentId: string, 
    decision: any, 
    outcome: any, 
    userFeedback?: 'positive' | 'negative' | 'neutral'
  ): Promise<void> {
    if (!this.config.enableLearning) {
      return;
    }

    try {
      await this.aiAgent.learnFromOutcome(decision, outcome, userFeedback);
      this.log('debug', `Learning from outcome for intent ${intentId}`);
    } catch (error) {
      this.log('error', `Failed to learn from outcome: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get AI performance metrics
   */
  getPerformanceMetrics(): any {
    return this.aiAgent.getPerformanceMetrics();
  }

  /**
   * Update AI configuration
   */
  updateConfig(newConfig: Partial<AIAgentConfig>): void {
    this.aiAgent.updateConfig(newConfig);
    this.log('info', 'AI configuration updated');
  }

  /**
   * Health check for AI service
   */
  getHealthStatus(): { status: string; metrics: any; timestamp: number } {
    return {
      status: this.isRunning ? 'healthy' : 'stopped',
      metrics: this.getPerformanceMetrics(),
      timestamp: getCurrentTimestamp(),
    };
  }

  /**
   * Convert raw intent data to proper Intent format
   */
  private convertToIntent(intentData: any): any {
    return {
      id: intentData.id || `intent_${Date.now()}`,
      asset_in: {
        token_id: intentData.asset_in || 'NEAR',
        amount: intentData.amount_in || '0',
      },
      asset_out: {
        token_id: intentData.asset_out || 'USDC',
        amount: intentData.amount_out || '0',
      },
      amount_in: intentData.amount_in || '0',
      amount_out_min: intentData.min_amount_out || '0',
      expiry: intentData.deadline || (getCurrentTimestamp() + 3600), // 1 hour default
      slippage_tolerance: intentData.slippage_tolerance || 0.01,
    };
  }

  /**
   * Broadcast AI decision to connected solvers
   */
  private broadcastAIDecision(intentId: string, decision: any): void {
    const message: WSMessage = {
      type: 'response',
      data: {
        type: 'ai_decision',
        intent_id: intentId,
        decision,
      },
      timestamp: getCurrentTimestamp(),
    };

    // Send to WebSocket server instead of broadcasting directly
    if (this.wsClient && this.wsClient.readyState === WebSocket.OPEN) {
      this.wsClient.send(JSON.stringify(message));
    }
  }

  /**
   * Broadcast system message
   */
  private broadcastSystemMessage(message: string): void {
    const wsMessage: WSMessage = {
      type: 'response',
      data: {
        type: 'system',
        message,
      },
      timestamp: getCurrentTimestamp(),
    };

    // Send to WebSocket server instead of broadcasting directly
    if (this.wsClient && this.wsClient.readyState === WebSocket.OPEN) {
      this.wsClient.send(JSON.stringify(wsMessage));
    }
  }

  /**
   * Internal logging
   */
  private log(level: 'debug' | 'info' | 'warn' | 'error', message: string): void {
    const levels = { debug: 0, info: 1, warn: 2, error: 3 };
    const configLevel = levels[this.config.logLevel];
    const messageLevel = levels[level];

    if (messageLevel >= configLevel) {
      const timestamp = new Date().toISOString();
      console.log(`[${timestamp}] [AI-SERVICE] [${level.toUpperCase()}] ${message}`);
    }
  }
}