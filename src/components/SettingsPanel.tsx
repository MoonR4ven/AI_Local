import { useState, useEffect } from 'react';
import { Settings, ModelParameters } from '../types/index';
import { storage } from '../utils/storage';
import {
  Search,
  X,
  Save,
  Monitor,
  Sun,
  Moon,
  Cpu,
  Network,
  Code,
  MessageSquare,
  Sliders,
  Zap,
  Shield,
  Bell,
  Palette,
  Database,
  Download,
  Upload,
  Trash2,
  Eye,
  EyeOff,
  Copy,
  Check
} from 'lucide-react';

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({ isOpen, onClose }) => {
  const [settings, setSettings] = useState<Settings>({
    theme: 'system',
    apiUrl: import.meta.env.VITE_OLLAMA_API_URL
,
    apiKey: '',
    maxTokens: 2048,
    temperature: 0.7,
    topP: 0.9,
    topK: 40,
    repeatPenalty: 1.1,
    frequencyPenalty: 0,
    presencePenalty: 0,
    systemPrompt: 'You have access to the following recent web search results from September 02, 2025. Use ONLY this provided context to answer any questions requiring up-to-date or real-time information. Do not use your prior knowledge or claim you lack internet access—these are fresh search results. If the context doesn\'t contain relevant information, say so and provide the best answer possible without fabricating details.',
    model: '',
    timeout: 300,

    maxContextLength: 4096,
    enableStreaming: true,
    enableMemory: true,
    enableSearch: false,
    enableWebSearch: false,
    googleApiKey: '',
    googleSearchEngineId: '',
    maxSearchResults: 3,
    searchTimeout: 10,
    enableFileUpload: true,
    enableImageGeneration: false,
    enableVoiceInput: false,
    enableVoiceOutput: false,
    enableCodeExecution: false,
    enablePlugins: false,
    enableNotifications: true,
    enableAutoUpdates: true,
    enableTelemetry: false,
    enableExperimentalFeatures: false,
    language: 'en',
    fontSize: 14,
    fontFamily: 'Inter',
    uiScale: 100,
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
    enableIndexedDB: true,
    privacyLevel: 'standard',
    dataRetention: '30days',
    enableModeration: false,
    enableContentFilter: false,
    enableRateLimiting: false,
    enableIPFiltering: false,
    enableAuth: false,
    enable2FA: false,
    enableSessionTimeout: false,
    sessionTimeout: 60,
    enablePasswordPolicy: false,
    enableAuditLog: false
  });

  useEffect(() => {
    const savedSettings = storage.getSettings();
    if (savedSettings) {
      // Ensure all settings have values (handle undefined ones)
      const completeSettings: Settings = {
        ...settings, // Defaults first
        ...savedSettings // Then override with saved values
      };
      setSettings(completeSettings);
    }
  }, []);

  const [showApiKey, setShowApiKey] = useState(false);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState('general');



  const handleSave = () => {
    storage.saveSettings(settings);
    onClose();

    // Apply theme immediately
    if (settings.theme === 'dark' ||
      (settings.theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const handleChange = (key: keyof Settings, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleReset = () => {
    if (confirm('Are you sure you want to reset all settings to default?')) {

      const defaultSettings: Settings = {
        theme: 'system',
        apiUrl: import.meta.env.VITE_OLLAMA_API_URL
,
        apiKey: '',
        maxTokens: 2048,
        temperature: 0.7,
        topP: 0.9,
        topK: 40,
        repeatPenalty: 1.1,
        frequencyPenalty: 0,
        presencePenalty: 0,
        systemPrompt: 'You are a helpful assistant.',
        model: '',
        timeout: 300,
        maxContextLength: 4096,
        enableStreaming: true,
        enableMemory: true,
        enableSearch: false,
        enableWebSearch: false,
        enableFileUpload: true,
        enableImageGeneration: false,
        enableVoiceInput: false,
        enableVoiceOutput: false,
        enableCodeExecution: false,
        enablePlugins: false,
        enableNotifications: true,
        enableAutoUpdates: true,
        enableTelemetry: false,
        enableExperimentalFeatures: false,
        language: 'en',
        fontSize: 14,
        fontFamily: 'Inter',
        uiScale: 100,
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
        enableIndexedDB: true,
        privacyLevel: 'standard',
        dataRetention: '30days',
        enableModeration: false,
        enableContentFilter: false,
        enableRateLimiting: false,
        enableIPFiltering: false,
        enableAuth: false,
        enable2FA: false,
        enableSessionTimeout: false,
        sessionTimeout: 60,
        enablePasswordPolicy: false,
        enableAuditLog: false,
        // Web Search (missing fields)
   
        googleApiKey: '',             // ← add this
        googleSearchEngineId: '',     // ← add this
        maxSearchResults: 3,          // ← add this
        searchTimeout: 10,            // ← add this
      };
      setSettings(defaultSettings);
    }
  };

  const handleExport = () => {
    const dataStr = JSON.stringify(settings, null, 2);
    const dataUri = `data:application/json;charset=utf-8,${encodeURIComponent(dataStr)}`;
    const exportFileDefaultName = 'ollama-settings.json';

    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const importedSettings = JSON.parse(e.target?.result as string);
          setSettings(importedSettings);
        } catch (error) {
          alert('Failed to import settings. The file might be corrupted.');
        }
      };
      reader.readAsText(file);
    }
  };

  const copyApiKey = () => {
    navigator.clipboard.writeText(settings.apiKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isOpen) return null;

  const tabs = [
    { id: 'general', label: 'General', icon: Sliders },
    { id: 'model', label: 'Model', icon: Cpu },
    { id: 'search', label: 'Web Search', icon: Search }, // Add this
    { id: 'appearance', label: 'Appearance', icon: Palette },
    { id: 'privacy', label: 'Privacy & Security', icon: Shield },
    { id: 'advanced', label: 'Advanced', icon: Zap },
    { id: 'data', label: 'Data & Storage', icon: Database }
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Settings</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b dark:border-gray-700">
          <div className="flex space-x-1 px-4">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center px-4 py-2 text-sm font-medium rounded-t-md transition-colors ${activeTab === tab.id
                    ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300 border-b-2 border-primary-500'
                    : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                >
                  <Icon className="w-4 h-4 mr-2" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex max-h-[calc(90vh-140px)]">
          {/* Settings content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-6">

            {activeTab === 'search' && (
              <>
                <div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4 flex items-center">
                    <Search className="w-5 h-5 mr-2" />
                    Web Search Configuration
                  </h3>

                  <div className="space-y-4">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={settings.enableWebSearch}
                        onChange={(e) => handleChange('enableWebSearch', e.target.checked)}
                        className="rounded border-gray-300 text-primary-600 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600"
                      />
                      <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Enable web search</span>
                    </label>

                    {settings.enableWebSearch && (
                      <>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Google API Key
                          </label>
                          <input
                            type="password"
                            value={settings.googleApiKey}
                            onChange={(e) => handleChange('googleApiKey', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                            placeholder="Enter your Google API key"
                          />
                          <p className="text-xs text-gray-500 mt-1">
                            Get this from Google Cloud Console
                          </p>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Google Search Engine ID
                          </label>
                          <input
                            type="text"
                            value={settings.googleSearchEngineId}
                            onChange={(e) => handleChange('googleSearchEngineId', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                            placeholder="Enter your Custom Search Engine ID"
                          />
                          <p className="text-xs text-gray-500 mt-1">
                            Create at <a href="https://cse.google.com" target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:text-primary-700">cse.google.com</a>
                          </p>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                              Max Search Results
                            </label>
                            <input
                              type="number"
                              min="1"
                              max="10"
                              value={settings.maxSearchResults}
                              onChange={(e) => handleChange('maxSearchResults', parseInt(e.target.value))}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                              Search Timeout (seconds)
                            </label>
                            <input
                              type="number"
                              min="5"
                              max="60"
                              value={settings.searchTimeout}
                              onChange={(e) => handleChange('searchTimeout', parseInt(e.target.value))}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                            />
                          </div>
                        </div>

                        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-md">
                          <p className="text-sm text-blue-800 dark:text-blue-200">
                            <strong>Note:</strong> Web search will be automatically used when the model needs current information.
                            You can also trigger it manually by including phrases like "search for" or "current information about".
                          </p>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </>
            )}

            {activeTab === 'general' && (
              <>
                <div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4 flex items-center">
                    <Sliders className="w-5 h-5 mr-2" />
                    General Settings
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Ollama API URL
                      </label>
                      <input
                        type="text"
                        value={settings.apiUrl}
                        onChange={(e) => handleChange('apiUrl', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        placeholder="http://localhost:11434"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        API Key (Optional)
                      </label>
                      <div className="relative">
                        <input
                          type={showApiKey ? 'text' : 'password'}
                          value={settings.apiKey}
                          onChange={(e) => handleChange('apiKey', e.target.value)}
                          className="w-full px-3 py-2 pr-20 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                          placeholder="Enter API key"
                        />
                        <div className="absolute inset-y-0 right-0 flex items-center">
                          <button
                            onClick={() => setShowApiKey(!showApiKey)}
                            className="px-3 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                          >
                            {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                          <button
                            onClick={copyApiKey}
                            className="px-3 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 border-l border-gray-300 dark:border-gray-600"
                          >
                            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4 flex items-center">
                    <Bell className="w-5 h-5 mr-2" />
                    Notifications & Updates
                  </h3>

                  <div className="space-y-3">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={settings.enableNotifications}
                        onChange={(e) => handleChange('enableNotifications', e.target.checked)}
                        className="rounded border-gray-300 text-primary-600 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600"
                      />
                      <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Enable notifications</span>
                    </label>

                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={settings.enableAutoUpdates}
                        onChange={(e) => handleChange('enableAutoUpdates', e.target.checked)}
                        className="rounded border-gray-300 text-primary-600 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600"
                      />
                      <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Enable automatic updates</span>
                    </label>

                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={settings.enableTelemetry}
                        onChange={(e) => handleChange('enableTelemetry', e.target.checked)}
                        className="rounded border-gray-300 text-primary-600 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600"
                      />
                      <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Enable anonymous usage statistics</span>
                    </label>
                  </div>
                </div>
              </>
            )}

            {activeTab === 'model' && (
              <>
                <div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4 flex items-center">
                    <Cpu className="w-5 h-5 mr-2" />
                    Model Parameters
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Default Model
                      </label>
                      <input
                        type="text"
                        value={settings.model}
                        onChange={(e) => handleChange('model', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        placeholder="llama2"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Max Tokens
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="32768"
                        value={settings.maxTokens}
                        onChange={(e) => handleChange('maxTokens', parseInt(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Temperature
                        <span className="text-xs text-gray-500 ml-1">({settings.temperature})</span>
                      </label>
                      <input
                        type="range"
                        min="0"
                        max="2"
                        step="0.1"
                        value={settings.temperature}
                        onChange={(e) => handleChange('temperature', parseFloat(e.target.value))}
                        className="w-full"
                      />
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>Deterministic</span>
                        <span>Creative</span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Top P
                        <span className="text-xs text-gray-500 ml-1">({settings.topP})</span>
                      </label>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.05"
                        value={settings.topP}
                        onChange={(e) => handleChange('topP', parseFloat(e.target.value))}
                        className="w-full"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Top K
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={settings.topK}
                        onChange={(e) => handleChange('topK', parseInt(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Repeat Penalty
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="2"
                        step="0.1"
                        value={settings.repeatPenalty}
                        onChange={(e) => handleChange('repeatPenalty', parseFloat(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4 flex items-center">
                    <MessageSquare className="w-5 h-5 mr-2" />
                    System Prompt
                  </h3>

                  <textarea
                    value={settings.systemPrompt}
                    onChange={(e) => handleChange('systemPrompt', e.target.value)}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    placeholder="You are a helpful assistant..."
                  />
                </div>
              </>
            )}

            {activeTab === 'appearance' && (
              <>
                <div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4 flex items-center">
                    <Palette className="w-5 h-5 mr-2" />
                    Theme & Appearance
                  </h3>

                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Theme
                    </label>
                    <div className="flex space-x-2">
                      {[
                        { value: 'light', icon: Sun, label: 'Light' },
                        { value: 'dark', icon: Moon, label: 'Dark' },
                        { value: 'system', icon: Monitor, label: 'System' }
                      ].map((theme) => (
                        <button
                          key={theme.value}
                          onClick={() => handleChange('theme', theme.value)}
                          className={`flex flex-col items-center p-3 rounded-lg border flex-1 ${settings.theme === theme.value
                            ? 'border-primary-500 bg-primary-50 text-primary-700 dark:bg-primary-900/20 dark:border-primary-400 dark:text-primary-300'
                            : 'border-gray-300 text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700'
                            }`}
                        >
                          <theme.icon className="w-5 h-5 mb-1" />
                          <span className="text-xs">{theme.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Font Size
                      </label>
                      <select
                        value={settings.fontSize}
                        onChange={(e) => handleChange('fontSize', parseInt(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      >
                        {[12, 14, 16, 18, 20].map(size => (
                          <option key={size} value={size}>{size}px</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        UI Scale
                      </label>
                      <select
                        value={settings.uiScale}
                        onChange={(e) => handleChange('uiScale', parseInt(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      >
                        {[80, 90, 100, 110, 120].map(scale => (
                          <option key={scale} value={scale}>{scale}%</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Animation Speed
                      </label>
                      <select
                        value={settings.animationSpeed}
                        onChange={(e) => handleChange('animationSpeed', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      >
                        <option value="slow">Slow</option>
                        <option value="normal">Normal</option>
                        <option value="fast">Fast</option>
                        <option value="none">None</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4 flex items-center">
                    <Code className="w-5 h-5 mr-2" />
                    Editor Settings
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={settings.enableSyntaxHighlighting}
                        onChange={(e) => handleChange('enableSyntaxHighlighting', e.target.checked)}
                        className="rounded border-gray-300 text-primary-600 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600"
                      />
                      <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Syntax highlighting</span>
                    </label>

                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={settings.enableLineNumbers}
                        onChange={(e) => handleChange('enableLineNumbers', e.target.checked)}
                        className="rounded border-gray-300 text-primary-600 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600"
                      />
                      <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Line numbers</span>
                    </label>

                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={settings.enableWordWrap}
                        onChange={(e) => handleChange('enableWordWrap', e.target.checked)}
                        className="rounded border-gray-300 text-primary-600 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600"
                      />
                      <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Word wrap</span>
                    </label>

                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={settings.enableSpellCheck}
                        onChange={(e) => handleChange('enableSpellCheck', e.target.checked)}
                        className="rounded border-gray-300 text-primary-600 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600"
                      />
                      <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Spell check</span>
                    </label>
                  </div>
                </div>
              </>
            )}

            {activeTab === 'privacy' && (
              <>
                <div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4 flex items-center">
                    <Shield className="w-5 h-5 mr-2" />
                    Privacy & Security
                  </h3>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Privacy Level
                      </label>
                      <select
                        value={settings.privacyLevel}
                        onChange={(e) => handleChange('privacyLevel', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      >
                        <option value="minimal">Minimal (Recommended)</option>
                        <option value="standard">Standard</option>
                        <option value="strict">Strict</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Data Retention
                      </label>
                      <select
                        value={settings.dataRetention}
                        onChange={(e) => handleChange('dataRetention', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      >
                        <option value="7days">7 days</option>
                        <option value="30days">30 days</option>
                        <option value="90days">90 days</option>
                        <option value="1year">1 year</option>
                        <option value="forever">Forever</option>
                      </select>
                    </div>

                    <div className="space-y-3">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={settings.enableModeration}
                          onChange={(e) => handleChange('enableModeration', e.target.checked)}
                          className="rounded border-gray-300 text-primary-600 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600"
                        />
                        <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Enable content moderation</span>
                      </label>

                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={settings.enableContentFilter}
                          onChange={(e) => handleChange('enableContentFilter', e.target.checked)}
                          className="rounded border-gray-300 text-primary-600 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600"
                        />
                        <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Enable content filtering</span>
                      </label>

                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={settings.enableRateLimiting}
                          onChange={(e) => handleChange('enableRateLimiting', e.target.checked)}
                          className="rounded border-gray-300 text-primary-600 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600"
                        />
                        <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Enable rate limiting</span>
                      </label>
                    </div>
                  </div>
                </div>
              </>
            )}

            {activeTab === 'advanced' && (
              <>
                <div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4 flex items-center">
                    <Zap className="w-5 h-5 mr-2" />
                    Advanced Features
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={settings.enableStreaming}
                        onChange={(e) => handleChange('enableStreaming', e.target.checked)}
                        className="rounded border-gray-300 text-primary-600 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600"
                      />
                      <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Enable streaming responses</span>
                    </label>

                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={settings.enableMemory}
                        onChange={(e) => handleChange('enableMemory', e.target.checked)}
                        className="rounded border-gray-300 text-primary-600 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600"
                      />
                      <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Enable conversation memory</span>
                    </label>

                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={settings.enableSearch}
                        onChange={(e) => handleChange('enableSearch', e.target.checked)}
                        className="rounded border-gray-300 text-primary-600 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600"
                      />
                      <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Enable web search</span>
                    </label>

                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={settings.enableFileUpload}
                        onChange={(e) => handleChange('enableFileUpload', e.target.checked)}
                        className="rounded border-gray-300 text-primary-600 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600"
                      />
                      <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Enable file upload</span>
                    </label>

                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={settings.enableCodeExecution}
                        onChange={(e) => handleChange('enableCodeExecution', e.target.checked)}
                        className="rounded border-gray-300 text-primary-600 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600"
                      />
                      <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Enable code execution</span>
                    </label>

                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={settings.enableExperimentalFeatures}
                        onChange={(e) => handleChange('enableExperimentalFeatures', e.target.checked)}
                        className="rounded border-gray-300 text-primary-600 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600"
                      />
                      <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Enable experimental features</span>
                    </label>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4 flex items-center">
                    <Network className="w-5 h-5 mr-2" />
                    Network & Performance
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Request Timeout (seconds)
                      </label>
                      <input
                        type="number"
                        min="30"
                        max="600"
                        value={settings.timeout}
                        onChange={(e) => handleChange('timeout', parseInt(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Max Context Length
                      </label>
                      <input
                        type="number"
                        min="512"
                        max="32768"
                        value={settings.maxContextLength}
                        onChange={(e) => handleChange('maxContextLength', parseInt(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      />
                    </div>
                  </div>
                </div>
              </>
            )}

            {activeTab === 'data' && (
              <>
                <div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4 flex items-center">
                    <Database className="w-5 h-5 mr-2" />
                    Data Management
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Backup Frequency
                      </label>
                      <select
                        value={settings.backupFrequency}
                        onChange={(e) => handleChange('backupFrequency', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      >
                        <option value="daily">Daily</option>
                        <option value="weekly">Weekly</option>
                        <option value="monthly">Monthly</option>
                        <option value="never">Never</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Export Format
                      </label>
                      <select
                        value={settings.exportFormat}
                        onChange={(e) => handleChange('exportFormat', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      >
                        <option value="json">JSON</option>
                        <option value="csv">CSV</option>
                        <option value="txt">Text</option>
                        <option value="markdown">Markdown</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={settings.enableLocalStorage}
                        onChange={(e) => handleChange('enableLocalStorage', e.target.checked)}
                        className="rounded border-gray-300 text-primary-600 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600"
                      />
                      <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Use local storage</span>
                    </label>

                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={settings.enableIndexedDB}
                        onChange={(e) => handleChange('enableIndexedDB', e.target.checked)}
                        className="rounded border-gray-300 text-primary-600 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600"
                      />
                      <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Use IndexedDB for large data</span>
                    </label>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4 flex items-center">
                    <Download className="w-5 h-5 mr-2" />
                    Import & Export
                  </h3>

                  <div className="flex space-x-3">
                    <button
                      onClick={handleExport}
                      className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Export Settings
                    </button>

                    <label className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 cursor-pointer">
                      <Upload className="w-4 h-4 mr-2" />
                      Import Settings
                      <input
                        type="file"
                        accept=".json"
                        onChange={handleImport}
                        className="hidden"
                      />
                    </label>

                    <button
                      onClick={handleReset}
                      className="flex items-center px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Reset to Defaults
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="flex justify-between p-4 border-t dark:border-gray-700">
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Settings apply immediately
          </div>
          <div className="flex space-x-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <Save className="w-4 h-4 mr-2" />
              Save Settings
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};