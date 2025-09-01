export interface SearchResult {
  title: string;
  link: string;
  snippet: string;
  source: string;
}

export interface SearchResponse {
  results: SearchResult[];
  query: string;
  timestamp: Date;
}

export class WebSearchService {
  private apiKey: string;
  private searchEngineId: string;

  constructor(apiKey: string, searchEngineId: string) {
    this.apiKey = apiKey;
    this.searchEngineId = searchEngineId;
  }

  async search(query: string, numResults: number = 5): Promise<SearchResponse> {
    if (!this.apiKey || !this.searchEngineId) {
      throw new Error('Google Search API credentials not configured');
    }

    try {
      const response = await fetch(
        `https://www.googleapis.com/customsearch/v1?key=${this.apiKey}&cx=${this.searchEngineId}&q=${encodeURIComponent(query)}&num=${numResults}`
      );

      if (!response.ok) {
        throw new Error(`Google Search API error: ${response.statusText}`);
      }

      const data = await response.json();

      const results: SearchResult[] = data.items?.map((item: any) => ({
        title: item.title,
        link: item.link,
        snippet: item.snippet,
        source: this.extractDomain(item.link)
      })) || [];

      return {
        results,
        query,
        timestamp: new Date()
      };
    } catch (error) {
      console.error('Web search error:', error);
      throw new Error('Failed to perform web search');
    }
  }

  private extractDomain(url: string): string {
    try {
      const domain = new URL(url).hostname;
      return domain.replace('www.', '');
    } catch {
      return url;
    }
  }

  formatSearchResults(results: SearchResult[]): string {
    return results.map((result, index) => 
      `[${index + 1}] "${result.title}"\nURL: ${result.link}\nSummary: ${result.snippet}\n`
    ).join('\n');
  }
}

// Singleton instance
let webSearchInstance: WebSearchService | null = null;

export const getWebSearchService = (): WebSearchService | null => {
  return webSearchInstance;
};

export const initializeWebSearch = (apiKey: string, searchEngineId: string): void => {
  webSearchInstance = new WebSearchService(apiKey, searchEngineId);
};

export const disableWebSearch = (): void => {
  webSearchInstance = null;
};