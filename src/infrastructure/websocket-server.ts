/**
 * WebSocket Server for Oracle Intent Protocol
 * Handles real-time communication between solvers, users, and the oracle network
 */

import WebSocket from 'ws';
import { EventEmitter } from 'events';
import { createServer } from 'http';

export interface WSMessage {
  type: 'intent_broadcast' | 'solver_response' | 'evaluation_update' | 'challenge_notification' | 'heartbeat';
  payload: any;
  timestamp: number;
  senderId?: string;
}

export interface SolverConnection {
  ws: WebSocket;
  solverId: string;
  specializations: string[];
  lastHeartbeat: number;
  isActive: boolean;
}

export interface UserConnection {
  ws: WebSocket;
  userId: string;
  lastActivity: number;
}

export class OracleWebSocketServer extends EventEmitter {
  private wss: WebSocket.Server;
  private solvers = new Map<string, SolverConnection>();
  private users = new Map<string, UserConnection>();
  private heartbeatInterval: NodeJS.Timeout;
  private cleanupInterval: NodeJS.Timeout;

  constructor(private port: number = 8080) {
    super();
    this.setupServer();
    this.startHeartbeat();
    this.startCleanup();
  }

  private setupServer(): void {
    const server = createServer();
    this.wss = new WebSocket.Server({ server });

    this.wss.on('connection', (ws: WebSocket, request) => {
      console.log('New WebSocket connection established');
      
      ws.on('message', (data: string) => {
        try {
          const message: WSMessage = JSON.parse(data);
          this.handleMessage(ws, message);
        } catch (error) {
          console.error('Invalid message format:', error);
          this.sendError(ws, 'Invalid message format');
        }
      });

      ws.on('close', () => {
        this.handleDisconnection(ws);
      });

      ws.on('error', (error) => {
        console.error('WebSocket error:', error);
      });

      // Send initial handshake
      this.sendMessage(ws, {
        type: 'heartbeat',
        payload: { status: 'connected' },
        timestamp: Date.now()
      });
    });

    server.listen(this.port, () => {
      console.log(`Oracle WebSocket server listening on port ${this.port}`);
    });
  }

  private handleMessage(ws: WebSocket, message: WSMessage): void {
    switch (message.type) {
      case 'solver_response':
        this.handleSolverResponse(ws, message);
        break;
      case 'intent_broadcast':
        this.handleIntentBroadcast(message);
        break;
      case 'evaluation_update':
        this.handleEvaluationUpdate(message);
        break;
      case 'heartbeat':
        this.handleHeartbeat(ws, message);
        break;
      default:
        console.warn('Unknown message type:', message.type);
    }
  }

  private handleSolverResponse(ws: WebSocket, message: WSMessage): void {
    const { solverId, action, intentId } = message.payload;
    
    if (!this.solvers.has(solverId)) {
      this.registerSolver(ws, solverId, message.payload.specializations || []);
    }

    // Update solver connection
    const solver = this.solvers.get(solverId);
    if (solver) {
      solver.lastHeartbeat = Date.now();
      solver.isActive = true;
    }

    // Broadcast to relevant users
    this.broadcastToUsers({
      type: 'evaluation_update',
      payload: {
        intentId,
        solverId,
        action,
        timestamp: message.timestamp
      },
      timestamp: Date.now()
    });

    this.emit('solver_response', message.payload);
  }

  private handleIntentBroadcast(message: WSMessage): void {
    const { intent, specializations } = message.payload;
    
    // Broadcast to relevant solvers based on specializations
    for (const [solverId, solver] of this.solvers) {
      if (solver.isActive && this.matchesSpecialization(solver.specializations, specializations)) {
        this.sendMessage(solver.ws, {
          type: 'intent_broadcast',
          payload: intent,
          timestamp: Date.now()
        });
      }
    }

    this.emit('intent_broadcast', message.payload);
  }

  private handleEvaluationUpdate(message: WSMessage): void {
    // Broadcast evaluation updates to all connected users
    this.broadcastToUsers(message);
    this.emit('evaluation_update', message.payload);
  }

  private handleHeartbeat(ws: WebSocket, message: WSMessage): void {
    const { senderId, role } = message.payload;
    
    if (role === 'solver' && senderId) {
      const solver = this.solvers.get(senderId);
      if (solver) {
        solver.lastHeartbeat = Date.now();
        solver.isActive = true;
      }
    } else if (role === 'user' && senderId) {
      const user = this.users.get(senderId);
      if (user) {
        user.lastActivity = Date.now();
      }
    }

    // Send heartbeat response
    this.sendMessage(ws, {
      type: 'heartbeat',
      payload: { status: 'alive' },
      timestamp: Date.now()
    });
  }

