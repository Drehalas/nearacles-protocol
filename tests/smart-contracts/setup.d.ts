/**
 * Test Setup Configuration for NEAR Smart Contracts
 * Provides common utilities and configuration for all contract tests
 */
import { Worker, NearAccount } from 'near-workspaces';
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
export declare function initTestEnvironment(): Promise<TestContext>;
export declare function cleanupTestEnvironment(context: TestContext): Promise<void>;
export declare const TEST_ASSETS: {
    NEAR: {
        token_id: string;
        decimals: number;
        symbol: string;
        name: string;
    };
    USDC: {
        token_id: string;
        decimals: number;
        symbol: string;
        name: string;
    };
    USDT: {
        token_id: string;
        decimals: number;
        symbol: string;
        name: string;
    };
    WETH: {
        token_id: string;
        decimals: number;
        symbol: string;
        name: string;
    };
};
export declare function createMockIntent(user: string, assetIn?: string, assetOut?: string): {
    id: string;
    user: string;
    asset_in: {
        token_id: string;
        decimals: number;
        symbol: string;
        name: string;
    } | {
        token_id: string;
        decimals: number;
        symbol: string;
        name: string;
    } | {
        token_id: string;
        decimals: number;
        symbol: string;
        name: string;
    } | {
        token_id: string;
        decimals: number;
        symbol: string;
        name: string;
    };
    asset_out: {
        token_id: string;
        decimals: number;
        symbol: string;
        name: string;
    } | {
        token_id: string;
        decimals: number;
        symbol: string;
        name: string;
    } | {
        token_id: string;
        decimals: number;
        symbol: string;
        name: string;
    } | {
        token_id: string;
        decimals: number;
        symbol: string;
        name: string;
    };
    amount_in: any;
    amount_out_min: string;
    expiry: number;
    nonce: string;
};
export declare function createMockQuote(solverId: string, intentId: string): {
    solver_id: string;
    intent_id: string;
    amount_out: string;
    fee: any;
    gas_estimate: string;
    execution_time_estimate: number;
    confidence_score: number;
    signature: string;
    expires_at: number;
};
//# sourceMappingURL=setup.d.ts.map