import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const token = localStorage.getItem('authToken');
      if (token) {
        // Set default authorization header
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        
        // For demo purposes, we'll set a mock user
        // In production, you would validate the token with your backend
        setUser({
          id: 1,
          name: '管理員',
          email: 'admin@youzou-ai.com',
          role: 'admin'
        });
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      localStorage.removeItem('authToken');
      delete axios.defaults.headers.common['Authorization'];
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      // For demo purposes, we'll simulate a successful login
      // In production, you would call your backend API
      const mockResponse = {
        data: {
          success: true,
          data: {
            user: {
              id: 1,
              name: '管理員',
              email: email,
              role: 'admin'
            },
            tokens: {
              accessToken: 'mock-jwt-token',
              refreshToken: 'mock-refresh-token'
            }
          }
        }
      };

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      const { user: userData, tokens } = mockResponse.data.data;
      
      // Store tokens
      localStorage.setItem('authToken', tokens.accessToken);
      localStorage.setItem('refreshToken', tokens.refreshToken);
      
      // Set authorization header
      axios.defaults.headers.common['Authorization'] = `Bearer ${tokens.accessToken}`;
      
      setUser(userData);
      
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: '登入失敗，請檢查您的憑據'
      };
    }
  };

  const logout = async () => {
    try {
      // Clear stored tokens
      localStorage.removeItem('authToken');
      localStorage.removeItem('refreshToken');
      
      // Remove authorization header
      delete axios.defaults.headers.common['Authorization'];
      
      setUser(null);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const value = {
    user,
    isLoading,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};