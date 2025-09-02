import { Message as MessageType } from '../types/index';
import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ChevronDown } from 'lucide-react';

interface MessageProps {
  message: MessageType;
  streamedContent?: string; // Incremental AI content
}

export const Message: React.FC<MessageProps> = ({ message, streamedContent }) => {
  const timestamp = typeof message.timestamp === 'string'
    ? new Date(message.timestamp)
    : message.timestamp;

  // Detect <think> block
  const thinkMatch = message.content.match(/<think>([\s\S]*?)<\/think>/i);
  const hasThink = Boolean(thinkMatch);
  const initialThinkContent = thinkMatch ? thinkMatch[1].trim() : '';
  const initialNormalContent = hasThink
    ? message.content.replace(/<think>[\s\S]*?<\/think>/i, '').trim()
    : message.content;

  const [collapsed, setCollapsed] = useState(true);
  const [normalContent, setNormalContent] = useState(initialNormalContent);
  const [thinkContent, setThinkContent] = useState(initialThinkContent);

  // Append incoming streamed chunks
  useEffect(() => {
    if (!streamedContent) return;

    // Check if streamed chunk is inside <think> block
    const thinkTagIndex = streamedContent.indexOf('<think>');
    if (thinkTagIndex !== -1) {
      // Split new content into before/after <think>
      const beforeThink = streamedContent.substring(0, thinkTagIndex);
      const insideThink = streamedContent.substring(thinkTagIndex).replace(/<\/?think>/g, '');

      setNormalContent(prev => prev + beforeThink);
      setThinkContent(prev => prev + insideThink);
    } else {
      // Append all to normal content
      setNormalContent(prev => prev + streamedContent);
    }
  }, [streamedContent]);

  return (
    <div className={`flex gap-4 p-6 ${message.role === 'user' ? 'bg-white dark:bg-gray-800' : 'bg-gray-50 dark:bg-gray-900'} transition-colors duration-200`}>
      <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
        message.role === 'user' 
          ? 'bg-blue-100 dark:bg-blue-900/30' 
          : 'bg-purple-100 dark:bg-purple-900/30'
      } transition-colors duration-200`}>
        {message.role === 'user' ? (
          <span className="text-blue-600 dark:text-blue-400 font-medium">U</span>
        ) : (
          <span className="text-purple-600 dark:text-purple-400 font-medium">AI</span>
        )}
      </div>

      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-medium text-gray-900 dark:text-white transition-colors duration-200">
            {message.role === 'user' ? 'You' : 'Assistant'}
          </span>
          <span className="text-xs text-gray-500 dark:text-gray-400 transition-colors duration-200">
            {timestamp.toLocaleTimeString()}
          </span>
        </div>

        {/* Normal content */}
        <div className="text-gray-800 dark:text-gray-200 transition-colors duration-200 prose prose-sm dark:prose-invert max-w-none mb-2">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {normalContent}
          </ReactMarkdown>
        </div>

        {/* Collapsible think block */}
        {hasThink && (
          <div className="text-gray-800 dark:text-gray-200 transition-colors duration-200 prose prose-sm dark:prose-invert max-w-none">
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="flex items-center gap-2 mb-2 px-3 py-1 bg-gray-200 dark:bg-gray-700 rounded-md text-gray-800 dark:text-gray-200 font-medium hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
            >
              <ChevronDown className={`w-4 h-4 transition-transform ${collapsed ? 'rotate-0' : 'rotate-180'}`} />
              {collapsed ? 'Thinking...' : 'Hide Thought'}
            </button>

            {!collapsed && (
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {thinkContent}
              </ReactMarkdown>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
