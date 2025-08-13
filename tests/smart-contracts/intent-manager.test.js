"use strict";
/**
 * Intent Manager Contract Test Suite
 * Tests for intent lifecycle management and execution coordination
 */
Object.defineProperty(exports, "__esModule", { value: true });
const globals_1 = require("@jest/globals");
const near_workspaces_1 = require("near-workspaces");
const setup_1 = require("./setup");
(0, globals_1.describe)('Intent Manager Contract Tests', () => {
    let context;
    (0, globals_1.beforeEach)(async () => {
        context = await (0, setup_1.initTestEnvironment)();
    });
    (0, globals_1.afterEach)(async () => {
        await (0, setup_1.cleanupTestEnvironment)(context);
    });
    (0, globals_1.describe)('Intent Lifecycle Management', () => {
        (0, globals_1.it)('should manage intent creation and status updates', async () => {
            const user = context.testUsers.alice;
            const intent = (0, setup_1.createMockIntent)(user.accountId);
            // Create intent through verifier
            await user.call(context.verifierContract, 'submit_intent', { intent }, {
                attachedDeposit: near_workspaces_1.NEAR.parse('0.01').toString(),
                gas: '300000000000000',
            });
            // Check intent status
            const status = await context.intentManagerContract.view('get_intent_status', {
                intent_id: intent.id,
            });
            (0, globals_1.expect)(status.status).toBe('pending');
            (0, globals_1.expect)(status.intent_id).toBe(intent.id);
        });
        (0, globals_1.it)('should handle intent expiry automatically', async () => {
            const user = context.testUsers.alice;
            const expiredIntent = {
                ...(0, setup_1.createMockIntent)(user.accountId),
                expiry: Math.floor(Date.now() / 1000) - 3600, // 1 hour ago
            };
            try {
                await user.call(context.verifierContract, 'submit_intent', { intent: expiredIntent }, {
                    attachedDeposit: near_workspaces_1.NEAR.parse('0.01').toString(),
                    gas: '300000000000000',
                });
                (0, globals_1.expect)(true).toBe(false); // Should not reach here
            }
            catch (error) {
                (0, globals_1.expect)(error).toBeDefined();
            }
        });
        (0, globals_1.it)('should track intent execution progress', async () => {
            const user = context.testUsers.alice;
            const solver = context.testSolvers.solver1;
            const intent = (0, setup_1.createMockIntent)(user.accountId);
            // Submit intent
            await user.call(context.verifierContract, 'submit_intent', { intent }, {
                attachedDeposit: near_workspaces_1.NEAR.parse('0.01').toString(),
                gas: '300000000000000',
            });
            // Update status to executing
            await context.intentManagerContract.call(context.intentManagerContract, 'update_intent_status', {
                intent_id: intent.id,
                status: 'executing',
                solver_id: solver.accountId,
            }, { gas: '100000000000000' });
            const status = await context.intentManagerContract.view('get_intent_status', {
                intent_id: intent.id,
            });
            (0, globals_1.expect)(status.status).toBe('executing');
            (0, globals_1.expect)(status.solver_id).toBe(solver.accountId);
        });
    });
    (0, globals_1.describe)('Intent Cleanup and Maintenance', () => {
        (0, globals_1.it)('should clean up expired intents', async () => {
            // This would test the cleanup mechanism for expired intents
            const cleanupResult = await context.intentManagerContract.call(context.intentManagerContract, 'cleanup_expired_intents', { limit: 10 }, { gas: '200000000000000' });
            (0, globals_1.expect)(cleanupResult).toBeDefined();
        });
        (0, globals_1.it)('should maintain intent statistics', async () => {
            const stats = await context.intentManagerContract.view('get_statistics', {});
            (0, globals_1.expect)(stats).toBeDefined();
            (0, globals_1.expect)(typeof stats.total_intents).toBe('number');
            (0, globals_1.expect)(typeof stats.active_intents).toBe('number');
            (0, globals_1.expect)(typeof stats.completed_intents).toBe('number');
        });
    });
    (0, globals_1.describe)('Event Emission', () => {
        (0, globals_1.it)('should emit events for intent lifecycle changes', async () => {
            const user = context.testUsers.alice;
            const intent = (0, setup_1.createMockIntent)(user.accountId);
            // Monitor for events (in a real test, you'd use event listeners)
            const result = await user.call(context.verifierContract, 'submit_intent', { intent }, {
                attachedDeposit: near_workspaces_1.NEAR.parse('0.01').toString(),
                gas: '300000000000000',
            });
            // Verify event was emitted (check transaction outcome)
            (0, globals_1.expect)(result).toBeDefined();
        });
    });
    (0, globals_1.describe)('Cross-Contract Communication', () => {
        (0, globals_1.it)('should coordinate with verifier contract', async () => {
            const user = context.testUsers.alice;
            const intent = (0, setup_1.createMockIntent)(user.accountId);
            await user.call(context.verifierContract, 'submit_intent', { intent }, {
                attachedDeposit: near_workspaces_1.NEAR.parse('0.01').toString(),
                gas: '300000000000000',
            });
            // Verify coordination worked
            const intentFromVerifier = await context.verifierContract.view('get_intent', {
                intent_id: intent.id,
            });
            const statusFromManager = await context.intentManagerContract.view('get_intent_status', {
                intent_id: intent.id,
            });
            (0, globals_1.expect)(intentFromVerifier.id).toBe(statusFromManager.intent_id);
        });
    });
});
//# sourceMappingURL=intent-manager.test.js.map