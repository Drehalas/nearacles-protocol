/**
 * Enhanced WebSocket Server for Oracle Intent Protocol
 * Handles solver-oracle communication with AI service integration
 */

import WebSocket, { WebSocketServer } from 'ws';
import { createServer } from 'http';
import { securityMiddleware, getSecurityConfigFromEnv } from '../utils/security';

export interface WSMessage {
  type: 'intent' | 'response' | 'ping' | 'ai_request' | 'ai_response';
  data: any;
  timestamp: number;
  client_id?: string;
}

export interface WSClient {
  ws: WebSocket;
  id: string;
  type: 'solver' | 'ai_service' | 'frontend' | 'unknown';
  connected_at: number;
}

export class OracleWebSocketServer {
  private wss!: WebSocketServer;
  private clients: Map<string, WSClient> = new Map();
  private aiServiceClient?: WSClient;
  private latencyHistory: number[] = [];
  private startTime: number = Date.now();

  constructor(private port: number = 8080) {
    this.setupServer();
  }

  private setupServer(): void {
    const securityConfig = getSecurityConfigFromEnv();
    
    const server = createServer((req, res) => {
      // Apply security middleware
      const securityResult = securityMiddleware(req, res, securityConfig);
      
      if (!securityResult.allowed) {
        if (securityResult.reason === 'Rate limit exceeded') {
          res.writeHead(429, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Rate limit exceeded' }));
        } else {
          res.writeHead(403, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: securityResult.reason }));
        }
        return;
      }
      
      // Handle OPTIONS requests for CORS
      if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
      }
      
      // Simple HTTP health endpoint
      if (req.url === '/health' && req.method === 'GET') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(this.getHealthStatus()));
        return;
      }
      
      // Default response for other paths
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('WebSocket server - use /health for status');
    });
    
    this.wss = new WebSocketServer({ server });

    this.wss.on('connection', (ws: WebSocket, req) => {
      const clientId = this.generateClientId();
      const clientType = this.detectClientType(req);
      
      const client: WSClient = {
        ws,
        id: clientId,
        type: clientType,
        connected_at: Date.now(),
      };

      this.clients.set(clientId, client);
      
      // Track AI service client separately for direct communication
      if (clientType === 'ai_service') {
        this.aiServiceClient = client;
        console.log('AI service connected');
      }

      console.log(`WebSocket connection established: ${clientType} (${clientId})`);
      
      // Send welcome message
      this.sendToClient(clientId, {
        type: 'response',
        data: {
          type: 'connection_established',
          client_id: clientId,
          server_time: Date.now(),
        },
        timestamp: Date.now(),
      });

      ws.on('message', (data: string) => {
        try {
          const message: WSMessage = JSON.parse(data);
          message.client_id = clientId;
          this.handleMessage(message, client);
        } catch (error) {
          console.error('Invalid message:', error);
          this.sendToClient(clientId, {
            type: 'response',
            data: { type: 'error', message: 'Invalid JSON format' },
            timestamp: Date.now(),
          });
        }
      });

      ws.on('close', () => {
        console.log(`WebSocket connection closed: ${clientType} (${clientId})`);
        this.clients.delete(clientId);
        
        if (client === this.aiServiceClient) {
          this.aiServiceClient = undefined;
          console.log('AI service disconnected');
        }
      });

      ws.on('error', (error) => {
        console.error(`WebSocket error for ${clientType} (${clientId}):`, error);
      });
    });

    server.listen(this.port, () => {
      console.log(`WebSocket server listening on port ${this.port}`);
    });
  }

  private handleMessage(message: WSMessage, sender: WSClient): void {
    // Track latency for performance monitoring
    const processingStart = Date.now();
    
    switch (message.type) {
      case 'intent':
        this.handleIntent(message, sender);
        break;
      case 'ai_request':
        this.handleAIRequest(message, sender);
        break;
      case 'ai_response':
        this.handleAIResponse(message, sender);
        break;
      case 'ping':
        this.handlePing(message, sender);
        break;
      default:
        // Broadcast other messages to all clients
        this.broadcast(message, sender.id);
    }
    
    // Track processing latency
    this.trackLatency(message, processingStart);
  }

  private handleIntent(message: WSMessage, sender: WSClient): void {
    console.log(`Intent received from ${sender.type} (${sender.id})`);
    
    // Forward intent to AI service if available
    if (this.aiServiceClient) {
      this.sendToClient(this.aiServiceClient.id, {
        type: 'ai_request',
        data: {
          action: 'process_intent',
          intent: message.data,
          sender_id: sender.id,
          sender_type: sender.type,
        },
        timestamp: Date.now(),
      });
    }
    
    // Broadcast to all solvers
    this.broadcastToType('solver', message, sender.id);
  }

  private handleAIRequest(message: WSMessage, sender: WSClient): void {
    // Forward AI requests to AI service
    if (this.aiServiceClient && sender.id !== this.aiServiceClient.id) {
      this.sendToClient(this.aiServiceClient.id, message);
    }
  }

  private handleAIResponse(message: WSMessage, sender: WSClient): void {
    // Handle responses from AI service
    if (sender === this.aiServiceClient) {
      const { target_client } = message.data;
      
      if (target_client) {
        // Send to specific client
        this.sendToClient(target_client, message);
      } else {
        // Broadcast AI insights to relevant clients
        this.broadcastToType('solver', message);
        this.broadcastToType('frontend', message);
      }
    }
  }

  private handlePing(message: WSMessage, sender: WSClient): void {
    this.sendToClient(sender.id, {
      type: 'response',
      data: { type: 'pong', timestamp: Date.now() },
      timestamp: Date.now(),
    });
  }

  private trackLatency(message: WSMessage, startTime: number): void {
    const latency = Date.now() - startTime;
    
    // Keep a rolling window of latency measurements
    this.latencyHistory.push(latency);
    if (this.latencyHistory.length > 100) {
      this.latencyHistory.shift(); // Keep only last 100 measurements
    }
    
    // Warn about high latency
    if (latency > 100) {
      console.warn(`High latency detected: ${latency}ms for ${message.type} from client ${message.client_id}`);
    }
  }

  private calculateAverageLatency(): number {
    if (this.latencyHistory.length === 0) return 0;
    const sum = this.latencyHistory.reduce((a, b) => a + b, 0);
    return Math.round(sum / this.latencyHistory.length);
  }

  private generateClientId(): string {
    return `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private detectClientType(req: any): WSClient['type'] {
    const userAgent = req.headers['user-agent'] || '';
    const origin = req.headers.origin || '';
    
    if (userAgent.includes('AI-Service')) return 'ai_service';
    if (origin.includes('localhost:3000') || origin.includes('testnet')) return 'frontend';
    if (userAgent.includes('Solver')) return 'solver';
    
    return 'unknown';
  }

  public sendToClient(clientId: string, message: WSMessage): boolean {
    const client = this.clients.get(clientId);
    if (client && client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(JSON.stringify(message));
      return true;
    }
    return false;
  }

  public broadcastToType(clientType: WSClient['type'], message: WSMessage, excludeId?: string): void {
    this.clients.forEach((client) => {
      if (client.type === clientType && 
          client.id !== excludeId && 
          client.ws.readyState === WebSocket.OPEN) {
        client.ws.send(JSON.stringify(message));
      }
    });
  }

  public broadcast(message: WSMessage, excludeId?: string): void {
    this.clients.forEach((client) => {
      if (client.id !== excludeId && client.ws.readyState === WebSocket.OPEN) {
        client.ws.send(JSON.stringify(message));
      }
    });
  }

  public getConnectedClients(): { type: WSClient['type']; count: number }[] {
    const clientStats = new Map<WSClient['type'], number>();
    
    this.clients.forEach((client) => {
      const count = clientStats.get(client.type) || 0;
      clientStats.set(client.type, count + 1);
    });

    return Array.from(clientStats.entries()).map(([type, count]) => ({
      type,
      count,
    }));
  }

  public getHealthStatus(): { 
    status: string; 
    clients: number; 
    ai_connected: boolean; 
    avg_latency_ms: number;
    max_latency_ms: number;
    uptime_ms: number;
    total_messages: number;
  } {
    const maxLatency = this.latencyHistory.length > 0 ? Math.max(...this.latencyHistory) : 0;
    
    return {
      status: 'healthy',
      clients: this.clients.size,
      ai_connected: !!this.aiServiceClient,
      avg_latency_ms: this.calculateAverageLatency(),
      max_latency_ms: maxLatency,
      uptime_ms: Date.now() - this.startTime,
      total_messages: this.latencyHistory.length,
    };
  }

  public close(): void {
    this.wss.close();
  }
}

// Start server when run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const port = parseInt(process.env.WEBSOCKET_PORT || '8080', 10);
  const server = new OracleWebSocketServer(port);
  
  console.log(`🚀 WebSocket server started on port ${port}`);
  
  // Graceful shutdown
  process.on('SIGINT', () => {
    console.log('🛑 Shutting down WebSocket server...');
    server.close();
    process.exit(0);
  });
  
  process.on('SIGTERM', () => {
    console.log('🛑 Shutting down WebSocket server...');
    server.close();
    process.exit(0);
  });
}