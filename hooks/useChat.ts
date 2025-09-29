




import { useState, useRef, useCallback, useEffect } from 'react';
import type { Chat } from '@google/genai';
import { Message, Role, ChatSession, Attachment } from '../types';
import { startChat, generateChatTitle } from '../services/geminiService';
import * as db from '../services/db';
import { retrieveContext } from '../services/knowledgeBase';

const initialMessage: Message = {
  role: Role.MODEL,
  content: "Hello! I am your Tallman Chat Assistant",
};

const systemInstruction = `You are an AI assistant for Tallman Equipment, a company specializing in professional-grade tools and equipment for the power utility industry. Your primary role is to provide accurate, relevant, and business-focused information about Tallman's products and services. Use the provided context from the knowledge base and any attached files to answer user questions. Ensure your responses are accurate and directly address the user's message.`;

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
                chatRef.current = startChat(session.messages, systemInstruction);
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

  const sendMessage = useCallback(async (messageContent: string, attachments: Attachment[]) => {
    if (!messageContent.trim() && attachments.length === 0) return;

    setIsLoading(true);
    setError(null);

    // For a new chat, initialize with the history *before* adding the new user message.
    // This prevents a race condition that causes an API error.
    if (!chatRef.current) {
        chatRef.current = startChat(messages, systemInstruction);
    }

    const userMessage: Message = { role: Role.USER, content: messageContent };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);

    try {
        // RAG search
        const ragContextItems = await retrieveContext(messageContent);
        
        const textAttachments = attachments.filter(a => a.type === 'text');
        const imageAttachments = attachments.filter(a => a.type === 'image');

        let contextString = '';

        if (ragContextItems.length > 0) {
            contextString += "--- Relevant Information from Knowledge Base ---\n" +
                ragContextItems.join('\n\n') +
                "\n--- End of Knowledge Base Information ---\n\n";
        }

        if (textAttachments.length > 0) {
            contextString += "--- Information from Attached Files ---\n" +
                textAttachments.map(a => `File: ${a.name}\n${a.content}`).join('\n\n') +
                "\n--- End of Attached Files Information ---\n\n";
        }
        
        const prompt = (contextString ? `${contextString}Based on the provided information, please answer the following question:\n\n` : '') + messageContent;

        const parts: any[] = [{ text: prompt }];

        imageAttachments.forEach(img => {
            parts.push({
                inlineData: {
                    mimeType: img.mimeType,
                    data: img.content
                }
            });
        });
        
        // The `sendMessageStream` method for chats requires the payload to be a `Part[]` array nested under a `message` property.
        const stream = await chatRef.current!.sendMessageStream({ message: parts });
      
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
            const title = generateChatTitle(messageContent || "Chat with attachments");
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
      // On error, append an error message to the history that includes the user's message,
      // ensuring their input isn't lost.
      setMessages([...updatedMessages, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  }, [messages, onChatCreated]);

  return { messages, isLoading, error, sendMessage };
};