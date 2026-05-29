/**
 * Authentication Service
 * API calls for authentication endpoints
 */

import api from './api';

class AuthService {
  async signup(userData) {
    const response = await api.post('/auth/signup', userData);
    return response.data;
  }

  async login(credentials) {
    const response = await api.post('/auth/login', credentials);
    return response.data;
  }

  async verifyOtp(email, otp) {
    // Clear any stale token from a previous session before completing new login
    localStorage.removeItem('auth_token');
    const response = await api.post('/auth/verify-otp', { email, otp });
    if (response.data.data?.token) {
      localStorage.setItem('auth_token', response.data.data.token);
    }
    return response.data;
  }

  async logout() {
    try {
      await api.post('/auth/logout');
    } finally {
      localStorage.removeItem('auth_token');
    }
  }

  async forgotPassword(email) {
    const response = await api.post('/auth/forgot-password', { email });
    return response.data;
  }

  async resetPassword(token, newPassword, confirmPassword) {
    const response = await api.post(`/auth/reset-password/${token}`, { newPassword, confirmPassword });
    return response.data;
  }

  async getCurrentUser() {
    const response = await api.get('/auth/me');
    return response.data.data.user;
  }

  async verifySession() {
    const response = await api.get('/auth/verify-session');
    return response.data.authenticated;
  }

  async changePassword(currentPassword, newPassword, confirmNewPassword) {
    const response = await api.put('/auth/change-password', { currentPassword, newPassword, confirmNewPassword });
    return response.data;
  }

  isAuthenticated() {
    return !!localStorage.getItem('auth_token');
  }

  getToken() {
    return localStorage.getItem('auth_token');
  }
}

export default new AuthService();
