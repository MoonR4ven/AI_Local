import { useState, useRef, useEffect } from 'react';
import { Chat as ChatType, Message as MessageType } from '../types';
import { useOllama } from '../hooks/useOllama';
import { useWebSearch } from '../hooks/useWebSearch';
import { Message } from './Message';
import { Send, Loader2, AlertCircle, Search } from 'lucide-react';

interface ChatProps {
  chat: ChatType;
  onUpdateChat: (chat: ChatType) => void;
  selectedModel: string | null;
}

export const Chat: React.FC<ChatProps> = ({ chat, onUpdateChat, selectedModel }) => {
  const [input, setInput] = useState('');
  const { sendMessage, isLoading, error } = useOllama();
  const { searchContext, clearSearch, isSearching } = useWebSearch();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });

  useEffect(() => { scrollToBottom(); }, [chat.messages]);

  useEffect(() => { inputRef.current?.focus(); }, [chat.messages, isLoading, isSearching]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading || !selectedModel) return;

    const userMessage: MessageType = {
      id: Date.now().toString(),
      content: input.trim(),
      role: 'user',
      timestamp: new Date(),
    };

    const updatedChat: ChatType = {
      ...chat,
      messages: [...chat.messages, userMessage],
      updatedAt: new Date(),
    };

    if (!chat.title && chat.messages.length === 0) {
      updatedChat.title = input.trim().length > 30 ? input.trim().substring(0, 30) + '...' : input.trim();
    }

    onUpdateChat(updatedChat);
    setInput('');

    try {
      const response = await sendMessage(updatedChat.messages, selectedModel);
      if (!response) return;

      const assistantMessage: MessageType = {
        id: (Date.now() + 1).toString(),
        content: response,
        role: 'assistant',
        timestamp: new Date(),
      };

      onUpdateChat({
        ...updatedChat,
        messages: [...updatedChat.messages, assistantMessage],
        updatedAt: new Date(),
      });
    } catch (err) {
      console.error('Failed to send message:', err);
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
        <h1 className="text-xl font-semibold text-gray-900 dark:text-white">{chat.title || 'New Chat'}</h1>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {selectedModel ? `Using ${selectedModel} model` : 'No model selected'} • {chat.messages.length} messages
        </p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto">
        {chat.messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-center p-8 max-w-md mx-auto">
            <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
              <Send className="w-8 h-8 text-gray-400 dark:text-gray-500" />
            </div>
            <p className="text-lg font-medium dark:text-gray-300">Start a conversation</p>
            <p className="mt-2 dark:text-gray-400">
              {selectedModel
                ? 'Type a message below to begin chatting with your local AI assistant.'
                : 'Please select a model from the sidebar to start chatting.'}
            </p>
          </div>
        ) : (
          chat.messages.map(msg => <Message key={msg.id} message={msg} />)
        )}

        {/* Search results */}
        {searchContext?.results?.length > 0 && (
          <div className="bg-blue-50 dark:bg-blue-900/20 border-t border-blue-200 dark:border-blue-800 p-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-medium text-blue-800 dark:text-blue-200 flex items-center">
                <Search className="w-4 h-4 mr-2" /> Web Search Results for "{searchContext.query}"
              </h4>
              <button onClick={clearSearch} className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200 text-sm">
                Clear
              </button>
            </div>
            <div className="space-y-2">
              {searchContext.results.slice(0, 3).map((result, i) => (
                <div key={i} className="text-sm text-blue-700 dark:text-blue-300">
                  <a href={result.link} target="_blank" rel="noopener noreferrer" className="font-medium hover:underline">
                    [{i + 1}] {result.title}
                  </a>
                  <p className="text-xs opacity-80">{result.snippet}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Loading indicators */}
        {isSearching && (
          <div className="flex gap-4 p-6 bg-blue-50 dark:bg-blue-900/20">
            <div className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center bg-blue-100 dark:bg-blue-900/30">
              <Search className="w-6 h-6 text-blue-600 dark:text-blue-400 animate-pulse" />
            </div>
            <span className="flex items-center gap-2 text-blue-700 dark:text-blue-300">Searching the web...</span>
          </div>
        )}
        {isLoading && !isSearching && (
          <div className="flex gap-4 p-6 bg-gray-50 dark:bg-gray-800">
            <div className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center bg-purple-100 dark:bg-purple-900/30">
              <Loader2 className="w-6 h-6 text-purple-600 dark:text-purple-400 animate-spin" />
            </div>
            <span className="flex items-center gap-2 text-gray-500 dark:text-gray-400">Ollama is thinking...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border-t border-red-200 dark:border-red-800 p-4">
          <div className="flex items-center gap-2 text-red-800 dark:text-red-200">
            <AlertCircle className="w-5 h-5" /> <span className="text-sm font-medium">Error: {error}</span>
          </div>
          <p className="text-sm text-red-700 dark:text-red-300 mt-1">Make sure Ollama is running at http://localhost:11434</p>
        </div>
      )}

      {/* Input */}
      <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-4">
        <div className="flex gap-3">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={selectedModel ? "Type your message..." : "Select a model to start chatting"}
            className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
            disabled={isLoading || !selectedModel}
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading || !selectedModel}
            className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
            <span>Send</span>
          </button>
        </div>
      </form>
    </div>
  );
};
