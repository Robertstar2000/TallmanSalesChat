export enum Role {
  USER = 'user',
  MODEL = 'model',
}

export interface Message {
  role: Role;
  content: string;
}

export interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
}

export interface ChatHistoryItem {
  id: string;
  title: string;
}

export interface Attachment {
    name: string;
    type: 'image' | 'text';
    content: string; // base64 for image, text content for text
    mimeType: string;
}

// FIX: Added missing KnowledgeItem interface.
export interface KnowledgeItem {
  content: string;
  timestamp: number;
}

// FIX: Added 'hold' to UserRole to match its usage in the AdminPage.
export type UserRole = 'admin' | 'user' | 'hold';

export interface User {
  username: string;
  role: UserRole;
}