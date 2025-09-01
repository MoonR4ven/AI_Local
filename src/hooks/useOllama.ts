// hooks/useOllama.ts
import { useState, useCallback, useEffect } from 'react';
import { Message } from '../types';
import { useWebSearch } from './useWebSearch';

export const useOllama = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [models, setModels] = useState<string[]>([]);
  
  const {
    isSearching,
    searchError,
    searchContext,
    initializeSearch,
    performSearch,
    shouldUseSearch,
    extractSearchQuery,
    formatSearchPrompt,
    clearSearch
  } = useWebSearch();

  // Get settings with defaults
  const getSettings = () => {
    try {
      const savedSettings = JSON.parse(localStorage.getItem('ollama-settings') || '{}');
      return {
        apiUrl: savedSettings.apiUrl || 'http://localhost:11434',
        enableWebSearch: savedSettings.enableWebSearch || false,
        googleApiKey: savedSettings.googleApiKey || '',
        googleSearchEngineId: savedSettings.googleSearchEngineId || '',
        maxSearchResults: savedSettings.maxSearchResults || 3,
        searchTimeout: savedSettings.searchTimeout || 10
      };
    } catch {
      return {
        apiUrl: 'http://localhost:11434',
        enableWebSearch: false,
        googleApiKey: '',
        googleSearchEngineId: '',
        maxSearchResults: 3,
        searchTimeout: 10
      };
    }
  };

  // Initialize web search when settings change
  useEffect(() => {
    const settings = getSettings();
    if (settings.enableWebSearch && settings.googleApiKey && settings.googleSearchEngineId) {
      initializeSearch(settings.googleApiKey, settings.googleSearchEngineId);
    }
  }, [initializeSearch]);

  // Fetch available models
  const fetchModels = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const settings = getSettings();
      const response = await fetch(`${settings.apiUrl}/api/tags`);

      if (!response.ok) {
        throw new Error(`Ollama API error: ${response.statusText}`);
      }

      const data = await response.json();
      setModels(data.models?.map((model: any) => model.name) || []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      console.error('Failed to fetch models:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Send messages to a model with web search integration
  const sendMessage = useCallback(
    async (messages: Message[], model: string): Promise<string> => {
      setIsLoading(true);
      setError(null);
      clearSearch();

      try {
        const settings = getSettings();
        const lastMessage = messages[messages.length - 1].content;

        let finalMessages = messages;
        let searchResults: any[] = [];

        // Check if we should perform a web search
        if (settings.enableWebSearch && shouldUseSearch(lastMessage)) {
          const searchQuery = extractSearchQuery(lastMessage);
          searchResults = await performSearch(searchQuery, settings.maxSearchResults);
          
          if (searchResults.length > 0) {
            const searchPrompt = formatSearchPrompt(searchQuery, searchResults);
            finalMessages = [
              ...messages.slice(0, -1),
              {
                ...messages[messages.length - 1],
                content: searchPrompt
              }
            ];
          }
        }

        const requestBody = {
          model,
          messages: finalMessages.map(msg => ({ 
            role: msg.role, 
            content: msg.content 
          })),
          stream: false,
        };

        const response = await fetch(`${settings.apiUrl}/api/chat`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
          throw new Error(`Ollama API error: ${response.statusText}`);
        }

        const data = await response.json();
        return data.message.content;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        setError(errorMessage);
        console.error('Failed to send message:', err);
        throw new Error(errorMessage);
      } finally {
        setIsLoading(false);
      }
    },
    [performSearch, shouldUseSearch, extractSearchQuery, formatSearchPrompt, clearSearch]
  );

  // Auto-fetch models on mount
  useEffect(() => {
    fetchModels();
  }, [fetchModels]);

  return { 
    sendMessage, 
    fetchModels, 
    models, 
    isLoading: isLoading || isSearching, // Combine loading states
    error: error || searchError,
    searchContext 
  };
};