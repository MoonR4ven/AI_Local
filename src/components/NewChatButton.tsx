import { Plus } from 'lucide-react';

interface NewChatButtonProps {
  onClick: () => void;
}

export const NewChatButton: React.FC<NewChatButtonProps> = ({ onClick }) => {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 w-full p-3 rounded-lg bg-primary-600 text-white hover:bg-primary-700 transition-colors shadow-md"
    >
      <Plus className="w-5 h-5" />
      <span className="font-medium">New Chat</span>
    </button>
  );
};