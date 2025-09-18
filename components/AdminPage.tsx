import React, { useState, useEffect, useRef } from 'react';
import { addKnowledge, getAllKnowledge, bulkAddKnowledge } from '../services/knowledgeBase';
import { getAllApprovedUsers, addOrUpdateApprovedUser, deleteApprovedUser } from '../services/db';
import { KnowledgeItem, User, UserRole } from '../types';

interface AdminPageProps {
  onNavigate: (page: 'chat' | 'admin') => void;
}


const UserManagement: React.FC<{ setFeedback: (msg: string) => void }> = ({ setFeedback }) => {
    const [users, setUsers] = useState<User[]>([]);
    const [newUsername, setNewUsername] = useState('');
    const [newUserRole, setNewUserRole] = useState<UserRole>('user');
  
    const loadUsers = async () => {
      const userList = await getAllApprovedUsers();
      setUsers(userList);
    };
  
    useEffect(() => {
      loadUsers();
    }, []);
  
    const handleAddUser = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!newUsername.trim()) {
        setFeedback('Error: Username cannot be empty.');
        return;
      }
      try {
        const newUser: User = { username: newUsername, role: newUserRole };
        await addOrUpdateApprovedUser(newUser);
        setNewUsername('');
        setNewUserRole('user');
        await loadUsers();
        setFeedback(`User '${newUsername}' added successfully.`);
      } catch (error) {
        setFeedback('Error: Could not add user.');
        console.error(error);
      }
    };
  
    const handleRoleChange = async (username: string, role: UserRole) => {
      try {
        const userToUpdate: User = { username, role };
        await addOrUpdateApprovedUser(userToUpdate);
        await loadUsers();
        setFeedback(`Role for '${username}' updated.`);
      } catch (error) {
        setFeedback('Error: Could not update user role.');
        console.error(error);
      }
    };
  
    const handleDeleteUser = async (username: string) => {
        if (username === 'BobM') {
            setFeedback('Error: Cannot delete the default admin user.');
            return;
        }
      if (window.confirm(`Are you sure you want to delete the user '${username}'?`)) {
        try {
          await deleteApprovedUser(username);
          await loadUsers();
          setFeedback(`User '${username}' deleted.`);
        } catch (error) {
          setFeedback('Error: Could not delete user.');
          console.error(error);
        }
      }
    };
  
    return (
      <div>
        <h3 className="text-xl font-bold text-gray-900 dark:text-white">User Management</h3>
        <p className="text-gray-500 dark:text-gray-400 mt-2 mb-4">
          Manage users who are approved to use this application. Users must also exist in the LDAP directory to log in.
        </p>

        {/* Add User Form */}
        <form onSubmit={handleAddUser} className="flex items-center gap-2 mb-4 p-4 bg-gray-100 dark:bg-gray-800/50 rounded-lg">
            <input 
                type="text"
                value={newUsername}
                onChange={e => setNewUsername(e.target.value)}
                placeholder="New username"
                className="flex-grow bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-200 rounded-md p-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
            <select
                value={newUserRole}
                onChange={e => setNewUserRole(e.target.value as UserRole)}
                className="bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-200 rounded-md p-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            >
                <option value="user">User</option>
                <option value="admin">Admin</option>
                <option value="hold">Hold</option>
            </select>
            <button type="submit" className="bg-indigo-500 hover:bg-indigo-600 text-white font-semibold py-2 px-4 rounded-lg">Add</button>
        </form>

        {/* User List */}
        <div className="space-y-2">
            {users.map(user => (
                <div key={user.username} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-md">
                    <span className="font-medium text-gray-800 dark:text-gray-200">{user.username}</span>
                    <div className="flex items-center gap-2">
                        <select
                            value={user.role}
                            onChange={(e) => handleRoleChange(user.username, e.target.value as UserRole)}
                            className="bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-200 rounded-md py-1 px-2 text-sm focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                        >
                            <option value="user">User</option>
                            <option value="admin">Admin</option>
                            <option value="hold">Hold</option>
                        </select>
                        <button 
                            onClick={() => handleDeleteUser(user.username)}
                            className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 p-1 disabled:opacity-50"
                            disabled={user.username === 'BobM'}
                            aria-label={`Delete user ${user.username}`}
                         >
                           Delete
                        </button>
                    </div>
                </div>
            ))}
        </div>

      </div>
    );
  };


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
    <div className="flex-1 flex flex-col items-center p-6 bg-gray-100 dark:bg-gray-800 overflow-y-auto">
      <div className="w-full max-w-2xl bg-white dark:bg-gray-900/50 rounded-lg p-8 shadow-xl border border-gray-200 dark:border-gray-700/50 my-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Admin Panel</h2>
          <button
            onClick={() => onNavigate('chat')}
            className="text-sm bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200"
          >
            Return to Chat
          </button>
        </div>
        
        <div className="space-y-10">
          <UserManagement setFeedback={setFeedback} />

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