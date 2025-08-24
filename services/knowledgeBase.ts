import { KnowledgeItem } from '../types';
import * as db from './db';

// A mock knowledge base for a fictional company, Tallman Sales.
const DEFAULT_KNOWLEDGE_BASE: KnowledgeItem[] = [
  { content: "Tallman Sales was founded in 2010 by Jane Doe. It specializes in providing high-quality, sustainable office furniture.", timestamp: 1609459200000 },
  { content: "Our flagship product is the 'ErgoMax Pro' chair, known for its ergonomic design and use of recycled materials. It won the 'Green Design Award' in 2022.", timestamp: 1640995200000 },
  { content: "Tallman Sales offers a 10-year warranty on all its products. Customer support is available 24/7 via phone and email at support@tallmansales.example.com.", timestamp: 1609459200001 },
  { content: "The headquarters of Tallman Sales is located in San Francisco, California. We have regional offices in New York, London, and Tokyo.", timestamp: 1609459200002 },
  { content: "Our company mission is to create productive and healthy workspaces while maintaining a commitment to environmental responsibility.", timestamp: 1609459200003 },
  { content: "We offer bulk discounts for corporate clients ordering more than 50 units. Please contact sales@tallmansales.example.com for a quote.", timestamp: 1609459200004 },
  { content: "The ErgoMax Pro chair comes in three colors: Midnight Black, Cloud White, and Forest Green. Custom colors are available for large orders.", timestamp: 1640995200001 },
  { content: "In addition to chairs, Tallman Sales also sells adjustable standing desks, monitor arms, and acoustic panels for open-plan offices.", timestamp: 1609459200005 },
];


const initializeKnowledgeBase = async () => {
  try {
    const count = await db.countItems();
    if (count === 0) {
      console.log('Knowledge base is empty. Populating with default data.');
      const promises = DEFAULT_KNOWLEDGE_BASE.map(item => db.addItem(item));
      await Promise.all(promises);
    }
  } catch (error) {
    console.error("Failed to initialize knowledge base:", error);
  }
};

export const addKnowledge = async (content: string): Promise<void> => {
  if (!content.trim()) return;
  const newItem: KnowledgeItem = {
    content,
    timestamp: Date.now(),
  };
  try {
    await db.addItem(newItem);
  } catch (error) {
    console.error("Failed to save new knowledge:", error);
    throw error;
  }
};

export const getAllKnowledge = async (): Promise<KnowledgeItem[]> => {
  return db.getAllItems();
};

export const bulkAddKnowledge = async (items: KnowledgeItem[]): Promise<void> => {
  return db.bulkAddItems(items);
};

/**
 * A retrieval function that scores based on keyword matching and prioritizes recent information.
 * @param query The user's search query.
 * @returns An array of relevant document contents.
 */
export const retrieveContext = async (query: string): Promise<string[]> => {
  const queryWords = new Set(query.toLowerCase().split(/\s+/).filter(word => word.length > 2));
  
  if (queryWords.size === 0) {
    return [];
  }

  const knowledgeBase = await db.getAllItems();

  const scoredDocuments = knowledgeBase.map(doc => {
    const docWords = new Set(doc.content.toLowerCase().split(/\s+/));
    let score = 0;
    for (const word of queryWords) {
      if (docWords.has(word)) {
        score++;
      }
    }
    return { doc, score };
  });

  // Sort by score (desc), then by timestamp (desc) to prioritize newer info
  scoredDocuments.sort((a, b) => {
    if (b.score !== a.score) {
      return b.score - a.score;
    }
    return b.doc.timestamp - a.doc.timestamp;
  });
  
  // Return the top 3 most relevant documents if they have a score > 0
  return scoredDocuments
    .filter(item => item.score > 0)
    .slice(0, 3)
    .map(item => item.doc.content);
};

// Initialize on module load
initializeKnowledgeBase();