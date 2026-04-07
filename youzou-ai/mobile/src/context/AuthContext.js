import React, { createContext, useContext, useState, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
import axios from 'axios';
import { API_BASE_URL } from '../config/api';

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
  const [tokens, setTokens] = useState(null);

  useEffect(() => {
    loadStoredAuth();
  }, []);

  const loadStoredAuth = async () => {
    try {
      const storedToken = await SecureStore.getItemAsync('authToken');
      const storedRefreshToken = await SecureStore.getItemAsync('refreshToken');
      const storedUser = await SecureStore.getItemAsync('user');

      if (storedToken && storedRefreshToken && storedUser) {
        setTokens({
          accessToken: storedToken,
          refreshToken: storedRefreshToken
        });
        setUser(JSON.parse(storedUser));
        
        // Validate token by making a test request
        try {
          await axios.get(`${API_BASE_URL}/auth/validate`, {
            headers: { Authorization: `Bearer ${storedToken}` }
          });
        } catch (error) {
          // Token is invalid, try to refresh
          await refreshToken(storedRefreshToken);
        }
      }
    } catch (error) {
      console.error('Error loading stored auth:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/auth/login`, {
        email,
        password
      });

      const { data } = response.data;
      
      await storeAuthData(data.user, data.tokens);
      setUser(data.user);
      setTokens(data.tokens);

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error?.message || '登入失敗，請稍後再試'
      };
    }
  };

  const googleLogin = async (idToken) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/auth/google-login`, {
        idToken
      });

      const { data } = response.data;
      
      await storeAuthData(data.user, data.tokens);
      setUser(data.user);
      setTokens(data.tokens);

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error?.message || 'Google 登入失敗，請稍後再試'
      };
    }
  };

  const register = async (userData) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/auth/register`, userData);
      
      const { data } = response.data;
      
      await storeAuthData(data.user, data.tokens);
      setUser(data.user);
      setTokens(data.tokens);

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error?.message || '註冊失敗，請稍後再試'
      };
    }
  };

  const logout = async () => {
    try {
      // Call logout endpoint
      if (tokens?.accessToken) {
        await axios.post(`${API_BASE_URL}/auth/logout`, {}, {
          headers: { Authorization: `Bearer ${tokens.accessToken}` }
        });
      }
    } catch (error) {
      console.error('Logout API error:', error);
    } finally {
      // Clear stored data
      await SecureStore.deleteItemAsync('authToken');
      await SecureStore.deleteItemAsync('refreshToken');
      await SecureStore.deleteItemAsync('user');
      
      setUser(null);
      setTokens(null);
    }
  };

  const refreshToken = async (refreshToken) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/auth/refresh-token`, {
        refreshToken
      });

      const { data } = response.data;
      
      await SecureStore.setItemAsync('authToken', data.tokens.accessToken);
      await SecureStore.setItemAsync('refreshToken', data.tokens.refreshToken);
      
      setTokens(data.tokens);

      return { success: true };
    } catch (error) {
      // Refresh failed, logout user
      await logout();
      return {
        success: false,
        error: '登入已過期，請重新登入'
      };
    }
  };

  const updateUser = async (userData) => {
    try {
      const response = await axios.put(`${API_BASE_URL}/user/profile`, userData, {
        headers: { Authorization: `Bearer ${tokens.accessToken}` }
      });

      const updatedUser = response.data.data.user;
      setUser(updatedUser);
      
      // Update stored user data
      await SecureStore.setItemAsync('user', JSON.stringify(updatedUser));

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error?.message || '更新失敗，請稍後再試'
      };
    }
  };

  const storeAuthData = async (userData, tokenData) => {
    await SecureStore.setItemAsync('authToken', tokenData.accessToken);
    await SecureStore.setItemAsync('refreshToken', tokenData.refreshToken);
    await SecureStore.setItemAsync('user', JSON.stringify(userData));
  };

  const getAuthHeaders = () => {
    if (!tokens?.accessToken) return {};
    return {
      Authorization: `Bearer ${tokens.accessToken}`
    };
  };

  const value = {
    user,
    tokens,
    isLoading,
    login,
    googleLogin,
    register,
    logout,
    refreshToken,
    updateUser,
    getAuthHeaders
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};