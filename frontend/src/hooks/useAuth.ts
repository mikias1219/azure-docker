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

    const initAuth = async () => {
      const token = localStorage.getItem('access_token');

      if (!token) {
        setLoading(false);
        return;
      }

      try {
        // Validate token and fetch real user info from backend
        const me = await authApi.getCurrentUser();
        setUser(me);
      } catch {
        // If token is invalid/expired, clear it
        localStorage.removeItem('access_token');
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    void initAuth();
  }, [isClient]);

  const login = async (username: string, password: string) => {
    try {
      const response = await authApi.login(username, password);
      localStorage.setItem('access_token', response.access_token);

      // After login, try to load the real user
      try {
        const me = await authApi.getCurrentUser();
        setUser(me);
      } catch {
        // Fallback if /me fails immediately after login
        setUser({ id: 1, username, email: `${username}@example.com` });
      }

      return { success: true };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.detail || 'Login failed',
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
        error: error.response?.data?.detail || 'Registration failed',
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
