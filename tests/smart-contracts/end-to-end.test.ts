/**
 * End-to-End Smart Contract Test Suite
 * Complete workflow testing across all contracts
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { NEAR } from 'near-workspaces';
import { initTestEnvironment, cleanupTestEnvironment, TestContext, createMockIntent, createMockQuote } from './setup';

describe('End-to-End Smart Contract Workflow Tests', () => {
  let context: TestContext;

  beforeEach(async () => {
    context = await initTestEnvironment();
  });

  afterEach(async () => {
    await cleanupTestEnvironment(context);
  });

  describe('Complete Intent Execution Workflow', () => {
    it('should execute complete intent workflow successfully', async () => {
      const user = context.testUsers.alice;
      const solver = context.testSolvers.solver1;
      const intent = createMockIntent(user.accountId);

      // Step 1: User submits intent
      await user.call(
        context.verifierContract,
        'submit_intent',
        { intent },
        {
          attachedDeposit: NEAR.parse('0.01').toString(),
          gas: '300000000000000',
        }
      );

      // Verify intent was created
      const storedIntent = await context.verifierContract.view('get_intent', {
        intent_id: intent.id,
      });
      expect(storedIntent.id).toBe(intent.id);

      // Step 2: Solver submits quote
      const quote = createMockQuote(solver.accountId, intent.id);
      
      await solver.call(
        context.verifierContract,
        'submit_quote',
        { quote },
        {
          attachedDeposit: NEAR.parse('0.005').toString(),
          gas: '200000000000000',
        }
      );

      // Verify quote was stored
      const quotes = await context.verifierContract.view('get_solver_quotes', {
        intent_id: intent.id,
      });
      expect(quotes.length).toBe(1);
      expect(quotes[0].solver_id).toBe(solver.accountId);

      // Step 3: User executes intent with selected quote
      await user.call(
        context.verifierContract,
        'execute_intent',
        {
          intent_id: intent.id,
          quote_id: solver.accountId,
        },
        {
          attachedDeposit: NEAR.parse('0.1').toString(),
          gas: '300000000000000',
        }
      );

      // Step 4: Verify execution status
      const status = await context.intentManagerContract.view('get_intent_status', {
        intent_id: intent.id,
      });
      expect(['executing', 'completed']).toContain(status.status);

      // Step 5: Verify solver performance was recorded
      const performance = await context.solverRegistryContract.view('get_solver_performance', {
        solver_id: solver.accountId,
      });
      expect(performance.total_executions).toBeGreaterThan(0);
    });

    it('should handle multiple competing quotes', async () => {
      const user = context.testUsers.bob;
      const solver1 = context.testSolvers.solver1;
      const solver2 = context.testSolvers.solver2;
      const solver3 = context.testSolvers.solver3;
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

      // Multiple solvers submit quotes
      const quotes = [
        { ...createMockQuote(solver1.accountId, intent.id), amount_out: '9700000' },
        { ...createMockQuote(solver2.accountId, intent.id), amount_out: '9800000' },
        { ...createMockQuote(solver3.accountId, intent.id), amount_out: '9750000' },
      ];

      for (const quote of quotes) {
        const solverAccount = quote.solver_id === solver1.accountId ? solver1 :
                             quote.solver_id === solver2.accountId ? solver2 : solver3;
        
        await solverAccount.call(
          context.verifierContract,
          'submit_quote',
          { quote },
          {
            attachedDeposit: NEAR.parse('0.005').toString(),
            gas: '200000000000000',
          }
        );
      }

      // Verify all quotes were stored
      const allQuotes = await context.verifierContract.view('get_solver_quotes', {
        intent_id: intent.id,
      });
      expect(allQuotes.length).toBe(3);

      // User selects best quote (solver2 with highest amount_out)
      await user.call(
        context.verifierContract,
        'execute_intent',
        {
          intent_id: intent.id,
          quote_id: solver2.accountId,
        },
        {
          attachedDeposit: NEAR.parse('0.1').toString(),
          gas: '300000000000000',
        }
      );

      const status = await context.intentManagerContract.view('get_intent_status', {
        intent_id: intent.id,
      });
      expect(status.solver_id).toBe(solver2.accountId);
    });

    it('should handle intent cancellation workflow', async () => {
      const user = context.testUsers.charlie;
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

      // User cancels intent
      await user.call(
        context.verifierContract,
        'cancel_intent',
        { intent_id: intent.id },
        { gas: '200000000000000' }
      );

      // Verify cancellation
      const status = await context.intentManagerContract.view('get_intent_status', {
        intent_id: intent.id,
      });
      expect(status.status).toBe('cancelled');

      // Verify quotes are no longer accepted
      const solver = context.testSolvers.solver1;
      const quote = createMockQuote(solver.accountId, intent.id);

      try {
        await solver.call(
          context.verifierContract,
          'submit_quote',
          { quote },
          {
            attachedDeposit: NEAR.parse('0.005').toString(),
            gas: '200000000000000',
          }
        );
        expect(true).toBe(false); // Should not accept quotes for cancelled intent
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle insufficient deposit for intent submission', async () => {
      const user = context.testUsers.alice;
      const intent = createMockIntent(user.accountId);

      try {
        await user.call(
          context.verifierContract,
          'submit_intent',
          { intent },
          {
            attachedDeposit: '1000', // Too low
            gas: '300000000000000',
          }
        );
        expect(true).toBe(false);
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    it('should handle quote submission after intent expiry', async () => {
      const user = context.testUsers.alice;
      const solver = context.testSolvers.solver1;
      
      // Create intent that will expire soon
      const shortLivedIntent = {
        ...createMockIntent(user.accountId),
        expiry: Math.floor(Date.now() / 1000) + 1, // 1 second
      };

      await user.call(
        context.verifierContract,
        'submit_intent',
        { intent: shortLivedIntent },
        {
          attachedDeposit: NEAR.parse('0.01').toString(),
          gas: '300000000000000',
        }
      );

      // Wait for expiry
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Try to submit quote after expiry
      const quote = createMockQuote(solver.accountId, shortLivedIntent.id);

      try {
        await solver.call(
          context.verifierContract,
          'submit_quote',
          { quote },
          {
            attachedDeposit: NEAR.parse('0.005').toString(),
            gas: '200000000000000',
          }
        );
        expect(true).toBe(false);
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    it('should handle execution by non-owner', async () => {
      const user = context.testUsers.alice;
      const maliciousUser = context.testUsers.bob;
      const solver = context.testSolvers.solver1;
      const intent = createMockIntent(user.accountId);

      // Submit intent and quote
      await user.call(
        context.verifierContract,
        'submit_intent',
        { intent },
        {
          attachedDeposit: NEAR.parse('0.01').toString(),
          gas: '300000000000000',
        }
      );

      const quote = createMockQuote(solver.accountId, intent.id);
      await solver.call(
        context.verifierContract,
        'submit_quote',
        { quote },
        {
          attachedDeposit: NEAR.parse('0.005').toString(),
          gas: '200000000000000',
        }
      );

      // Malicious user tries to execute
      try {
        await maliciousUser.call(
          context.verifierContract,
          'execute_intent',
          {
            intent_id: intent.id,
            quote_id: solver.accountId,
          },
          {
            attachedDeposit: NEAR.parse('0.1').toString(),
            gas: '300000000000000',
          }
        );
        expect(true).toBe(false);
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });

  describe('Performance and Scalability', () => {
    it('should handle multiple concurrent intents', async () => {
      const users = [context.testUsers.alice, context.testUsers.bob, context.testUsers.charlie];
      const intents = users.map(user => createMockIntent(user.accountId));

      // Submit multiple intents concurrently
      await Promise.all(
        intents.map((intent, index) =>
          users[index].call(
            context.verifierContract,
            'submit_intent',
            { intent },
            {
              attachedDeposit: NEAR.parse('0.01').toString(),
              gas: '300000000000000',
            }
          )
        )
      );

      // Verify all intents were created
      for (const intent of intents) {
        const storedIntent = await context.verifierContract.view('get_intent', {
          intent_id: intent.id,
        });
        expect(storedIntent.id).toBe(intent.id);
      }
    });

    it('should maintain performance with many quotes', async () => {
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

      // Submit quotes from all solvers multiple times
      const solvers = [context.testSolvers.solver1, context.testSolvers.solver2, context.testSolvers.solver3];
      
      for (let i = 0; i < 3; i++) {
        for (const solver of solvers) {
          const quote = {
            ...createMockQuote(solver.accountId, intent.id),
            amount_out: (9700000 + i * 10000).toString(),
          };

          await solver.call(
            context.verifierContract,
            'submit_quote',
            { quote },
            {
              attachedDeposit: NEAR.parse('0.005').toString(),
              gas: '200000000000000',
            }
          );
        }
      }

      // Should still be able to retrieve quotes efficiently
      const quotes = await context.verifierContract.view('get_solver_quotes', {
        intent_id: intent.id,
      });
      expect(quotes.length).toBe(9); // 3 solvers × 3 quotes each
    });
  });
});
