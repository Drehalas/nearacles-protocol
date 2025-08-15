/**
 * NEAR Oracle Protocol Performance Load Testing Suite
 * Tests system performance under various load conditions
 */

import { Worker, NearAccount } from 'near-workspaces';
import { NEAR } from 'near-workspaces';
import WebSocket from 'ws';
import { EventEmitter } from 'events';

interface LoadTestConfig {
  concurrentUsers: number;
  intentsPerUser: number;
  testDurationMinutes: number;
  rampUpSeconds: number;
  websocketUrl?: string;
  contractId?: string;
}

interface LoadTestMetrics {
  totalIntents: number;
  successfulIntents: number;
  failedIntents: number;
  averageResponseTime: number;
  maxResponseTime: number;
  minResponseTime: number;
  throughputPerSecond: number;
  errorRate: number;
  gasUsage: {
    total: string;
    average: string;
    max: string;
  };
  websocketMetrics?: {
    connectionsEstablished: number;
    messagesReceived: number;
    averageLatency: number;
  };
}

interface LoadTestResult {
  config: LoadTestConfig;
  metrics: LoadTestMetrics;
  timeline: Array<{
    timestamp: number;
    activeUsers: number;
    successfulOperations: number;
    errorCount: number;
    averageLatency: number;
  }>;
  errors: Array<{
    timestamp: number;
    error: string;
    operation: string;
  }>;
}

export class PerformanceLoadTester extends EventEmitter {
  private worker: Worker | null = null;
  private accounts: NearAccount[] = [];
  private oracleContract: NearAccount | null = null;
  private wsConnections: WebSocket[] = [];
  private metrics: LoadTestMetrics;
  private timeline: LoadTestResult['timeline'] = [];
  private errors: LoadTestResult['errors'] = [];
  private startTime: number = 0;
  private responseTimes: number[] = [];

  constructor() {
    super();
    this.metrics = this.initializeMetrics();
  }

  private initializeMetrics(): LoadTestMetrics {
    return {
      totalIntents: 0,
      successfulIntents: 0,
      failedIntents: 0,
      averageResponseTime: 0,
      maxResponseTime: 0,
      minResponseTime: Infinity,
      throughputPerSecond: 0,
      errorRate: 0,
      gasUsage: {
        total: '0',
        average: '0',
        max: '0'
      },
      websocketMetrics: {
        connectionsEstablished: 0,
        messagesReceived: 0,
        averageLatency: 0
      }
    };
  }

  async runLoadTest(config: LoadTestConfig): Promise<LoadTestResult> {
    console.log('🚀 Starting NEAR Oracle Protocol Load Test');
    console.log(`Configuration: ${JSON.stringify(config, null, 2)}`);
    console.log('─'.repeat(60));

    this.startTime = Date.now();
    
    try {
      await this.setupTestEnvironment(config);
      await this.executeLoadTest(config);
      const result = await this.generateResults(config);
      
      console.log('✅ Load test completed successfully');
      return result;

    } catch (error) {
      console.error('❌ Load test failed:', error);
      throw error;
    } finally {
      await this.cleanup();
    }
  }

  private async setupTestEnvironment(config: LoadTestConfig): Promise<void> {
    console.log('🔧 Setting up load test environment...');

    // Initialize NEAR worker
    this.worker = await Worker.init();
    const root = this.worker.rootAccount;

    // Deploy or connect to contract
    if (config.contractId) {
      this.oracleContract = root.getAccount(config.contractId);
    } else {
      // Deploy fresh contract for testing
      this.oracleContract = await root.createSubAccount('load-test-oracle');
      await this.oracleContract.deploy('./contracts/oracle-intent/target/wasm32-unknown-unknown/release/oracle_intent.wasm');
      await this.oracleContract.call(this.oracleContract, 'new', { owner: root.accountId });
    }

    // Create test accounts
    console.log(`Creating ${config.concurrentUsers} test accounts...`);
    for (let i = 0; i < config.concurrentUsers; i++) {
      const account = await root.createSubAccount(`load-user-${i}`);
      await account.call(this.oracleContract, 'register_user', { role: 'User' });
      this.accounts.push(account);
    }

    // Create solver accounts for testing
    const solverCount = Math.min(10, Math.ceil(config.concurrentUsers / 5));
    console.log(`Creating ${solverCount} solver accounts...`);
    for (let i = 0; i < solverCount; i++) {
      const solver = await root.createSubAccount(`load-solver-${i}`);
      await solver.call(this.oracleContract, 'register_solver', {}, {
        attachedDeposit: NEAR.parse('2').toString()
      });
    }

    // Setup WebSocket connections if configured
    if (config.websocketUrl) {
      await this.setupWebSocketConnections(config);
    }

    console.log('✅ Test environment ready');
  }

