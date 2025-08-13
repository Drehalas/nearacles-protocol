/**
 * Quote Manager for NEAR Intent Protocol
 * Manages quote collection, validation, and selection logic
 */

import { 
  Quote, 
  Intent, 
  SolverInfo, 
  IntentError,
  AsyncResult,
  UserPreferences,
  QuoteEvaluationCriteria,
  QuoteAnalysis 
} from './types';
import { SolverBus } from './solver-bus';
import { AssetManager } from './asset-manager';
import { getCurrentTimestamp, stringToBigInt } from '../utils/helpers';

export class QuoteManager {
  private solverBus: SolverBus;
  private assetManager: AssetManager;
  private quotes: Map<string, Quote[]> = new Map();
  private solvers: Map<string, SolverInfo> = new Map();

  constructor(solverBus: SolverBus, assetManager: AssetManager) {
    this.solverBus = solverBus;
    this.assetManager = assetManager;
  }

  /**
   * Initialize the quote manager
   */
  async initialize(): Promise<void> {
    // Load solver information
    const solversResult = await this.solverBus.getSolvers();
    if (solversResult.success) {
      solversResult.data.forEach(solver => {
        this.solvers.set(solver.id, solver);
      });
    }

    // Subscribe to real-time quote updates
    this.solverBus.subscribe('quote-manager', (message) => {
      if (message.type === 'quote_response') {
        this.handleNewQuote(message.data as any);
      }
    });
  }

  /**
   * Request quotes for an intent
   */
  async requestQuotes(
    intent: Intent, 
    timeout: number = 30000,
    criteria?: QuoteEvaluationCriteria
  ): Promise<AsyncResult<QuoteAnalysis[]>> {
    try {
      // Publish intent to solver network
      const publishResult = await this.solverBus.publishIntent(intent);
      if (!publishResult.success) {
        return { success: false, error: publishResult.error };
      }

      // Wait for quotes
      const quotesResult = await this.solverBus.waitForQuotes(intent.id, timeout);
      if (!quotesResult.success) {
        return { success: false, error: quotesResult.error };
      }

      const quotes = quotesResult.data;
      this.quotes.set(intent.id, quotes);

      // Validate and analyze quotes
      const validQuotes = await this.validateQuotes(quotes, intent);
      const analyses = await this.analyzeQuotes(validQuotes, intent, criteria);

      return { success: true, data: analyses };

    } catch (error) {
      const intentError: IntentError = {
        code: 'QUOTE_REQUEST_ERROR',
        message: error instanceof Error ? error.message : 'Failed to request quotes',
        timestamp: getCurrentTimestamp(),
      };
      return { success: false, error: intentError };
    }
  }

  /**
   * Handle new quote from WebSocket
   */
  private handleNewQuote(quote: Quote): void {
    const intentQuotes = this.quotes.get(quote.intent_id) || [];
    intentQuotes.push(quote);
    this.quotes.set(quote.intent_id, intentQuotes);
  }

  /**
   * Validate quotes against intent requirements
   */
  private async validateQuotes(quotes: Quote[], intent: Intent): Promise<Quote[]> {
    const validQuotes: Quote[] = [];

    for (const quote of quotes) {
      try {
        // Basic validation
        if (quote.intent_id !== intent.id) continue;
        if (quote.expires_at <= getCurrentTimestamp()) continue;
        if (stringToBigInt(quote.amount_out) < stringToBigInt(intent.amount_out_min)) continue;

        // Solver validation
        const solver = this.solvers.get(quote.solver_id);
        if (!solver || !solver.active) continue;

        // Asset validation
        const assetOut = this.assetManager.getAsset(intent.asset_out.token_id);
        if (!assetOut) continue;

        validQuotes.push(quote);
      } catch (error) {
        console.warn(`Invalid quote from ${quote.solver_id}:`, error);
      }
    }

    return validQuotes;
  }

  /**
   * Analyze and score quotes
   */
  private async analyzeQuotes(
    quotes: Quote[], 
    intent: Intent, 
    criteria?: QuoteEvaluationCriteria
  ): Promise<QuoteAnalysis[]> {
    const analyses: QuoteAnalysis[] = [];

    for (const quote of quotes) {
      const analysis = await this.analyzeQuote(quote, intent, criteria);
      analyses.push(analysis);
    }

    // Sort by score (highest first)
    analyses.sort((a, b) => b.score - a.score);

    return analyses;
  }

