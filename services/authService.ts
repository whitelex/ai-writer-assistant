
import { User } from '../types';

const SESSION_KEY = 'inkwell_session';
const TOKEN_KEY = 'inkwell_token';
const API_BASE = '/api';

export const authService = {
  signup: async (email: string, password: string): Promise<User> => {
    const response = await fetch(`${API_BASE}/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Signup failed');
    }

    const sessionUser: User = { id: data.id, email: data.email };
    localStorage.setItem(SESSION_KEY, JSON.stringify(sessionUser));
    localStorage.setItem(TOKEN_KEY, data.token);
    return sessionUser;
  },

  login: async (email: string, password: string): Promise<User> => {
    const response = await fetch(`${API_BASE}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Login failed');
    }

    const sessionUser: User = { id: data.id, email: data.email };
    localStorage.setItem(SESSION_KEY, JSON.stringify(sessionUser));
    return sessionUser;
  },

  logout: () => {
    localStorage.removeItem(SESSION_KEY);
    localStorage.removeItem(TOKEN_KEY);
  },

  authHeaders: (): Record<string, string> => {
    const token = localStorage.getItem(TOKEN_KEY);
    return token ? { Authorization: `Bearer ${token}` } : {};
  },

  getCurrentUser: (): User | null => {
    const session = localStorage.getItem(SESSION_KEY);
    return session && localStorage.getItem(TOKEN_KEY) ? JSON.parse(session) : null;
  }
};
