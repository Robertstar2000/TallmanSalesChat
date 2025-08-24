
import React, { useState, useEffect, useRef } from 'react';
import { addKnowledge, getAllKnowledge, bulkAddKnowledge } from '../services/knowledgeBase';
import { KnowledgeItem } from '../types';

interface AdminPageProps {
  onNavigate: (page: 'chat' | 'admin') => void;
}

const AdminPage: React.FC<AdminPageProps> = ({ onNavigate }) => {
  const [newKnowledge, setNewKnowledge] = useState('');
  const [feedback, setFeedback] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (feedback) {
      const timer = setTimeout(() => {
        setFeedback('');
      }, 4000); // Clear feedback after 4 seconds
      return () => clearTimeout(timer);
    }
  }, [feedback]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newKnowledge.trim() && !isSubmitting) {
      setIsSubmitting(true);
      try {
        await addKnowledge(newKnowledge);
        setNewKnowledge('');
        setFeedback('New knowledge has been added successfully!');
      } catch (error) {
        console.error('Failed to add knowledge:', error);
        setFeedback('Error: Could not add knowledge. Please try again.');
      } finally {
        setIsSubmitting(false);
      }
    } else {
      setFeedback('Please enter some information to add.');
    }
  };

  const handleDownload = async () => {
    try {
      const allKnowledge = await getAllKnowledge();
      const jsonString = JSON.stringify(allKnowledge, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'tallman_knowledge_base.json';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setFeedback('Data downloaded successfully!');
    } catch (error) {
      console.error('Failed to download data:', error);
      setFeedback('Error: Could not download data.');
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const text = e.target?.result;
        if (typeof text !== 'string') {
          throw new Error('Failed to read file.');
        }
        const data = JSON.parse(text);

        // Basic validation
        if (!Array.isArray(data) || (data.length > 0 && !data.every(item => 'content' in item && 'timestamp' in item))) {
          throw new Error('Invalid JSON format. Expected an array of knowledge items.');
        }

        await bulkAddKnowledge(data as KnowledgeItem[]);
        setFeedback(`${data.length} items imported successfully!`);
      } catch (error) {
        console.error('Failed to upload data:', error);
        setFeedback(`Error: ${(error as Error).message}`);
      } finally {
        // Reset file input value to allow re-uploading the same file
        if (event.target) {
          event.target.value = '';
        }
      }
    };
    reader.onerror = () => {
      setFeedback('Error: Failed to read the file.');
    };
    reader.readAsText(file);
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 bg-gray-100 dark:bg-gray-800">
      <div className="w-full max-w-2xl bg-white dark:bg-gray-900/50 rounded-lg p-8 shadow-xl border border-gray-200 dark:border-gray-700/50">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Admin Panel</h2>
          <button
            onClick={() => onNavigate('chat')}
            className="text-sm bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200"
          >
            Return to Chat
          </button>
        </div>
        
        {/* Add Knowledge Section */}
        <div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Add Knowledge</h3>
          <p className="text-gray-500 dark:text-gray-400 mb-6">
            Add new pieces of information to the bot's knowledge base. This data is stored in your browser's IndexedDB.
          </p>
          <form onSubmit={handleSubmit}>
            <textarea
              value={newKnowledge}
              onChange={(e) => setNewKnowledge(e.target.value)}
              placeholder="e.g., The ErgoMax Pro chair now also comes in Royal Blue."
              rows={4}
              className="w-full bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-200 rounded-lg p-4 resize-y focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-shadow duration-200 placeholder:text-gray-500 dark:placeholder:text-gray-400"
              aria-label="New knowledge input"
              disabled={isSubmitting}
            />
            <div className="mt-4 flex items-center justify-end">
              <button
                type="submit"
                className="bg-indigo-500 hover:bg-indigo-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200 disabled:bg-indigo-400 disabled:cursor-not-allowed"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Adding...' : 'Add Information'}
              </button>
            </div>
          </form>
        </div>

        <hr className="my-8 border-gray-200 dark:border-gray-700" />

        {/* Manage Data Section */}
        <div className="space-y-4">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">Manage Knowledge Data</h3>
          <p className="text-gray-500 dark:text-gray-400">
              Download the current knowledge base for backup, or upload a JSON file to add or update information in bulk.
          </p>
          <div className="flex gap-4">
            <button
              onClick={handleDownload}
              className="flex-1 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200"
            >
              Download Data
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex-1 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200"
            >
              Upload Data
            </button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept=".json"
              className="hidden"
              aria-hidden="true"
            />
          </div>
        </div>
        
        {/* Global Feedback Area */}
        <div className="mt-6 text-center h-5">
            <p className={`text-sm ${feedback.startsWith('Error') ? 'text-red-500 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                {feedback}
            </p>
        </div>
      </div>
    </div>
  );
};

export default AdminPage;