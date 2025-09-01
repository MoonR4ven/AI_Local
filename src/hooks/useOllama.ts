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
  const [apiStatus, setApiStatus] = useState<'checking' | 'online' | 'offline'>('checking');

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

      // Use Netlify function for production, direct URL for development
      const isDevelopment = import.meta.env.DEV;
      const apiUrl = isDevelopment
        ? (import.meta.env.VITE_OLLAMA_API_URL || 'http://localhost:11434')
        : '/.netlify/functions/ollama-proxy'; // Note: fixed path name

      return {
        apiUrl,
        enableWebSearch: savedSettings.enableWebSearch || false,
        googleApiKey: savedSettings.googleApiKey || '',
        googleSearchEngineId: savedSettings.googleSearchEngineId || '',
        maxSearchResults: savedSettings.maxSearchResults || 3,
        searchTimeout: savedSettings.searchTimeout || 10
      };
    } catch {
      return {
        apiUrl: import.meta.env.VITE_OLLAMA_API_URL || 'http://localhost:11434',
        enableWebSearch: false,
        googleApiKey: '',
        googleSearchEngineId: '',
        maxSearchResults: 3,
        searchTimeout: 10
      };
    }
  }, []);

  // Check API status
  const checkApiStatus = useCallback(async () => {
    const settings = getSettings();
    try {
      const response = await fetch(`${settings.apiUrl}/api/tags`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });

      setApiStatus(response.ok ? 'online' : 'offline');
      return response.ok;
    } catch {
      setApiStatus('offline');
      return false;
    }
  }, [getSettings]);

// Add this function to check if response is JSON
const isJsonResponse = (response: Response) => {
  const contentType = response.headers.get('content-type');
  return contentType && contentType.includes('application/json');
};

// Update fetchModels function
const fetchModels = useCallback(async () => {
  setIsLoading(true);
  setError(null);

  try {
    const settings = getSettings();
    console.log('Fetching models from:', `${settings.apiUrl}/api/tags`);
    
    const response = await fetch(`${settings.apiUrl}/api/tags`, {
      headers: { 'Content-Type': 'application/json' }
    });

    if (!response.ok) {
      throw new Error(`HTTP error: ${response.status} ${response.statusText}`);
    }

    // Check if response is JSON
    if (!isJsonResponse(response)) {
      const text = await response.text();
      console.error('Non-JSON response:', text.substring(0, 200));
      throw new Error('Server returned non-JSON response');
    }

    const data: ModelResponse = await response.json();
    setModels(data.models?.map(model => model.name) || []);
    setApiStatus('online');
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    setError(errorMessage);
    setApiStatus('offline');
    console.error('Failed to fetch models:', err);
  } finally {
    setIsLoading(false);
  }
}, [getSettings]);
  // Initialize web search when settings change
  useEffect(() => {
    const settings = getSettings();
    if (settings.enableWebSearch && settings.googleApiKey && settings.googleSearchEngineId) {
      initializeSearch(settings.googleApiKey, settings.googleSearchEngineId);
    }
    console.log("Using Ollama API URL:", settings.apiUrl); // ✅ now inside useEffect
  }, [initializeSearch, getSettings]);




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
    searchContext,
    apiUrl: getSettings().apiUrl, // <-- add this
  };

};
