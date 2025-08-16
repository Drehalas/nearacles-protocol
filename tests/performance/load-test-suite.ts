/**
 * Simple Performance Testing - Basic load validation for testnet
 * Tests basic system performance under light load conditions
 */

import { Worker, NearAccount } from 'near-workspaces';
import { NEAR } from 'near-workspaces';

interface LoadTestResult {
  totalIntents: number;
  successfulIntents: number;
  averageResponseTime: number;
  passed: boolean;
}

export class LoadTestSuite {
  private worker: Worker | null = null;
  private oracleContract: NearAccount | null = null;

  async runBasicLoadTest(contractId?: string): Promise<LoadTestResult> {
    console.log('⚡ Running Basic Load Test');
    
    const startTime = Date.now();
    let successfulIntents = 0;
    const totalIntents = 10;

    try {
      this.worker = await Worker.init();
      this.oracleContract = contractId 
        ? await this.worker.importContract({ accountId: contractId, mainnetContract: contractId })
        : this.worker.rootAccount;

      // Submit 10 test intents and measure response time
      for (let i = 0; i < totalIntents; i++) {
        try {
          await this.oracleContract.call('submit_credibility_intent', {
            question: `Test load question ${i}?`,
            required_sources: 3,
            confidence_threshold: 0.8,
            deadline_minutes: 60
          }, { attachedDeposit: NEAR.parse('1 N').toString() });
          
          successfulIntents++;
        } catch (error) {
          console.error(`Intent ${i} failed:`, error);
        }
      }

      const totalTime = Date.now() - startTime;
      const averageResponseTime = totalTime / totalIntents;
      const passed = successfulIntents >= totalIntents * 0.8; // 80% success rate

      return {
        totalIntents,
        successfulIntents,
        averageResponseTime,
        passed
      };
    } finally {
      await this.cleanup();
    }
  }

  private async cleanup(): void {
    if (this.worker) {
      await this.worker.tearDown();
    }
  }
}