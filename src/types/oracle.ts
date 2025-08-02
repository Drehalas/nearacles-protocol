/**
 * Core types for the Oracle system
 */

export interface Source {
  title: string;
  url: string;
}

export interface CredibilityEvaluation {
  question: string;
  sources: Source[];
  answer: boolean;
  hash?: string;
  status: 'evaluated' | 'pending' | 'error';
}

export interface RefutationResult {
  originalQuestion: string;
  originalAnswer: boolean;
  refuteAnswer: boolean;
  sources: Source[];
  originalSourceCount: number;
  refuteSourceCount: number;
  status: 'refuted' | 'refuted-local' | 'error';
}

export interface OracleEvaluationRequest {
  question: string;
}

export interface OracleRefutationRequest {
  originalEvaluation: CredibilityEvaluation;
}

export interface WebSearchOptions {
  searchContextSize?: 'low' | 'medium' | 'high';
  model?: string;
}

export interface EvaluationOptions extends WebSearchOptions {
  requireSources?: boolean;
  minimumSources?: number;
}

export interface RefutationOptions extends WebSearchOptions {
  requireMoreSources?: boolean;
}