import { KnowledgeItem } from '../types';
import * as db from './db';

// A mock knowledge base for a fictional company, Tallman Sales.
const DEFAULT_KNOWLEDGE_BASE: KnowledgeItem[] = [
  // Company Overview
  { content: "Tallman Equipment Company, Inc., founded in 1974, is a leading manufacturer's representative and distributor of tools and equipment for the power utility and telecommunications industries.", timestamp: 1672531200000 },
  { content: "Our headquarters is located at 15430 Endeavor Dr, Noblesville, IN 46060, proudly serving Indiana, Ohio, and Kentucky.", timestamp: 1672531201000 },
  { content: "We serve a diverse client base, including investor-owned utilities (IOUs), municipal electric systems, electrical cooperatives (co-ops), and contractors.", timestamp: 1672531202000 },
  { content: "Tallman Equipment's mission is to provide lineworkers with the safest, most reliable tools and equipment, backed by exceptional customer service and technical expertise.", timestamp: 1672531203000 },

  // Product Categories
  { content: "Our core product offerings include a comprehensive range of lineman tools, such as hot line tools, climbing equipment, personal protective equipment (PPE), and safety gear.", timestamp: 1675209600000 },
  { content: "We are a premier distributor for grounding equipment, offering standard and custom-made grounding assemblies, clamps, and accessories to ensure worker safety during maintenance.", timestamp: 1675209601000 },
  { content: "Tallman provides a wide selection of hoisting and rigging equipment, including chain hoists, lever hoists, web strap hoists, and rope blocks designed for utility work.", timestamp: 1675209602000 },
  { content: "Our inventory includes advanced testing and measurement instruments for diagnosing and maintaining electrical systems, from voltage detectors to insulation testers.", timestamp: 1675209603000 },
  { content: "We supply essential utility work accessories like cover-up equipment (line hose, insulator covers), temporary jumpers, and various hand tools from trusted brands.", timestamp: 1675209604000 },

  // Key Brands and Manufacturers
  { content: "Tallman Equipment is a proud partner and distributor for industry-leading manufacturers, including Hastings, Chance (Hubbell Power Systems), Klein Tools, Bashlin Industries, and Salisbury by Honeywell.", timestamp: 1677628800000 },
  { content: "Through our partnership with Hastings, we offer a full line of fiberglass hot sticks, telescopic sticks, and other live-line tools known for their durability and safety.", timestamp: 1677628801000 },
  { content: "As a Chance distributor, we provide access to top-tier anchoring systems, insulators, and cutout switches essential for power line construction and maintenance.", timestamp: 1677628802000 },

  // Services
  { content: "Tallman Equipment operates a certified tool repair and testing facility. We specialize in servicing hydraulic tools, hoists, and grounding equipment to ensure they meet safety standards.", timestamp: 1680307200000 },
  { content: "Our services include comprehensive testing for hot line tools and rubber goods (gloves, sleeves, blankets) in our state-of-the-art NAIL-accredited lab, ensuring compliance with ASTM and OSHA standards.", timestamp: 1680307201000 },
  { content: "We offer on-site product demonstrations and safety training sessions to help crews understand the proper use and maintenance of the equipment we sell.", timestamp: 1680307202000 },
  { content: "Our knowledgeable sales team provides expert technical support and can assist in creating custom solutions, such as specialized grounding sets or tool kits for specific jobs.", timestamp: 1680307203000 },

  // Sales and Contact
  { content: "For sales inquiries, product quotes, or service requests, customers can contact our main office or reach out to their dedicated regional sales representative through our official website.", timestamp: 1682899200000 },
  { content: "We maintain a large inventory of common tools and equipment at our Noblesville warehouse to ensure quick delivery times for our customers.", timestamp: 1682899201000 },
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