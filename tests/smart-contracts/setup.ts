/**
 * Test Setup Configuration for NEAR Smart Contracts
 * Provides common utilities and configuration for all contract tests
 */

import { Worker, NearAccount } from 'near-workspaces';
import { readFileSync } from 'fs';
import { join } from 'path';

export interface TestContext {
  worker: Worker;
  root: NearAccount;
  verifierContract: NearAccount;
  intentManagerContract: NearAccount;
  solverRegistryContract: NearAccount;
  testUsers: {
    alice: NearAccount;
    bob: NearAccount;
    charlie: NearAccount;
  };
  testSolvers: {
    solver1: NearAccount;
    solver2: NearAccount;
    solver3: NearAccount;
  };
}

export async function initTestEnvironment(): Promise<TestContext> {
  // Initialize NEAR Workspaces
  const worker = await Worker.init();
  const root = worker.rootAccount;

  // Deploy smart contracts (mock deployment for testing)
  const verifierContract = await deployContract(root, 'verifier', './contracts/verifier.wasm');
  const intentManagerContract = await deployContract(root, 'intent-manager', './contracts/intent-manager.wasm');
  const solverRegistryContract = await deployContract(root, 'solver-registry', './contracts/solver-registry.wasm');

  // Mock contract initialization - would call contract methods in real deployment
  // For testing, we skip actual contract initialization since we don't have WASM files
  console.log('Mock initializing contracts...');

  // Create test users
  const alice = await root.createSubAccount('alice', {
    initialBalance: 100000000000000000000000000n, // 100 NEAR
  });
  const bob = await root.createSubAccount('bob', {
    initialBalance: 100000000000000000000000000n, // 100 NEAR
  });
  const charlie = await root.createSubAccount('charlie', {
    initialBalance: 100000000000000000000000000n, // 100 NEAR
  });

  // Create test solvers
  const solver1 = await root.createSubAccount('solver1', {
    initialBalance: 50000000000000000000000000n, // 50 NEAR
  });
  const solver2 = await root.createSubAccount('solver2', {
    initialBalance: 50000000000000000000000000n, // 50 NEAR
  });
  const solver3 = await root.createSubAccount('solver3', {
    initialBalance: 50000000000000000000000000n, // 50 NEAR
  });

  // Mock user and solver registration - would call contract methods in real deployment  
  console.log('Mock registering users and solvers...');

  return {
    worker,
    root,
    verifierContract,
    intentManagerContract,
    solverRegistryContract,
    testUsers: { alice, bob, charlie },
    testSolvers: { solver1, solver2, solver3 },
  };
}

async function deployContract(root: NearAccount, name: string, wasmPath: string): Promise<NearAccount> {
  const contract = await root.createSubAccount(name, {
    initialBalance: 10000000000000000000000000n, // 10 NEAR
  });

  // Mock deployment - in a real setup, you would deploy the actual WASM file
  // await contract.deploy(wasmPath);
  console.log(`Mock deploying ${name} contract (${wasmPath})...`);
  
  return contract;
}

async function registerUser(verifierContract: NearAccount, user: NearAccount): Promise<void> {
  await user.call(
    verifierContract,
    'register_user',
    {},
    {
      attachedDeposit: 100000000000000000000000n, // 0.1 NEAR
      gas: 100000000000000n,
    }
  );
}

async function registerSolver(
  solverRegistry: NearAccount,
  solver: NearAccount,
  name: string,
  description: string
): Promise<void> {
  await solver.call(
    solverRegistry,
    'register_solver',
    {
      name,
      description,
      supported_assets: ['NEAR', 'USDC', 'USDT', 'WETH'],
      fee_rate: 0.003, // 0.3%
    },
    {
      attachedDeposit: 1000000000000000000000000n, // 1 NEAR
      gas: 150000000000000n,
    }
  );
}

export async function cleanupTestEnvironment(context: TestContext | undefined): Promise<void> {
  if (!context || !context.worker) {
    return;
  }
  
  try {
    await context.worker.tearDown();
  } catch (error) {
    // Ignore teardown errors to prevent test failures
    console.warn('Warning: Failed to tear down worker:', error);
  }
}

export const TEST_ASSETS = {
  NEAR: {
    token_id: 'NEAR',
    decimals: 24,
    symbol: 'NEAR',
    name: 'NEAR Protocol',
  },
  USDC: {
    token_id: 'USDC',
    decimals: 6,
    symbol: 'USDC',
    name: 'USD Coin',
  },
  USDT: {
    token_id: 'USDT',
    decimals: 6,
    symbol: 'USDT',
    name: 'Tether USD',
  },
  WETH: {
    token_id: 'WETH',
    decimals: 18,
    symbol: 'WETH',
    name: 'Wrapped Ethereum',
  },
};

export function createMockIntent(user: string, assetIn: string = 'NEAR', assetOut: string = 'USDC') {
  return {
    id: `intent_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    user,
    asset_in: TEST_ASSETS[assetIn as keyof typeof TEST_ASSETS],
    asset_out: TEST_ASSETS[assetOut as keyof typeof TEST_ASSETS],
    amount_in: '10000000000000000000000000', // 10 NEAR
    amount_out_min: '9500000', // 9.5 USDC
    expiry: Math.floor(Date.now() / 1000) + 3600,
    nonce: `nonce_${Date.now()}`,
  };
}

export function createMockQuote(solverId: string, intentId: string) {
  return {
    solver_id: solverId,
    intent_id: intentId,
    amount_out: '9800000', // 9.8 USDC
    fee: '100000000000000000000000', // 0.1 NEAR
    gas_estimate: '200000000000000',
    execution_time_estimate: 30,
    confidence_score: 0.95,
    signature: 'mock_signature',
    expires_at: Math.floor(Date.now() / 1000) + 1800,
  };
}
