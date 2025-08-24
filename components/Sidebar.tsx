import React from 'react';
import { PlusIcon, SparklesIcon, TrashIcon } from './icons';
import { ChatHistoryItem } from '../types';

interface SidebarProps {
  onNewChat: () => void;
  onNavigate: (page: 'chat' | 'admin') => void;
  chatHistory: ChatHistoryItem[];
  activeChatId: string | null;
  onSelectChat: (id: string) => void;
  onDeleteChat: (id: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  onNewChat,
  onNavigate,
  chatHistory,
  activeChatId,
  onSelectChat,
  onDeleteChat,
}) => {
  return (
    <aside className="bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white w-64 p-4 flex flex-col h-screen border-r border-gray-200 dark:border-gray-700/50">
      <div className="flex items-center gap-2 mb-6">
        <SparklesIcon className="w-8 h-8 text-indigo-500 dark:text-indigo-400" />
        <h1 className="text-xl font-bold">Tallman Sales Chat</h1>
      </div>
      <button
        onClick={onNewChat}
        className="w-full flex items-center justify-center gap-2 bg-indigo-500 hover:bg-indigo-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200"
      >
        <PlusIcon className="w-5 h-5" />
        New Chat
      </button>
      <div className="mt-6 flex-grow overflow-y-auto">
        <h2 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
          Chat History
        </h2>
        <div className="space-y-1">
          {chatHistory.length > 0 ? (
            chatHistory.map((chat) => (
              <div key={chat.id} className="group relative">
                <button
                  onClick={() => onSelectChat(chat.id)}
                  className={`w-full text-left text-sm p-2 rounded-md truncate transition-colors ${
                    activeChatId === chat.id
                      ? 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-200/50 dark:hover:bg-gray-700/50 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  {chat.title}
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation(); // prevent selecting chat
                    onDeleteChat(chat.id);
                  }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-400 dark:text-gray-500 hover:text-red-500 dark:hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                  aria-label="Delete chat"
                >
                  <TrashIcon className="w-4 h-4" />
                </button>
              </div>
            ))
          ) : (
            <div className="mt-4 text-sm text-gray-500 dark:text-gray-500 text-center px-2">
              Your chat history will appear here. Start a new conversation to
              begin!
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
