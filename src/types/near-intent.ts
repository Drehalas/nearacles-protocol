/**
 * NEAR Intent types for Oracle operations
 * Extends the standard NEAR intent protocol to support credibility evaluation
 */

import { Source } from './oracle.js';

export type OracleIntentType =
  | 'credibility_evaluation'
  | 'refutation_challenge'
  | 'oracle_settlement';

export interface BaseOracleIntent {
  intent: OracleIntentType;
  reward?: string; // NEAR amount in yoctoNEAR
  deadline?: string; // ISO timestamp
}

export interface CredibilityEvaluationIntent extends BaseOracleIntent {
  intent: 'credibility_evaluation';
  question: string;
  required_sources?: number;
  confidence_threshold?: number; // 0-1 scale
  max_evaluation_time?: number; // seconds
}

export interface RefutationChallengeIntent extends BaseOracleIntent {
  intent: 'refutation_challenge';
  evaluation_hash: string;
  challenge_stake: string; // Must be > original evaluation stake
  counter_evidence?: Source[];
}

export interface OracleSettlementIntent extends BaseOracleIntent {
  intent: 'oracle_settlement';
  evaluation_hash: string;
  challenge_hash?: string;
  settlement_method: 'consensus' | 'arbitration' | 'stake_weight';
}

export interface NEARIntentMessage {
  signer_id: string;
  deadline: string;
  intents: BaseOracleIntent[];
}

export interface OracleEvaluationResult {
  evaluation_hash: string;
  question: string;
  answer: boolean;
  confidence: number; // 0-1 scale
  sources: Source[];
  execution_time: number; // milliseconds
  solver_id: string;
  timestamp: string;
}

export interface NEARRefutationResult {
  challenge_hash: string;
  evaluation_hash: string;
  refutation_successful: boolean;
  counter_sources: Source[];
  challenger_id: string;
  timestamp: string;
}

export interface IntentSettlement {
  settlement_hash: string;
  evaluation_hash: string;
  challenge_hash?: string;
  winner: 'evaluator' | 'challenger' | 'tie';
  reward_distribution: {
    [account_id: string]: string; // yoctoNEAR amounts
  };
  slashing_distribution: {
    [account_id: string]: string; // yoctoNEAR amounts
  };
  timestamp: string;
}

export interface OracleQuote {
  solver_id: string;
  intent_hash: string;
  estimated_execution_time: number; // seconds
  confidence_guarantee: number; // 0-1 scale
  required_stake: string; // yoctoNEAR
  quote_hash: string;
  expiration_time: string;
}

export interface SignedIntentData {
  intent_message: NEARIntentMessage;
  signature: string;
  public_key: string;
}
