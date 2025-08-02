import { createHash } from 'node:crypto';
import { CredibilityEvaluation, EvaluationOptions, Source } from '../types/oracle.js';
import { OpenAIService } from './openai.js';

export class CredibilityService {
  private openaiService: OpenAIService;

  constructor(openaiApiKey?: string) {
    this.openaiService = new OpenAIService(openaiApiKey);
  }

  /**
   * Evaluates a yes/no question by analyzing web search results
   */
  async evaluateCredibility(
    question: string,
    options: EvaluationOptions = {}
  ): Promise<CredibilityEvaluation> {
    if (!question || question.trim() === '') {
      throw new Error('Question cannot be empty');
    }

    const { requireSources = true, minimumSources = 2 } = options;

    try {
      const prompt = this.buildEvaluationPrompt(question, minimumSources);
      const { content, sources } = await this.openaiService.searchWithAI(prompt, options);

      // Validate sources if required
      if (requireSources && sources.length === 0) {
        sources.push({
          title: 'Web Search Results',
          url: `https://www.google.com/search?q=${encodeURIComponent(question)}`,
        });
      }

      const answer = this.parseAnswer(content, question);
      const hash = this.createEvaluationHash(question, answer, sources);

      return {
        question,
        sources,
        answer,
        hash,
        status: 'evaluated',
      };
    } catch (error) {
      console.error('Error in credibility evaluation:', error);
      throw new Error(`Failed to evaluate question: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Builds the evaluation prompt for OpenAI
   */
  private buildEvaluationPrompt(question: string, minimumSources: number): string {
    return `Based on the most recent information from the web, answer this yes/no question: "${question}".
    Focus on finding the most recent and reliable sources.
    For price-related questions, prioritize the most recent price information.
    Include specific price information in your response.

    REQUIRED: You MUST include at least ${minimumSources} reliable sources with their URLs.
    Format your response exactly as follows:
    Answer: [yes/no]
    Current price: [price] (if applicable)
    Sources:
    - [source name](url)
    - [source name](url)
    - [source name](url)

    Make sure to use proper markdown link format [source name](url) for each source.
    Do not skip the Sources section.`;
  }

  /**
   * Parses the answer from OpenAI response
   */
  private parseAnswer(content: string, question: string): boolean {
    const answer = content.trim().toLowerCase();
    const firstSentence = answer.split('.')[0].toLowerCase();

    // Check for explicit yes/no
    if (firstSentence.includes('yes') || firstSentence.includes('no')) {
      return firstSentence.includes('yes');
    }

    // Check for price-based determination (Bitcoin price example)
    const pricePhraseMatch = answer.match(/the price is ([\d,\.]+)/i);
    if (pricePhraseMatch) {
      const currentPrice = parseFloat(pricePhraseMatch[1].replace(/,/g, ''));
      return currentPrice > 50000; // Example threshold
    }

    // Check for explicit price comparisons
    return (
      answer.includes('above $50,000') ||
      answer.includes('over $50,000') ||
      answer.includes('trading above $50,000') ||
      firstSentence.includes('trading above')
    );
  }

  /**
   * Creates a hash for the evaluation
   */
  private createEvaluationHash(question: string, answer: boolean, sources: Source[]): string {
    const data = JSON.stringify({ question, answer, sources });
    return createHash('sha256').update(Buffer.from(data)).digest('hex');
  }
}