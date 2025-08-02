import { Source } from '../types/oracle.js';

/**
 * Validates and normalizes source URLs
 */
export function validateSource(source: Source): boolean {
  if (!source.title || !source.url) {
    return false;
  }

  try {
    const url = new URL(source.url);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Filters out invalid sources from a list
 */
export function filterValidSources(sources: Source[]): Source[] {
  return sources.filter(validateSource);
}

/**
 * Normalizes source URLs (removes tracking parameters, etc.)
 */
export function normalizeSourceUrl(url: string): string {
  try {
    const urlObj = new URL(url);
    
    // Remove common tracking parameters
    const trackingParams = [
      'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content',
      'fbclid', 'gclid', 'ref', 'source'
    ];
    
    trackingParams.forEach(param => {
      urlObj.searchParams.delete(param);
    });
    
    return urlObj.toString();
  } catch {
    return url; // Return original if URL parsing fails
  }
}

/**
 * Deduplicates sources based on normalized URLs
 */
export function deduplicateSources(sources: Source[]): Source[] {
  const seen = new Set<string>();
  const deduplicated: Source[] = [];
  
  for (const source of sources) {
    const normalizedUrl = normalizeSourceUrl(source.url);
    if (!seen.has(normalizedUrl)) {
      seen.add(normalizedUrl);
      deduplicated.push({
        ...source,
        url: normalizedUrl,
      });
    }
  }
  
  return deduplicated;
}

/**
 * Extracts domain from URL for source categorization
 */
export function extractDomain(url: string): string | null {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname.replace(/^www\./, '');
  } catch {
    return null;
  }
}

/**
 * Categorizes sources by domain reliability (basic heuristic)
 */
export function categorizeSources(sources: Source[]): {
  highReliability: Source[];
  mediumReliability: Source[];
  lowReliability: Source[];
} {
  const highReliabilityDomains = new Set([
    'reuters.com', 'ap.org', 'bbc.com', 'npr.org', 'pbs.org',
    'wsj.com', 'ft.com', 'bloomberg.com', 'economist.com',
    'nature.com', 'science.org', 'nejm.org', 'arxiv.org'
  ]);
  
  const mediumReliabilityDomains = new Set([
    'cnn.com', 'nytimes.com', 'washingtonpost.com', 'theguardian.com',
    'usatoday.com', 'cbsnews.com', 'abcnews.go.com', 'nbcnews.com',
    'forbes.com', 'marketwatch.com', 'coindesk.com', 'cointelegraph.com'
  ]);
  
  const result = {
    highReliability: [] as Source[],
    mediumReliability: [] as Source[],
    lowReliability: [] as Source[],
  };
  
  for (const source of sources) {
    const domain = extractDomain(source.url);
    if (!domain) {
      result.lowReliability.push(source);
      continue;
    }
    
    if (highReliabilityDomains.has(domain)) {
      result.highReliability.push(source);
    } else if (mediumReliabilityDomains.has(domain)) {
      result.mediumReliability.push(source);
    } else {
      result.lowReliability.push(source);
    }
  }
  
  return result;
}