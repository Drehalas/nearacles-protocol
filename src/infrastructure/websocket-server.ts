/**
 * Simple WebSocket Server for Oracle Intent Protocol
 * Basic message broadcasting for solver-oracle communication
 */

import WebSocket from 'ws';
import { createServer } from 'http';

export interface WSMessage {
  type: 'intent' | 'response' | 'ping';
  data: any;
  timestamp: number;
}

export class OracleWebSocketServer {
  private wss!: WebSocket.Server;

  constructor(private port: number = 8080) {
    this.setupServer();
  }

  private setupServer(): void {
    const server = createServer();
    this.wss = new WebSocket.Server({ server });

    this.wss.on('connection', (ws: WebSocket) => {
      console.log('WebSocket connection established');
      
      ws.on('message', (data: string) => {
        try {
          const message: WSMessage = JSON.parse(data);
          this.broadcast(message);
        } catch (error) {
          console.error('Invalid message:', error);
        }
      });

      ws.on('close', () => {
        console.log('WebSocket connection closed');
      });
    });

    server.listen(this.port, () => {
      console.log(`WebSocket server listening on port ${this.port}`);
    });
  }

  public broadcast(message: WSMessage): void {
    this.wss.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(message));
      }
    });
  }

  public close(): void {
    this.wss.close();
  }
}