import { useState, useEffect, useRef } from 'react';
import { User } from '@/types';
import { authApi, setAuthTokenGetter, setAuthClearCallback } from '@/lib/api';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isClient, setIsClient] = useState(false);
  const tokenRef = useRef<string | null>(null);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Expose token to api interceptor so all requests (including text-analytics) use current session
  useEffect(() => {
    if (!isClient) return;
    setAuthTokenGetter(() => tokenRef.current || localStorage.getItem('access_token'));
    setAuthClearCallback(() => {
      tokenRef.current = null;
      setUser(null);
    });
    return () => {
      setAuthTokenGetter(null);
      setAuthClearCallback(null);
    };
  }, [isClient]);

  useEffect(() => {
    if (!isClient) return;

    const initAuth = async () => {
      const token = (localStorage.getItem('access_token') || '').trim();

      if (!token) {
        tokenRef.current = null;
        setLoading(false);
        return;
      }

      tokenRef.current = token;
      try {
        const me = await authApi.getCurrentUser(token);
        setUser(me);
      } catch {
        tokenRef.current = null;
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
      const token = response.access_token.trim();
      tokenRef.current = token;
      localStorage.setItem('access_token', token);

      try {
        const me = await authApi.getCurrentUser(token);
        setUser(me);
      } catch {
        setUser({ id: 1, username, email: `${username}@example.com` });
      }

      return { success: true };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.detail || error.message || 'Login failed',
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
    tokenRef.current = null;
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
