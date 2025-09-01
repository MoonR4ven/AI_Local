import { useState, useEffect } from 'react';
import { Chat, ModelInfo } from './types';
import { storage } from './utils/storage';
import { Sidebar } from './components/Sidebar';
import { Chat as ChatComponent } from './components/Chat';
import { Menu, MessageSquare } from 'lucide-react';
import { useWebSearch } from './hooks/useWebSearch';
import { useVoiceInput } from './hooks/useVoiceInput';
import { useVoiceOutput } from './hooks/useVoiceOutput';

// Change this to a regular function with export default
function App() {
  const [chats, setChats] = useState<Chat[]>([]);
  const [currentChat, setCurrentChat] = useState<Chat | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedModel, setSelectedModel] = useState<string | null>(null);
  const [models, setModels] = useState<ModelInfo[]>([]);

  // Apply theme settings
  useEffect(() => {
    const settings = storage.getSettings();
    if (settings.theme === 'dark' ||
      (settings.theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  // Load chats and models from storage on component mount
  useEffect(() => {
    const savedChats = storage.getChats();
    setChats(savedChats);

    const currentChatId = storage.getCurrentChatId();
    if (currentChatId) {
      const chat = savedChats.find(c => c.id === currentChatId);
      if (chat) setCurrentChat(chat);
    }

    // Initialize and load models
    storage.initSampleModels();
    const savedModels = storage.getModels();
    setModels(savedModels);

    // Set the first model as selected if none is selected
    if (savedModels.length > 0 && !selectedModel) {
      setSelectedModel(savedModels[0].name);
    }
  }, []);

  // Save chats to storage whenever they change
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

    // Update the current chat's model if there is one
    if (currentChat) {
      const updatedChat = {
        ...currentChat,
        model: modelName
      };
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
    setChats(prev => prev.filter(chat => chat.id !== chatId));

    if (currentChat?.id === chatId) {
      const nextChat = chats.find(chat => chat.id !== chatId);
      setCurrentChat(nextChat || null);
      if (nextChat) {
        setSelectedModel(nextChat.model);
      }
      storage.setCurrentChatId(nextChat?.id || null);
    }
  };

  const updateChat = (updatedChat: Chat) => {
    setChats(prev =>
      prev.map(chat => chat.id === updatedChat.id ? updatedChat : chat)
    );

    if (currentChat?.id === updatedChat.id) {
      setCurrentChat(updatedChat);
    }
  };

  const handleModelDownloaded = () => {
    // Refresh the models list when a new model is downloaded
    const updatedModels = storage.getModels();
    setModels(updatedModels);

    // If no model is selected, select the first one
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
        {/* Mobile header */}
        <div className="lg:hidden p-4 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <Menu className="w-6 h-6" />
          </button>
        </div>

        {/* Chat area */}
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

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}

// Make sure to export as default
export default App;