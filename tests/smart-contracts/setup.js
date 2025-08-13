"use strict";
/**
 * Test Setup Configuration for NEAR Smart Contracts
 * Provides common utilities and configuration for all contract tests
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.TEST_ASSETS = void 0;
exports.initTestEnvironment = initTestEnvironment;
exports.cleanupTestEnvironment = cleanupTestEnvironment;
exports.createMockIntent = createMockIntent;
exports.createMockQuote = createMockQuote;
const near_workspaces_1 = require("near-workspaces");
async function initTestEnvironment() {
    // Initialize NEAR Workspaces
    const worker = await near_workspaces_1.Worker.init();
    const root = worker.rootAccount;
    // Deploy smart contracts
    const verifierContract = await deployContract(root, 'verifier', './contracts/verifier.wasm');
    const intentManagerContract = await deployContract(root, 'intent-manager', './contracts/intent-manager.wasm');
    const solverRegistryContract = await deployContract(root, 'solver-registry', './contracts/solver-registry.wasm');
    // Initialize contracts
    await verifierContract.call(verifierContract, 'new', {
        intent_manager: intentManagerContract.accountId,
        solver_registry: solverRegistryContract.accountId,
    });
    await intentManagerContract.call(intentManagerContract, 'new', {
        verifier_contract: verifierContract.accountId,
    });
    await solverRegistryContract.call(solverRegistryContract, 'new', {
        verifier_contract: verifierContract.accountId,
    });
    // Create test users
    const alice = await root.createSubAccount('alice', {
        initialBalance: near_workspaces_1.NEAR.parse('100').toString(),
    });
    const bob = await root.createSubAccount('bob', {
        initialBalance: near_workspaces_1.NEAR.parse('100').toString(),
    });
    const charlie = await root.createSubAccount('charlie', {
        initialBalance: near_workspaces_1.NEAR.parse('100').toString(),
    });
    // Create test solvers
    const solver1 = await root.createSubAccount('solver1', {
        initialBalance: near_workspaces_1.NEAR.parse('50').toString(),
    });
    const solver2 = await root.createSubAccount('solver2', {
        initialBalance: near_workspaces_1.NEAR.parse('50').toString(),
    });
    const solver3 = await root.createSubAccount('solver3', {
        initialBalance: near_workspaces_1.NEAR.parse('50').toString(),
    });
    // Register users and solvers
    await registerUser(verifierContract, alice);
    await registerUser(verifierContract, bob);
    await registerUser(verifierContract, charlie);
    await registerSolver(solverRegistryContract, solver1, 'Solver One', 'High-performance arbitrage solver');
    await registerSolver(solverRegistryContract, solver2, 'Solver Two', 'Multi-DEX liquidity aggregator');
    await registerSolver(solverRegistryContract, solver3, 'Solver Three', 'AI-powered trading solver');
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
async function deployContract(root, name, wasmPath) {
    const contract = await root.createSubAccount(name, {
        initialBalance: near_workspaces_1.NEAR.parse('10').toString(),
    });
    // In a real setup, you would deploy the actual WASM file
    // For testing, we'll use a mock deployment
    console.log(`Deploying ${name} contract...`);
    return contract;
}
async function registerUser(verifierContract, user) {
    await user.call(verifierContract, 'register_user', {}, {
        attachedDeposit: near_workspaces_1.NEAR.parse('0.1').toString(),
        gas: '100000000000000',
    });
}
async function registerSolver(solverRegistry, solver, name, description) {
    await solver.call(solverRegistry, 'register_solver', {
        name,
        description,
        supported_assets: ['NEAR', 'USDC', 'USDT', 'WETH'],
        fee_rate: 0.003, // 0.3%
    }, {
        attachedDeposit: near_workspaces_1.NEAR.parse('1').toString(),
        gas: '150000000000000',
    });
}
async function cleanupTestEnvironment(context) {
    await context.worker.tearDown();
}
exports.TEST_ASSETS = {
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
function createMockIntent(user, assetIn = 'NEAR', assetOut = 'USDC') {
    return {
        id: `intent_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        user,
        asset_in: exports.TEST_ASSETS[assetIn],
        asset_out: exports.TEST_ASSETS[assetOut],
        amount_in: near_workspaces_1.NEAR.parse('10').toString(),
        amount_out_min: '9500000', // 9.5 USDC
        expiry: Math.floor(Date.now() / 1000) + 3600,
        nonce: `nonce_${Date.now()}`,
    };
}
function createMockQuote(solverId, intentId) {
    return {
        solver_id: solverId,
        intent_id: intentId,
        amount_out: '9800000', // 9.8 USDC
        fee: near_workspaces_1.NEAR.parse('0.1').toString(),
        gas_estimate: '200000000000000',
        execution_time_estimate: 30,
        confidence_score: 0.95,
        signature: 'mock_signature',
        expires_at: Math.floor(Date.now() / 1000) + 1800,
    };
}
//# sourceMappingURL=setup.js.map