  private handleDisconnection(ws: WebSocket): void {
    // Find and remove the disconnected connection
    for (const [solverId, solver] of this.solvers) {
      if (solver.ws === ws) {
        solver.isActive = false;
        console.log(`Solver ${solverId} disconnected`);
        this.emit('solver_disconnected', solverId);
        break;
      }
    }

    for (const [userId, user] of this.users) {
      if (user.ws === ws) {
        this.users.delete(userId);
        console.log(`User ${userId} disconnected`);
        this.emit('user_disconnected', userId);
        break;
      }
    }
  }

  public registerSolver(ws: WebSocket, solverId: string, specializations: string[]): void {
    this.solvers.set(solverId, {
      ws,
      solverId,
      specializations,
      lastHeartbeat: Date.now(),
      isActive: true
    });

    console.log(`Solver ${solverId} registered with specializations: ${specializations.join(', ')}`);
    this.emit('solver_registered', { solverId, specializations });
  }

  public registerUser(ws: WebSocket, userId: string): void {
    this.users.set(userId, {
      ws,
      userId,
      lastActivity: Date.now()
    });

    console.log(`User ${userId} registered`);
    this.emit('user_registered', userId);
  }

  public broadcastIntent(intent: any, targetSpecializations?: string[]): void {
    const message: WSMessage = {
      type: 'intent_broadcast',
      payload: { intent, specializations: targetSpecializations },
      timestamp: Date.now()
    };

    this.handleIntentBroadcast(message);
  }

  public notifyEvaluationUpdate(intentId: string, solverId: string, update: any): void {
    const message: WSMessage = {
      type: 'evaluation_update',
      payload: { intentId, solverId, ...update },
      timestamp: Date.now()
    };

    this.broadcastToUsers(message);
  }

  public notifyChallenge(evaluationId: string, challengerId: string, details: any): void {
    const message: WSMessage = {
      type: 'challenge_notification',
      payload: { evaluationId, challengerId, ...details },
      timestamp: Date.now()
    };

    this.broadcastToAll(message);
  }

  private broadcastToUsers(message: WSMessage): void {
    for (const user of this.users.values()) {
      this.sendMessage(user.ws, message);
    }
  }

  private broadcastToSolvers(message: WSMessage): void {
    for (const solver of this.solvers.values()) {
      if (solver.isActive) {
        this.sendMessage(solver.ws, message);
      }
    }
  }

  private broadcastToAll(message: WSMessage): void {
    this.broadcastToUsers(message);
    this.broadcastToSolvers(message);
  }

  private sendMessage(ws: WebSocket, message: WSMessage): void {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
    }
  }

  private sendError(ws: WebSocket, error: string): void {
    this.sendMessage(ws, {
      type: 'challenge_notification',
      payload: { error },
      timestamp: Date.now()
    });
  }

  private matchesSpecialization(solverSpecs: string[], targetSpecs?: string[]): boolean {
    if (!targetSpecs || targetSpecs.length === 0) return true;
    return targetSpecs.some(spec => solverSpecs.includes(spec));
  }

  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      const heartbeatMessage: WSMessage = {
        type: 'heartbeat',
        payload: { server: 'ping' },
        timestamp: Date.now()
      };

      this.broadcastToAll(heartbeatMessage);
    }, 30000); // Every 30 seconds
  }

  private startCleanup(): void {
    this.cleanupInterval = setInterval(() => {
      const now = Date.now();
      const timeout = 60000; // 1 minute timeout

      // Clean up inactive solvers
      for (const [solverId, solver] of this.solvers) {
        if (now - solver.lastHeartbeat > timeout) {
          solver.isActive = false;
          console.log(`Marking solver ${solverId} as inactive`);
        }
      }

      // Clean up inactive users
      for (const [userId, user] of this.users) {
        if (now - user.lastActivity > timeout * 2) { // Longer timeout for users
          this.users.delete(userId);
          console.log(`Removing inactive user ${userId}`);
        }
      }
    }, 30000); // Check every 30 seconds
  }

  public getStats(): any {
    return {
      activeSolvers: Array.from(this.solvers.values()).filter(s => s.isActive).length,
      totalSolvers: this.solvers.size,
      activeUsers: this.users.size,
      uptime: process.uptime()
    };
  }

  public close(): void {
    clearInterval(this.heartbeatInterval);
    clearInterval(this.cleanupInterval);
    this.wss.close();
  }
}