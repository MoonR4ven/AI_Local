import { useState, useCallback } from 'react';
import { SearchResult, SearchContext } from '../types';
import { getWebSearchService, initializeWebSearch, disableWebSearch } from '../utils/webSearch';

export const useWebSearch = () => {
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [searchContext, setSearchContext] = useState<SearchContext | null>(null);

  const initializeSearch = useCallback((apiKey: string, searchEngineId: string) => {
    initializeWebSearch(apiKey, searchEngineId);
  }, []);

  const performSearch = useCallback(async (query: string, maxResults: number = 5): Promise<SearchResult[]> => {
    const searchService = getWebSearchService();
    if (!searchService) {
      throw new Error('Web search not configured');
    }

    setIsSearching(true);
    setSearchError(null);

    try {
      const response = await searchService.search(query, maxResults);
      setSearchContext({
        query: response.query,
        results: response.results,
        timestamp: response.timestamp
      });
      return response.results;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Search failed';
      setSearchError(errorMessage);
      throw error;
    } finally {
      setIsSearching(false);
    }
  }, []);

  const shouldUseSearch = useCallback((message: string): boolean => {
    // Check if the message contains search triggers
    const searchTriggers = [
      'current',
      'recent',
      'latest',
      'today',
      'yesterday',
      'this week',
      'search for',
      'find information about',
      'look up',
      'web search',
      'internet search',
      'google'
    ];

    const lowerMessage = message.toLowerCase();
    return searchTriggers.some(trigger => lowerMessage.includes(trigger));
  }, []);

  const extractSearchQuery = useCallback((message: string): string => {
    // Extract the main query from the message
    const patterns = [
      /(?:search|find|look up) (?:for|information about)?\s*(.+?)(?:\?|\.|$)/i,
      /(?:what|who|when|where|why|how) (?:is|are|was|were|did|does)\s+(.+?)(?:\?|\.|$)/i,
      /(?:tell me|show me|give me) (?:about|information about)?\s*(.+?)(?:\?|\.|$)/i
    ];

    for (const pattern of patterns) {
      const match = message.match(pattern);
      if (match && match[1]) {
        return match[1].trim();
      }
    }

    // Fallback: use the entire message as query
    return message.replace(/[?.!]/g, '').trim();
  }, []);

  const formatSearchPrompt = useCallback((query: string, results: SearchResult[]): string => {
    const formattedResults = results.map((result, index) => 
      `[${index + 1}] Title: ${result.title}\nURL: ${result.link}\nSummary: ${result.snippet}\n`
    ).join('\n');

    return `User asked: "${query}"

I found these recent search results:

${formattedResults}

Please provide a comprehensive answer based on these search results. Cite specific sources using [1], [2], etc., when referencing information from the search results. If the search results don't contain relevant information, acknowledge this and provide the best answer you can based on your general knowledge.

Answer:`;
  }, []);

  const clearSearch = useCallback(() => {
    setSearchContext(null);
    setSearchError(null);
  }, []);

  return {
    isSearching,
    searchError,
    searchContext,
    initializeSearch,
    performSearch,
    shouldUseSearch,
    extractSearchQuery,
    formatSearchPrompt,
    clearSearch
  };
};
