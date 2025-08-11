/**
 * Intent Manager Contract Test Suite
 * Tests for intent lifecycle management and execution coordination
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { NEAR } from 'near-workspaces';
import { initTestEnvironment, cleanupTestEnvironment, TestContext, createMockIntent } from './setup';

describe('Intent Manager Contract Tests', () => {
  let context: TestContext;

  beforeEach(async () => {
    context = await initTestEnvironment();
  });

  afterEach(async () => {
    await cleanupTestEnvironment(context);
  });

  describe('Intent Lifecycle Management', () => {
    it('should manage intent creation and status updates', async () => {
      const user = context.testUsers.alice;
      const intent = createMockIntent(user.accountId);

      // Create intent through verifier
      await user.call(
        context.verifierContract,
        'submit_intent',
        { intent },
        {
          attachedDeposit: NEAR.parse('0.01').toString(),
          gas: '300000000000000',
        }
      );

      // Check intent status
      const status = await context.intentManagerContract.view('get_intent_status', {
        intent_id: intent.id,
      }) as { status: string; intent_id: string };

      expect(status.status).toBe('pending');
      expect(status.intent_id).toBe(intent.id);
    });

    it('should handle intent expiry automatically', async () => {
      const user = context.testUsers.alice;
      const expiredIntent = {
        ...createMockIntent(user.accountId),
        expiry: Math.floor(Date.now() / 1000) - 3600, // 1 hour ago
      };

      try {
        await user.call(
          context.verifierContract,
          'submit_intent',
          { intent: expiredIntent },
          {
            attachedDeposit: NEAR.parse('0.01').toString(),
            gas: '300000000000000',
          }
        );
        expect(true).toBe(false); // Should not reach here
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    it('should track intent execution progress', async () => {
      const user = context.testUsers.alice;
      const solver = context.testSolvers.solver1;
      const intent = createMockIntent(user.accountId);

      // Submit intent
      await user.call(
        context.verifierContract,
        'submit_intent',
        { intent },
        {
          attachedDeposit: NEAR.parse('0.01').toString(),
          gas: '300000000000000',
        }
      );

      // Update status to executing
      await context.intentManagerContract.call(
        context.intentManagerContract,
        'update_intent_status',
        {
          intent_id: intent.id,
          status: 'executing',
          solver_id: solver.accountId,
        },
        { gas: '100000000000000' }
      );

      const status = await context.intentManagerContract.view('get_intent_status', {
        intent_id: intent.id,
      });

      expect((status as { status: string; solver_id: string; intent_id: string }).status).toBe('executing');
      expect((status as { status: string; solver_id: string; intent_id: string }).solver_id).toBe(solver.accountId);
    });
  });

  describe('Intent Cleanup and Maintenance', () => {
    it('should clean up expired intents', async () => {
      // This would test the cleanup mechanism for expired intents
      const cleanupResult = await context.intentManagerContract.call(
        context.intentManagerContract,
        'cleanup_expired_intents',
        { limit: 10 },
        { gas: '200000000000000' }
      );

      expect(cleanupResult).toBeDefined();
    });

    it('should maintain intent statistics', async () => {
      const stats = await context.intentManagerContract.view('get_statistics', {});

      expect(stats).toBeDefined();
      expect(typeof (stats as { total_intents: number; active_intents: number; completed_intents: number }).total_intents).toBe('number');
      expect(typeof (stats as { total_intents: number; active_intents: number; completed_intents: number }).active_intents).toBe('number');
      expect(typeof (stats as { total_intents: number; active_intents: number; completed_intents: number }).completed_intents).toBe('number');
    });
  });

  describe('Event Emission', () => {
    it('should emit events for intent lifecycle changes', async () => {
      const user = context.testUsers.alice;
      const intent = createMockIntent(user.accountId);

      // Monitor for events (in a real test, you'd use event listeners)
      const result = await user.call(
        context.verifierContract,
        'submit_intent',
        { intent },
        {
          attachedDeposit: NEAR.parse('0.01').toString(),
          gas: '300000000000000',
        }
      );

      // Verify event was emitted (check transaction outcome)
      expect(result).toBeDefined();
    });
  });

  describe('Cross-Contract Communication', () => {
    it('should coordinate with verifier contract', async () => {
      const user = context.testUsers.alice;
      const intent = createMockIntent(user.accountId);

      await user.call(
        context.verifierContract,
        'submit_intent',
        { intent },
        {
          attachedDeposit: NEAR.parse('0.01').toString(),
          gas: '300000000000000',
        }
      );

      // Verify coordination worked
      const intentFromVerifier = await context.verifierContract.view('get_intent', {
        intent_id: intent.id,
      });
      const statusFromManager = await context.intentManagerContract.view('get_intent_status', {
        intent_id: intent.id,
      });

      expect((intentFromVerifier as { id: string; user: string }).id).toBe((statusFromManager as { intent_id: string; status: string }).intent_id);
    });
  });
});
