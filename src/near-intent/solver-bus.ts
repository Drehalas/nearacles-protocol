/**
 * Solver Bus Integration for NEAR Intent Protocol
 * Handles communication with the off-chain solver network
 */

import WebSocket from 'ws';
import { 
  Quote, 
  SolverInfo, 
  Intent, 
  SolverBusMessage, 
  IntentExecutionStatus,
  IntentError,
  AsyncResult 
} from './types';
import { retry, sleep, getCurrentTimestamp } from '../utils/helpers';

export class SolverBus {
  private baseUrl: string;
  private apiKey?: string;
  private subscribers: Map<string, (message: SolverBusMessage) => void> = new Map();
  private wsConnection?: WebSocket;

  constructor(baseUrl: string, apiKey?: string) {
    this.baseUrl = baseUrl.replace(/\/$/, ''); // Remove trailing slash
    this.apiKey = apiKey;
  }

  /**
   * Initialize WebSocket connection for real-time updates
   */
  async connect(): Promise<void> {
    const wsUrl = this.baseUrl.replace('http', 'ws') + '/ws';
    
    try {
      this.wsConnection = new WebSocket(wsUrl);
      
      this.wsConnection.onopen = () => {
        console.log('Connected to Solver Bus');
        
        // Send authentication if API key is provided
        if (this.apiKey) {
          this.send({
            type: 'auth',
            data: { api_key: this.apiKey }
          });
        }
      };

      this.wsConnection.onmessage = (event) => {
        try {
          const data = typeof event.data === 'string' ? event.data : 
            (event.data instanceof ArrayBuffer ? new TextDecoder().decode(event.data) : 
             Array.isArray(event.data) ? new TextDecoder().decode(event.data[0]) : 
             String(event.data));
          const message: SolverBusMessage = JSON.parse(data);
          this.handleMessage(message);
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      };

      this.wsConnection.onerror = (error) => {
        console.error('WebSocket error:', error);
      };

      this.wsConnection.onclose = () => {
        console.log('Disconnected from Solver Bus');
        // Auto-reconnect after 5 seconds
        setTimeout(() => this.connect(), 5000);
      };

    } catch (error) {
      console.error('Failed to connect to Solver Bus:', error);
      throw error;
    }
  }

  /**
   * Disconnect from the Solver Bus
   */
  disconnect(): void {
    if (this.wsConnection) {
      this.wsConnection.close();
      this.wsConnection = undefined;
    }
  }

  /**
   * Send a message through WebSocket
   */
  private send(data: any): void {
    if (this.wsConnection && this.wsConnection.readyState === WebSocket.OPEN) {
      this.wsConnection.send(JSON.stringify(data));
    }
  }

  /**
   * Handle incoming WebSocket messages
   */
  private handleMessage(message: SolverBusMessage): void {
    // Broadcast to all subscribers
    this.subscribers.forEach(callback => {
      try {
        callback(message);
      } catch (error) {
        console.error('Error in message subscriber:', error);
      }
    });
  }

  /**
   * Subscribe to messages
   */
  subscribe(id: string, callback: (message: SolverBusMessage) => void): void {
    this.subscribers.set(id, callback);
  }

  /**
   * Unsubscribe from messages
   */
  unsubscribe(id: string): void {
    this.subscribers.delete(id);
  }

  /**
   * Publish an intent to solvers
   */
  async publishIntent(intent: Intent): Promise<AsyncResult<string>> {
    try {
      const response = await this.httpRequest('POST', '/intents', intent);
      
      if (response.success) {
        // Also send via WebSocket for real-time processing
        this.send({
          type: 'intent_request',
          id: intent.id,
          timestamp: getCurrentTimestamp(),
          data: intent
        });

        return { success: true, data: intent.id };
      } else {
        return { success: false, error: response.error };
      }
    } catch (error) {
      const intentError: IntentError = {
        code: 'SOLVER_BUS_ERROR',
        message: error instanceof Error ? error.message : 'Failed to publish intent',
        timestamp: getCurrentTimestamp(),
      };
      return { success: false, error: intentError };
    }
  }

  /**
   * Get quotes for an intent
   */
  async getQuotes(intentId: string, timeout: number = 30000): Promise<AsyncResult<Quote[]>> {
    try {
      const response = await this.httpRequest('GET', `/intents/${intentId}/quotes`);
      
      if (response.success) {
        return { success: true, data: response.data.quotes || [] };
      } else {
        return { success: false, error: response.error };
      }
    } catch (error) {
      const intentError: IntentError = {
        code: 'QUOTE_FETCH_ERROR',
        message: error instanceof Error ? error.message : 'Failed to fetch quotes',
        timestamp: getCurrentTimestamp(),
      };
      return { success: false, error: intentError };
    }
  }

  /**
   * Wait for quotes with timeout
   */
  async waitForQuotes(intentId: string, timeout: number = 30000): Promise<AsyncResult<Quote[]>> {
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeout) {
      const quotesResult = await this.getQuotes(intentId);
      
      if (quotesResult.success && quotesResult.data.length > 0) {
        return quotesResult;
      }
      
      await sleep(2000); // Wait 2 seconds before checking again
    }
    
    const error: IntentError = {
      code: 'QUOTE_TIMEOUT',
      message: `No quotes received within ${timeout}ms`,
      timestamp: getCurrentTimestamp(),
    };
    
    return { success: false, error };
  }

