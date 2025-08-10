/**
 * Integration Tests for NEAR Intent Protocol
 * End-to-end testing of the complete protocol
 */

import { describe, it, expect } from '@jest/globals';
import { IntentAgent } from '../../src/near-intent/intent-agent';
import { AIAgent } from '../../src/near-ai/ai-agent';
import { NEAR_INTENT_CONFIG } from '../../src/near-intent';
import { NEAR_AI_CONFIG } from '../../src/near-ai';

describe('NEAR Intent Protocol Integration Tests', () => {
  let intentAgent: IntentAgent;
  let aiAgent: AIAgent;

  beforeEach(async () => {
    const config = {
      network_id: 'testnet' as const,
      node_url: 'https://rpc.testnet.near.org',
      wallet_url: 'https://wallet.testnet.near.org',
      helper_url: 'https://helper.testnet.near.org',
      explorer_url: 'https://explorer.testnet.near.org',
      solver_bus_url: 'https://solver-bus.near.org',
      verifier_contract: 'verifier.intents.near',
      intent_contract: 'intents.near',
      gas_limits: {
        register: '100000000000000',
        submit_intent: '300000000000000',
        submit_quote: '200000000000000',
        execute_intent: '300000000000000',
      },
      storage_deposits: {
        registration: '0.1',
        intent: '0.01',
        quote: '0.005',
      },
    };

    intentAgent = new IntentAgent(config);
    
    // Initialize the intent agent - critical for tests to work!
    await intentAgent.initialize();

    aiAgent = new AIAgent({
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

  it('should create and analyze intent with AI assistance', async () => {
    const result = await intentAgent.createSmartIntent(
      'swap 10 NEAR for USDC with low risk',
      {
        riskTolerance: 'low',
        speedPreference: 'normal',
        maxSlippage: 1.0,
      }
    );



    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.intent).toBeDefined();
      expect(result.data.aiDecision).toBeDefined();
      expect(result.data.reasoning).toBeDefined();
    }
  });

  it('should perform end-to-end market analysis', async () => {
    const analysis = await aiAgent.getPerformanceMetrics();
    expect(analysis).toBeDefined();
    expect(analysis.decision_accuracy).toBeGreaterThan(0);
  });
});
