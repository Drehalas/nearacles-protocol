/**
 * Simple Solver Orchestrator - Basic intent distribution
 * Coordinates between WebSocket server and NEAR contract calls
 */

import { OracleWebSocketServer } from './websocket-server.js';

export class SolverOrchestrator {
  private wsServer: OracleWebSocketServer;

  constructor(private contractAccountId: string, wsPort: number = 8080) {
    this.wsServer = new OracleWebSocketServer(wsPort);
  }

  public async distributeIntent(intent: any): Promise<void> {
    // Simple broadcast to all connected solvers
    this.wsServer.broadcast({
      type: 'intent',
      data: intent,
      timestamp: Date.now()
    });

    console.log(`Intent ${intent.intent_id} distributed`);
  }

  public close(): void {
    this.wsServer.close();
  }
}