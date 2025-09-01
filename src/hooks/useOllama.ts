// hooks/useOllama.ts
import { useState, useCallback, useEffect } from 'react';
import { Message } from '../types';
import { useWebSearch } from './useWebSearch';

interface OllamaSettings {
  apiUrl: string;
  enableWebSearch: boolean;
  googleApiKey: string;
  googleSearchEngineId: string;
  maxSearchResults: number;
  searchTimeout: number;
}

interface ModelResponse {
  models: { name: string }[];
}

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

  const getSettings = useCallback((): OllamaSettings => {
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
  }, []);

  // Initialize web search when settings change
  useEffect(() => {
    const settings = getSettings();
    if (settings.enableWebSearch && settings.googleApiKey && settings.googleSearchEngineId) {
      initializeSearch(settings.googleApiKey, settings.googleSearchEngineId);
    }
  }, [initializeSearch, getSettings]);

  // Fetch available models
  const fetchModels = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const settings = getSettings();
      const response = await fetch(`${settings.apiUrl}/api/tags`);
      if (!response.ok) throw new Error(`Ollama API error: ${response.statusText}`);

      const data: ModelResponse = await response.json();
      setModels(data.models?.map(model => model.name) || []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      console.error('Failed to fetch models:', err);
    } finally {
      setIsLoading(false);
    }
  }, [getSettings]);

  // Send messages to a model with optional web search
  const sendMessage = useCallback(
    async (messages: Message[], model: string): Promise<string> => {
      setIsLoading(true);
      setError(null);
      clearSearch();

      try {
        if (!messages.length) throw new Error('No messages to send');

        const settings = getSettings();
        const lastMessage = messages[messages.length - 1].content;

        let finalMessages = messages;
        let searchResults: any[] = [];

        if (settings.enableWebSearch && shouldUseSearch(lastMessage)) {
          const searchQuery = extractSearchQuery(lastMessage);
          searchResults = await performSearch(searchQuery, settings.maxSearchResults);

          if (searchResults.length) {
            const searchPrompt = formatSearchPrompt(searchQuery, searchResults);
            finalMessages = [
              ...messages.slice(0, -1),
              { ...messages[messages.length - 1], content: searchPrompt }
            ];
          }
        }

        const response = await fetch(`${settings.apiUrl}/api/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model,
            messages: finalMessages.map(msg => ({ role: msg.role, content: msg.content })),
            stream: false
          })
        });

        if (!response.ok) throw new Error(`Ollama API error: ${response.statusText}`);

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
    [clearSearch, getSettings, performSearch, shouldUseSearch, extractSearchQuery, formatSearchPrompt]
  );

  useEffect(() => {
    fetchModels();
  }, [fetchModels]);

  return {
    sendMessage,
    fetchModels,
    models,
    isLoading: isLoading || isSearching,
    error: error || searchError,
    searchContext
  };
};
