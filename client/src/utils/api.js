import { auth } from '../firebase/config';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

/**
 * Helper to make authenticated requests to our Node.js backend
 */
export const apiRequest = async (endpoint, options = {}) => {
  try {
    // Get the current user's ID token if they are logged in
    let token = null;
    if (auth.currentUser) {
      token = await auth.currentUser.getIdToken();
    }

    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'API Request Failed');
    }

    return data;
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
};
