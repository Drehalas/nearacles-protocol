/**
 * NEAR Intent types for oracle integration
 * Simplified types for build compatibility
 */

export interface CredibilityEvaluationIntent {
  question: string;
  required_sources?: number;
  max_evaluation_time?: number;
  confidence_threshold?: number;
}

export interface OracleEvaluationResult {
  evaluation_hash: string;
  question: string;
  answer: string;
  confidence: number;
  sources: any[];
  execution_time: number;
  solver_id: string;
  timestamp: string;
}