// components/Message.tsx
import { Message as MessageType } from '../types';

interface MessageProps {
  message: MessageType;
}

export const Message: React.FC<MessageProps> = ({ message }) => {
  // Ensure timestamp is a Date object
  const timestamp = typeof message.timestamp === 'string' 
    ? new Date(message.timestamp) 
    : message.timestamp;

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
        <div className="text-gray-800 dark:text-gray-200 transition-colors duration-200">
          {message.content}
        </div>
      </div>
    </div>
  );
};