  /**
   * Select best quote based on criteria
   */
  selectBestQuote(
    quotes: Quote[], 
    criteria: {
      prioritize?: 'amount' | 'fee' | 'speed' | 'reputation';
      maxFee?: string;
      maxExecutionTime?: number;
      minConfidence?: number;
    } = {}
  ): Quote | null {
    if (quotes.length === 0) return null;

    // Filter quotes based on criteria
    let filteredQuotes = quotes.filter(quote => {
      if (criteria.maxFee && BigInt(quote.fee) > BigInt(criteria.maxFee)) {
        return false;
      }
      if (criteria.maxExecutionTime && quote.execution_time_estimate > criteria.maxExecutionTime) {
        return false;
      }
      if (criteria.minConfidence && quote.confidence_score < criteria.minConfidence) {
        return false;
      }
      return true;
    });

    if (filteredQuotes.length === 0) return null;

    // Sort based on priority
    switch (criteria.prioritize) {
      case 'amount':
        filteredQuotes.sort((a, b) => BigInt(b.amount_out) > BigInt(a.amount_out) ? 1 : -1);
        break;
      case 'fee':
        filteredQuotes.sort((a, b) => BigInt(a.fee) > BigInt(b.fee) ? 1 : -1);
        break;
      case 'speed':
        filteredQuotes.sort((a, b) => a.execution_time_estimate - b.execution_time_estimate);
        break;
      case 'reputation':
        filteredQuotes.sort((a, b) => b.confidence_score - a.confidence_score);
        break;
      default:
        // Default: best amount with reasonable fee
        filteredQuotes.sort((a, b) => {
          const aScore = Number(BigInt(a.amount_out)) / Number(BigInt(a.fee) + BigInt(1));
          const bScore = Number(BigInt(b.amount_out)) / Number(BigInt(b.fee) + BigInt(1));
          return bScore - aScore;
        });
    }

    return filteredQuotes[0];
  }

  /**
   * Submit a quote (for solvers)
   */
  async submitQuote(quote: Quote): Promise<AsyncResult<void>> {
    try {
      const response = await this.httpRequest('POST', '/quotes', quote);
      
      if (response.success) {
        // Send via WebSocket
        this.send({
          type: 'quote_response',
          id: quote.intent_id,
          timestamp: getCurrentTimestamp(),
          data: quote
        });

        return { success: true, data: undefined };
      } else {
        return { success: false, error: response.error };
      }
    } catch (error) {
      const intentError: IntentError = {
        code: 'QUOTE_SUBMISSION_ERROR',
        message: error instanceof Error ? error.message : 'Failed to submit quote',
        timestamp: getCurrentTimestamp(),
      };
      return { success: false, error: intentError };
    }
  }

