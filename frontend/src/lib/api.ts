import axios from 'axios';
import Router from 'next/router';
import { User, Document, AuthResponse, ApiResponse, UploadResponse } from '@/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor: clear token and redirect only on 401.
// We do NOT clear token on network errors or 5xx, so user credentials persist
// across app rebuilds/redeploys when the same origin is used.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('access_token');
      if (typeof window !== 'undefined' && !Router.asPath.startsWith('/login')) {
        Router.replace('/login');
      }
    }
    return Promise.reject(error);
  }
);

export const authApi = {
  login: async (username: string, password: string): Promise<AuthResponse> => {
    const formData = new FormData();
    formData.append('username', username);
    formData.append('password', password);
    
    const response = await api.post('/token', formData, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });
    return response.data;
  },

  register: async (username: string, email: string, password: string): Promise<User> => {
    const response = await api.post('/register', {
      username,
      email,
      password,
    });
    return response.data;
  },

  getCurrentUser: async (): Promise<User> => {
    const response = await api.get('/me');
    return response.data;
  },
};

export const documentsApi = {
  upload: async (file: File): Promise<UploadResponse> => {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await api.post('/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        const progress = Math.round(
          (progressEvent.loaded * 100) / (progressEvent.total || 1)
        );
        // You can emit this progress to a callback if needed
      },
    });
    return response.data;
  },

  getDocuments: async (): Promise<Document[]> => {
    const response = await api.get('/documents');
    return response.data;
  },

  getDocument: async (id: number): Promise<Document> => {
    const response = await api.get(`/documents/${id}`);
    return response.data;
  },

  deleteDocument: async (id: number): Promise<void> => {
    await api.delete(`/documents/${id}`);
  },

  searchDocuments: async (query: string): Promise<Document[]> => {
    const response = await api.post<Document[]>('/documents/search', { query });
    return response.data;
  },

  askDocument: async (documentId: number, question: string): Promise<{ answer: string }> => {
    const response = await api.post<{ answer: string }>(`/documents/${documentId}/ask`, {
      question,
    });
    return response.data;
  },
};

export const healthApi = {
  check: async (): Promise<{ status: string }> => {
    const response = await api.get('/health');
    return response.data;
  },
};

export const textAnalyticsApi = {
  analyze: async (text: string): Promise<any> => {
    const response = await api.post('/text-analytics/analyze', { text });
    return response.data;
  },
  detectLanguage: async (text: string): Promise<any> => {
    const response = await api.post('/text-analytics/language', { text });
    return response.data;
  },
  analyzeSentiment: async (text: string): Promise<any> => {
    const response = await api.post('/text-analytics/sentiment', { text });
    return response.data;
  },
  extractKeyPhrases: async (text: string): Promise<any> => {
    const response = await api.post('/text-analytics/key-phrases', { text });
    return response.data;
  },
  recognizeEntities: async (text: string): Promise<any> => {
    const response = await api.post('/text-analytics/entities', { text });
    return response.data;
  },
};
