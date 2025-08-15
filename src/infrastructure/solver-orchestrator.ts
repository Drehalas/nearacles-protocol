/**
 * Solver Orchestrator - Manages solver network and intent distribution
 * Coordinates between WebSocket server and NEAR contract calls
 */

import { OracleWebSocketServer } from './websocket-server.js';
import { EventEmitter } from 'events';

export interface SolverMetrics {
  solverId: string;
  responseTime: number;
  accuracy: number;
  specializations: string[];
  reputation: number;
  isOnline: boolean;
  lastSeen: number;
}

export interface IntentDistributionStrategy {
  type: 'broadcast' | 'targeted' | 'auction';
  maxSolvers?: number;
  minReputationThreshold?: number;
  specializations?: string[];
}

export class SolverOrchestrator extends EventEmitter {
  private wsServer: OracleWebSocketServer;
  private solverMetrics = new Map<string, SolverMetrics>();
  private activeIntents = new Map<string, any>();
  private performanceHistory = new Map<string, number[]>();

  constructor(private contractAccountId: string, wsPort: number = 8080) {
    super();
    this.wsServer = new OracleWebSocketServer(wsPort);
    this.setupEventHandlers();
  }

  private setupEventHandlers(): void {
    this.wsServer.on('solver_registered', (data) => {
      this.handleSolverRegistration(data);
    });

    this.wsServer.on('solver_response', (data) => {
      this.handleSolverResponse(data);
    });

    this.wsServer.on('solver_disconnected', (solverId) => {
      this.handleSolverDisconnection(solverId);
    });

    this.wsServer.on('evaluation_update', (data) => {
      this.handleEvaluationUpdate(data);
    });
  }

  private handleSolverRegistration(data: { solverId: string; specializations: string[] }): void {
    const { solverId, specializations } = data;
    
    this.solverMetrics.set(solverId, {
      solverId,
      responseTime: 0,
      accuracy: 1.0,
      specializations,
      reputation: 100, // Starting reputation
      isOnline: true,
      lastSeen: Date.now()
    });

    console.log(`Solver orchestrator: Registered solver ${solverId}`);
    this.emit('solver_registered', { solverId, specializations });
  }

  private handleSolverResponse(data: any): void {
    const { solverId, intentId, action, responseTime } = data;
    
    // Update solver metrics
    const metrics = this.solverMetrics.get(solverId);
    if (metrics) {
      metrics.responseTime = responseTime || 0;
      metrics.lastSeen = Date.now();
      metrics.isOnline = true;

      // Update performance history
      const history = this.performanceHistory.get(solverId) || [];
      history.push(responseTime || 0);
      if (history.length > 100) history.shift(); // Keep last 100 entries
      this.performanceHistory.set(solverId, history);
    }

    // Track intent response
    if (action === 'accept_intent') {
      const intent = this.activeIntents.get(intentId);
      if (intent) {
        intent.acceptedBy = solverId;
        intent.acceptedAt = Date.now();
      }
    }

    console.log(`Solver ${solverId} responded to intent ${intentId} with action: ${action}`);
    this.emit('solver_response', data);
  }

  private handleSolverDisconnection(solverId: string): void {
    const metrics = this.solverMetrics.get(solverId);
    if (metrics) {
      metrics.isOnline = false;
      metrics.lastSeen = Date.now();
    }

    console.log(`Solver orchestrator: Solver ${solverId} disconnected`);
    this.emit('solver_disconnected', solverId);
  }

  private handleEvaluationUpdate(data: any): void {
    const { intentId, solverId, evaluation } = data;
    
    // Update solver accuracy based on evaluation quality
    if (evaluation && evaluation.confidence) {
      const metrics = this.solverMetrics.get(solverId);
      if (metrics) {
        // Simple accuracy calculation - can be made more sophisticated
        const confidenceBonus = evaluation.confidence > 0.8 ? 1.1 : 1.0;
        metrics.accuracy = Math.min(1.0, metrics.accuracy * confidenceBonus);
      }
    }

    this.emit('evaluation_update', data);
  }

  public async distributeIntent(
    intent: any, 
    strategy: IntentDistributionStrategy = { type: 'broadcast' }
  ): Promise<void> {
    this.activeIntents.set(intent.intent_id, {
      ...intent,
      distributedAt: Date.now(),
      strategy
    });

    switch (strategy.type) {
      case 'broadcast':
        await this.broadcastToAllSolvers(intent);
        break;
      case 'targeted':
        await this.distributeToTargetedSolvers(intent, strategy);
        break;
      case 'auction':
        await this.runSolverAuction(intent, strategy);
        break;
    }

    console.log(`Intent ${intent.intent_id} distributed using ${strategy.type} strategy`);
    this.emit('intent_distributed', { intent, strategy });
  }

  private async broadcastToAllSolvers(intent: any): Promise<void> {
    const targetSpecializations = this.extractSpecializations(intent.question);
    this.wsServer.broadcastIntent(intent, targetSpecializations);
  }

  private async distributeToTargetedSolvers(
    intent: any, 
    strategy: IntentDistributionStrategy
  ): Promise<void> {
    const eligibleSolvers = this.selectEligibleSolvers(strategy);
    
    // Rank solvers by reputation and specialization match
    const rankedSolvers = this.rankSolvers(eligibleSolvers, intent);
    
    // Take top solvers based on maxSolvers parameter
    const targetSolvers = rankedSolvers.slice(0, strategy.maxSolvers || 5);
    
    // Send intent to selected solvers
    for (const solver of targetSolvers) {
      if (solver.isOnline) {
        // Send targeted message (would need WebSocket connection tracking)
        // For now, use broadcast with specialization filter
        this.wsServer.broadcastIntent(intent, solver.specializations);
      }
    }
  }

