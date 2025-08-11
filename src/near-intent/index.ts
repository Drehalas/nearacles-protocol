/**
 * NEAR Intent Integration for Nearacles Protocol
 * Based on: https://github.com/near-examples/near-intents-agent-example
 */

// Export specific types to avoid conflicts
export type { Intent, Quote, AssetInfo, SolverInfo, IntentRequestParams, IntentConfig, IntentError, AsyncResult } from './types';

// Export classes
export { IntentRequest } from './intent-request';
export { QuoteManager } from './quote-manager';  
export { SolverBus } from './solver-bus';
export { VerifierContract } from './verifier-contract';
export { AssetManager } from './asset-manager';

// Re-export main component
export { IntentAgent } from './intent-agent';

// Constants
export const NEAR_INTENT_CONFIG = {
  SOLVER_BUS_URL: 'https://solver-relay-v2.chaindefuser.com/rpc',
  VERIFIER_CONTRACT: 'intents.near',
  INTENT_CONTRACT: 'intents.near',
  STORAGE_DEPOSIT: '0.25', // NEAR
  GAS_LIMIT: '300000000000000', // 300 TGas
  DEFAULT_SLIPPAGE: 0.01, // 1%
} as const;

// Version info
export const VERSION = '1.0.0';
export const PROTOCOL_VERSION = 'v1';
