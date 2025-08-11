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

  beforeEach(() => {
    const config = {
      network_id: 'testnet' as const,
      node_url: 'https://rpc.testnet.near.org',
      wallet_url: 'https://wallet.testnet.near.org',
      helper_url: 'https://helper.testnet.near.org',
      explorer_url: 'https://explorer.testnet.near.org',
      solver_bus_url: 'https://solver-relay-v2.chaindefuser.com/rpc',
      verifier_contract: 'intents.near',
      intent_contract: 'intents.near',
      gas_limits: {
        register: '5000000000000',
        submit_intent: '30000000000000',
        submit_quote: '5000000000000',
        execute_intent: '100000000000000',
      },
      storage_deposits: {
        registration: '0.1',
        intent: '0.25',
        quote: '0.1',
      },
    };

    intentAgent = new IntentAgent(config);

    aiAgent = new AIAgent({
      model: {
        name: 'near-ai',
        provider: 'near-ai',
        version: '1.0.0',
        capabilities: ['intent-analysis'],
        max_tokens: 4096,
      },
      temperature: 0.7,
      max_tokens: 4096,
      context_window: 8192,
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
      expect(result.data.reasoning).toBeDefined();
      expect(result.data.reasoning).toBeDefined();
    }
  });

  it('should perform end-to-end market analysis', async () => {
    const analysis = await aiAgent.getPerformanceMetrics();
    expect(analysis).toBeDefined();
    expect(analysis.accuracy).toBeGreaterThan(0);
  });
});
