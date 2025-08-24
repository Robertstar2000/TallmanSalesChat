
import { KnowledgeItem, ChatSession, ChatHistoryItem } from '../types';

const DB_NAME = 'TallmanSalesDB';
const KNOWLEDGE_STORE = 'knowledge';
const CHAT_HISTORY_STORE = 'chatHistory';
const DB_VERSION = 2; // Incremented to add new object store

let db: IDBDatabase;

const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    if (db) {
      return resolve(db);
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      console.error('Database error:', request.error);
      reject('Database error');
    };

    request.onsuccess = () => {
      db = request.result;
      resolve(db);
    };

    request.onupgradeneeded = (event) => {
      const dbInstance = (event.target as IDBOpenDBRequest).result;
      if (!dbInstance.objectStoreNames.contains(KNOWLEDGE_STORE)) {
        const objectStore = dbInstance.createObjectStore(KNOWLEDGE_STORE, {
          keyPath: 'timestamp',
        });
        objectStore.createIndex('content', 'content', { unique: false });
      }
      if (!dbInstance.objectStoreNames.contains(CHAT_HISTORY_STORE)) {
        dbInstance.createObjectStore(CHAT_HISTORY_STORE, { keyPath: 'id' });
      }
    };
  });
};

// --- Knowledge Base Functions ---

export const addItem = async (item: KnowledgeItem): Promise<void> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([KNOWLEDGE_STORE], 'readwrite');
    const store = transaction.objectStore(KNOWLEDGE_STORE);
    const request = store.add(item);
    
    request.onsuccess = () => resolve();
    request.onerror = () => {
        console.error('Error adding item:', request.error);
        reject(request.error);
    };
  });
};

export const bulkAddItems = async (items: KnowledgeItem[]): Promise<void> => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([KNOWLEDGE_STORE], 'readwrite');
      const store = transaction.objectStore(KNOWLEDGE_STORE);
  
      transaction.oncomplete = () => {
        resolve();
      };
  
      transaction.onerror = () => {
        console.error('Transaction error during bulk add:', transaction.error);
        reject(transaction.error);
      };
  
      items.forEach(item => {
        store.put(item);
      });
    });
  };

export const getAllItems = async (): Promise<KnowledgeItem[]> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([KNOWLEDGE_STORE], 'readonly');
    const store = transaction.objectStore(KNOWLEDGE_STORE);
    const request = store.getAll();

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => {
        console.error('Error getting all items:', request.error);
        reject(request.error);
    };
  });
};

export const countItems = async (): Promise<number> => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([KNOWLEDGE_STORE], 'readonly');
      const store = transaction.objectStore(KNOWLEDGE_STORE);
      const request = store.count();
  
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => {
          console.error('Error counting items:', request.error);
          reject(request.error);
      };
    });
};

// --- Chat History Functions ---

export const addOrUpdateChatSession = async (session: ChatSession): Promise<void> => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([CHAT_HISTORY_STORE], 'readwrite');
      const store = transaction.objectStore(CHAT_HISTORY_STORE);
      const request = store.put(session);
      
      request.onsuccess = () => resolve();
      request.onerror = () => {
          console.error('Error saving chat session:', request.error);
          reject(request.error);
      };
    });
};

export const getChatSession = async (id: string): Promise<ChatSession | undefined> => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([CHAT_HISTORY_STORE], 'readonly');
        const store = transaction.objectStore(CHAT_HISTORY_STORE);
        const request = store.get(id);

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => {
            console.error('Error getting chat session:', request.error);
            reject(request.error);
        };
    });
};

export const getAllChatHistories = async (): Promise<ChatHistoryItem[]> => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([CHAT_HISTORY_STORE], 'readonly');
        const store = transaction.objectStore(CHAT_HISTORY_STORE);
        const request = store.getAll();

        request.onsuccess = () => {
            // Only return id and title for the history list
            const histories: ChatSession[] = request.result;
            // Sort by ID descending (which will be timestamp based)
            histories.sort((a, b) => b.id.localeCompare(a.id));
            resolve(histories.map(({ id, title }) => ({ id, title })));
        };
        request.onerror = () => {
            console.error('Error getting all chat histories:', request.error);
            reject(request.error);
        };
    });
};

export const deleteChatSession = async (id: string): Promise<void> => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([CHAT_HISTORY_STORE], 'readwrite');
        const store = transaction.objectStore(CHAT_HISTORY_STORE);
        const request = store.delete(id);

        request.onsuccess = () => resolve();
        request.onerror = () => {
            console.error('Error deleting chat session:', request.error);
            reject(request.error);
        };
    });
};