  /**
   * Analyze individual quote
   */
  private async analyzeQuote(
    quote: Quote, 
    intent: Intent, 
    criteria?: QuoteEvaluationCriteria
  ): Promise<QuoteAnalysis> {
    const solver = this.solvers.get(quote.solver_id);
    const pros: string[] = [];
    const cons: string[] = [];
    let score = 0;
    let riskLevel: 'low' | 'medium' | 'high' = 'medium';

    // Amount analysis
    const outputAmount = stringToBigInt(quote.amount_out);
    const minAmount = stringToBigInt(intent.amount_out_min);
    const slippage = Number((outputAmount - minAmount) * BigInt(100) / outputAmount);
    
    if (slippage > 5) {
      pros.push(`Excellent output: ${slippage.toFixed(2)}% above minimum`);
      score += 30;
    } else if (slippage > 1) {
      pros.push(`Good output: ${slippage.toFixed(2)}% above minimum`);
      score += 20;
    } else {
      cons.push(`Output close to minimum: ${slippage.toFixed(2)}% above minimum`);
      score += 5;
    }

    // Fee analysis
    const feePercentage = Number(stringToBigInt(quote.fee) * BigInt(100) / stringToBigInt(intent.amount_in));
    if (feePercentage < 0.3) {
      pros.push(`Very low fee: ${feePercentage.toFixed(3)}%`);
      score += 25;
    } else if (feePercentage < 0.5) {
      pros.push(`Low fee: ${feePercentage.toFixed(3)}%`);
      score += 15;
    } else if (feePercentage > 1.0) {
      cons.push(`High fee: ${feePercentage.toFixed(3)}%`);
      score -= 10;
    }

    // Speed analysis
    if (quote.execution_time_estimate < 30) {
      pros.push(`Very fast execution: ${quote.execution_time_estimate}s`);
      score += 20;
    } else if (quote.execution_time_estimate < 60) {
      pros.push(`Fast execution: ${quote.execution_time_estimate}s`);
      score += 10;
    } else if (quote.execution_time_estimate > 300) {
      cons.push(`Slow execution: ${quote.execution_time_estimate}s`);
      score -= 10;
    }

    // Solver reputation analysis
    if (solver) {
      if (solver.reputation > 0.9) {
        pros.push(`Excellent solver reputation: ${(solver.reputation * 100).toFixed(1)}%`);
        score += 20;
        riskLevel = 'low';
      } else if (solver.reputation > 0.8) {
        pros.push(`Good solver reputation: ${(solver.reputation * 100).toFixed(1)}%`);
        score += 10;
      } else if (solver.reputation < 0.7) {
        cons.push(`Low solver reputation: ${(solver.reputation * 100).toFixed(1)}%`);
        score -= 15;
        riskLevel = 'high';
      }

      if (solver.success_rate > 0.95) {
        pros.push(`High success rate: ${(solver.success_rate * 100).toFixed(1)}%`);
        score += 15;
      } else if (solver.success_rate < 0.9) {
        cons.push(`Lower success rate: ${(solver.success_rate * 100).toFixed(1)}%`);
        score -= 10;
        riskLevel = 'high';
      }
    }

    // Confidence analysis
    if (quote.confidence_score > 0.9) {
      pros.push(`Very high confidence: ${(quote.confidence_score * 100).toFixed(1)}%`);
      score += 15;
    } else if (quote.confidence_score < 0.7) {
      cons.push(`Low confidence: ${(quote.confidence_score * 100).toFixed(1)}%`);
      score -= 15;
      riskLevel = 'high';
    }

    // Apply criteria adjustments
    if (criteria) {
      if (criteria.maxSlippage && slippage > criteria.maxSlippage) {
        score -= 50;
      }
      if (criteria.maxFee && stringToBigInt(quote.fee) > stringToBigInt(criteria.maxFee)) {
        score -= 30;
      }
      if (criteria.maxExecutionTime && quote.execution_time_estimate > criteria.maxExecutionTime) {
        score -= 20;
      }
      if (criteria.minConfidence && quote.confidence_score < criteria.minConfidence) {
        score -= 25;
      }
      if (criteria.preferred_solvers?.includes(quote.solver_id)) {
        score += 10;
        pros.push('Preferred solver');
      }
    }

    // Determine recommendation
    let recommendation: 'accept' | 'consider' | 'reject' = 'consider';
    if (score >= 70) {
      recommendation = 'accept';
    } else if (score < 30) {
      recommendation = 'reject';
    }

    return {
      quote,
      score,
      pros,
      cons,
      riskLevel,
      recommendation,
      reasoning: `Quote scored ${score}/100 based on execution time, fees, and solver reputation`,
      risk_factors: cons,
      opportunities: pros,
      confidence: Math.min(score / 100, 1.0)
    };
  }

  /**
   * Get best quote based on criteria
   */
  getBestQuote(
    analyses: QuoteAnalysis[], 
    criteria?: QuoteEvaluationCriteria
  ): QuoteAnalysis | null {
    if (analyses.length === 0) return null;

    // Filter by recommendation
    let candidates = analyses.filter(a => a.recommendation === 'accept');
    if (candidates.length === 0) {
      candidates = analyses.filter(a => a.recommendation === 'consider');
    }
    if (candidates.length === 0) {
      return null; // All quotes rejected
    }

    // Apply prioritization
    if (criteria?.prioritize) {
      switch (criteria.prioritize) {
        case 'amount':
          candidates.sort((a, b) => 
            Number(stringToBigInt(b.quote.amount_out) - stringToBigInt(a.quote.amount_out))
          );
          break;
        case 'fee':
          candidates.sort((a, b) => 
            Number(stringToBigInt(a.quote.fee) - stringToBigInt(b.quote.fee))
          );
          break;
        case 'speed':
          candidates.sort((a, b) => 
            a.quote.execution_time_estimate - b.quote.execution_time_estimate
          );
          break;
        case 'reputation':
          candidates.sort((a, b) => b.quote.confidence_score - a.quote.confidence_score);
          break;
        case 'balanced':
        default:
          // Already sorted by score
          break;
      }
    }

    // Apply risk tolerance
    if (criteria?.riskTolerance) {
      if (criteria.riskTolerance === 'low') {
        candidates = candidates.filter(a => a.riskLevel === 'low');
      } else if (criteria.riskTolerance === 'medium') {
        candidates = candidates.filter(a => a.riskLevel !== 'high');
      }
    }

    return candidates[0] || null;
  }