  private async setupWebSocketConnections(config: LoadTestConfig): Promise<void> {
    console.log('🔌 Setting up WebSocket connections...');
    
    const connectionPromises = Array.from({ length: config.concurrentUsers }, async (_, i) => {
      try {
        const ws = new WebSocket(config.websocketUrl!);
        
        await new Promise((resolve, reject) => {
          const timeout = setTimeout(() => reject(new Error('WebSocket timeout')), 5000);
          
          ws.on('open', () => {
            clearTimeout(timeout);
            this.metrics.websocketMetrics!.connectionsEstablished++;
            resolve(ws);
          });
          
          ws.on('error', (error) => {
            clearTimeout(timeout);
            reject(error);
          });

          ws.on('message', (data) => {
            this.metrics.websocketMetrics!.messagesReceived++;
            // Measure latency if message includes timestamp
            try {
              const message = JSON.parse(data.toString());
              if (message.timestamp) {
                const latency = Date.now() - message.timestamp;
                // Update average latency (simple running average)
                const current = this.metrics.websocketMetrics!.averageLatency;
                const count = this.metrics.websocketMetrics!.messagesReceived;
                this.metrics.websocketMetrics!.averageLatency = 
                  (current * (count - 1) + latency) / count;
              }
            } catch (error) {
              // Ignore parsing errors for latency measurement
            }
          });
        });

        this.wsConnections.push(ws);
        return ws;
      } catch (error) {
        console.warn(`Failed to connect WebSocket ${i}:`, error.message);
        return null;
      }
    });

    const connections = await Promise.allSettled(connectionPromises);
    const successful = connections.filter(c => c.status === 'fulfilled').length;
    
    console.log(`✅ WebSocket setup: ${successful}/${config.concurrentUsers} connections established`);
  }

  private async executeLoadTest(config: LoadTestConfig): Promise<void> {
    console.log('📊 Executing load test...');
    
    const testDurationMs = config.testDurationMinutes * 60 * 1000;
    const rampUpMs = config.rampUpSeconds * 1000;
    const userRampInterval = rampUpMs / config.concurrentUsers;
    
    // Start timeline tracking
    const timelineInterval = setInterval(() => {
      this.captureTimelineSnapshot();
    }, 5000); // Capture every 5 seconds

    // Gradually ramp up users
    const userPromises: Promise<void>[] = [];
    
    for (let i = 0; i < config.concurrentUsers; i++) {
      const delay = i * userRampInterval;
      
      userPromises.push(
        this.delay(delay).then(() => 
          this.simulateUser(this.accounts[i], config, testDurationMs - delay)
        )
      );
    }

    // Wait for test duration
    await Promise.all([
      Promise.allSettled(userPromises),
      this.delay(testDurationMs)
    ]);

    clearInterval(timelineInterval);
    console.log('✅ Load test execution completed');
  }

  private async simulateUser(
    account: NearAccount, 
    config: LoadTestConfig, 
    remainingTimeMs: number
  ): Promise<void> {
    const endTime = Date.now() + remainingTimeMs;
    const intentInterval = remainingTimeMs / config.intentsPerUser;
    
    for (let i = 0; i < config.intentsPerUser && Date.now() < endTime; i++) {
      try {
        await this.submitTestIntent(account);
        
        // Wait before next intent
        if (i < config.intentsPerUser - 1) {
          await this.delay(intentInterval);
        }
      } catch (error) {
        this.recordError(error.message, 'intent_submission');
      }
    }
  }

