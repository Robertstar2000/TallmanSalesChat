import React, { useEffect, useRef, useState, useCallback } from 'react';
import ReactDOM from 'react-dom/client';
import { useChat } from './hooks/useChat';
import Sidebar from './components/Sidebar';
import MessageComponent from './components/Message';
import ChatInput from './components/ChatInput';
import AdminPage from './components/AdminPage';
import { ChatHistoryItem, ChatSession } from './types';
import * as db from './services/db';
import { SunIcon, MoonIcon, PrinterIcon } from './components/icons';

type Page = 'chat' | 'admin';
type Theme = 'light' | 'dark';

const Header: React.FC<{
  theme: Theme;
  toggleTheme: () => void;
  onNavigate: (page: Page) => void;
}> = ({ theme, toggleTheme, onNavigate }) => {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="absolute top-4 right-6 z-10 flex items-center gap-2">
       <button
        onClick={toggleTheme}
        className="p-2 rounded-full bg-gray-200/80 dark:bg-gray-700/80 backdrop-blur-sm hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 transition-colors duration-200"
        aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
      >
        {theme === 'light' ? (
          <MoonIcon className="w-5 h-5" />
        ) : (
          <SunIcon className="w-5 h-5" />
        )}
      </button>
      <button
        onClick={handlePrint}
        className="p-2 rounded-full bg-gray-200/80 dark:bg-gray-700/80 backdrop-blur-sm hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 transition-colors duration-200"
        aria-label="Print chat"
      >
        <PrinterIcon className="w-5 h-5" />
      </button>
      <button
        onClick={() => onNavigate('admin')}
        className="bg-gray-200/80 dark:bg-gray-700/80 backdrop-blur-sm hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 font-semibold py-2 px-3 rounded-lg text-sm transition-colors duration-200"
        aria-label="Open Admin Panel"
      >
        Admin
      </button>
    </div>
  );
};

const ChatView: React.FC<{
  chatId: string | null;
  onChatCreated: (session: ChatSession) => void;
  onNavigate: (page: Page) => void;
  theme: Theme;
  toggleTheme: () => void;
}> = ({ chatId, onChatCreated, onNavigate, theme, toggleTheme }) => {
  const { messages, isLoading, error, sendMessage } = useChat(chatId, onChatCreated);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <>
      <div className="relative flex-1 overflow-y-auto p-6 space-y-4">
        <Header theme={theme} toggleTheme={toggleTheme} onNavigate={onNavigate} />
        <div className="max-w-4xl mx-auto w-full printable-chat">
          {messages.map((msg, index) => (
            <MessageComponent key={index} message={msg} />
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {error && (
        <div className="px-6 pb-2 text-red-600 dark:text-red-400 text-sm max-w-4xl mx-auto w-full">
          <p>
            <strong>Error:</strong> {error.message}
          </p>
        </div>
      )}

      <div className="p-6 bg-gray-100/80 dark:bg-gray-800/80 backdrop-blur-sm border-t border-gray-200 dark:border-gray-700/50">
        <div className="max-w-4xl mx-auto">
          <ChatInput onSendMessage={sendMessage} isLoading={isLoading} />
          <p className="text-center text-xs text-gray-400 dark:text-gray-500 mt-3 px-4">
            Tallman may display inaccurate info, including about people, so please
            double-check its responses.
          </p>
        </div>
      </div>
    </>
  );
};

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<Page>('chat');
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [chatHistory, setChatHistory] = useState<ChatHistoryItem[]>([]);
  const [theme, setTheme] = useState<Theme>(() => {
    // Default to dark mode unless the user has explicitly chosen light mode.
    if (typeof window !== 'undefined' && window.localStorage.getItem('theme') === 'light') {
      return 'light';
    }
    return 'dark';
  });

  useEffect(() => {
    const root = document.documentElement;
    const isDark = theme === 'dark';

    if (isDark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    
    localStorage.setItem('theme', theme);
    
    const darkThemeLink = document.getElementById('hljs-dark-theme') as HTMLLinkElement;
    const lightThemeLink = document.getElementById('hljs-light-theme') as HTMLLinkElement;
    
    if (darkThemeLink) darkThemeLink.disabled = !isDark;
    if (lightThemeLink) lightThemeLink.disabled = isDark;

  }, [theme]);

  const toggleTheme = () => {
    setTheme(prevTheme => (prevTheme === 'light' ? 'dark' : 'light'));
  };

  const loadHistory = useCallback(async () => {
    const history = await db.getAllChatHistories();
    setChatHistory(history);
  }, []);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const handleNavigate = (page: Page) => {
    setCurrentPage(page);
  };

  const handleNewChat = () => {
    setCurrentChatId(null);
    setCurrentPage('chat');
  };

  const handleSelectChat = (id: string) => {
    setCurrentChatId(id);
    setCurrentPage('chat');
  };

  const handleDeleteChat = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this chat?')) {
      await db.deleteChatSession(id);
      if (currentChatId === id) {
        setCurrentChatId(null);
      }
      await loadHistory();
    }
  };

  const handleChatCreated = (session: ChatSession) => {
    setCurrentChatId(session.id);
    setChatHistory(prev => [{ id: session.id, title: session.title }, ...prev.filter(c => c.id !== session.id)]);
  };

  return (
    <div className="flex h-screen font-sans">
      <Sidebar
        onNewChat={handleNewChat}
        onNavigate={handleNavigate}
        chatHistory={chatHistory}
        activeChatId={currentChatId}
        onSelectChat={handleSelectChat}
        onDeleteChat={handleDeleteChat}
      />
      <main className="flex-1 flex flex-col">
        {currentPage === 'chat' ? (
          <ChatView
            chatId={currentChatId}
            onChatCreated={handleChatCreated}
            onNavigate={handleNavigate}
            theme={theme}
            toggleTheme={toggleTheme}
          />
        ) : (
          <AdminPage onNavigate={handleNavigate} />
        )}
      </main>
    </div>
  );
};

const root = ReactDOM.createRoot(document.getElementById('root')!);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);