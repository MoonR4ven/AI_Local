import { Chat, ModelInfo, DownloadableModel, Settings } from '../types';

const CHATS_STORAGE_KEY = 'ollama-chats';
const CURRENT_CHAT_KEY = 'ollama-current-chat';
const MODELS_STORAGE_KEY = 'ollama-models';
const SETTINGS_STORAGE_KEY = 'ollama-settings';
const AVAILABLE_MODELS_KEY = 'ollama-available-models';

export const storage = {
    
  // Chat-related methods
  getChats: (): Chat[] => {
    try {
      const chats = localStorage.getItem(CHATS_STORAGE_KEY);
      return chats ? JSON.parse(chats) : [];
    } catch {
      return [];
    }
  },

  saveChats: (chats: Chat[]): void => {
    try {
      localStorage.setItem(CHATS_STORAGE_KEY, JSON.stringify(chats));
    } catch (error) {
      console.error('Failed to save chats:', error);
    }
  },

  getCurrentChatId: (): string | null => {
    try {
      return localStorage.getItem(CURRENT_CHAT_KEY);
    } catch {
      return null;
    }
  },

  setCurrentChatId: (id: string | null): void => {
    try {
      if (id) {
        localStorage.setItem(CURRENT_CHAT_KEY, id);
      } else {
        localStorage.removeItem(CURRENT_CHAT_KEY);
      }
    } catch (error) {
      console.error('Failed to set current chat:', error);
    }
  },

  // Model-related methods
  getModels: (): ModelInfo[] => {
    try {
      const models = localStorage.getItem(MODELS_STORAGE_KEY);
      return models ? JSON.parse(models) : [];
    } catch {
      return [];
    }
  },

  saveModels: (models: ModelInfo[]): void => {
    try {
      localStorage.setItem(MODELS_STORAGE_KEY, JSON.stringify(models));
    } catch (error) {
      console.error('Failed to save models:', error);
    }
  },

  addModel: (model: ModelInfo): void => {
    try {
      const models = storage.getModels();
      const existingIndex = models.findIndex(m => m.name === model.name);
      
      if (existingIndex >= 0) {
        models[existingIndex] = model;
      } else {
        models.push(model);
      }
      
      storage.saveModels(models);
    } catch (error) {
      console.error('Failed to add model:', error);
    }
  },

  removeModel: (modelName: string): void => {
    try {
      const models = storage.getModels();
      const filteredModels = models.filter(model => model.name !== modelName);
      storage.saveModels(filteredModels);
    } catch (error) {
      console.error('Failed to remove model:', error);
    }
  },

  // Available models (downloadable models)
  getAvailableModels: (): DownloadableModel[] => {
    try {
      const models = localStorage.getItem(AVAILABLE_MODELS_KEY);
      if (models) return JSON.parse(models);
      
      // Initialize with sample data if none exists
      const sampleModels: DownloadableModel[] = [
       
        {
          name: 'numaicaexemplu',
          size: '13GB',
          description: 'A model specialized in code generation',
          requiredRAM: '16GB',
          popularity: 76,
          tags: ['coding']
        }
      ];
      
      storage.saveAvailableModels(sampleModels);
      return sampleModels;
    } catch {
      return [];
    }
  },

  saveAvailableModels: (models: DownloadableModel[]): void => {
    try {
      localStorage.setItem(AVAILABLE_MODELS_KEY, JSON.stringify(models));
    } catch (error) {
      console.error('Failed to save available models:', error);
    }
  },

  // Settings management
getSettings: (): Settings => {
  try {
    const settings = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (settings) return JSON.parse(settings);

    // Full default settings object
    const defaultSettings: Settings = {
      // General
      theme: 'system',
      apiUrl: import.meta.env.VITE_OLLAMA_API_URL
,
      apiKey: '',

      // Model Parameters
      maxTokens: 2048,
      temperature: 0.7,
      topP: 1,
      topK: 50,
      repeatPenalty: 1,
      frequencyPenalty: 0,
      presencePenalty: 0,
      systemPrompt: 'You are a helpful assistant.',
      model: 'llama3.2:3b',

      // Performance
      timeout: 30,
      maxContextLength: 2048,

      // Features
      enableStreaming: true,
      enableMemory: true,
      enableSearch: false,
      enableFileUpload: false,
      enableImageGeneration: false,
      enableVoiceInput: false,
      enableVoiceOutput: false,
      enableCodeExecution: false,
      enablePlugins: false,

      // Notifications & Updates
      enableNotifications: true,
      enableAutoUpdates: false,
      enableTelemetry: true,
      enableExperimentalFeatures: false,

      // Appearance
      language: 'en',
      fontSize: 14,
      fontFamily: 'Arial',
      uiScale: 1,
      animationSpeed: 'normal',
      enableSyntaxHighlighting: true,
      enableLineNumbers: true,
      enableWordWrap: true,
      enableSpellCheck: true,
      enableAutoComplete: true,
      enableQuickActions: true,
      enableTooltips: true,
      enableKeyboardShortcuts: true,

      // Data & Storage
      backupFrequency: 'weekly',
      exportFormat: 'json',
      enableCloudSync: false,
      cloudSyncProvider: 'none',
      enableLocalStorage: true,
      enableIndexedDB: false,

      // Web Search
      enableWebSearch: false,
      googleApiKey: '',
      googleSearchEngineId: '',
      maxSearchResults: 3,
      searchTimeout: 10,

      // Privacy & Security
      privacyLevel: 'standard',
      dataRetention: '30days',
      enableModeration: true,
      enableContentFilter: true,
      enableRateLimiting: true,
      enableIPFiltering: false,
      enableAuth: false,
      enable2FA: false,
      enableSessionTimeout: false,
      sessionTimeout: 15,
      enablePasswordPolicy: false,
      enableAuditLog: false
    };

    storage.saveSettings(defaultSettings);
    return defaultSettings;

  } catch {
    // Return the same full defaults even if localStorage fails
    return {
      // copy the same object here as above
      theme: 'system',
      apiUrl: import.meta.env.VITE_OLLAMA_API_URL
,
      apiKey: '',

      maxTokens: 2048,
      temperature: 0.7,
      topP: 1,
      topK: 50,
      repeatPenalty: 1,
      frequencyPenalty: 0,
      presencePenalty: 0,
      systemPrompt: 'You are a helpful assistant.',
      model: 'llama3.2:3b',

      timeout: 30,
      maxContextLength: 2048,

      enableStreaming: true,
      enableMemory: true,
      enableSearch: false,
      enableFileUpload: false,
      enableImageGeneration: false,
      enableVoiceInput: false,
      enableVoiceOutput: false,
      enableCodeExecution: false,
      enablePlugins: false,

      enableNotifications: true,
      enableAutoUpdates: false,
      enableTelemetry: true,
      enableExperimentalFeatures: false,

      language: 'en',
      fontSize: 14,
      fontFamily: 'Arial',
      uiScale: 1,
      animationSpeed: 'normal',
      enableSyntaxHighlighting: true,
      enableLineNumbers: true,
      enableWordWrap: true,
      enableSpellCheck: true,
      enableAutoComplete: true,
      enableQuickActions: true,
      enableTooltips: true,
      enableKeyboardShortcuts: true,

      backupFrequency: 'weekly',
      exportFormat: 'json',
      enableCloudSync: false,
      cloudSyncProvider: 'none',
      enableLocalStorage: true,
      enableIndexedDB: false,

      enableWebSearch: false,
      googleApiKey: '',
      googleSearchEngineId: '',
      maxSearchResults: 3,
      searchTimeout: 10,

      privacyLevel: 'standard',
      dataRetention: '30days',
      enableModeration: true,
      enableContentFilter: true,
      enableRateLimiting: true,
      enableIPFiltering: false,
      enableAuth: false,
      enable2FA: false,
      enableSessionTimeout: false,
      sessionTimeout: 15,
      enablePasswordPolicy: false,
      enableAuditLog: false
    };
  }
},


  saveSettings: (settings: Settings): void => {
    try {
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
    } catch (error) {
      console.error('Failed to save settings:', error);
    }
  },

  // Add a sample model for demonstration
  initSampleModels: (): void => {
    const existingModels = storage.getModels();
    if (existingModels.length === 0) {
      const sampleModels: ModelInfo[] = [
        {
          name: 'llama3.2:3b',
          size: '1.8 GB',
          modified: new Date()
        },
        {
          name: 'mistral:7b',
          size: '4.1 GB',
          modified: new Date(Date.now() - 86400000) // 1 day ago
        }
      ];
      storage.saveModels(sampleModels);
    }
  },

  // Clear all data (for debugging/reset)
  clearAll: (): void => {
    try {
      localStorage.removeItem(CHATS_STORAGE_KEY);
      localStorage.removeItem(CURRENT_CHAT_KEY);
      localStorage.removeItem(MODELS_STORAGE_KEY);
      localStorage.removeItem(SETTINGS_STORAGE_KEY);
      localStorage.removeItem(AVAILABLE_MODELS_KEY);
    } catch (error) {
      console.error('Failed to clear storage:', error);
    }
  }
};