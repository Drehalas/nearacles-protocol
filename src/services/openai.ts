import { OpenAI } from 'openai';
import { Source, WebSearchOptions } from '../types/oracle.js';

export class OpenAIService {
  private client: OpenAI;

  constructor(apiKey?: string) {
    if (!apiKey && !process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is not set in environment variables');
    }

    this.client = new OpenAI({
      apiKey: apiKey || process.env.OPENAI_API_KEY,
    });

    if (!this.client?.chat?.completions) {
      throw new Error('OpenAI client not properly initialized');
    }
  }

  /**
   * Performs web search using OpenAI's search-enabled models
   */
  async searchWithAI(
    prompt: string, 
    options: WebSearchOptions = {}
  ): Promise<{ content: string; sources: Source[] }> {
    const { searchContextSize = 'high', model = 'gpt-4o-mini-search-preview' } = options;

    try {
      const completion = await this.client.chat.completions.create({
        model,
        web_search_options: {
          search_context_size: searchContextSize,
        },
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      });

      if (!completion?.choices?.[0]?.message?.content) {
        throw new Error('Invalid response from OpenAI');
      }

      const content = completion.choices[0].message.content;
      const sources = this.extractSources(content);

      return { content, sources };
    } catch (error) {
      console.error('Error in OpenAI search:', error);
      throw new Error(`Failed to perform AI search: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Extracts sources from OpenAI response with markdown links
   */
  private extractSources(content: string): Source[] {
    const sources: Source[] = [];
    
    // Extract markdown links
    const sourceRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
    let match;
    
    while ((match = sourceRegex.exec(content)) !== null) {
      sources.push({
        title: match[1],
        url: match[2],
      });
    }

    // If no markdown sources found, try to extract URLs directly
    if (sources.length === 0) {
      const urlRegex = /(https?:\/\/[^\s]+)/g;
      while ((match = urlRegex.exec(content)) !== null) {
        sources.push({
          title: 'Source',
          url: match[1],
        });
      }
    }

    return sources;
  }
}