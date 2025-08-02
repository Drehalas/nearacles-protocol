import { CredibilityEvaluation, RefutationResult, RefutationOptions } from '../types/oracle.js';
import { OpenAIService } from './openai.js';

export class RefutationService {
  private openaiService: OpenAIService;

  constructor(openaiApiKey?: string) {
    this.openaiService = new OpenAIService(openaiApiKey);
  }

  /**
   * Refutes a previous evaluation by finding counter-evidence
   */
  async refute(
    originalEvaluation: CredibilityEvaluation,
    options: RefutationOptions = {}
  ): Promise<RefutationResult> {
    if (!originalEvaluation?.question) {
      throw new Error('Original evaluation data is required');
    }

    const { requireMoreSources = true } = options;
    const { question, answer: originalAnswer, sources: originalSources = [] } = originalEvaluation;
    
    const originalSourceCount = originalSources.length;
    const minimumRequiredSources = originalSourceCount + 1;

    try {
      const prompt = this.buildRefutationPrompt(
        question,
        originalAnswer,
        originalSourceCount,
        minimumRequiredSources
      );

      const { content, sources: refuteSources } = await this.openaiService.searchWithAI(prompt, options);

      // Determine refutation success based on source count
      const refuteAnswer = requireMoreSources 
        ? refuteSources.length > originalSourceCount
        : !originalAnswer; // Simple opposite for non-source-based refutation

      if (requireMoreSources && refuteSources.length <= originalSourceCount) {
        console.warn(`Refutation found ${refuteSources.length} sources (required: ${minimumRequiredSources})`);
      } else {
        console.log(`Successfully found ${refuteSources.length} sources for refutation`);
      }

      return {
        originalQuestion: question,
        originalAnswer,
        refuteAnswer,
        sources: refuteSources,
        originalSourceCount,
        refuteSourceCount: refuteSources.length,
        status: 'refuted',
      };
    } catch (error) {
      console.error('Error in refutation:', error);
      throw new Error(`Failed to refute evaluation: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Builds the refutation prompt for OpenAI
   */
  private buildRefutationPrompt(
    question: string,
    originalAnswer: boolean,
    originalSourceCount: number,
    minimumRequiredSources: number
  ): string {
    return `Find evidence to REFUTE the following claim: "${question}".
    The original evaluation concluded: ${originalAnswer ? 'YES' : 'NO'}.

    Your task is to find evidence supporting the OPPOSITE conclusion (${originalAnswer ? 'NO' : 'YES'}).
    You MUST find MORE than ${originalSourceCount} reliable sources.
    Minimum required sources: ${minimumRequiredSources}

    Search for recent contradictory evidence, alternative perspectives, counter-arguments, and opposing viewpoints.
    Focus on finding the most credible sources that challenge the original conclusion.

    REQUIRED: You MUST include at least ${minimumRequiredSources} reliable sources with their URLs.
    Format your response exactly as follows:
    Answer: [yes/no] (opposite of original)
    Refutation summary: [brief explanation]
    Sources:
    - [source name](url)
    - [source name](url)
    - [source name](url)
    [continue with more sources]

    Make sure to use proper markdown link format [source name](url) for each source.
    Do not skip the Sources section.`;
  }
}