  private async submitTestIntent(account: NearAccount): Promise<void> {
    const startTime = Date.now();
    
    try {
      this.metrics.totalIntents++;
      
      const questions = [
        'Is Bitcoin price currently above $50,000?',
        'Will Ethereum reach $5,000 this year?',
        'Is the current market trend bullish?',
        'Are gas fees on NEAR below $0.01?',
        'Is DeFi adoption increasing this quarter?'
      ];
      
      const question = questions[Math.floor(Math.random() * questions.length)];
      
      await account.call(this.oracleContract!, 'submit_credibility_intent', {
        question,
        required_sources: Math.floor(Math.random() * 3) + 2, // 2-4 sources
        confidence_threshold: 0.7 + Math.random() * 0.2, // 0.7-0.9
        deadline_minutes: 30 + Math.floor(Math.random() * 60) // 30-90 minutes
      }, {
        attachedDeposit: NEAR.parse('1').toString()
      });
      
      const responseTime = Date.now() - startTime;
      this.recordResponseTime(responseTime);
      this.metrics.successfulIntents++;
      
    } catch (error) {
      this.metrics.failedIntents++;
      this.recordError(error.message, 'intent_submission');
      throw error;
    }
  }

  private recordResponseTime(responseTime: number): void {
    this.responseTimes.push(responseTime);
    
    this.metrics.maxResponseTime = Math.max(this.metrics.maxResponseTime, responseTime);
    this.metrics.minResponseTime = Math.min(this.metrics.minResponseTime, responseTime);
    
    // Update average
    const sum = this.responseTimes.reduce((a, b) => a + b, 0);
    this.metrics.averageResponseTime = sum / this.responseTimes.length;
  }

  private recordError(error: string, operation: string): void {
    this.errors.push({
      timestamp: Date.now(),
      error,
      operation
    });
  }

  private captureTimelineSnapshot(): void {
    const elapsed = Date.now() - this.startTime;
    const throughput = this.metrics.successfulIntents / (elapsed / 1000);
    
    this.timeline.push({
      timestamp: Date.now(),
      activeUsers: this.accounts.length,
      successfulOperations: this.metrics.successfulIntents,
      errorCount: this.metrics.failedIntents,
      averageLatency: this.metrics.averageResponseTime
    });
  }

  private async generateResults(config: LoadTestConfig): Promise<LoadTestResult> {
    console.log('📊 Generating performance report...');
    
    // Calculate final metrics
    const totalDuration = (Date.now() - this.startTime) / 1000; // seconds
    this.metrics.throughputPerSecond = this.metrics.successfulIntents / totalDuration;
    this.metrics.errorRate = this.metrics.failedIntents / this.metrics.totalIntents;
    
    // Clean up WebSocket connections
    this.wsConnections.forEach(ws => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    });

    return {
      config,
      metrics: this.metrics,
      timeline: this.timeline,
      errors: this.errors
    };
  }

  private async cleanup(): Promise<void> {
    console.log('🧹 Cleaning up test environment...');
    
    // Close WebSocket connections
    this.wsConnections.forEach(ws => ws.close());
    
    // Cleanup NEAR worker
    if (this.worker) {
      await this.worker.tearDown();
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Performance test scenarios
export const performanceTestScenarios = {
  // Light load - baseline performance
  light: {
    concurrentUsers: 5,
    intentsPerUser: 3,
    testDurationMinutes: 2,
    rampUpSeconds: 30
  },
  
  // Medium load - normal usage
  medium: {
    concurrentUsers: 25,
    intentsPerUser: 5,
    testDurationMinutes: 5,
    rampUpSeconds: 60
  },
  
  // Heavy load - stress testing
  heavy: {
    concurrentUsers: 100,
    intentsPerUser: 10,
    testDurationMinutes: 10,
    rampUpSeconds: 120
  },
  
  // Burst load - sudden traffic spike
  burst: {
    concurrentUsers: 50,
    intentsPerUser: 20,
    testDurationMinutes: 3,
    rampUpSeconds: 15
  }
};

// Export for use in test files
export { LoadTestConfig, LoadTestMetrics, LoadTestResult };