  /**
   * Get intent execution status
   */
  async getExecutionStatus(intentId: string): Promise<AsyncResult<IntentExecutionStatus>> {
    try {
      const response = await this.httpRequest('GET', `/intents/${intentId}/status`);
      
      if (response.success) {
        return { success: true, data: response.data };
      } else {
        return { success: false, error: response.error };
      }
    } catch (error) {
      const intentError: IntentError = {
        code: 'STATUS_FETCH_ERROR',
        message: error instanceof Error ? error.message : 'Failed to fetch execution status',
        timestamp: getCurrentTimestamp(),
      };
      return { success: false, error: intentError };
    }
  }

  /**
   * Get active solvers information
   */
  async getSolvers(): Promise<AsyncResult<SolverInfo[]>> {
    try {
      const response = await this.httpRequest('GET', '/solvers');
      
      if (response.success) {
        return { success: true, data: response.data.solvers || [] };
      } else {
        return { success: false, error: response.error };
      }
    } catch (error) {
      const intentError: IntentError = {
        code: 'SOLVERS_FETCH_ERROR',
        message: error instanceof Error ? error.message : 'Failed to fetch solvers',
        timestamp: getCurrentTimestamp(),
      };
      return { success: false, error: intentError };
    }
  }

  /**
   * Update intent execution status
   */
  async updateExecutionStatus(
    intentId: string, 
    status: IntentExecutionStatus
  ): Promise<AsyncResult<void>> {
    try {
      const response = await this.httpRequest('PUT', `/intents/${intentId}/status`, status);
      
      if (response.success) {
        // Send update via WebSocket
        this.send({
          type: 'execution_update',
          id: intentId,
          timestamp: getCurrentTimestamp(),
          data: status
        });

        return { success: true, data: undefined };
      } else {
        return { success: false, error: response.error };
      }
    } catch (error) {
      const intentError: IntentError = {
        code: 'STATUS_UPDATE_ERROR',
        message: error instanceof Error ? error.message : 'Failed to update execution status',
        timestamp: getCurrentTimestamp(),
      };
      return { success: false, error: intentError };
    }
  }

  /**
   * Make HTTP request to Solver Bus API
   */
  private async httpRequest(
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    endpoint: string,
    data?: any
  ): Promise<any> {
    const url = `${this.baseUrl}${endpoint}`;
    const headers: any = {
      'Content-Type': 'application/json',
    };

    if (this.apiKey) {
      headers['Authorization'] = `Bearer ${this.apiKey}`;
    }

    const config: RequestInit = {
      method,
      headers,
    };

    if (data && (method === 'POST' || method === 'PUT')) {
      config.body = JSON.stringify(data);
    }

    return retry(async () => {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }
      
      return await response.json();
    }, 3, 1000);
  }

  /**
   * Health check for Solver Bus
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await this.httpRequest('GET', '/health');
      return response.success === true;
    } catch (error) {
      console.error('Solver Bus health check failed:', error);
      return false;
    }
  }

  /**
   * Get Solver Bus statistics
   */
  async getStatistics(): Promise<AsyncResult<any>> {
    try {
      const response = await this.httpRequest('GET', '/stats');
      
      if (response.success) {
        return { success: true, data: response.data };
      } else {
        return { success: false, error: response.error };
      }
    } catch (error) {
      const intentError: IntentError = {
        code: 'STATS_FETCH_ERROR',
        message: error instanceof Error ? error.message : 'Failed to fetch statistics',
        timestamp: getCurrentTimestamp(),
      };
      return { success: false, error: intentError };
    }
  }
}
