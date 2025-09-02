import { useState, useCallback, useEffect } from 'react';
import { Message } from '../types/index';
import { useWebSearch } from './useWebSearch';

interface OllamaSettings {
  apiUrl: string;
  enableWebSearch: boolean;
  enableAdvancedSearch: boolean;
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

  // Read settings from localStorage or environment (for Netlify)
  const getSettings = useCallback((): OllamaSettings => {
    try {
      const savedSettings = JSON.parse(localStorage.getItem('ollama-settings') || '{}');

      // Use environment variable first, fallback to localStorage, fallback to localhost

      const apiUrl =
        import.meta.env.VITE_OLLAMA_API_URL ||
        savedSettings.apiUrl ||
        'http://localhost:11434';


      return {
        apiUrl,
        enableWebSearch: savedSettings.enableWebSearch || false,
        enableAdvancedSearch: savedSettings.enableAdvancedSearch || false,
        googleApiKey: savedSettings.googleApiKey || '',
        googleSearchEngineId: savedSettings.googleSearchEngineId || '',
        maxSearchResults: savedSettings.maxSearchResults || 3,
        searchTimeout: savedSettings.searchTimeout || 10
      };
    } catch {
      return {
        apiUrl: import.meta.env.VITE_OLLAMA_API_URL || 'http://localhost:11434'
        ,
        enableWebSearch: false,
        enableAdvancedSearch: false,
        googleApiKey: '',
        googleSearchEngineId: '',
        maxSearchResults: 3,
        searchTimeout: 10
      };
    }
  }, []);

  useEffect(() => {
    const settings = getSettings();
    if (settings.enableWebSearch && settings.googleApiKey && settings.googleSearchEngineId) {
      initializeSearch(settings.googleApiKey, settings.googleSearchEngineId);
    }
  }, [initializeSearch, getSettings]);

  const fetchModels = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const settings = getSettings();
      const response = await fetch(`${settings.apiUrl}/api/tags`);
      const text = await response.text();
      console.log('Ollama /api/tags response:', text);
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

  const ollamaRequest = async (settings: OllamaSettings, model: string, messages: Message[]) => {
    const response = await fetch(`${settings.apiUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        messages: messages.map(msg => ({ role: msg.role, content: msg.content })),
        stream: false
      })
    });
    if (!response.ok) throw new Error(`Ollama API error: ${response.statusText}`);
    const data = await response.json();
    return data.message.content;
  };



  const sendMessage = useCallback(
    async (messages: Message[], model: string): Promise<string> => {
      setIsLoading(true);
      setError(null);
      clearSearch();

      try {
        if (!messages.length) throw new Error('No messages to send');

        const settings = getSettings();
        const lastMessage = messages[messages.length - 1].content;

        let finalMessages: Message[] = [...messages];
        let searchResults: any[] = [];

        if (settings.enableWebSearch) {
          let searchQueries: string[] = [];

          if (settings.enableAdvancedSearch) {
            const queryGenPrompt = [
              {
                role: 'system',
                content: 'You are a helpful assistant. Determine if the user\'s query requires real-time web search (e.g., current events, recent data). If yes, generate 1-3 concise search queries. Output ONLY JSON: {"needsSearch": boolean, "queries": string[]}. If no, {"needsSearch": false, "queries": []}.'
              },
              { role: 'user', content: lastMessage }
            ];
            const queryGenResponse = await ollamaRequest(settings, model, queryGenPrompt as Message[]);
            console.log('Query generation response:', queryGenResponse); // Debug log
            const parsed = JSON.parse(queryGenResponse);
            if (parsed.needsSearch && parsed.queries?.length) {
              searchQueries = parsed.queries.slice(0, 3);
            }
          } else if (shouldUseSearch(lastMessage)) {
            searchQueries = [extractSearchQuery(lastMessage)];
          }

          if (searchQueries.length) {
            const allResults = new Map<string, any>();
            for (const query of searchQueries) {
              const results = await performSearch(query, settings.maxSearchResults, settings.searchTimeout);
              results.forEach(res => allResults.set(res.link, res));
            }
            searchResults = Array.from(allResults.values());

            if (searchResults.length) {
              const searchPrompt = formatSearchPrompt(lastMessage, searchResults);
              finalMessages = [
                ...messages.slice(0, -1),
                { ...messages[messages.length - 1], content: searchPrompt }
              ];
            }
          }
        }

        if (searchResults.length > 0) {
          finalMessages = [
            {
              id: 'system-' + Date.now().toString(),
              role: 'system',
              content: 'You are a helpful AI assistant with access to recent web search results provided in the context. Answer questions using ONLY the provided context for up-to-date information. Do not claim you have no internet access or use knowledge outside the context. If the context is irrelevant, acknowledge it.',
              timestamp: new Date(),
            },
            ...finalMessages
          ];
        }

        console.log('Sending messages to Ollama:', finalMessages); // Debug log
        const response = await ollamaRequest(settings, model, finalMessages);
        console.log('Ollama API response:', response); // Debug log
        return response;
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
    isSearching,
    error: error || searchError,
    searchContext,
    clearSearch
  };
};