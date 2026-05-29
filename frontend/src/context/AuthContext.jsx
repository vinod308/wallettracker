/**
 * Authentication Context
 * Global state management for authentication
 */

import { createContext, useState, useEffect, useCallback } from 'react';
import authService from '../services/authService';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      if (authService.isAuthenticated()) {
        const userData = await authService.getCurrentUser();
        setUser(userData);
        setIsAuthenticated(true);
      }
    } catch (error) {
      setUser(null);
      setIsAuthenticated(false);
      localStorage.removeItem('auth_token');
    } finally {
      setLoading(false);
    }
  };

  const login = useCallback(async (credentials) => {
    // Step 1: validates password, sends OTP. Returns { otpRequired: true }.
    const response = await authService.login(credentials);
    return response;
  }, []);

  const verifyOtp = useCallback(async (email, otp) => {
    // Step 2: verifies OTP, sets cookie + token, completes login.
    const response = await authService.verifyOtp(email, otp);
    setUser(response.data.user);
    setIsAuthenticated(true);
    return response;
  }, []);

  const signup = useCallback(async (userData) => {
    // Signup only triggers email verification — does NOT log the user in.
    const response = await authService.signup(userData);
    return response;
  }, []);

  const logout = useCallback(async () => {
    await authService.logout();
    setUser(null);
    setIsAuthenticated(false);
  }, []);

  const value = {
    user,
    loading,
    isAuthenticated,
    login,
    verifyOtp,
    signup,
    logout,
    refreshUser: loadUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
