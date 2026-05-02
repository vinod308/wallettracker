/**
 * Authentication Service
 * API calls for authentication endpoints
 */

import api from './api';

class AuthService {
  /**
   * Signup new user
   */
  async signup(userData) {
    const response = await api.post('/auth/signup', userData);

    // Store token if returned
    if (response.data.data?.token) {
      localStorage.setItem('auth_token', response.data.data.token);
    }

    return response.data;
  }

  /**
   * Login user
   */
  async login(credentials) {
    const response = await api.post('/auth/login', credentials);

    // Store token if returned
    if (response.data.data?.token) {
      localStorage.setItem('auth_token', response.data.data.token);
    }

    return response.data;
  }

  /**
   * Logout user
   */
  async logout() {
    try {
      await api.post('/auth/logout');
    } finally {
      // Clear token regardless of API response
      localStorage.removeItem('auth_token');
    }
  }

  /**
   * Forgot password
   */
  async forgotPassword(email) {
    const response = await api.post('/auth/forgot-password', { email });
    return response.data;
  }

  /**
   * Reset password
   */
  async resetPassword(token, newPassword, confirmPassword) {
    const response = await api.post(`/auth/reset-password/${token}`, {
      newPassword,
      confirmPassword,
    });
    return response.data;
  }

  /**
   * Get current user
   */
  async getCurrentUser() {
    const response = await api.get('/auth/me');
    return response.data.data.user;
  }

  /**
   * Verify session
   */
  async verifySession() {
    const response = await api.get('/auth/verify-session');
    return response.data.authenticated;
  }

  /**
   * Change password
   */
  async changePassword(currentPassword, newPassword, confirmNewPassword) {
    const response = await api.put('/auth/change-password', {
      currentPassword,
      newPassword,
      confirmNewPassword,
    });
    return response.data;
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated() {
    return !!localStorage.getItem('auth_token');
  }

  /**
   * Get token
   */
  getToken() {
    return localStorage.getItem('auth_token');
  }
}

export default new AuthService();
