/**
 * Nearacles Protocol - NEAR Intent Integration
 * Main entry point for the NEAR Intent Protocol
 */

// Export specific types to avoid conflicts
export type { Intent, Quote, AssetInfo, SolverInfo, IntentRequestParams, IntentConfig, IntentError, AsyncResult } from './near-intent/types';
export type { AIAgentConfig, AIDecision, MarketAnalysisResult } from './near-ai/types';
export * from './utils/helpers';

// Export main classes
export { IntentAgent } from './near-intent/intent-agent';
export { AIAgent } from './near-ai/ai-agent';
export { AssetManager } from './near-intent/asset-manager';
export { SolverBus } from './near-intent/solver-bus';
export { QuoteManager } from './near-intent/quote-manager';
export { VerifierContract } from './near-intent/verifier-contract';
export { MarketAnalyzer } from './near-ai/market-analyzer';
export { RiskAssessor } from './near-ai/risk-assessor';
export { IntentOptimizer } from './near-ai/intent-optimizer';

// Configuration and constants
export const NEARACLES_VERSION = '1.0.0';
export const PROTOCOL_VERSION = 'v1';
<<<<<<< HEAD
// Default configurations
export const DEFAULT_TESTNET_CONFIG = {
  network_id: 'testnet' as const,
  node_url: 'https://rpc.testnet.near.org',
  wallet_url: 'https://wallet.testnet.near.org',
  helper_url: 'https://helper.testnet.near.org',
  explorer_url: 'https://explorer.testnet.near.org',
  solver_bus_url: 'https://solver-relay-v2.chaindefuser.com/rpc',
  verifier_contract: 'verifier.testnet',
  intent_contract: 'intents.testnet',
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

=======

// Default configurations
export const DEFAULT_TESTNET_CONFIG = {
  network_id: 'testnet' as const,
  node_url: 'https://rpc.testnet.near.org',
  wallet_url: 'https://wallet.testnet.near.org',
  helper_url: 'https://helper.testnet.near.org',
  explorer_url: 'https://explorer.testnet.near.org',
  solver_bus_url: 'https://solver-relay-v2.chaindefuser.com/rpc',
  verifier_contract: 'verifier.testnet',
  intent_contract: 'intents.testnet',
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

>>>>>>> origin/main
export const DEFAULT_MAINNET_CONFIG = {
  network_id: 'mainnet' as const,
  node_url: 'https://rpc.mainnet.near.org',
  wallet_url: 'https://wallet.mainnet.near.org',
  helper_url: 'https://helper.mainnet.near.org',
  explorer_url: 'https://explorer.mainnet.near.org',
  solver_bus_url: 'https://solver-relay-v2.chaindefuser.com/rpc',
  verifier_contract: 'intents.near',
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

/**
 * Initialize NEAR Intent Protocol
 */
export async function initializeNearIntentProtocol(
  config: typeof DEFAULT_TESTNET_CONFIG | typeof DEFAULT_MAINNET_CONFIG,
  accountId?: string,
  privateKey?: string
) {
  const { IntentAgent } = await import('./near-intent/intent-agent');
  const { AIAgent } = await import('./near-ai/ai-agent');
  
  const intentAgent = new IntentAgent(config);
  
  const aiAgent = new AIAgent({
    model: {
      name: 'near-ai-v1',
      provider: 'near-ai',
      version: '1.0.0',
      capabilities: ['market-analysis', 'risk-assessment', 'intent-optimization'],
      max_tokens: 4096,
    },
    temperature: 0.7,
    max_tokens: 4096,
    context_window: 8192,
    enable_reasoning: true,
    enable_memory: true,
    risk_tolerance: 'moderate',
  });

  // Initialize agents
  await intentAgent.initialize(accountId, privateKey);
  
  return {
    intentAgent,
    aiAgent,
    config,
  };
}

/**
 * Quick setup for testnet
 */
export function setupTestnet(accountId?: string, privateKey?: string) {
  return initializeNearIntentProtocol(DEFAULT_TESTNET_CONFIG, accountId, privateKey);
}

/**
 * Quick setup for mainnet
 */
export function setupMainnet(accountId?: string, privateKey?: string) {
  return initializeNearIntentProtocol(DEFAULT_MAINNET_CONFIG, accountId, privateKey);
}
