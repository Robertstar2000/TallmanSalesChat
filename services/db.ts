import { ChatSession, ChatHistoryItem, User, KnowledgeItem } from '../types';

const DB_NAME = 'TallmanSalesDB';
const CHAT_HISTORY_STORE = 'chatHistory';
const KNOWLEDGE_BASE_STORE = 'knowledgeBase';
// FIX: Add constant for approved users store
const APPROVED_USERS_STORE = 'approvedUsers';
// FIX: Bumped version to add new object store
const DB_VERSION = 4; 

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
      if (!dbInstance.objectStoreNames.contains(CHAT_HISTORY_STORE)) {
        dbInstance.createObjectStore(CHAT_HISTORY_STORE, { keyPath: 'id' });
      }
      if (!dbInstance.objectStoreNames.contains(KNOWLEDGE_BASE_STORE)) {
        dbInstance.createObjectStore(KNOWLEDGE_BASE_STORE, { autoIncrement: true });
      }

      // FIX: Create approvedUsers store instead of deleting it, and seed with default users.
      if (!dbInstance.objectStoreNames.contains(APPROVED_USERS_STORE)) {
        const userStore = dbInstance.createObjectStore(APPROVED_USERS_STORE, { keyPath: 'username' });
        userStore.transaction.oncomplete = () => {
            const userTransaction = dbInstance.transaction(APPROVED_USERS_STORE, 'readwrite');
            const store = userTransaction.objectStore(APPROVED_USERS_STORE);
            store.add({ username: 'BobM', role: 'admin' });
            store.add({ username: 'testuser', role: 'user' });
        };
      }
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

export const clearAllChatSessions = async (): Promise<void> => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([CHAT_HISTORY_STORE], 'readwrite');
        const store = transaction.objectStore(CHAT_HISTORY_STORE);
        const request = store.clear();

        request.onsuccess = () => resolve();
        request.onerror = () => {
            console.error('Error clearing chat history:', request.error);
            reject(request.error);
        };
    });
};

// --- Knowledge Base Functions ---

export const countItems = async (): Promise<number> => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([KNOWLEDGE_BASE_STORE], 'readonly');
        const store = transaction.objectStore(KNOWLEDGE_BASE_STORE);
        const request = store.count();
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => {
            console.error('Error counting knowledge base items:', request.error);
            reject(request.error);
        };
    });
};

export const addItem = async (item: KnowledgeItem): Promise<void> => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([KNOWLEDGE_BASE_STORE], 'readwrite');
        const store = transaction.objectStore(KNOWLEDGE_BASE_STORE);
        const request = store.add(item);
        request.onsuccess = () => resolve();
        request.onerror = () => {
            console.error('Error adding knowledge base item:', request.error);
            reject(request.error);
        };
    });
};

export const getAllItems = async (): Promise<KnowledgeItem[]> => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([KNOWLEDGE_BASE_STORE], 'readonly');
        const store = transaction.objectStore(KNOWLEDGE_BASE_STORE);
        const request = store.getAll();
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => {
            console.error('Error getting all knowledge base items:', request.error);
            reject(request.error);
        };
    });
};

export const bulkAddItems = async (items: KnowledgeItem[]): Promise<void> => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([KNOWLEDGE_BASE_STORE], 'readwrite');
        const store = transaction.objectStore(KNOWLEDGE_BASE_STORE);
        
        items.forEach(item => {
            store.add(item);
        });

        transaction.oncomplete = () => resolve();
        transaction.onerror = () => {
            console.error('Error bulk adding items:', transaction.error);
            reject(transaction.error);
        };
    });
};

// FIX: Added missing user management functions for AdminPage
// --- Approved Users Functions ---

export const addOrUpdateApprovedUser = async (user: User): Promise<void> => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([APPROVED_USERS_STORE], 'readwrite');
      const store = transaction.objectStore(APPROVED_USERS_STORE);
      const request = store.put(user);
      
      request.onsuccess = () => resolve();
      request.onerror = () => {
          console.error('Error saving approved user:', request.error);
          reject(request.error);
      };
    });
};

export const getApprovedUser = async (username: string): Promise<User | undefined> => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([APPROVED_USERS_STORE], 'readonly');
        const store = transaction.objectStore(APPROVED_USERS_STORE);
        const request = store.get(username);

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => {
            console.error('Error getting approved user:', request.error);
            reject(request.error);
        };
    });
};

export const getAllApprovedUsers = async (): Promise<User[]> => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([APPROVED_USERS_STORE], 'readonly');
        const store = transaction.objectStore(APPROVED_USERS_STORE);
        const request = store.getAll();

        request.onsuccess = () => {
            const users: User[] = request.result;
            // Sort for consistent display
            users.sort((a, b) => a.username.localeCompare(b.username));
            resolve(users);
        };
        request.onerror = () => {
            console.error('Error getting all approved users:', request.error);
            reject(request.error);
        };
    });
};

export const deleteApprovedUser = async (username: string): Promise<void> => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([APPROVED_USERS_STORE], 'readwrite');
        const store = transaction.objectStore(APPROVED_USERS_STORE);
        const request = store.delete(username);

        request.onsuccess = () => resolve();
        request.onerror = () => {
            console.error('Error deleting approved user:', request.error);
            reject(request.error);
        };
    });
};
