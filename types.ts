
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

export interface KnowledgeItem {
  content: string;
  timestamp: number;
}
