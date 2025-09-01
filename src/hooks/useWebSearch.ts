// import { useState, useCallback } from 'react';
// import { SearchResult, SearchContext } from '../types';
// import { getWebSearchService, initializeWebSearch, disableWebSearch } from '../utils/webSearch';

// export const useWebSearch = () => {
//   const [isSearching, setIsSearching] = useState(false);
//   const [searchError, setSearchError] = useState<string | null>(null);
//   const [searchContext, setSearchContext] = useState<SearchContext | null>(null);

//   const initializeSearch = useCallback((apiKey: string, searchEngineId: string) => {
//     initializeWebSearch(apiKey, searchEngineId);
//   }, []);

//   const performSearch = useCallback(async (query: string, maxResults: number = 5): Promise<SearchResult[]> => {
//     const searchService = getWebSearchService();
//     if (!searchService) {
//       throw new Error('Web search not configured');
//     }

//     setIsSearching(true);
//     setSearchError(null);

//     try {
//       const response = await searchService.search(query, maxResults);
//       setSearchContext({
//         query: response.query,
//         results: response.results,
//         timestamp: response.timestamp
//       });
//       return response.results;
//     } catch (error) {
//       const errorMessage = error instanceof Error ? error.message : 'Search failed';
//       setSearchError(errorMessage);
//       throw error;
//     } finally {
//       setIsSearching(false);
//     }
//   }, []);

//   const shouldUseSearch = useCallback((message: string): boolean => {
//     // Check if the message contains search triggers
//     const searchTriggers = [
//       'current',
//       'recent',
//       'latest',
//       'today',
//       'yesterday',
//       'this week',
//       'search for',
//       'find information about',
//       'look up',
//       'web search',
//       'internet search',
//       'google'
//     ];

//     const lowerMessage = message.toLowerCase();
//     return searchTriggers.some(trigger => lowerMessage.includes(trigger));
//   }, []);

//   const extractSearchQuery = useCallback((message: string): string => {
//     // Extract the main query from the message
//     const patterns = [
//       /(?:search|find|look up) (?:for|information about)?\s*(.+?)(?:\?|\.|$)/i,
//       /(?:what|who|when|where|why|how) (?:is|are|was|were|did|does)\s+(.+?)(?:\?|\.|$)/i,
//       /(?:tell me|show me|give me) (?:about|information about)?\s*(.+?)(?:\?|\.|$)/i
//     ];

//     for (const pattern of patterns) {
//       const match = message.match(pattern);
//       if (match && match[1]) {
//         return match[1].trim();
//       }
//     }

//     // Fallback: use the entire message as query
//     return message.replace(/[?.!]/g, '').trim();
//   }, []);

//   const formatSearchPrompt = useCallback((query: string, results: SearchResult[]): string => {
//     const formattedResults = results.map((result, index) => 
//       `[${index + 1}] Title: ${result.title}\nURL: ${result.link}\nSummary: ${result.snippet}\n`
//     ).join('\n');

//     return `User asked: "${query}"

// I found these recent search results:

// ${formattedResults}

// Please provide a comprehensive answer based on these search results. Cite specific sources using [1], [2], etc., when referencing information from the search results. If the search results don't contain relevant information, acknowledge this and provide the best answer you can based on your general knowledge.

// Answer:`;
//   }, []);

//   const clearSearch = useCallback(() => {
//     setSearchContext(null);
//     setSearchError(null);
//   }, []);

//   return {
//     isSearching,
//     searchError,
//     searchContext,
//     initializeSearch,
//     performSearch,
//     shouldUseSearch,
//     extractSearchQuery,
//     formatSearchPrompt,
//     clearSearch
//   };
// };

import { useState, useEffect } from 'react';
import { storage } from '../utils/storage';

export interface SearchResult {
  title: string;
  link: string;
  snippet: string;
}

export const useWebSearch = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const search = async (query: string): Promise<SearchResult[]> => {
    const settings = storage.getSettings();
    
    if (!settings.enableWebSearch) {
      throw new Error('Web search is disabled');
    }

    if (!settings.googleApiKey || !settings.googleSearchEngineId) {
      throw new Error('Google API credentials not configured');
    }

    setIsLoading(true);
    setError(null);

    try {
      const url = `https://www.googleapis.com/customsearch/v1?key=${settings.googleApiKey}&cx=${settings.googleSearchEngineId}&q=${encodeURIComponent(query)}&num=${settings.maxSearchResults || 3}`;
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Search failed: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error.message);
      }
      
      return data.items?.map((item: any) => ({
        title: item.title,
        link: item.link,
        snippet: item.snippet
      })) || [];
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown search error';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return { search, isLoading, error };
};