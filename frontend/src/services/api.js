/**
 * Axios API Client Configuration
 * Base configuration for all API calls
 */

import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://moneygence.com';

// Create axios instance
const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  timeout: 30000, // 30 seconds
  withCredentials: true, // Send cookies with requests
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // Add authorization header if token exists
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Handle session expiry (401)
    if (error.response?.status === 401) {
      localStorage.removeItem('auth_token');

      // Only redirect to login from protected pages — never from public auth pages
      const publicPaths = ['/login', '/signup', '/forgot-password', '/reset-password', '/vendor-signup'];
      const isPublicPage = publicPaths.some(p => window.location.pathname.startsWith(p));
      if (!isPublicPage) {
        window.location.href = '/login?session_expired=true';
      }
    }

    // Handle network errors
    if (!error.response) {
      error.message = 'Unable to connect to server. Please check your internet connection and try again.';
    }

    return Promise.reject(error);
  }
);

export default api;
