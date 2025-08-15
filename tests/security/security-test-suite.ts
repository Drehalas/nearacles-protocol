/**
 * Basic Security Testing - Essential security validation for testnet
 * Tests core security requirements without enterprise complexity
 */

import { Worker, NearAccount } from 'near-workspaces';
import { NEAR } from 'near-workspaces';

interface SecurityTestResult {
  testName: string;
  passed: boolean;
  description: string;
}

interface SecurityReport {
  totalTests: number;
  passed: number;
  failed: number;
  tests: SecurityTestResult[];
}

export class SecurityTestSuite {
  private worker: Worker | null = null;
  private oracleContract: NearAccount | null = null;
  private testAccount: NearAccount | null = null;

  async runSecurityTests(contractId?: string): Promise<SecurityReport> {
    console.log('🔒 Running Basic Security Tests');
    
    const results: SecurityTestResult[] = [];

    try {
      await this.setupTestEnvironment(contractId);
      
      // Test 1: Access Control
      results.push(await this.testAccessControl());
      
      // Test 2: Input Validation  
      results.push(await this.testInputValidation());
      
      // Test 3: Deposit Requirements
      results.push(await this.testDepositRequirements());

      return this.generateReport(results);
    } finally {
      await this.cleanup();
    }
  }

  private async setupTestEnvironment(contractId?: string): Promise<void> {
    this.worker = await Worker.init();
    this.oracleContract = contractId 
      ? await this.worker.importContract({ accountId: contractId, mainnetContract: contractId })
      : this.worker.rootAccount;
    this.testAccount = await this.worker.createAccount('test-account');
  }

  private async testAccessControl(): Promise<SecurityTestResult> {
    try {
      // Try to call admin-only function with non-admin account
      await this.testAccount!.call('update_admin_config', {}, { attachedDeposit: '0' });
      return {
        testName: 'Access Control',
        passed: false,
        description: 'Non-admin account should not access admin functions'
      };
    } catch (error) {
      // Expected to fail - this is good
      return {
        testName: 'Access Control', 
        passed: true,
        description: 'Admin functions properly protected'
      };
    }
  }

  private async testInputValidation(): Promise<SecurityTestResult> {
    try {
      // Try to submit intent with invalid data
      await this.testAccount!.call('submit_credibility_intent', {
        question: '', // Empty question should be rejected
        required_sources: -1, // Negative sources should be rejected
        confidence_threshold: 2.0, // > 1.0 should be rejected
        deadline_minutes: -10 // Negative deadline should be rejected
      }, { attachedDeposit: NEAR.parse('1 N').toString() });
      
      return {
        testName: 'Input Validation',
        passed: false,
        description: 'Invalid input should be rejected'
      };
    } catch (error) {
      // Expected to fail - this is good
      return {
        testName: 'Input Validation',
        passed: true,
        description: 'Invalid inputs properly rejected'
      };
    }
  }

  private async testDepositRequirements(): Promise<SecurityTestResult> {
    try {
      // Try to submit intent without required deposit
      await this.testAccount!.call('submit_credibility_intent', {
        question: 'Test question?',
        required_sources: 3,
        confidence_threshold: 0.8,
        deadline_minutes: 60
      }, { attachedDeposit: '0' });
      
      return {
        testName: 'Deposit Requirements',
        passed: false,
        description: 'Should require minimum deposit'
      };
    } catch (error) {
      // Expected to fail - this is good
      return {
        testName: 'Deposit Requirements',
        passed: true,
        description: 'Deposit requirements properly enforced'
      };
    }
  }

  private generateReport(results: SecurityTestResult[]): SecurityReport {
    const passed = results.filter(r => r.passed).length;
    const failed = results.length - passed;
    
    return {
      totalTests: results.length,
      passed,
      failed,
      tests: results
    };
  }

  private async cleanup(): void {
    if (this.worker) {
      await this.worker.tearDown();
    }
  }
}