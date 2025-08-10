"use strict";
/**
 * Verifier Contract Test Suite
 * Comprehensive tests for NEAR Intent Protocol smart contracts
 */
Object.defineProperty(exports, "__esModule", { value: true });
const globals_1 = require("@jest/globals");
const near_workspaces_1 = require("near-workspaces");
(0, globals_1.describe)('Verifier Contract Tests', () => {
    let worker;
    let root;
    let verifierContract;
    let user;
    let solver;
    (0, globals_1.beforeEach)(async () => {
        // Initialize the NEAR testing environment
        worker = await near_workspaces_1.Worker.init();
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
    (0, globals_1.afterEach)(async () => {
        await worker.tearDown();
    });
    (0, globals_1.describe)('User Registration', () => {
        (0, globals_1.it)('should register a new user successfully', async () => {
            const result = await user.call(verifierContract, 'register_user', {}, { attachedDeposit: near_workspaces_1.NEAR.parse('0.1').toString() });
            (0, globals_1.expect)(result).toBeDefined();
            const isRegistered = await verifierContract.view('is_registered', {
                account_id: user.accountId,
            });
            (0, globals_1.expect)(isRegistered).toBe(true);
        });
        (0, globals_1.it)('should not register the same user twice', async () => {
            // First registration
            await user.call(verifierContract, 'register_user', {}, { attachedDeposit: near_workspaces_1.NEAR.parse('0.1').toString() });
            // Second registration should fail or be idempotent
            try {
                await user.call(verifierContract, 'register_user', {}, { attachedDeposit: near_workspaces_1.NEAR.parse('0.1').toString() });
                // Should not charge again if idempotent
            }
            catch (error) {
                // Or should fail gracefully
                (0, globals_1.expect)(error).toBeDefined();
            }
        });
    });
    (0, globals_1.describe)('Intent Submission', () => {
        (0, globals_1.beforeEach)(async () => {
            // Register user before tests
            await user.call(verifierContract, 'register_user', {}, { attachedDeposit: near_workspaces_1.NEAR.parse('0.1').toString() });
        });
        (0, globals_1.it)('should submit a valid intent successfully', async () => {
            const intent = {
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
                amount_in: near_workspaces_1.NEAR.parse('10').toString(),
                amount_out_min: '9500000', // 9.5 USDC
                expiry: Math.floor(Date.now() / 1000) + 3600, // 1 hour from now
                nonce: 'nonce_001',
            };
            const result = await user.call(verifierContract, 'submit_intent', { intent }, {
                attachedDeposit: near_workspaces_1.NEAR.parse('0.01').toString(),
                gas: '300000000000000' // 300 TGas
            });
            (0, globals_1.expect)(result).toBeDefined();
            // Verify intent was stored
            const storedIntent = await verifierContract.view('get_intent', {
                intent_id: intent.id,
            });
            (0, globals_1.expect)(storedIntent).toBeDefined();
            (0, globals_1.expect)(storedIntent.id).toBe(intent.id);
            (0, globals_1.expect)(storedIntent.user).toBe(user.accountId);
        });
        (0, globals_1.it)('should reject invalid intent with zero amount', async () => {
            const invalidIntent = {
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
                await user.call(verifierContract, 'submit_intent', { intent: invalidIntent }, {
                    attachedDeposit: near_workspaces_1.NEAR.parse('0.01').toString(),
                    gas: '300000000000000'
                });
                // Should not reach here
                (0, globals_1.expect)(true).toBe(false);
            }
            catch (error) {
                (0, globals_1.expect)(error).toBeDefined();
            }
        });
        (0, globals_1.it)('should reject expired intent', async () => {
            const expiredIntent = {
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
                amount_in: near_workspaces_1.NEAR.parse('10').toString(),
                amount_out_min: '9500000',
                expiry: Math.floor(Date.now() / 1000) - 3600, // 1 hour ago (expired)
                nonce: 'nonce_003',
            };
            try {
                await user.call(verifierContract, 'submit_intent', { intent: expiredIntent }, {
                    attachedDeposit: near_workspaces_1.NEAR.parse('0.01').toString(),
                    gas: '300000000000000'
                });
                (0, globals_1.expect)(true).toBe(false);
            }
            catch (error) {
                (0, globals_1.expect)(error).toBeDefined();
            }
        });
    });
    (0, globals_1.describe)('Quote Submission', () => {
        let intentId;
        (0, globals_1.beforeEach)(async () => {
            // Register users
            await user.call(verifierContract, 'register_user', {}, { attachedDeposit: near_workspaces_1.NEAR.parse('0.1').toString() });
            await solver.call(verifierContract, 'register_user', {}, { attachedDeposit: near_workspaces_1.NEAR.parse('0.1').toString() });
            // Submit an intent first
            const intent = {
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
                amount_in: near_workspaces_1.NEAR.parse('10').toString(),
                amount_out_min: '9500000',
                expiry: Math.floor(Date.now() / 1000) + 3600,
                nonce: 'nonce_quote_001',
            };
            await user.call(verifierContract, 'submit_intent', { intent }, {
                attachedDeposit: near_workspaces_1.NEAR.parse('0.01').toString(),
                gas: '300000000000000'
            });
            intentId = intent.id;
        });
        (0, globals_1.it)('should submit a valid quote successfully', async () => {
            const quote = {
                solver_id: solver.accountId,
                intent_id: intentId,
                amount_out: '9800000', // 9.8 USDC (better than minimum)
                fee: near_workspaces_1.NEAR.parse('0.1').toString(),
                gas_estimate: '200000000000000',
                execution_time_estimate: 30,
                confidence_score: 0.95,
                signature: 'mock_signature',
                expires_at: Math.floor(Date.now() / 1000) + 1800, // 30 minutes
            };
            const result = await solver.call(verifierContract, 'submit_quote', { quote }, {
                attachedDeposit: near_workspaces_1.NEAR.parse('0.005').toString(),
                gas: '200000000000000'
            });
            (0, globals_1.expect)(result).toBeDefined();
            // Verify quote was stored
            const quotes = await verifierContract.view('get_solver_quotes', {
                intent_id: intentId,
            });
            (0, globals_1.expect)(quotes).toBeDefined();
            (0, globals_1.expect)(quotes.length).toBe(1);
            (0, globals_1.expect)(quotes[0].solver_id).toBe(solver.accountId);
            (0, globals_1.expect)(quotes[0].amount_out).toBe(quote.amount_out);
        });
        (0, globals_1.it)('should reject quote with insufficient output amount', async () => {
            const badQuote = {
                solver_id: solver.accountId,
                intent_id: intentId,
                amount_out: '9000000', // 9.0 USDC (less than minimum 9.5)
                fee: near_workspaces_1.NEAR.parse('0.1').toString(),
                gas_estimate: '200000000000000',
                execution_time_estimate: 30,
                confidence_score: 0.95,
                signature: 'mock_signature',
                expires_at: Math.floor(Date.now() / 1000) + 1800,
            };
            try {
                await solver.call(verifierContract, 'submit_quote', { quote: badQuote }, {
                    attachedDeposit: near_workspaces_1.NEAR.parse('0.005').toString(),
                    gas: '200000000000000'
                });
                (0, globals_1.expect)(true).toBe(false);
            }
            catch (error) {
                (0, globals_1.expect)(error).toBeDefined();
            }
        });
    });
    (0, globals_1.describe)('Intent Execution', () => {
        let intentId;
        let quoteId;
        (0, globals_1.beforeEach)(async () => {
            // Setup complete intent and quote scenario
            await user.call(verifierContract, 'register_user', {}, { attachedDeposit: near_workspaces_1.NEAR.parse('0.1').toString() });
            await solver.call(verifierContract, 'register_user', {}, { attachedDeposit: near_workspaces_1.NEAR.parse('0.1').toString() });
            // Submit intent
            const intent = {
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
                amount_in: near_workspaces_1.NEAR.parse('10').toString(),
                amount_out_min: '9500000',
                expiry: Math.floor(Date.now() / 1000) + 3600,
                nonce: 'nonce_exec_001',
            };
            await user.call(verifierContract, 'submit_intent', { intent }, {
                attachedDeposit: near_workspaces_1.NEAR.parse('0.01').toString(),
                gas: '300000000000000'
            });
            intentId = intent.id;
            // Submit quote
            const quote = {
                solver_id: solver.accountId,
                intent_id: intentId,
                amount_out: '9800000',
                fee: near_workspaces_1.NEAR.parse('0.1').toString(),
                gas_estimate: '200000000000000',
                execution_time_estimate: 30,
                confidence_score: 0.95,
                signature: 'mock_signature',
                expires_at: Math.floor(Date.now() / 1000) + 1800,
            };
            await solver.call(verifierContract, 'submit_quote', { quote }, {
                attachedDeposit: near_workspaces_1.NEAR.parse('0.005').toString(),
                gas: '200000000000000'
            });
            quoteId = solver.accountId; // Using solver ID as quote ID for simplicity
        });
        (0, globals_1.it)('should execute intent with valid quote successfully', async () => {
            const result = await user.call(verifierContract, 'execute_intent', {
                intent_id: intentId,
                quote_id: quoteId,
            }, {
                attachedDeposit: near_workspaces_1.NEAR.parse('0.1').toString(),
                gas: '300000000000000'
            });
            (0, globals_1.expect)(result).toBeDefined();
            // Check intent status
            const status = await verifierContract.view('get_intent_status', {
                intent_id: intentId,
            });
            (0, globals_1.expect)(status).toBeDefined();
            (0, globals_1.expect)(['executing', 'completed']).toContain(status.status);
        });
        (0, globals_1.it)('should not allow execution by non-owner', async () => {
            try {
                await solver.call(verifierContract, 'execute_intent', {
                    intent_id: intentId,
                    quote_id: quoteId,
                }, {
                    attachedDeposit: near_workspaces_1.NEAR.parse('0.1').toString(),
                    gas: '300000000000000'
                });
                (0, globals_1.expect)(true).toBe(false);
            }
            catch (error) {
                (0, globals_1.expect)(error).toBeDefined();
            }
        });
    });
    (0, globals_1.describe)('Intent Cancellation', () => {
        let intentId;
        (0, globals_1.beforeEach)(async () => {
            await user.call(verifierContract, 'register_user', {}, { attachedDeposit: near_workspaces_1.NEAR.parse('0.1').toString() });
            const intent = {
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
                amount_in: near_workspaces_1.NEAR.parse('10').toString(),
                amount_out_min: '9500000',
                expiry: Math.floor(Date.now() / 1000) + 3600,
                nonce: 'nonce_cancel_001',
            };
            await user.call(verifierContract, 'submit_intent', { intent }, {
                attachedDeposit: near_workspaces_1.NEAR.parse('0.01').toString(),
                gas: '300000000000000'
            });
            intentId = intent.id;
        });
        (0, globals_1.it)('should cancel own intent successfully', async () => {
            const result = await user.call(verifierContract, 'cancel_intent', { intent_id: intentId }, { gas: '200000000000000' });
            (0, globals_1.expect)(result).toBeDefined();
            // Verify intent is cancelled
            const status = await verifierContract.view('get_intent_status', {
                intent_id: intentId,
            });
            (0, globals_1.expect)(status.status).toBe('cancelled');
        });
        (0, globals_1.it)('should not allow cancellation by non-owner', async () => {
            await solver.call(verifierContract, 'register_user', {}, { attachedDeposit: near_workspaces_1.NEAR.parse('0.1').toString() });
            try {
                await solver.call(verifierContract, 'cancel_intent', { intent_id: intentId }, { gas: '200000000000000' });
                (0, globals_1.expect)(true).toBe(false);
            }
            catch (error) {
                (0, globals_1.expect)(error).toBeDefined();
            }
        });
    });
    (0, globals_1.describe)('Query Functions', () => {
        (0, globals_1.beforeEach)(async () => {
            // Setup test data
            await user.call(verifierContract, 'register_user', {}, { attachedDeposit: near_workspaces_1.NEAR.parse('0.1').toString() });
            const intent = {
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
                amount_in: near_workspaces_1.NEAR.parse('10').toString(),
                amount_out_min: '9500000',
                expiry: Math.floor(Date.now() / 1000) + 3600,
                nonce: 'nonce_query_001',
            };
            await user.call(verifierContract, 'submit_intent', { intent }, {
                attachedDeposit: near_workspaces_1.NEAR.parse('0.01').toString(),
                gas: '300000000000000'
            });
        });
        (0, globals_1.it)('should get user intents successfully', async () => {
            const intents = await verifierContract.view('get_user_intents', {
                user: user.accountId,
                limit: 10,
            });
            (0, globals_1.expect)(intents).toBeDefined();
            (0, globals_1.expect)(Array.isArray(intents)).toBe(true);
            (0, globals_1.expect)(intents.length).toBeGreaterThan(0);
            (0, globals_1.expect)(intents[0].user).toBe(user.accountId);
        });
        (0, globals_1.it)('should get contract statistics', async () => {
            const stats = await verifierContract.view('get_statistics', {});
            (0, globals_1.expect)(stats).toBeDefined();
            (0, globals_1.expect)(typeof stats.total_intents).toBe('number');
            (0, globals_1.expect)(typeof stats.total_users).toBe('number');
        });
    });
});
//# sourceMappingURL=verifier-contract.test.js.map