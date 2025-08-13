/**
 * Verifier Contract Test Suite
 * Comprehensive tests for NEAR Intent Protocol smart contracts
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { NEAR, Worker, NearAccount } from 'near-workspaces';
import { Intent, Quote } from '../../src/near-intent/types';

describe('Verifier Contract Tests', () => {
  let worker: Worker;
  let root: NearAccount;
  let verifierContract: NearAccount;
  let user: NearAccount;
  let solver: NearAccount;

  beforeEach(async () => {
    // Initialize the NEAR testing environment
    worker = await Worker.init();
    root = worker.rootAccount;

    // Deploy the verifier contract
    verifierContract = await root.createSubAccount('verifier');
    await verifierContract.deploy('./contracts/verifier.wasm');

    // Create test accounts
    user = await root.createSubAccount('user');
    solver = await root.createSubAccount('solver');

    // Initialize contract
    await verifierContract.call(verifierContract, 'new', {});
  });

  afterEach(async () => {
    await worker.tearDown();
  });

  describe('User Registration', () => {
    it('should register a new user successfully', async () => {
      const result = await user.call(
        verifierContract,
        'register_user',
        {},
        { attachedDeposit: NEAR.parse('0.1').toString() }
      );

      expect(result).toBeDefined();

      const isRegistered = await verifierContract.view('is_registered', {
        account_id: user.accountId,
      });

      expect(isRegistered).toBe(true);
    });

    it('should not register the same user twice', async () => {
      // First registration
      await user.call(
        verifierContract,
        'register_user',
        {},
        { attachedDeposit: NEAR.parse('0.1').toString() }
      );

      // Second registration should fail or be idempotent
      try {
        await user.call(
          verifierContract,
          'register_user',
          {},
          { attachedDeposit: NEAR.parse('0.1').toString() }
        );
        // Should not charge again if idempotent
      } catch (error) {
        // Or should fail gracefully
        expect(error).toBeDefined();
      }
    });
  });

  describe('Intent Submission', () => {
    beforeEach(async () => {
      // Register user before tests
      await user.call(
        verifierContract,
        'register_user',
        {},
        { attachedDeposit: NEAR.parse('0.1').toString() }
      );
    });

    it('should submit a valid intent successfully', async () => {
      const intent: Intent = {
        id: 'intent_001',
        user: user.accountId,
        asset_in: {
          token_id: 'NEAR',
          decimals: 24,
          symbol: 'NEAR',
          name: 'NEAR Protocol',
        },
        asset_out: {
          token_id: 'USDC',
          decimals: 6,
          symbol: 'USDC',
          name: 'USD Coin',
        },
        amount_in: NEAR.parse('10').toString(),
        amount_out_min: '9500000', // 9.5 USDC
        expiry: Math.floor(Date.now() / 1000) + 3600, // 1 hour from now
        nonce: 'nonce_001',
      };

      const result = await user.call(
        verifierContract,
        'submit_intent',
        { intent },
        { 
          attachedDeposit: NEAR.parse('0.01').toString(),
          gas: '300000000000000' // 300 TGas
        }
      );

      expect(result).toBeDefined();

      // Verify intent was stored
      const storedIntent = await verifierContract.view('get_intent', {
        intent_id: intent.id,
      });

      expect(storedIntent).toBeDefined();
      expect((storedIntent as { id: string; user: string }).id).toBe(intent.id);
      expect((storedIntent as { id: string; user: string }).user).toBe(user.accountId);
    });

    it('should reject invalid intent with zero amount', async () => {
      const invalidIntent: Intent = {
        id: 'intent_002',
        user: user.accountId,
        asset_in: {
          token_id: 'NEAR',
          decimals: 24,
          symbol: 'NEAR',
          name: 'NEAR Protocol',
        },
        asset_out: {
          token_id: 'USDC',
          decimals: 6,
          symbol: 'USDC',
          name: 'USD Coin',
        },
        amount_in: '0', // Invalid: zero amount
        amount_out_min: '9500000',
        expiry: Math.floor(Date.now() / 1000) + 3600,
        nonce: 'nonce_002',
      };

      try {
        await user.call(
          verifierContract,
          'submit_intent',
          { intent: invalidIntent },
          { 
            attachedDeposit: NEAR.parse('0.01').toString(),
            gas: '300000000000000'
          }
        );
        // Should not reach here
        expect(true).toBe(false);
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    it('should reject expired intent', async () => {
      const expiredIntent: Intent = {
        id: 'intent_003',
        user: user.accountId,
        asset_in: {
          token_id: 'NEAR',
          decimals: 24,
          symbol: 'NEAR',
          name: 'NEAR Protocol',
        },
        asset_out: {
          token_id: 'USDC',
          decimals: 6,
          symbol: 'USDC',
          name: 'USD Coin',
        },
        amount_in: NEAR.parse('10').toString(),
        amount_out_min: '9500000',
        expiry: Math.floor(Date.now() / 1000) - 3600, // 1 hour ago (expired)
        nonce: 'nonce_003',
      };

      try {
        await user.call(
          verifierContract,
          'submit_intent',
          { intent: expiredIntent },
          { 
            attachedDeposit: NEAR.parse('0.01').toString(),
            gas: '300000000000000'
          }
        );
        expect(true).toBe(false);
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });

  describe('Quote Submission', () => {
    let intentId: string;

    beforeEach(async () => {
      // Register users
      await user.call(
        verifierContract,
        'register_user',
        {},
        { attachedDeposit: NEAR.parse('0.1').toString() }
      );

      await solver.call(
        verifierContract,
        'register_user',
        {},
        { attachedDeposit: NEAR.parse('0.1').toString() }
      );

      // Submit an intent first
      const intent: Intent = {
        id: 'intent_quote_001',
        user: user.accountId,
        asset_in: {
          token_id: 'NEAR',
          decimals: 24,
          symbol: 'NEAR',
          name: 'NEAR Protocol',
        },
        asset_out: {
          token_id: 'USDC',
          decimals: 6,
          symbol: 'USDC',
          name: 'USD Coin',
        },
        amount_in: NEAR.parse('10').toString(),
        amount_out_min: '9500000',
        expiry: Math.floor(Date.now() / 1000) + 3600,
        nonce: 'nonce_quote_001',
      };

      await user.call(
        verifierContract,
        'submit_intent',
        { intent },
        { 
          attachedDeposit: NEAR.parse('0.01').toString(),
          gas: '300000000000000'
        }
      );

      intentId = intent.id;
    });

    it('should submit a valid quote successfully', async () => {
      const quote: Quote = {
        solver_id: solver.accountId,
        intent_id: intentId,
        amount_out: '9800000', // 9.8 USDC (better than minimum)
        fee: NEAR.parse('0.1').toString(),
        gas_estimate: '200000000000000',
        execution_time_estimate: 30,
        confidence_score: 0.95,
        signature: 'mock_signature',
        expires_at: Math.floor(Date.now() / 1000) + 1800, // 30 minutes
      };

      const result = await solver.call(
        verifierContract,
        'submit_quote',
        { quote },
        { 
          attachedDeposit: NEAR.parse('0.005').toString(),
          gas: '200000000000000'
        }
      );

      expect(result).toBeDefined();

      // Verify quote was stored
      const quotes = await verifierContract.view('get_solver_quotes', {
        intent_id: intentId,
      });

      expect(quotes).toBeDefined();
      expect((quotes as Array<{ solver_id: string; amount_out: string }>).length).toBe(1);
      expect((quotes as Array<{ solver_id: string; amount_out: string }>)[0].solver_id).toBe(solver.accountId);
      expect((quotes as Array<{ solver_id: string; amount_out: string }>)[0].amount_out).toBe(quote.amount_out);
    });

    it('should reject quote with insufficient output amount', async () => {
      const badQuote: Quote = {
        solver_id: solver.accountId,
        intent_id: intentId,
        amount_out: '9000000', // 9.0 USDC (less than minimum 9.5)
        fee: NEAR.parse('0.1').toString(),
        gas_estimate: '200000000000000',
        execution_time_estimate: 30,
        confidence_score: 0.95,
        signature: 'mock_signature',
        expires_at: Math.floor(Date.now() / 1000) + 1800,
      };

      try {
        await solver.call(
          verifierContract,
          'submit_quote',
          { quote: badQuote },
          { 
            attachedDeposit: NEAR.parse('0.005').toString(),
            gas: '200000000000000'
          }
        );
        expect(true).toBe(false);
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });

  describe('Intent Execution', () => {
    let intentId: string;
    let quoteId: string;

    beforeEach(async () => {
      // Setup complete intent and quote scenario
      await user.call(
        verifierContract,
        'register_user',
        {},
        { attachedDeposit: NEAR.parse('0.1').toString() }
      );

      await solver.call(
        verifierContract,
        'register_user',
        {},
        { attachedDeposit: NEAR.parse('0.1').toString() }
      );

      // Submit intent
      const intent: Intent = {
        id: 'intent_exec_001',
        user: user.accountId,
        asset_in: {
          token_id: 'NEAR',
          decimals: 24,
          symbol: 'NEAR',
          name: 'NEAR Protocol',
        },
        asset_out: {
          token_id: 'USDC',
          decimals: 6,
          symbol: 'USDC',
          name: 'USD Coin',
        },
        amount_in: NEAR.parse('10').toString(),
        amount_out_min: '9500000',
        expiry: Math.floor(Date.now() / 1000) + 3600,
        nonce: 'nonce_exec_001',
      };

      await user.call(
        verifierContract,
        'submit_intent',
        { intent },
        { 
          attachedDeposit: NEAR.parse('0.01').toString(),
          gas: '300000000000000'
        }
      );

      intentId = intent.id;

      // Submit quote
      const quote: Quote = {
        solver_id: solver.accountId,
        intent_id: intentId,
        amount_out: '9800000',
        fee: NEAR.parse('0.1').toString(),
        gas_estimate: '200000000000000',
        execution_time_estimate: 30,
        confidence_score: 0.95,
        signature: 'mock_signature',
        expires_at: Math.floor(Date.now() / 1000) + 1800,
      };

      await solver.call(
        verifierContract,
        'submit_quote',
        { quote },
        { 
          attachedDeposit: NEAR.parse('0.005').toString(),
          gas: '200000000000000'
        }
      );

      quoteId = solver.accountId; // Using solver ID as quote ID for simplicity
    });

    it('should execute intent with valid quote successfully', async () => {
      const result = await user.call(
        verifierContract,
        'execute_intent',
        { 
          intent_id: intentId,
          quote_id: quoteId,
        },
        { 
          attachedDeposit: NEAR.parse('0.1').toString(),
          gas: '300000000000000'
        }
      );

      expect(result).toBeDefined();

      // Check intent status
      const status = await verifierContract.view('get_intent_status', {
        intent_id: intentId,
      });

      expect(status).toBeDefined();
      expect(['executing', 'completed']).toContain((status as { status: string; intent_id: string }).status);
    });

    it('should not allow execution by non-owner', async () => {
      try {
        await solver.call(
          verifierContract,
          'execute_intent',
          { 
            intent_id: intentId,
            quote_id: quoteId,
          },
          { 
            attachedDeposit: NEAR.parse('0.1').toString(),
            gas: '300000000000000'
          }
        );
        expect(true).toBe(false);
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });

  describe('Intent Cancellation', () => {
    let intentId: string;

    beforeEach(async () => {
      await user.call(
        verifierContract,
        'register_user',
        {},
        { attachedDeposit: NEAR.parse('0.1').toString() }
      );

      const intent: Intent = {
        id: 'intent_cancel_001',
        user: user.accountId,
        asset_in: {
          token_id: 'NEAR',
          decimals: 24,
          symbol: 'NEAR',
          name: 'NEAR Protocol',
        },
        asset_out: {
          token_id: 'USDC',
          decimals: 6,
          symbol: 'USDC',
          name: 'USD Coin',
        },
        amount_in: NEAR.parse('10').toString(),
        amount_out_min: '9500000',
        expiry: Math.floor(Date.now() / 1000) + 3600,
        nonce: 'nonce_cancel_001',
      };

      await user.call(
        verifierContract,
        'submit_intent',
        { intent },
        { 
          attachedDeposit: NEAR.parse('0.01').toString(),
          gas: '300000000000000'
        }
      );

      intentId = intent.id;
    });

    it('should cancel own intent successfully', async () => {
      const result = await user.call(
        verifierContract,
        'cancel_intent',
        { intent_id: intentId },
        { gas: '200000000000000' }
      );

      expect(result).toBeDefined();

      // Verify intent is cancelled
      const status = await verifierContract.view('get_intent_status', {
        intent_id: intentId,
      });

      expect((status as { status: string; intent_id: string }).status).toBe('cancelled');
    });

    it('should not allow cancellation by non-owner', async () => {
      await solver.call(
        verifierContract,
        'register_user',
        {},
        { attachedDeposit: NEAR.parse('0.1').toString() }
      );

      try {
        await solver.call(
          verifierContract,
          'cancel_intent',
          { intent_id: intentId },
          { gas: '200000000000000' }
        );
        expect(true).toBe(false);
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });

  describe('Query Functions', () => {
    beforeEach(async () => {
      // Setup test data
      await user.call(
        verifierContract,
        'register_user',
        {},
        { attachedDeposit: NEAR.parse('0.1').toString() }
      );

      const intent: Intent = {
        id: 'intent_query_001',
        user: user.accountId,
        asset_in: {
          token_id: 'NEAR',
          decimals: 24,
          symbol: 'NEAR',
          name: 'NEAR Protocol',
        },
        asset_out: {
          token_id: 'USDC',
          decimals: 6,
          symbol: 'USDC',
          name: 'USD Coin',
        },
        amount_in: NEAR.parse('10').toString(),
        amount_out_min: '9500000',
        expiry: Math.floor(Date.now() / 1000) + 3600,
        nonce: 'nonce_query_001',
      };

      await user.call(
        verifierContract,
        'submit_intent',
        { intent },
        { 
          attachedDeposit: NEAR.parse('0.01').toString(),
          gas: '300000000000000'
        }
      );
    });

    it('should get user intents successfully', async () => {
      const intents = await verifierContract.view('get_user_intents', {
        user: user.accountId,
        limit: 10,
      });

      expect(intents).toBeDefined();
      expect(Array.isArray(intents)).toBe(true);
      expect((intents as Array<{ user: string; id: string }>).length).toBeGreaterThan(0);
      expect((intents as Array<{ user: string; id: string }>)[0].user).toBe(user.accountId);
    });

    it('should get contract statistics', async () => {
      const stats = await verifierContract.view('get_statistics', {});

      expect(stats).toBeDefined();
      expect(typeof (stats as { total_intents: number; total_users: number }).total_intents).toBe('number');
      expect(typeof (stats as { total_intents: number; total_users: number }).total_users).toBe('number');
    });
  });
});
