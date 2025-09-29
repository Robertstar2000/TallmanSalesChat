

import React, { useState, useRef, useEffect, KeyboardEvent } from 'react';
import { SendIcon, PaperClipIcon } from './icons';

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  isLoading: boolean;
  onAddFiles: (files: FileList) => void;
}

const ChatInput: React.FC<ChatInputProps> = ({ onSendMessage, isLoading, onAddFiles }) => {
  const [inputValue, setInputValue] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const scrollHeight = textareaRef.current.scrollHeight;
      textareaRef.current.style.height = `${scrollHeight}px`;
    }
  }, [inputValue]);

  const handleSendMessage = () => {
    if ((inputValue.trim() || document.querySelector('.attachment-pill')) && !isLoading) {
      onSendMessage(inputValue);
      setInputValue('');
    }
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSendMessage();
    }
  };
  
  const handleAttachmentClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      onAddFiles(event.target.files);
      event.target.value = ''; // Reset for re-uploading same file
    }
  };


  return (
    <div className="relative">
      <textarea
        ref={textareaRef}
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Send a message..."
        rows={1}
        disabled={isLoading}
        className="w-full bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-200 rounded-lg py-3 pl-12 pr-12 resize-none focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-shadow duration-200 placeholder:text-gray-500 dark:placeholder:text-gray-400"
        style={{ maxHeight: '200px' }}
        aria-label="Chat input"
      />
       <input
        type="file"
        multiple
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        accept="image/*,.txt,.csv,.md,.json"
        aria-hidden="true"
      />
      <button
        onClick={handleAttachmentClick}
        disabled={isLoading}
        className="absolute left-3 top-1/2 -translate-y-1/2 p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-300 dark:hover:bg-gray-600 disabled:cursor-not-allowed transition-colors duration-200"
        aria-label="Attach files"
      >
        <PaperClipIcon className="w-5 h-5" />
      </button>
      <button
        onClick={handleSendMessage}
        disabled={isLoading || !inputValue.trim()}
        className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full text-gray-500 dark:text-gray-400 hover:text-white hover:bg-indigo-500 disabled:hover:bg-transparent disabled:text-gray-500/50 dark:disabled:text-gray-600 disabled:cursor-not-allowed transition-colors duration-200"
        aria-label="Send message"
      >
        <SendIcon className="w-5 h-5" />
      </button>
    </div>
  );
};

export default ChatInput;