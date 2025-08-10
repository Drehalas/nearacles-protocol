/**
 * TypeScript interfaces for NEAR Intent Protocol
 * Based on the NEAR Intents specification
 */

import { Account, Contract } from 'near-api-js';

// Core Intent Types
export interface Intent {
  id: string;
  user: string;
  asset_in: AssetInfo;
  asset_out: AssetInfo;
  amount_in: string;
  amount_out_min: string;
  expiry: number;
  nonce: string;
  signature?: string;
}

export interface AssetInfo {
  token_id: string;
  decimals: number;
  symbol: string;
  name: string;
  contract_address?: string;
}

// Quote and Solver Types
export interface Quote {
  solver_id: string;
  intent_id: string;
  amount_out: string;
  fee: string;
  gas_estimate: string;
  execution_time_estimate: number;
  confidence_score: number;
  signature: string;
  expires_at: number;
}

export interface SolverInfo {
  id: string;
  name: string;
  reputation: number;
  success_rate: number;
  avg_execution_time: number;
  supported_assets: string[];
  fee_rate: number;
  active: boolean;
}

// Request and Response Types
export interface IntentRequestParams {
  asset_in: string;
  asset_out: string;
  amount_in: string;
  min_amount_out?: string;
  slippage_tolerance?: number;
  deadline?: number;
  user_preferences?: UserPreferences;
}

export interface UserPreferences {
  max_fee?: string;
  preferred_solvers?: string[];
  execution_speed?: 'fast' | 'normal' | 'slow';
  privacy_level?: 'public' | 'private';
}

// Solver Bus Types
export interface SolverBusMessage {
  type: 'intent_request' | 'quote_response' | 'execution_update' | 'settlement';
  id: string;
  timestamp: number;
  data: any;
  signature?: string;
}

export interface IntentExecutionStatus {
  intent_id: string;
  status: 'pending' | 'matched' | 'executing' | 'completed' | 'failed' | 'expired';
  solver_id?: string;
  transaction_hash?: string;
  execution_time?: number;
  actual_amount_out?: string;
  fee_paid?: string;
  error?: string;
}

// Smart Contract Types
export interface VerifierContractMethods {
  // View methods
  get_intent: (args: { intent_id: string }) => Promise<Intent | null>;
  get_user_intents: (args: { user: string, limit?: number }) => Promise<Intent[]>;
  get_solver_quotes: (args: { intent_id: string }) => Promise<Quote[]>;
  is_registered: (args: { account_id: string }) => Promise<boolean>;
  
  // Change methods
  register_user: (args: {}, gas?: string, deposit?: string) => Promise<void>;
  submit_intent: (args: { intent: Intent }, gas?: string, deposit?: string) => Promise<string>;
  submit_quote: (args: { quote: Quote }, gas?: string, deposit?: string) => Promise<void>;
  execute_intent: (args: { intent_id: string, quote_id: string }, gas?: string, deposit?: string) => Promise<void>;
  cancel_intent: (args: { intent_id: string }, gas?: string, deposit?: string) => Promise<void>;
}

// Asset Management Types
export interface TokenMetadata {
  token_id: string;
  symbol: string;
  name: string;
  decimals: number;
  icon?: string;
  contract_address: string;
  total_supply?: string;
  is_native: boolean;
}

export interface AssetBalance {
  token_id: string;
  balance: string;
  available: string;
  locked: string;
  decimals: number;
}

// Configuration Types
export interface IntentConfig {
  network_id: 'testnet' | 'mainnet';
  node_url: string;
  wallet_url: string;
  helper_url: string;
  explorer_url: string;
  solver_bus_url: string;
  verifier_contract: string;
  intent_contract: string;
  gas_limits: {
    register: string;
    submit_intent: string;
    submit_quote: string;
    execute_intent: string;
  };
  storage_deposits: {
    registration: string;
    intent: string;
    quote: string;
  };
}

// Error Types
export interface IntentError {
  code: string;
  message: string;
  details?: any;
  timestamp: number;
}

export type IntentErrorCode = 
  | 'INSUFFICIENT_BALANCE'
  | 'INVALID_ASSET'
  | 'SLIPPAGE_EXCEEDED'
  | 'DEADLINE_EXCEEDED'
  | 'NO_SOLVERS_AVAILABLE'
  | 'EXECUTION_FAILED'
  | 'SIGNATURE_INVALID'
  | 'CONTRACT_ERROR'
  | 'NETWORK_ERROR';

// Event Types
export interface IntentEvent {
  type: 'intent_created' | 'quote_received' | 'intent_matched' | 'execution_started' | 'execution_completed' | 'intent_failed';
  intent_id: string;
  timestamp: number;
  data: any;
}

// AI Agent Types (for NEAR AI integration)
export interface AIAgentConfig {
  model: 'gpt-4' | 'claude-3' | 'near-ai';
  api_key?: string;
  endpoint?: string;
  max_tokens: number;
  temperature: number;
  context_window: number;
}

export interface AIDecision {
  action: 'execute' | 'wait' | 'cancel' | 'modify';
  confidence: number;
  reasoning: string;
  parameters?: any;
  risk_assessment: {
    level: 'low' | 'medium' | 'high';
    factors: string[];
  };
}

export interface MarketAnalysis {
  asset_pair: string;
  current_price: string;
  price_trend: 'up' | 'down' | 'stable';
  volatility: number;
  liquidity: number;
  recommended_action: 'buy' | 'sell' | 'hold';
  confidence: number;
  analysis_timestamp: number;
}

// Utility Types
export type AsyncResult<T> = Promise<{ success: true; data: T } | { success: false; error: IntentError }>;

export interface PaginationParams {
  limit?: number;
  offset?: number;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

export interface FilterParams {
  status?: IntentExecutionStatus['status'][];
  asset_in?: string[];
  asset_out?: string[];
  min_amount?: string;
  max_amount?: string;
  date_from?: number;
  date_to?: number;
}
