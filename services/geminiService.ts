
import { GoogleGenAI, Chat } from "@google/genai";
import { Message } from '../types';

if (!process.env.API_KEY) {
  throw new Error("API_KEY environment variable is not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
const model = 'gemini-2.5-flash';

export const startChat = (history: Message[]): Chat => {
  const formattedHistory = history.map(msg => ({
    role: msg.role,
    parts: [{ text: msg.content }],
  }));

  // The Gemini API history needs to alternate between user and model roles.
  // Our initial greeting is a model message, so we slice it off if it's the first message.
  const validHistory = (formattedHistory.length > 0 && formattedHistory[0].role === 'model') 
    ? formattedHistory.slice(1) 
    : formattedHistory;


  const chat = ai.chats.create({
    model,
    history: validHistory,
    config: {
      temperature: 0.9,
      topK: 1,
      topP: 1,
      maxOutputTokens: 2048,
    }
  });

  return chat;
};

/**
 * Generates a short title from the first few words of a message.
 * This is a client-side operation to avoid API calls for titles and prevent rate-limiting.
 * @param firstUserMessage The user's first message in the chat.
 * @returns A string to be used as the chat title.
 */
export const generateChatTitle = (firstUserMessage: string): string => {
    const cleanedMessage = firstUserMessage.trim();
    if (!cleanedMessage) {
      return "New Chat";
    }
  
    const words = cleanedMessage.split(/\s+/);
    const titleWords = words.slice(0, 5);
    let title = titleWords.join(' ');
  
    if (words.length > 5) {
      title += '...';
    }
  
    return title;
  };
