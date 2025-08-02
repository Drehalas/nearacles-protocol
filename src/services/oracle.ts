import { CredibilityEvaluation, RefutationResult, EvaluationOptions, RefutationOptions } from '../types/oracle.js';
import { CredibilityService } from './credibility.js';
import { RefutationService } from './refutation.js';
import { filterValidSources, deduplicateSources } from '../utils/source-validation.js';

/**
 * Main Oracle service that combines credibility evaluation and refutation
 */
export class OracleService {
  private credibilityService: CredibilityService;
  private refutationService: RefutationService;

  constructor(openaiApiKey?: string) {
    this.credibilityService = new CredibilityService(openaiApiKey);
    this.refutationService = new RefutationService(openaiApiKey);
  }

  /**
   * Evaluates the credibility of a question
   */
  async evaluate(
    question: string,
    options: EvaluationOptions = {}
  ): Promise<CredibilityEvaluation> {
    const evaluation = await this.credibilityService.evaluateCredibility(question, options);
    
    // Post-process sources
    evaluation.sources = deduplicateSources(filterValidSources(evaluation.sources));
    
    return evaluation;
  }

  /**
   * Refutes a previous evaluation
   */
  async refute(
    originalEvaluation: CredibilityEvaluation,
    options: RefutationOptions = {}
  ): Promise<RefutationResult> {
    const refutation = await this.refutationService.refute(originalEvaluation, options);
    
    // Post-process sources
    refutation.sources = deduplicateSources(filterValidSources(refutation.sources));
    
    return refutation;
  }

  /**
   * Evaluates a question and immediately attempts refutation
   */
  async evaluateWithRefutation(
    question: string,
    evaluationOptions: EvaluationOptions = {},
    refutationOptions: RefutationOptions = {}
  ): Promise<{ evaluation: CredibilityEvaluation; refutation: RefutationResult }> {
    const evaluation = await this.evaluate(question, evaluationOptions);
    const refutation = await this.refute(evaluation, refutationOptions);
    
    return { evaluation, refutation };
  }
}