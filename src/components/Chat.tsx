import { useState, useRef, useEffect, useCallback } from 'react';
import { Chat as ChatType, Message as MessageType, ChatFile } from '../types/index';
import { useOllama } from '../hooks/useOllama';
import { useWebSearch } from '../hooks/useWebSearch';
import { Message } from './Message';
import { FileUpload } from '../utils/fileUploads';
import { Send, Loader2, AlertCircle, Search, Paperclip, FileText } from 'lucide-react';
import { getSystemMessage, formatProductSummary, extractKeyInfo } from '../utils/assistantPrompt';
import { storage } from '../utils/storage';

interface ChatProps {
  chat: ChatType;
  onUpdateChat: (chat: ChatType) => void;
  selectedModel: string | null;
}

export const Chat: React.FC<ChatProps> = ({ chat, onUpdateChat, selectedModel }) => {
  const [input, setInput] = useState('');
  const [showFileUpload, setShowFileUpload] = useState(false);
  const { sendMessage, isLoading, error } = useOllama();
  const { searchContext, clearSearch, isSearching } = useWebSearch();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const pendingMessageRef = useRef<MessageType | null>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [chat.messages, scrollToBottom]);

  useEffect(() => {
    inputRef.current?.focus();
  }, [chat.messages, isLoading, isSearching]);

  const updatePendingMessage = useCallback(
    (content: string) => {
      if (pendingMessageRef.current) {
        console.log('Updating pending message with content:', content); // Debug log
        onUpdateChat((prevChat: ChatType) => {
          const updatedMessages = prevChat.messages.map((msg) =>
            msg.id === pendingMessageRef.current!.id ? { ...msg, content } : msg
          );
          console.log('Updated messages:', updatedMessages); // Debug log
          return { ...prevChat, messages: updatedMessages, updatedAt: new Date() };
        });
        scrollToBottom();
      } else {
        console.warn('No pending message to update'); // Debug log
      }
    },
    [onUpdateChat, scrollToBottom]
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading || !selectedModel) return;

    const userMessage: MessageType = {
      id: Date.now().toString(),
      content: input.trim(),
      role: 'user',
      timestamp: new Date(),
      fileReferences: chat.files?.length ? chat.files.map((f) => f.id) : undefined,
    };

    const updatedChat: ChatType = {
      ...chat,
      messages: [...chat.messages, userMessage],
      updatedAt: new Date(),
      files: chat.files || [],
    };

    if (!chat.title && chat.messages.length === 0) {
      updatedChat.title = input.trim().length > 30 ? input.trim().substring(0, 30) + '...' : input.trim();
    }

    console.log('Updating chat with user message:', userMessage);
    onUpdateChat(updatedChat);
    setInput('');

    try {
      const fileContext = chat.files?.length
        ? `Context from uploaded files:\n${chat.files
            .map((f) => `File: ${f.name}\nContent: ${f.content.substring(0, 2000)}${f.content.length > 2000 ? '...' : ''}`)
            .join('\n\n')}`
        : '';

      let productSummary = '';
      let sampleSection = '';
      try {
        const [catalogRes, productsRes] = await Promise.all([
          fetch('http://localhost:5000/api/catalog', { cache: 'no-store' }),
          fetch('http://localhost:5000/api/products', { cache: 'no-store' }),
        ]);

        if (!catalogRes.ok) throw new Error(`Catalog fetch failed: ${catalogRes.status}`);
        if (!productsRes.ok) throw new Error(`Products fetch failed: ${productsRes.status}`);

        const catalogData = await catalogRes.json();
        const productsData = await productsRes.json();
        productSummary = formatProductSummary(productsData);
        sampleSection = extractKeyInfo(catalogData.content);
        storage.saveMemoryFiles({ catalog: catalogData.content, products: productsData });
        console.log('Fetched catalog and products:', { catalogData, productsData });
      } catch (err) {
        console.error('Failed to fetch memory files:', err);
        const errorMessage: MessageType = {
          id: (Date.now() + 2).toString(),
          content: '⚠️ Warning: Could not load product data. Using cached data if available.',
          role: 'system',
          timestamp: new Date(),
        };
        onUpdateChat((prevChat: ChatType) => ({
          ...prevChat,
          messages: [...prevChat.messages, errorMessage],
          updatedAt: new Date(),
        }));
        const cachedFiles = storage.getMemoryFiles();
        if (cachedFiles.catalog) sampleSection = extractKeyInfo(cachedFiles.catalog);
        if (cachedFiles.products) productSummary = formatProductSummary(cachedFiles.products);
      }

      const fullPrompt = `${fileContext}\n\nBased on the above context, please answer the following question:\n${input.trim()}`;

      const messagesWithSystem = [
        getSystemMessage(productSummary, sampleSection),
        ...updatedChat.messages.slice(0, -1),
        { ...userMessage, content: fullPrompt },
      ];

      const assistantId = (Date.now() + 1).toString();
      pendingMessageRef.current = {
        id: assistantId,
        content: '',
        role: 'assistant',
        timestamp: new Date(),
      };

      console.log('Adding pending assistant message:', pendingMessageRef.current);
      onUpdateChat((prevChat: ChatType) => ({
        ...prevChat,
        messages: [...prevChat.messages, pendingMessageRef.current!],
        updatedAt: new Date(),
      }));

      const response = await sendMessage(messagesWithSystem, selectedModel);
      console.log('Received assistant response:', response);
      updatePendingMessage(response);

      try {
        const jsonMatch = response.match(/```json\n([\s\S]*?)\n```/s);
        if (!jsonMatch) {
          console.log('No CRUD action found in response');
          return;
        }

        const actionData = JSON.parse(jsonMatch[1]);
        console.log('Parsed CRUD action:', actionData);

        let payload: any;
        if (actionData.target === 'products') {
          payload =
            actionData.action === 'delete'
              ? { productName: actionData.data.name || actionData.data.productName }
              : actionData.data;
        } else if (actionData.target === 'catalog') {
          payload =
            actionData.action === 'delete'
              ? { productName: actionData.data.productName }
              : actionData.data;
        }

        const crudPayload = {
          action: actionData.action,
          target: actionData.target,
          data: payload,
        };

        const res = await fetch('http://localhost:5000/api/crud', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(crudPayload),
        });

        if (!res.ok) throw new Error(`CRUD operation failed: ${res.status}`);
        const result = await res.json();
        console.log('CRUD operation result:', result);

        const feedbackMessage: MessageType = {
          id: (Date.now() + 2).toString(),
          content: result.success
            ? `✅ Operation successful: ${actionData.action} on ${actionData.target}.`
            : `❌ Error: ${result.error || 'Unknown error'}`,
          role: 'system',
          timestamp: new Date(),
        };

        onUpdateChat((prevChat) => ({
          ...prevChat,
          messages: [...prevChat.messages, feedbackMessage],
          updatedAt: new Date(),
        }));

        if (result.success) {
          try {
            const [catalogRes, productsRes] = await Promise.all([
              fetch('http://localhost:5000/api/catalog', { cache: 'no-store' }),
              fetch('http://localhost:5000/api/products', { cache: 'no-store' }),
            ]);

            if (catalogRes.ok && productsRes.ok) {
              const catalogData = await catalogRes.json();
              const productsData = await productsRes.json();

              storage.saveMemoryFiles({ catalog: catalogData.content, products: productsData });

              const newSystemMessage = getSystemMessage(
                formatProductSummary(productsData),
                extractKeyInfo(catalogData.content)
              );

              onUpdateChat((prevChat) => ({
                ...prevChat,
                messages: prevChat.messages.map((msg, index) =>
                  index === 0 && msg.role === 'system' ? newSystemMessage : msg
                ),
                updatedAt: new Date(),
              }));
            }
          } catch (refreshErr) {
            console.error('Failed to refresh product data:', refreshErr);
          }
        }
      } catch (err) {
        console.error('CRUD operation error:', err);
        const errorMessage: MessageType = {
          id: (Date.now() + 2).toString(),
          content: '❌ Failed to process CRUD action. Please check the backend.',
          role: 'system',
          timestamp: new Date(),
        };

        onUpdateChat((prevChat) => ({
          ...prevChat,
          messages: [...prevChat.messages, errorMessage],
          updatedAt: new Date(),
        }));
      }
    } catch (err) {
      console.error('Message submission error:', err);
      const errorMessage: MessageType = {
        id: (Date.now() + 2).toString(),
        content: '❌ Failed to process message. Please try again.',
        role: 'system',
        timestamp: new Date(),
      };
      onUpdateChat((prevChat) => ({
        ...prevChat,
        messages: [...prevChat.messages, errorMessage],
        updatedAt: new Date(),
      }));
    } finally {
      pendingMessageRef.current = null;
    }
  };
  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-gray-900 dark:text-white">{chat.title || 'New Chat'}</h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {selectedModel ? `Using ${selectedModel} model` : 'No model selected'} • {chat.messages.length} messages
              {(chat.files?.length || 0) > 0 && ` • ${chat.files.length} file${chat.files.length !== 1 ? 's' : ''}`}
            </p>
          </div>
          <button
            onClick={() => setShowFileUpload(!showFileUpload)}
            className={`p-2 rounded-lg transition-colors ${
              showFileUpload
                ? 'bg-primary-100 text-primary-600 dark:bg-primary-900 dark:text-primary-400'
                : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
            }`}
            title="Attach files"
          >
            <Paperclip className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* File upload section */}
      {showFileUpload && (
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4">
          <FileUpload
            onFilesUpload={handleFilesUpload}
            existingFiles={chat.files || []}
            onFileRemove={handleFileRemove}
          />
        </div>
      )}

      {/* File attachments indicator */}
      {(chat.files?.length || 0) > 0 && !showFileUpload && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border-b border-blue-200 dark:border-blue-800 p-3">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span className="text-sm text-blue-700 dark:text-blue-300">
              {chat.files.length} file{chat.files.length !== 1 ? 's' : ''} attached to this chat
            </span>
            <button
              onClick={() => setShowFileUpload(true)}
              className="ml-2 text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200"
            >
              Manage
            </button>
          </div>
        </div>
      )}

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
            {selectedModel && (
              <button
                onClick={() => setShowFileUpload(true)}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
              >
                <Paperclip className="w-4 h-4 mr-2 inline" />
                Attach Files
              </button>
            )}
          </div>
        ) : (
          chat.messages.map((msg) => (
            <Message
              key={msg.id}
              message={msg}
             
            />
          ))
        )}

        {/* Search results */}
        {searchContext?.results?.length > 0 && (
          <div className="bg-blue-50 dark:bg-blue-900/20 border-t border-blue-200 dark:border-blue-800 p-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-medium text-blue-800 dark:text-blue-200 flex items-center">
                <Search className="w-4 h-4 mr-2" /> Web Search Results for "{searchContext.query}"
              </h4>
              <button
                onClick={clearSearch}
                className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200 text-sm"
              >
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
          <p className="text-sm text-red-700 dark:text-red-300 mt-1">
            Make sure Ollama is running at http://localhost:11434 and the backend is running at http://localhost:5000
          </p>
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
            placeholder={selectedModel ? 'Type your message...' : 'Select a model to start chatting'}
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