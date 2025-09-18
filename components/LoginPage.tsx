import React, { useState } from 'react';
import { SparklesIcon } from './icons';
import { User } from '../types';
import * as auth from '../services/authService';

interface LoginPageProps {
  onLoginSuccess: (user: User) => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const [isLoginView, setIsLoginView] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setIsLoading(true);

    if (!username || !password) {
      setError('Please enter both username and password.');
      setIsLoading(false);
      return;
    }

    try {
      if (isLoginView) {
        const user = await auth.login(username, password);
        onLoginSuccess(user);
      } else {
        await auth.signup(username, password);
        setMessage('Sign up successful! An administrator must approve your account before you can log in.');
        setUsername('');
        setPassword('');
        setIsLoginView(true);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleView = () => {
    setIsLoginView(!isLoginView);
    setError('');
    setMessage('');
    setUsername('');
    setPassword('');
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-800">
      <div className="w-full max-w-md p-8 space-y-6 bg-white dark:bg-gray-900/50 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700/50">
        <div className="text-center">
            <SparklesIcon className="w-12 h-12 mx-auto text-indigo-500 dark:text-indigo-400" />
            <h1 className="mt-4 text-3xl font-bold text-gray-900 dark:text-white">Tallman Sales Chat</h1>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                {isLoginView ? 'Sign in to your account' : 'Create a new account'}
            </p>
        </div>

        <form className="space-y-6" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Username
            </label>
            <div className="mt-1">
              <input
                id="username"
                name="username"
                type="text"
                autoComplete="username"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-200 rounded-lg p-3 focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-shadow duration-200"
              />
            </div>
          </div>

          <div>
            <label htmlFor="password"  className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Password
            </label>
            <div className="mt-1">
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-200 rounded-lg p-3 focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-shadow duration-200"
              />
            </div>
          </div>
          
          {error && <p className="text-sm text-red-600 dark:text-red-400 text-center">{error}</p>}
          {message && <p className="text-sm text-green-600 dark:text-green-400 text-center">{message}</p>}

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {isLoading ? 'Processing...' : (isLoginView ? 'Sign In' : 'Sign Up')}
            </button>
          </div>
        </form>

        <p className="text-sm text-center text-gray-600 dark:text-gray-400">
          {isLoginView ? "Don't have an account?" : 'Already have an account?'}
          <button onClick={toggleView} className="ml-1 font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300">
            {isLoginView ? 'Sign Up' : 'Sign In'}
          </button>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
