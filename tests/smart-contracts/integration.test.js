"use strict";
/**
 * Integration Tests for NEAR Intent Protocol
 * End-to-end testing of the complete protocol
 */
Object.defineProperty(exports, "__esModule", { value: true });
const globals_1 = require("@jest/globals");
const intent_agent_1 = require("../../src/near-intent/intent-agent");
const ai_agent_1 = require("../../src/near-ai/ai-agent");
const near_intent_1 = require("../../src/near-intent");
(0, globals_1.describe)('NEAR Intent Protocol Integration Tests', () => {
    let intentAgent;
    let aiAgent;
    beforeEach(() => {
        const config = {
            ...near_intent_1.NEAR_INTENT_CONFIG,
            network_id: 'testnet',
            node_url: 'https://rpc.testnet.near.org',
            wallet_url: 'https://wallet.testnet.near.org',
            helper_url: 'https://helper.testnet.near.org',
            explorer_url: 'https://explorer.testnet.near.org',
        };
        intentAgent = new intent_agent_1.IntentAgent(config);
        aiAgent = new ai_agent_1.AIAgent({
            model: {
                name: 'test-model',
                provider: 'near-ai',
                version: '1.0.0',
                capabilities: ['market-analysis', 'risk-assessment'],
                max_tokens: 4096,
            },
            temperature: 0.7,
            max_tokens: 4096,
            context_window: 8192,
            enable_reasoning: true,
            enable_memory: true,
            risk_tolerance: 'moderate',
        });
    });
    (0, globals_1.it)('should create and analyze intent with AI assistance', async () => {
        const result = await intentAgent.createSmartIntent('swap 10 NEAR for USDC with low risk', {
            riskTolerance: 'low',
            speedPreference: 'normal',
            maxSlippage: 1.0,
        });
        (0, globals_1.expect)(result.success).toBe(true);
        if (result.success) {
            (0, globals_1.expect)(result.data.intent).toBeDefined();
            (0, globals_1.expect)(result.data.aiDecision).toBeDefined();
            (0, globals_1.expect)(result.data.reasoning).toBeDefined();
        }
    });
    (0, globals_1.it)('should perform end-to-end market analysis', async () => {
        const analysis = await aiAgent.getPerformanceMetrics();
        (0, globals_1.expect)(analysis).toBeDefined();
        (0, globals_1.expect)(analysis.decision_accuracy).toBeGreaterThan(0);
    });
});
//# sourceMappingURL=integration.test.js.map