/**
 * Solver Registry Contract Test Suite
 * Tests for solver registration, management, and reputation tracking
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { Worker } from 'near-workspaces';
import { initTestEnvironment, cleanupTestEnvironment, TestContext } from './setup';

describe('Solver Registry Contract Tests', () => {
  let context: TestContext;

  beforeEach(async () => {
    context = await initTestEnvironment();
  }, 30000); // 30 second timeout

  afterEach(async () => {
    if (context) {
      await cleanupTestEnvironment(context);
    }
  });

  describe('Solver Registration', () => {
    it('should register a new solver successfully', async () => {
      const newSolver = await context.root.createSubAccount('newsolver');
      
      const result = await newSolver.call(
        context.solverRegistryContract,
        'register_solver',
        {
          name: 'New Solver',
          description: 'A test solver',
          supported_assets: ['NEAR', 'USDC'],
          fee_rate: 0.005,
        },
        {
          attachedDeposit: 1000000000000000000000000n, // 1 NEAR
          gas: 150000000000000n,
        }
      );

      expect(result).toBeDefined();

      // Verify solver is registered
      const solverInfo = await context.solverRegistryContract.view('get_solver', {
        solver_id: newSolver.accountId,
      });

      expect(solverInfo).toBeDefined();
      expect((solverInfo as { name: string; active: boolean; fee_rate: number }).name).toBe('New Solver');
      expect((solverInfo as { name: string; active: boolean; fee_rate: number }).active).toBe(true);
    });

    it('should not allow duplicate solver registration', async () => {
      const solver = context.testSolvers.solver1;

      try {
        await solver.call(
          context.solverRegistryContract,
          'register_solver',
          {
            name: 'Duplicate Solver',
            description: 'Should fail',
            supported_assets: ['NEAR'],
            fee_rate: 0.005,
          },
          {
            attachedDeposit: 1000000000000000000000000n, // 1 NEAR
            gas: 150000000000000n,
          }
        );
        expect(true).toBe(false); // Should not reach here
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    it('should require minimum deposit for registration', async () => {
      const newSolver = await context.root.createSubAccount('lowdepositsolver');

      try {
        await newSolver.call(
          context.solverRegistryContract,
          'register_solver',
          {
            name: 'Low Deposit Solver',
            description: 'Should fail due to low deposit',
            supported_assets: ['NEAR'],
            fee_rate: 0.005,
          },
          {
            attachedDeposit: 100000000000000000000000n, // 0.1 NEAR (too low)
            gas: 150000000000000n,
          }
        );
        expect(true).toBe(false);
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });

  describe('Solver Management', () => {
    it('should allow solver to update their information', async () => {
      const solver = context.testSolvers.solver1;

      await solver.call(
        context.solverRegistryContract,
        'update_solver_info',
        {
          name: 'Updated Solver Name',
          description: 'Updated description',
          fee_rate: 0.004,
        },
        { gas: 100000000000000n }
      );

      const solverInfo = await context.solverRegistryContract.view('get_solver', {
        solver_id: solver.accountId,
      });

      expect((solverInfo as { name: string; active: boolean; fee_rate: number }).name).toBe('Updated Solver Name');
      expect((solverInfo as { name: string; active: boolean; fee_rate: number }).fee_rate).toBe(0.004);
    });

    it('should allow solver to deactivate themselves', async () => {
      const solver = context.testSolvers.solver1;

      await solver.call(
        context.solverRegistryContract,
        'deactivate_solver',
        {},
        { gas: 100000000000000n }
      );

      const solverInfo = await context.solverRegistryContract.view('get_solver', {
        solver_id: solver.accountId,
      });

      expect((solverInfo as { name: string; active: boolean; fee_rate: number }).active).toBe(false);
    });

    it('should allow solver to reactivate themselves', async () => {
      const solver = context.testSolvers.solver1;

      // First deactivate
      await solver.call(
        context.solverRegistryContract,
        'deactivate_solver',
        {},
        { gas: 100000000000000n }
      );

      // Then reactivate
      await solver.call(
        context.solverRegistryContract,
        'reactivate_solver',
        {},
        { gas: 100000000000000n }
      );

      const solverInfo = await context.solverRegistryContract.view('get_solver', {
        solver_id: solver.accountId,
      });

      expect((solverInfo as { name: string; active: boolean; fee_rate: number }).active).toBe(true);
    });
  });

  describe('Reputation System', () => {
    it('should track solver performance metrics', async () => {
      const solver = context.testSolvers.solver1;

      // Simulate successful execution
      await context.solverRegistryContract.call(
        context.solverRegistryContract,
        'record_execution',
        {
          solver_id: solver.accountId,
          success: true,
          execution_time: 25,
          gas_used: '180000000000000',
        },
        { gas: 100000000000000n }
      );

      const performance = await context.solverRegistryContract.view('get_solver_performance', {
        solver_id: solver.accountId,
      });

      expect((performance as { total_executions: number; successful_executions: number; success_rate: number }).total_executions).toBe(1);
      expect((performance as { total_executions: number; successful_executions: number; success_rate: number }).successful_executions).toBe(1);
      expect((performance as { total_executions: number; successful_executions: number; success_rate: number }).success_rate).toBe(1.0);
    });

    it('should update reputation based on performance', async () => {
      const solver = context.testSolvers.solver1;

      // Record multiple executions
      for (let i = 0; i < 10; i++) {
        await context.solverRegistryContract.call(
          context.solverRegistryContract,
          'record_execution',
          {
            solver_id: solver.accountId,
            success: i < 9, // 90% success rate
            execution_time: 20 + (i % 5),
            gas_used: '180000000000000',
          },
          { gas: 100000000000000n }
        );
      }

      const solverInfo = await context.solverRegistryContract.view('get_solver', {
        solver_id: solver.accountId,
      });

      expect((solverInfo as { name: string; active: boolean; reputation: number }).reputation).toBeGreaterThan(0.8);
      expect((solverInfo as { name: string; active: boolean; reputation: number }).reputation).toBeLessThan(1.0);
    });

    it('should penalize poor performance', async () => {
      const solver = context.testSolvers.solver2;

      // Record poor performance
      for (let i = 0; i < 10; i++) {
        await context.solverRegistryContract.call(
          context.solverRegistryContract,
          'record_execution',
          {
            solver_id: solver.accountId,
            success: i < 3, // 30% success rate
            execution_time: 60 + (i % 10),
            gas_used: '300000000000000',
          },
          { gas: 100000000000000n }
        );
      }

      const solverInfo = await context.solverRegistryContract.view('get_solver', {
        solver_id: solver.accountId,
      });

      expect((solverInfo as { name: string; active: boolean; reputation: number }).reputation).toBeLessThan(0.5);
    });
  });

  describe('Solver Discovery', () => {
    it('should return active solvers for asset pair', async () => {
      const solvers = await context.solverRegistryContract.view('get_solvers_for_assets', {
        asset_in: 'NEAR',
        asset_out: 'USDC',
      });

      expect(Array.isArray(solvers)).toBe(true);
      expect((solvers as Array<{ active: boolean; solver_id: string }>).length).toBeGreaterThan(0);
      
      // All returned solvers should be active
      (solvers as Array<{ active: boolean; solver_id: string }>).forEach((solver) => {
        expect(solver.active).toBe(true);
      });
    });

    it('should return solvers sorted by reputation', async () => {
      const solvers = await context.solverRegistryContract.view('get_top_solvers', {
        limit: 5,
      });

      expect(Array.isArray(solvers)).toBe(true);
      
      // Should be sorted by reputation (highest first)
      const typedSolvers = solvers as Array<{ reputation: number; solver_id: string }>;
      for (let i = 1; i < typedSolvers.length; i++) {
        expect(typedSolvers[i - 1].reputation).toBeGreaterThanOrEqual(typedSolvers[i].reputation);
      }
    });

    it('should filter solvers by minimum reputation', async () => {
      const solvers = await context.solverRegistryContract.view('get_solvers_by_reputation', {
        min_reputation: 0.8,
        limit: 10,
      });

      expect(Array.isArray(solvers)).toBe(true);
      
      (solvers as Array<{ reputation: number; solver_id: string }>).forEach((solver) => {
        expect(solver.reputation).toBeGreaterThanOrEqual(0.8);
      });
    });
  });

  describe('Administrative Functions', () => {
    it('should allow admin to suspend malicious solver', async () => {
      const solver = context.testSolvers.solver3;

      await context.root.call(
        context.solverRegistryContract,
        'admin_suspend_solver',
        {
          solver_id: solver.accountId,
          reason: 'Malicious behavior detected',
        },
        { gas: 100000000000000n }
      );

      const solverInfo = await context.solverRegistryContract.view('get_solver', {
        solver_id: solver.accountId,
      });

      expect((solverInfo as { name: string; active: boolean; suspended: boolean }).suspended).toBe(true);
    });

    it('should not allow non-admin to suspend solver', async () => {
      const solver = context.testSolvers.solver1;
      const user = context.testUsers.alice;

      try {
        await user.call(
          context.solverRegistryContract,
          'admin_suspend_solver',
          {
            solver_id: solver.accountId,
            reason: 'Should fail',
          },
          { gas: 100000000000000n }
        );
        expect(true).toBe(false);
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });

  describe('Economic Incentives', () => {
    it('should distribute rewards to high-performing solvers', async () => {
      const solver = context.testSolvers.solver1;
      const initialBalance = await solver.balance();

      // Record excellent performance
      for (let i = 0; i < 5; i++) {
        await context.solverRegistryContract.call(
          context.solverRegistryContract,
          'record_execution',
          {
            solver_id: solver.accountId,
            success: true,
            execution_time: 15,
            gas_used: '150000000000000',
          },
          { gas: 100000000000000n }
        );
      }

      // Trigger reward distribution
      await context.root.call(
        context.solverRegistryContract,
        'distribute_rewards',
        {},
        {
          attachedDeposit: 10000000000000000000000000n, // 10 NEAR
          gas: 200000000000000n,
        }
      );

      const finalBalance = await solver.balance();
      expect(BigInt(finalBalance.total.toString())).toBeGreaterThan(BigInt(initialBalance.total.toString()));
    });
  });
});
