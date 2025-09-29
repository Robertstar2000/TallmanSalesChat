import React, { useState, useEffect } from 'react';
import { getAllApprovedUsers, addOrUpdateApprovedUser, deleteApprovedUser } from '../services/db';
import { User, UserRole } from '../types';

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
  const [feedback, setFeedback] = useState('');

  useEffect(() => {
    if (feedback) {
      const timer = setTimeout(() => {
        setFeedback('');
      }, 4000); // Clear feedback after 4 seconds
      return () => clearTimeout(timer);
    }
  }, [feedback]);

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
