// types.ts
export interface Message {
    id: string;
    role: 'user' | 'assistant' | 'system';
    content: string;
    timestamp: Date;
}
export interface ModelParameters {
  maxTokens: number;
  temperature: number;
  topP: number;
  topK: number;
  repeatPenalty: number;
  frequencyPenalty: number;
  presencePenalty: number;
}


export interface Chat {
    id: string;
    title: string;
    messages: Message[];
    model: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface ModelInfo {
    name: string;
    size: string;
    modified: Date;
}

export interface DownloadableModel {
    name: string;
    size: string;
    description: string;
    requiredRAM: string;
    popularity: number;
    tags: string[];
}

// types.ts
export interface Settings {
  // General
  theme: 'light' | 'dark' | 'system';
  apiUrl: string;
  apiKey: string;
  
  // Model Parameters
  maxTokens: number;
  temperature: number;
  topP: number;
  topK: number;
  repeatPenalty: number;
  frequencyPenalty: number;
  presencePenalty: number;
  systemPrompt: string;
  model: string;
  
  // Performance
  timeout: number;
  maxContextLength: number;
  
  // Features
  enableStreaming: boolean;
  enableMemory: boolean;
  enableSearch: boolean;

  enableFileUpload: boolean;
  enableImageGeneration: boolean;
  enableVoiceInput: boolean;
  enableVoiceOutput: boolean;
  enableCodeExecution: boolean;
  enablePlugins: boolean;
  
  // Notifications & Updates
  enableNotifications: boolean;
  enableAutoUpdates: boolean;
  enableTelemetry: boolean;
  enableExperimentalFeatures: boolean;
  
  // Appearance
  language: string;
  fontSize: number;
  fontFamily: string;
  uiScale: number;
  animationSpeed: 'slow' | 'normal' | 'fast' | 'none';
  enableSyntaxHighlighting: boolean;
  enableLineNumbers: boolean;
  enableWordWrap: boolean;
  enableSpellCheck: boolean;
  enableAutoComplete: boolean;
  enableQuickActions: boolean;
  enableTooltips: boolean;
  enableKeyboardShortcuts: boolean;
  
  // Data & Storage
  backupFrequency: 'daily' | 'weekly' | 'monthly' | 'never';
  exportFormat: 'json' | 'csv' | 'txt' | 'markdown';
  enableCloudSync: boolean;
  cloudSyncProvider: 'none' | 'google' | 'dropbox' | 'onedrive';
  enableLocalStorage: boolean;
  enableIndexedDB: boolean;
  
  // Web Search
  enableWebSearch: boolean;
  googleApiKey: string;
  googleSearchEngineId: string;
  maxSearchResults: number;
  searchTimeout: number;

  // Privacy & Security
  privacyLevel: 'minimal' | 'standard' | 'strict';
  dataRetention: '7days' | '30days' | '90days' | '1year' | 'forever';
  enableModeration: boolean;
  enableContentFilter: boolean;
  enableRateLimiting: boolean;
  enableIPFiltering: boolean;
  enableAuth: boolean;
  enable2FA: boolean;
  enableSessionTimeout: boolean;
  sessionTimeout: number;
  enablePasswordPolicy: boolean;
  enableAuditLog: boolean;
}

export interface SearchResult {
  title: string;
  link: string;
  snippet: string;
  source: string;
}

export interface SearchContext {
  query: string;
  results: SearchResult[];
  timestamp: Date;
}

export interface OllamaResponse {
    model: string;
    created_at: string;
    message: {
        role: string;
        content: string;
    };
    done: boolean;
}

export interface OllamaRequest {
    model: string;
    messages: {
        role: string;
        content: string;
    }[];
    stream: boolean;
}

