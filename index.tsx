import React, { useEffect, useRef, useState, useCallback } from 'react';
import ReactDOM from 'react-dom/client';
import { useChat } from './hooks/useChat';
import Sidebar from './components/Sidebar';
import MessageComponent from './components/Message';
import ChatInput from './components/ChatInput';
import LoginPage from './components/LoginPage';
import AdminPage from './components/AdminPage';
import { ChatHistoryItem, ChatSession, User, Attachment } from './types';
import * as db from './services/db';
import * as auth from './services/authService';
import { SunIcon, MoonIcon, PrinterIcon, XIcon } from './components/icons';

type Theme = 'light' | 'dark';
type Page = 'chat' | 'admin';

const Header: React.FC<{
  theme: Theme;
  toggleTheme: () => void;
}> = ({ theme, toggleTheme }) => {
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
    </div>
  );
};

const readFileAsBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve((reader.result as string).split(',')[1]);
        reader.onerror = (error) => reject(error);
        reader.readAsDataURL(file);
    });
};

const readFileAsText = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = (error) => reject(error);
        reader.readAsText(file);
    });
};

const ChatView: React.FC<{
  chatId: string | null;
  onChatCreated: (session: ChatSession) => void;
  theme: Theme;
  toggleTheme: () => void;
}> = ({ chatId, onChatCreated, theme, toggleTheme }) => {
  const { messages, isLoading, error, sendMessage } = useChat(chatId, onChatCreated);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleAddFiles = async (files: FileList) => {
    const newAttachments: Attachment[] = [];
    for (const file of Array.from(files)) {
        try {
            if (file.type.startsWith('image/')) {
                const content = await readFileAsBase64(file);
                newAttachments.push({ name: file.name, type: 'image', content, mimeType: file.type });
            } else {
                const content = await readFileAsText(file);
                newAttachments.push({ name: file.name, type: 'text', content, mimeType: file.type });
            }
        } catch (err) {
            console.error("Error reading file:", file.name, err);
            // Optionally: dispatch a user-facing error message
        }
    }
    setAttachments(prev => [...prev, ...newAttachments]);
  };

  const handleRemoveAttachment = (fileName: string) => {
    setAttachments(prev => prev.filter(att => att.name !== fileName));
  };


  return (
    <>
      <div className="relative flex-1 overflow-y-auto p-6 space-y-4">
        <Header theme={theme} toggleTheme={toggleTheme} />
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
          {attachments.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-2">
                {attachments.map(att => (
                    <div key={att.name} className="flex items-center gap-2 bg-indigo-100 dark:bg-indigo-900/50 text-indigo-800 dark:text-indigo-200 text-sm font-medium px-2.5 py-1 rounded-full">
                        <span className="truncate max-w-xs">{att.name}</span>
                        <button 
                          onClick={() => handleRemoveAttachment(att.name)} 
                          className="text-indigo-500 hover:text-indigo-700 dark:hover:text-indigo-300 rounded-full focus:outline-none focus:ring-2 focus:ring-indigo-400"
                          aria-label={`Remove ${att.name}`}
                        >
                           <XIcon className="w-4 h-4" />
                        </button>
                    </div>
                ))}
            </div>
          )}
          <ChatInput 
            onSendMessage={(message) => {
              sendMessage(message, attachments);
              setAttachments([]);
            }} 
            isLoading={isLoading} 
            onAddFiles={handleAddFiles}
          />
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
  const [currentUser, setCurrentUser] = useState<User | null>(auth.getCurrentUser());
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [chatHistory, setChatHistory] = useState<ChatHistoryItem[]>([]);
  const [currentPage, setCurrentPage] = useState<Page>('chat');
  const [theme, setTheme] = useState<Theme>(() => {
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
    if (currentUser) {
        loadHistory();
    }
  }, [currentUser, loadHistory]);

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

  const handleClearAllChats = async () => {
    if (window.confirm('Are you sure you want to delete all chat history? This action cannot be undone.')) {
      await db.clearAllChatSessions();
      setChatHistory([]);
      setCurrentChatId(null);
    }
  };

  const handleChatCreated = (session: ChatSession) => {
    setCurrentChatId(session.id);
    setChatHistory(prev => [{ id: session.id, title: session.title }, ...prev.filter(c => c.id !== session.id)]);
  };
  
  const handleLoginSuccess = (user: User) => {
    setCurrentUser(user);
  };

  const handleLogout = () => {
    auth.logout();
    setCurrentUser(null);
    setChatHistory([]);
    setCurrentChatId(null);
    setCurrentPage('chat');
  };

  if (!currentUser) {
    return <LoginPage onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="flex h-screen font-sans">
      <Sidebar
        onNewChat={handleNewChat}
        chatHistory={chatHistory}
        activeChatId={currentChatId}
        onSelectChat={handleSelectChat}
        onDeleteChat={handleDeleteChat}
        onClearAllChats={handleClearAllChats}
        onLogout={handleLogout}
        user={currentUser}
        onNavigateToAdmin={() => setCurrentPage('admin')}
      />
      <main className="flex-1 flex flex-col">
          {currentPage === 'chat' ? (
            <ChatView
              chatId={currentChatId}
              onChatCreated={handleChatCreated}
              theme={theme}
              toggleTheme={toggleTheme}
            />
          ) : (
            <AdminPage onNavigate={setCurrentPage} />
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