  private async runSolverAuction(intent: any, strategy: IntentDistributionStrategy): Promise<void> {
    // Auction-based distribution - solvers bid on intents
    const eligibleSolvers = this.selectEligibleSolvers(strategy);
    
    // Broadcast auction announcement
    this.wsServer.broadcastIntent({
      ...intent,
      type: 'auction',
      minReputationThreshold: strategy.minReputationThreshold || 50,
      biddingDeadline: Date.now() + 30000 // 30 seconds to bid
    });

    // Set up auction timer
    setTimeout(() => {
      this.processAuctionResults(intent.intent_id);
    }, 30000);
  }

  private selectEligibleSolvers(strategy: IntentDistributionStrategy): SolverMetrics[] {
    return Array.from(this.solverMetrics.values()).filter(solver => {
      if (!solver.isOnline) return false;
      
      if (strategy.minReputationThreshold && solver.reputation < strategy.minReputationThreshold) {
        return false;
      }
      
      if (strategy.specializations && strategy.specializations.length > 0) {
        const hasMatchingSpecialization = strategy.specializations.some(spec =>
          solver.specializations.includes(spec)
        );
        if (!hasMatchingSpecialization) return false;
      }
      
      return true;
    });
  }

  private rankSolvers(solvers: SolverMetrics[], intent: any): SolverMetrics[] {
    const intentSpecializations = this.extractSpecializations(intent.question);
    
    return solvers.sort((a, b) => {
      // Calculate score based on multiple factors
      const scoreA = this.calculateSolverScore(a, intentSpecializations);
      const scoreB = this.calculateSolverScore(b, intentSpecializations);
      
      return scoreB - scoreA; // Higher score first
    });
  }

  private calculateSolverScore(solver: SolverMetrics, intentSpecializations: string[]): number {
    let score = 0;
    
    // Reputation weight (40%)
    score += solver.reputation * 0.4;
    
    // Accuracy weight (30%)
    score += solver.accuracy * 100 * 0.3;
    
    // Specialization match weight (20%)
    const specializationMatch = intentSpecializations.filter(spec =>
      solver.specializations.includes(spec)
    ).length / intentSpecializations.length;
    score += specializationMatch * 100 * 0.2;
    
    // Response time weight (10%) - lower is better
    const avgResponseTime = this.getAverageResponseTime(solver.solverId);
    const responseTimeScore = Math.max(0, 100 - (avgResponseTime / 1000)); // Penalize slow responses
    score += responseTimeScore * 0.1;
    
    return score;
  }

  private extractSpecializations(question: string): string[] {
    const specializations: string[] = [];
    const lowerQuestion = question.toLowerCase();
    
    // Simple keyword-based specialization detection
    if (lowerQuestion.includes('bitcoin') || lowerQuestion.includes('crypto') || lowerQuestion.includes('price')) {
      specializations.push('financial');
    }
    if (lowerQuestion.includes('technology') || lowerQuestion.includes('ai') || lowerQuestion.includes('software')) {
      specializations.push('technology');
    }
    if (lowerQuestion.includes('news') || lowerQuestion.includes('politics') || lowerQuestion.includes('event')) {
      specializations.push('news');
    }
    if (lowerQuestion.includes('science') || lowerQuestion.includes('research') || lowerQuestion.includes('study')) {
      specializations.push('scientific');
    }
    
    return specializations.length > 0 ? specializations : ['general'];
  }

  private getAverageResponseTime(solverId: string): number {
    const history = this.performanceHistory.get(solverId) || [];
    if (history.length === 0) return 0;
    
    return history.reduce((sum, time) => sum + time, 0) / history.length;
  }

  private processAuctionResults(intentId: string): void {
    // Process auction bids and select winner
    // This would integrate with actual bidding mechanism
    console.log(`Processing auction results for intent ${intentId}`);
    this.emit('auction_completed', { intentId });
  }

  public getSolverMetrics(solverId?: string): SolverMetrics | SolverMetrics[] {
    if (solverId) {
      return this.solverMetrics.get(solverId) || null;
    }
    return Array.from(this.solverMetrics.values());
  }

  public getActiveIntents(): any[] {
    return Array.from(this.activeIntents.values());
  }

  public getNetworkStats(): any {
    const allSolvers = Array.from(this.solverMetrics.values());
    const onlineSolvers = allSolvers.filter(s => s.isOnline);
    
    return {
      totalSolvers: allSolvers.length,
      onlineSolvers: onlineSolvers.length,
      averageReputation: allSolvers.reduce((sum, s) => sum + s.reputation, 0) / allSolvers.length || 0,
      averageAccuracy: allSolvers.reduce((sum, s) => sum + s.accuracy, 0) / allSolvers.length || 0,
      activeIntents: this.activeIntents.size,
      wsStats: this.wsServer.getStats()
    };
  }

  public updateSolverReputation(solverId: string, reputationChange: number): void {
    const metrics = this.solverMetrics.get(solverId);
    if (metrics) {
      metrics.reputation = Math.max(0, Math.min(1000, metrics.reputation + reputationChange));
      console.log(`Updated solver ${solverId} reputation to ${metrics.reputation}`);
    }
  }

  public close(): void {
    this.wsServer.close();
    this.activeIntents.clear();
    this.solverMetrics.clear();
    this.performanceHistory.clear();
  }
}