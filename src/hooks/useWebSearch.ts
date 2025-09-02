import { useState, useCallback } from 'react';
import { SearchResult, SearchContext } from '../types/index';
import { getWebSearchService, initializeWebSearch, disableWebSearch } from '../utils/webSearch';

export const useWebSearch = () => {
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [searchContext, setSearchContext] = useState<SearchContext | null>(null);

  const initializeSearch = useCallback((apiKey: string, searchEngineId: string) => {
    initializeWebSearch(apiKey, searchEngineId);
  }, []);

  const performSearch = useCallback(async (query: string, maxResults: number = 5, timeout: number = 10): Promise<SearchResult[]> => {
    const searchService = getWebSearchService();
    if (!searchService) {
      throw new Error('Web search not configured');
    }

    setIsSearching(true);
    setSearchError(null);

    try {
      // Add timeout
      const searchPromise = searchService.search(query, maxResults);
      const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('Search timeout')), timeout * 1000));
      const response = await Promise.race([searchPromise, timeoutPromise]);

      setSearchContext({
        query,
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
    return message.replace(/[?.!]/g, '').trim();
  }, []);



const formatSearchPrompt = useCallback((originalQuery: string, results: SearchResult[]): string => {
  const formattedResults = results.map((result, index) => 
    `[${index + 1}] Title: ${result.title}\nURL: ${result.link}\nSummary: ${result.snippet}\nSource: ${result.source}\n`
  ).join('\n\n');

  if (!results.length) {
    return originalQuery; // Fallback if no results
  }

  return `You have access to the following recent web search results from September 02, 2025. Use ONLY this provided context to answer any questions requiring up-to-date or real-time information. Do not use your prior knowledge or claim you lack internet access—these are fresh search results. If the context doesn't contain relevant information, say so and provide the best answer possible without fabricating details.

Context:
${formattedResults}

Question: ${originalQuery}

Helpful Answer:`;
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