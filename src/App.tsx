import { useState, useEffect } from 'react';
import { Chat, ModelInfo } from './types';
import { storage } from './utils/storage';
import { Sidebar } from './components/Sidebar';
import { Chat as ChatComponent } from './components/Chat';
import { Menu, MessageSquare } from 'lucide-react';
import { useOllama } from './hooks/useOllama';

function App() {
  const [chats, setChats] = useState<Chat[]>([]);
  const [currentChat, setCurrentChat] = useState<Chat | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedModel, setSelectedModel] = useState<string | null>(null);
  const [models, setModels] = useState<ModelInfo[]>([]);

 

  // Apply theme settings
  useEffect(() => {
    const applyTheme = () => {
      const settings = storage.getSettings();
      const darkMode = settings.theme === 'dark' ||
        (settings.theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
      document.documentElement.classList.toggle('dark', darkMode);
    };

    applyTheme();

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    mediaQuery.addEventListener('change', applyTheme);
    return () => mediaQuery.removeEventListener('change', applyTheme);
  }, []);

  // Load chats and models from storage on mount
  useEffect(() => {
    const savedChats = storage.getChats();
    setChats(savedChats);

    const currentChatId = storage.getCurrentChatId();
    if (currentChatId) {
      const chat = savedChats.find(c => c.id === currentChatId);
      if (chat) setCurrentChat(chat);
    }

    storage.initSampleModels();
    const savedModels = storage.getModels();
    setModels(savedModels);

    if (savedModels.length > 0 && !selectedModel) {
      setSelectedModel(savedModels[0].name);
    }
  }, []);

  // Save chats whenever they change
  useEffect(() => {
    storage.saveChats(chats);
  }, [chats]);

  const createNewChat = () => {
    const newChat: Chat = {
      id: Date.now().toString(),
      title: 'New Chat',
      messages: [],
      model: selectedModel || models[0]?.name || '',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    setChats(prev => [newChat, ...prev]);
    setCurrentChat(newChat);
    storage.setCurrentChatId(newChat.id);
    setSidebarOpen(false);
  };

  const handleModelSelect = (modelName: string) => {
    setSelectedModel(modelName);

    if (currentChat) {
      const updatedChat = { ...currentChat, model: modelName };
      setCurrentChat(updatedChat);
      updateChat(updatedChat);
    }
  };

  const selectChat = (chat: Chat) => {
    setCurrentChat(chat);
    setSelectedModel(chat.model);
    storage.setCurrentChatId(chat.id);
    setSidebarOpen(false);
  };

  const deleteChat = (chatId: string) => {
    setChats(prev => {
      const filtered = prev.filter(chat => chat.id !== chatId);
      if (currentChat?.id === chatId) {
        const nextChat = filtered[0] || null;
        setCurrentChat(nextChat);
        setSelectedModel(nextChat?.model || null);
        storage.setCurrentChatId(nextChat?.id || null);
      }
      return filtered;
    });
  };

  const updateChat = (updatedChat: Chat) => {
    setChats(prev => prev.map(chat => chat.id === updatedChat.id ? updatedChat : chat));
    if (currentChat?.id === updatedChat.id) {
      setCurrentChat(updatedChat);
    }
  };

  const handleModelDownloaded = () => {
    const updatedModels = storage.getModels();
    setModels(updatedModels);

    if (!selectedModel && updatedModels.length > 0) {
      setSelectedModel(updatedModels[0].name);
    }
  };

  return (
    <div className="h-screen bg-gray-100 dark:bg-gray-900 flex">
      <Sidebar
        isOpen={sidebarOpen}
        chats={chats}
        currentChat={currentChat}
        onSelectChat={selectChat}
        onNewChat={createNewChat}
        onDeleteChat={deleteChat}
        onModelSelect={handleModelSelect}
        selectedModel={selectedModel}
        onModelDownloaded={handleModelDownloaded}
      />

      <div className="flex-1 flex flex-col lg:ml-0">
        <div className="lg:hidden p-4 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <Menu className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1">
          {currentChat ? (
            <ChatComponent
              chat={currentChat}
              onUpdateChat={updateChat}
              selectedModel={selectedModel}
            />
          ) : (
            <div className="h-full flex items-center justify-center">
              <div className="text-center p-8 max-w-md mx-auto">
                <div className="w-16 h-16 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                  <MessageSquare className="w-8 h-8 text-primary-600 dark:text-primary-400" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  Welcome to Ollama Chat
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  Start a new conversation with your local AI assistant or continue an existing one.
                </p>
                <button
                  onClick={createNewChat}
                  className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium"
                >
                  Start New Chat
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}

export default App;