  /**
   * Compare quotes side by side
   */
  compareQuotes(quote1: Quote, quote2: Quote, intent: Intent): {
    better: Quote;
    comparison: string[];
  } {
    const comparison: string[] = [];
    let score1 = 0;
    let score2 = 0;

    // Compare amounts
    const amount1 = stringToBigInt(quote1.amount_out);
    const amount2 = stringToBigInt(quote2.amount_out);
    if (amount1 > amount2) {
      comparison.push(`Quote 1 offers ${this.assetManager.formatAmount(intent.asset_out.token_id, (amount1 - amount2).toString())} more output`);
      score1++;
    } else if (amount2 > amount1) {
      comparison.push(`Quote 2 offers ${this.assetManager.formatAmount(intent.asset_out.token_id, (amount2 - amount1).toString())} more output`);
      score2++;
    }

    // Compare fees
    const fee1 = stringToBigInt(quote1.fee);
    const fee2 = stringToBigInt(quote2.fee);
    if (fee1 < fee2) {
      comparison.push(`Quote 1 has ${this.assetManager.formatAmount(intent.asset_in.token_id, (fee2 - fee1).toString())} lower fee`);
      score1++;
    } else if (fee2 < fee1) {
      comparison.push(`Quote 2 has ${this.assetManager.formatAmount(intent.asset_in.token_id, (fee1 - fee2).toString())} lower fee`);
      score2++;
    }

    // Compare execution time
    if (quote1.execution_time_estimate < quote2.execution_time_estimate) {
      comparison.push(`Quote 1 is ${quote2.execution_time_estimate - quote1.execution_time_estimate}s faster`);
      score1++;
    } else if (quote2.execution_time_estimate < quote1.execution_time_estimate) {
      comparison.push(`Quote 2 is ${quote1.execution_time_estimate - quote2.execution_time_estimate}s faster`);
      score2++;
    }

    // Compare confidence
    if (quote1.confidence_score > quote2.confidence_score) {
      comparison.push(`Quote 1 has higher confidence (${(quote1.confidence_score * 100).toFixed(1)}% vs ${(quote2.confidence_score * 100).toFixed(1)}%)`);
      score1++;
    } else if (quote2.confidence_score > quote1.confidence_score) {
      comparison.push(`Quote 2 has higher confidence (${(quote2.confidence_score * 100).toFixed(1)}% vs ${(quote1.confidence_score * 100).toFixed(1)}%)`);
      score2++;
    }

    return {
      better: score1 > score2 ? quote1 : score2 > score1 ? quote2 : quote1,
      comparison,
    };
  }

  /**
   * Get quotes for intent ID
   */
  getQuotes(intentId: string): Quote[] {
    return this.quotes.get(intentId) || [];
  }

  /**
   * Clear quotes for intent
   */
  clearQuotes(intentId: string): void {
    this.quotes.delete(intentId);
  }

  /**
   * Get solver information
   */
  getSolver(solverId: string): SolverInfo | undefined {
    return this.solvers.get(solverId);
  }

  /**
   * Generate quote summary for user
   */
  generateQuoteSummary(analysis: QuoteAnalysis, intent: Intent): string {
    const quote = analysis.quote;
    const solver = this.getSolver(quote.solver_id);
    
    const outputAmount = this.assetManager.formatAmount(
      intent.asset_out.token_id, 
      quote.amount_out
    );
    const fee = this.assetManager.formatAmount(
      intent.asset_in.token_id, 
      quote.fee
    );

    let summary = `Solver: ${solver?.name || quote.solver_id}\n`;
    summary += `Output: ${outputAmount} ${intent.asset_out.symbol}\n`;
    summary += `Fee: ${fee} ${intent.asset_in.symbol}\n`;
    summary += `Execution Time: ~${quote.execution_time_estimate}s\n`;
    summary += `Confidence: ${(quote.confidence_score * 100).toFixed(1)}%\n`;
    summary += `Score: ${analysis.score}/100\n`;
    summary += `Recommendation: ${analysis.recommendation.toUpperCase()}\n`;

    if (analysis.pros.length > 0) {
      summary += `\nAdvantages:\n${analysis.pros.map(p => `• ${p}`).join('\n')}`;
    }

    if (analysis.cons.length > 0) {
      summary += `\nConcerns:\n${analysis.cons.map(c => `• ${c}`).join('\n')}`;
    }

    return summary;
  }
}