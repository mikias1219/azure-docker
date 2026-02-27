import { useState, useEffect } from 'react';
import { User } from '@/types';
import { authApi } from '@/lib/api';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient) return;
    
    const token = localStorage.getItem('access_token');
    if (token) {
      // Parse JWT to get user info without API call
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        setUser({ 
          id: payload.sub || 1, 
          username: payload.sub || 'user', 
          email: payload.email || 'user@example.com' 
        });
      } catch (error) {
        // If token is invalid, remove it
        localStorage.removeItem('access_token');
      }
    }
    setLoading(false);
  }, [isClient]);

  const login = async (username: string, password: string) => {
    try {
      const response = await authApi.login(username, password);
      localStorage.setItem('access_token', response.access_token);
      setUser({ id: 1, username, email: `${username}@example.com` });
      return { success: true };
    } catch (error: any) {
      return { 
        success: false, 
        error: error.response?.data?.detail || 'Login failed' 
      };
    }
  };

  const register = async (username: string, email: string, password: string) => {
    try {
      await authApi.register(username, email, password);
      return { success: true };
    } catch (error: any) {
      return { 
        success: false, 
        error: error.response?.data?.detail || 'Registration failed' 
      };
    }
  };

  const logout = () => {
    localStorage.removeItem('access_token');
    setUser(null);
  };

  const isAuthenticated = !!user;

  return {
    user,
    loading,
    isAuthenticated,
    login,
    register,
    logout,
  };
}
