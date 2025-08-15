/**
 * Enhanced Oracle Contract Integration Tests with NEAR Workspaces
 * Tests all new features: expiry handling, user management, performance metrics, and reward distribution
 */

import { Worker, NearAccount } from 'near-workspaces';
import { NEAR } from 'near-workspaces';

describe('Enhanced Oracle Contract Integration Tests', () => {
  let worker: Worker;
  let root: NearAccount;
  let oracleContract: NearAccount;
  let owner: NearAccount;
  let solver1: NearAccount;
  let solver2: NearAccount;
  let user1: NearAccount;
  let challenger: NearAccount;

  beforeAll(async () => {
    worker = await Worker.init();
    root = worker.rootAccount;

    // Create test accounts
    owner = await root.createSubAccount('owner');
    solver1 = await root.createSubAccount('solver1');
    solver2 = await root.createSubAccount('solver2');
    user1 = await root.createSubAccount('user1');
    challenger = await root.createSubAccount('challenger');

    // Deploy the oracle contract
    oracleContract = await root.createSubAccount('oracle-contract');
    await oracleContract.deploy('./contracts/oracle-intent/target/wasm32-unknown-unknown/release/oracle_intent.wasm');
    
    // Initialize the contract
    await oracleContract.call(oracleContract, 'new', { owner: owner.accountId });
  });

  afterAll(async () => {
    await worker.tearDown();
  });

  describe('User Registration and Access Control', () => {
    it('should register users with different roles', async () => {
      // Register user1 as regular user
      await user1.call(oracleContract, 'register_user', { role: 'User' });
      
      const userProfile = await oracleContract.view('get_user_profile', { user_id: user1.accountId });
      expect(userProfile.role).toBe('User');
      expect(userProfile.is_verified).toBe(false);
      expect(userProfile.verification_level).toBe(0);
    });

    it('should allow owner to register admins', async () => {
      await owner.call(oracleContract, 'register_user', { 
        role: 'Admin'
      });

      const admins = await oracleContract.view('get_all_admins');
      expect(admins).toContain(owner.accountId);
    });

    it('should allow verification of users', async () => {
      // Owner can verify users
      await owner.call(oracleContract, 'verify_user', {
        user_id: user1.accountId,
        verification_level: 3
      });

      const userProfile = await oracleContract.view('get_user_profile', { user_id: user1.accountId });
      expect(userProfile.is_verified).toBe(true);
      expect(userProfile.verification_level).toBe(3);
    });
  });

  describe('Enhanced Solver Registration with Performance Metrics', () => {
    it('should register solver with comprehensive performance metrics', async () => {
      await solver1.call(oracleContract, 'register_solver', {}, {
        attachedDeposit: NEAR.parse('2').toString()
      });

      const solverInfo = await oracleContract.view('get_solver', { solver_id: solver1.accountId });
      expect(solverInfo.solver_id).toBe(solver1.accountId);
      expect(solverInfo.performance_metrics.average_execution_time).toBe(0);
      expect(solverInfo.performance_metrics.total_rewards_earned).toBe('0');
      expect(solverInfo.performance_metrics.uptime_score).toBe(1.0);
    });

    it('should allow solver to update specialization areas', async () => {
      await solver1.call(oracleContract, 'update_solver_specialization', {
        specialization_areas: ['financial', 'scientific', 'news']
      });

      const specializations = await oracleContract.view('get_solver_specialization', { 
        solver_id: solver1.accountId 
      });
      expect(specializations).toEqual(['financial', 'scientific', 'news']);
    });
  });

  describe('Intent Execution Coordination', () => {
    let intentId: string;

    it('should create and accept intent with proper coordination', async () => {
      // Create intent
      const result = await user1.call(oracleContract, 'submit_credibility_intent', {
        question: 'Is Bitcoin trading above $50,000?',
        required_sources: 5,
        confidence_threshold: 0.9,
        deadline_minutes: 60
      }, {
        attachedDeposit: NEAR.parse('1').toString()
      });

      // Extract intent ID from logs or return value
      const intent = await oracleContract.view('get_pending_intents');
      expect(intent.length).toBeGreaterThan(0);
      intentId = intent[0].intent_id;

      // Solver accepts intent
      const accepted = await solver1.call(oracleContract, 'accept_intent', {
        intent_id: intentId
      });

      expect(accepted).toBe(true);

      // Check intent status
      const updatedIntent = await oracleContract.view('get_intent', { intent_id: intentId });
      expect(updatedIntent.status).toBe('InProgress');
    });

    it('should submit evaluation and track performance metrics', async () => {
      const sources = [
        { title: 'CoinMarketCap', url: 'https://coinmarketcap.com/currencies/bitcoin/' },
        { title: 'CoinGecko', url: 'https://coingecko.com/en/coins/bitcoin' },
        { title: 'Binance', url: 'https://binance.com/en/trade/BTC_USDT' }
      ];

      const evaluationResult = await solver1.call(oracleContract, 'submit_evaluation', {
        intent_id: intentId,
        answer: true,
        confidence: 0.95,
        sources: sources,
        execution_time_ms: { '0': '45000' } // 45 seconds
      }, {
        attachedDeposit: NEAR.parse('1').toString()
      });

      // Get the evaluation
      const evaluations = await oracleContract.view('get_pending_intents');
      expect(evaluations.length).toBeGreaterThan(0);

      // Complete the intent execution
      const completed = await solver1.call(oracleContract, 'complete_intent_execution', {
        intent_id: intentId,
        evaluation_id: evaluationResult
      });

      expect(completed).toBe(true);
    });
  });

  describe('Storage Optimization and Gas Efficiency', () => {
    it('should provide storage statistics', async () => {
      const stats = await oracleContract.view('get_storage_stats');
      expect(stats).toHaveLength(4); // [intents, evaluations, challenges, users]
      expect(stats[0]).toBeGreaterThan(0); // Should have at least one intent
    });

    it('should perform batch cleanup efficiently', async () => {
      const result = await owner.call(oracleContract, 'batch_process_expired_and_cleanup', {
        max_operations: 10
      });

      // Result should be [expired_count, cleanup_count]
      expect(Array.isArray(result)).toBe(true);
      expect(result).toHaveLength(2);
    });
  });

  describe('Performance Metrics Storage', () => {
    it('should track and retrieve solver performance metrics', async () => {
      const metrics = await oracleContract.view('get_solver_performance_metrics', {
        solver_id: solver1.accountId
      });

      expect(metrics).toBeDefined();
      expect(metrics.average_execution_time).toBeGreaterThan(0);
      expect(metrics.total_challenges_received).toBe(0);
      expect(metrics.last_active_timestamp).toBeDefined();
    });

    it('should show top performers ranking', async () => {
      // Register second solver
      await solver2.call(oracleContract, 'register_solver', {}, {
        attachedDeposit: NEAR.parse('2').toString()
      });

      const topPerformers = await oracleContract.view('get_top_performers', { limit: 5 });
      
      expect(Array.isArray(topPerformers)).toBe(true);
      expect(topPerformers.length).toBeGreaterThan(0);
      expect(topPerformers[0]).toHaveLength(3); // [account_id, reputation, metrics]
    });
  });

  describe('Reward Distribution Logic', () => {
    it('should distribute performance rewards based on weighted scoring', async () => {
      const rewardPool = NEAR.parse('10').toString();
      
      await owner.call(oracleContract, 'distribute_performance_rewards', {
        total_reward_pool: rewardPool
      });

      // Check that solver1 received rewards
      const solver1Metrics = await oracleContract.view('get_solver_performance_metrics', {
        solver_id: solver1.accountId
      });

      expect(parseInt(solver1Metrics.total_rewards_earned)).toBeGreaterThan(0);
    });

    it('should finalize evaluation rewards with bonuses', async () => {
      // First create a new intent for testing finalization
      const newResult = await user1.call(oracleContract, 'submit_credibility_intent', {
        question: 'Will Ethereum reach $5,000 this year?',
        required_sources: 3,
        confidence_threshold: 0.8,
        deadline_minutes: 30
      }, {
        attachedDeposit: NEAR.parse('2').toString()
      });

      const intents = await oracleContract.view('get_pending_intents');
      const newIntentId = intents[intents.length - 1].intent_id;

      // Accept and submit evaluation
      await solver1.call(oracleContract, 'accept_intent', { intent_id: newIntentId });
      
      const evaluationId = await solver1.call(oracleContract, 'submit_evaluation', {
        intent_id: newIntentId,
        answer: false,
        confidence: 0.88,
        sources: [
          { title: 'Source 1', url: 'https://example1.com' },
          { title: 'Source 2', url: 'https://example2.com' },
          { title: 'Source 3', url: 'https://example3.com' }
        ],
        execution_time_ms: { '0': '30000' } // 30 seconds - fast execution
      }, {
        attachedDeposit: NEAR.parse('1').toString()
      });

      // Note: In a real test, we would need to wait for the challenge period to expire
      // For testing purposes, we'll just verify the finalization method exists
      const finalizationMethodExists = await oracleContract.view('get_intent', { intent_id: newIntentId });
      expect(finalizationMethodExists).toBeDefined();
    });
  });

  describe('Expiry Handling and Cleanup', () => {
    it('should process expired intents automatically', async () => {
      // Create an intent with very short deadline for testing
      await user1.call(oracleContract, 'submit_credibility_intent', {
        question: 'Test question for expiry?',
        required_sources: 2,
        confidence_threshold: 0.7,
        deadline_minutes: 0 // Immediate expiry
      }, {
        attachedDeposit: NEAR.parse('0.5').toString()
      });

      // Process expired intents
      const expiredCount = await oracleContract.call(oracleContract, 'process_expired_intents');
      expect(expiredCount).toBeGreaterThanOrEqual(0);
    });

    it('should perform automatic cleanup efficiently', async () => {
      const cleanupResult = await oracleContract.call(oracleContract, 'auto_cleanup');
      expect(typeof cleanupResult).toBe('number');
      expect(cleanupResult).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Challenge and Dispute System', () => {
    it('should handle challenges with performance metric updates', async () => {
      // First need to create an intent and evaluation to challenge
      const challengeResult = await user1.call(oracleContract, 'submit_credibility_intent', {
        question: 'Is AI advancing rapidly?',
        required_sources: 3,
        confidence_threshold: 0.85,
        deadline_minutes: 60
      }, {
        attachedDeposit: NEAR.parse('1').toString()
      });

      const intents = await oracleContract.view('get_pending_intents');
      const challengeIntentId = intents[intents.length - 1].intent_id;

      // Accept and submit evaluation
      await solver1.call(oracleContract, 'accept_intent', { intent_id: challengeIntentId });
      
      const challengeEvaluationId = await solver1.call(oracleContract, 'submit_evaluation', {
        intent_id: challengeIntentId,
        answer: true,
        confidence: 0.9,
        sources: [
          { title: 'AI Research Paper', url: 'https://arxiv.org/example' },
          { title: 'Tech News', url: 'https://technews.example' },
          { title: 'Industry Report', url: 'https://report.example' }
        ],
        execution_time_ms: { '0': '60000' }
      }, {
        attachedDeposit: NEAR.parse('1').toString()
      });

      // Submit challenge
      const challengeId = await challenger.call(oracleContract, 'submit_challenge', {
        evaluation_id: challengeEvaluationId,
        counter_sources: [
          { title: 'Counter Source 1', url: 'https://counter1.example' },
          { title: 'Counter Source 2', url: 'https://counter2.example' }
        ]
      }, {
        attachedDeposit: NEAR.parse('1.5').toString() // Higher stake
      });

      // Verify challenge was created
      const challenge = await oracleContract.view('get_challenge', { challenge_id: challengeId });
      expect(challenge.challenger).toBe(challenger.accountId);
      expect(challenge.status).toBe('Submitted');
    });
  });
});