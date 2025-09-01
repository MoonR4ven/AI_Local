import { useState, useEffect } from 'react';
import { Chat, ModelInfo } from '../types';
import { storage } from '../utils/storage';
import { ollamaApi } from '../utils/ollamaApi';
import { NewChatButton } from './NewChatButton';
import { SettingsPanel } from './SettingsPanel';
import { ModelDownload } from './ModelDownload';
import { 
  MessageSquare, 
  Trash2, 
  Settings, 
  ChevronDown, 
  ChevronRight, 
  Download,
  Cpu,
  RefreshCw
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  chats: Chat[];
  currentChat: Chat | null;
  onSelectChat: (chat: Chat) => void;
  onNewChat: () => void;
  onDeleteChat: (chatId: string) => void;
  onModelSelect: (modelName: string) => void;
  selectedModel: string | null;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  chats,
  currentChat,
  onSelectChat,
  onNewChat,
  onDeleteChat,
  onModelSelect,
  selectedModel
}) => {
  const [models, setModels] = useState<ModelInfo[]>([]);
  const [ollamaModels, setOllamaModels] = useState<any[]>([]);
  const [showModels, setShowModels] = useState(false);
  const [showChats, setShowChats] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [showModelDownload, setShowModelDownload] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Initialize sample models if none exist
    storage.initSampleModels();
    setModels(storage.getModels());
    
    // Apply saved theme settings
    const settings = storage.getSettings();
    if (settings.theme === 'dark' || 
        (settings.theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      document.documentElement.classList.add('dark');
    }

    // Load Ollama models
    loadOllamaModels();
  }, []);

  const loadOllamaModels = async () => {
    try {
      setLoading(true);
      const installedModels = await ollamaApi.listModels();
      setOllamaModels(installedModels);
    } catch (error) {
      console.error('Failed to load Ollama models:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(date));
  };

  const getChatTitle = (chat: Chat) => {
    if (chat.title) return chat.title;
    if (chat.messages.length > 0) {
      const firstMessage = chat.messages[0].content;
      return firstMessage.length > 30 
        ? firstMessage.substring(0, 30) + '...' 
        : firstMessage;
    }
    return 'New Chat';
  };

  const handleModelDownloaded = () => {
    setModels(storage.getModels());
    loadOllamaModels(); // Refresh the list of installed models
  };

  const formatModelSize = (size: number) => {
    const GB = size / 1e9;
    return `${GB.toFixed(1)} GB`;
  };

  return (
    <>
      <div className={`
        fixed lg:static inset-y-0 left-0 z-30
        w-80 bg-gray-50 dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800
        transform transition-transform duration-300 ease-in-out
        flex flex-col
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Header */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-800">
          <NewChatButton onClick={onNewChat} />
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto">
          {/* Chats section */}
          <div className="p-4">
            <button
              onClick={() => setShowChats(!showChats)}
              className="flex items-center justify-between w-full mb-2 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
            >
              <h2 className="font-semibold text-lg">Chats</h2>
              {showChats ? (
                <ChevronDown className="w-5 h-5" />
              ) : (
                <ChevronRight className="w-5 h-5" />
              )}
            </button>

            {showChats && (
              <div className="space-y-1">
                {chats.length === 0 ? (
                  <p className="text-gray-500 dark:text-gray-400 text-sm p-2">No chats yet</p>
                ) : (
                  chats.map((chat) => (
                    <div
                      key={chat.id}
                      className={`group flex items-center justify-between p-2 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 ${
                        currentChat?.id === chat.id 
                          ? 'bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800' 
                          : ''
                      }`}
                    >
                      <div
                        className="flex items-center gap-2 flex-1 min-w-0"
                        onClick={() => onSelectChat(chat)}
                      >
                        <MessageSquare className="w-4 h-4 text-gray-500 dark:text-gray-400 flex-shrink-0" />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                            {getChatTitle(chat)}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {formatDate(chat.updatedAt)}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteChat(chat.id);
                        }}
                        className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-500 transition-opacity"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Models section */}
          <div className="p-4 border-t border-gray-200 dark:border-gray-800">
            <div className="flex items-center justify-between w-full mb-2">
              <button
                onClick={() => setShowModels(!showModels)}
                className="flex items-center justify-between flex-1 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
              >
                <h2 className="font-semibold text-lg">Models</h2>
                {showModels ? (
                  <ChevronDown className="w-5 h-5" />
                ) : (
                  <ChevronRight className="w-5 h-5" />
                )}
              </button>
              <button
                onClick={loadOllamaModels}
                disabled={loading}
                className="ml-2 p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 disabled:opacity-50"
                title="Refresh models"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>

            {showModels && (
              <div className="space-y-2">
                {ollamaModels.length === 0 ? (
                  <p className="text-gray-500 dark:text-gray-400 text-sm p-2">
                    {loading ? 'Loading models...' : 'No models installed. Download some models to get started.'}
                  </p>
                ) : (
                  ollamaModels.map((model) => (
                    <div
                      key={model.name}
                      onClick={() => onModelSelect(model.name)}
                      className={`p-3 rounded-lg cursor-pointer border transition-colors ${
                        selectedModel === model.name
                          ? 'bg-primary-50 dark:bg-primary-900/20 border-primary-200 dark:border-primary-700'
                          : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-750'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <Cpu className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                        <h3 className="font-medium text-sm text-gray-900 dark:text-white">{model.name}</h3>
                      </div>
                      <div className="flex justify-between items-center text-xs text-gray-500 dark:text-gray-400">
                        <span>{formatModelSize(model.size)}</span>
                        <span>{new Date(model.modified_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  ))
                )}
                
                <button 
                  onClick={() => setShowModelDownload(true)}
                  className="flex items-center gap-2 w-full p-2 text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 hover:bg-primary-50 dark:hover:bg-primary-900/30 rounded-lg transition-colors"
                >
                  <Download className="w-4 h-4" />
                  <span>Download more models</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-800">
          <button 
            onClick={() => setShowSettings(true)}
            className="flex items-center gap-2 w-full p-2 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            <Settings className="w-5 h-5" />
            <span className="font-medium">Settings</span>
          </button>
        </div>
      </div>

      {/* Settings Panel */}
      <SettingsPanel 
        isOpen={showSettings} 
        onClose={() => setShowSettings(false)} 
      />

      {/* Model Download Panel */}
      <ModelDownload 
        isOpen={showModelDownload} 
        onClose={() => setShowModelDownload(false)}
        onModelDownloaded={handleModelDownloaded}
      />
    </>
  );
};