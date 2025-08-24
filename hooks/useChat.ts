
import { useState, useRef, useCallback, useEffect } from 'react';
import type { Chat } from '@google/genai';
import { Message, Role, ChatSession } from '../types';
import { startChat, generateChatTitle } from '../services/geminiService';
import { retrieveContext } from '../services/knowledgeBase';
import * as db from '../services/db';

const initialMessage: Message = {
  role: Role.MODEL,
  content: "Hello! I am your Tallman Sales Assistant. I can answer questions about Tallman Sales. How can I help you today?",
};

export const useChat = (
  chatId: string | null,
  onChatCreated: (session: ChatSession) => void
) => {
  const [messages, setMessages] = useState<Message[]>([initialMessage]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  const chatRef = useRef<Chat | null>(null);
  const currentChatId = useRef<string | null>(chatId);

  useEffect(() => {
    currentChatId.current = chatId;
    const loadChat = async () => {
        setIsLoading(true);
        if (chatId) {
            const session = await db.getChatSession(chatId);
            if (session) {
                setMessages(session.messages);
                chatRef.current = startChat(session.messages);
            } else {
                currentChatId.current = null; // ID not found, treat as new chat
                setMessages([initialMessage]);
                chatRef.current = null;
            }
        } else {
            setMessages([initialMessage]);
            chatRef.current = null;
        }
        setIsLoading(false);
    };
    loadChat();
  }, [chatId]);

  const sendMessage = useCallback(async (messageContent: string) => {
    if (!messageContent.trim()) return;

    setIsLoading(true);
    setError(null);

    const userMessage: Message = { role: Role.USER, content: messageContent };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);

    try {
        let promptToSend = messageContent;
        const context = await retrieveContext(messageContent);
        if (context.length > 0) {
            const contextString = context.map(c => `- ${c}`).join('\n');
            promptToSend = `Please answer the following question based ONLY on the provided context. If the context doesn't contain the answer, state that you don't have enough information to answer.

Context:
${contextString}

Question:
${messageContent}`;
        }
        
        if (!chatRef.current) {
            // startChat correctly handles slicing off the initial greeting for the API history
            chatRef.current = startChat(updatedMessages);
        }

        const stream = await chatRef.current.sendMessageStream({ message: promptToSend });
      
        let modelResponse = '';
        const modelMessagePlaceholder: Message = { role: Role.MODEL, content: '▋' };
        setMessages([...updatedMessages, modelMessagePlaceholder]);

        for await (const chunk of stream) {
            modelResponse += chunk.text;
            setMessages(prev =>
                prev.map((msg, index) =>
                    index === prev.length - 1 ? { ...msg, content: modelResponse + '▋' } : msg
                )
            );
        }
        
        const finalModelMessage: Message = { role: Role.MODEL, content: modelResponse };
        const finalMessages = [...updatedMessages, finalModelMessage];
        setMessages(finalMessages);
        
        // Save to DB
        if (currentChatId.current) {
            const session = await db.getChatSession(currentChatId.current);
            if(session) {
                await db.addOrUpdateChatSession({ ...session, messages: finalMessages });
            }
        } else {
            // This is a new chat, create it
            const newId = Date.now().toString();
            currentChatId.current = newId;
            const title = generateChatTitle(messageContent);
            const newSession: ChatSession = { id: newId, title, messages: finalMessages };
            await db.addOrUpdateChatSession(newSession);
            onChatCreated(newSession);
        }

    } catch (e) {
      setError(e instanceof Error ? e : new Error('An unknown error occurred'));
      const errorMessage: Message = {
        role: Role.MODEL,
        content: "Sorry, I encountered an error. Please try again.",
      };
      setMessages(prev => [...prev.slice(0, -1), errorMessage]); // Replace placeholder with error
    } finally {
      setIsLoading(false);
    }
  }, [messages, onChatCreated]);

  return { messages, isLoading, error, sendMessage };
};
