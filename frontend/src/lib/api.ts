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

// In-memory token getter (set by useAuth) so requests always use current session token
let authTokenGetter: (() => string | null) | null = null;
export function setAuthTokenGetter(getter: (() => string | null) | null) {
  authTokenGetter = getter;
}
// Called on 401 so auth hook can clear in-memory token and user state
let authClearCallback: (() => void) | null = null;
export function setAuthClearCallback(cb: (() => void) | null) {
  authClearCallback = cb;
}

// Request interceptor: use getter first, then localStorage; trim to avoid invalid JWT
api.interceptors.request.use((config) => {
  const raw = authTokenGetter?.() ?? (typeof localStorage !== 'undefined' ? localStorage.getItem('access_token') : null);
  const token = typeof raw === 'string' ? raw.trim() : '';
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

/** Get current auth headers (for multipart/form-data so Authorization is not dropped). */
export function getAuthHeaders(): Record<string, string> {
  const raw = authTokenGetter?.() ?? (typeof localStorage !== 'undefined' ? localStorage.getItem('access_token') : null);
  const token = typeof raw === 'string' ? raw.trim() : '';
  const headers: Record<string, string> = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

/** Multipart request headers: always include Authorization when we have a token (avoids 401 on 2nd request). */
function multipartHeaders(): Record<string, string> {
  const h: Record<string, string> = { 'Content-Type': 'multipart/form-data' };
  const auth = getAuthHeaders();
  if (auth.Authorization) h.Authorization = auth.Authorization;
  return h;
}

// Response interceptor: on 401, retry once (avoids logout on spurious 401); then clear and redirect.
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status !== 401) return Promise.reject(error);

    const config = error.config;
    const alreadyRetried = (config as any).__retry401;
    if (!alreadyRetried && config) {
      (config as any).__retry401 = true;
      const token = authTokenGetter?.() ?? (typeof localStorage !== 'undefined' ? localStorage.getItem('access_token') : null);
      const t = typeof token === 'string' ? token.trim() : '';
      if (t) {
        try {
          config.headers = { ...config.headers, Authorization: `Bearer ${t}` };
          const res = await api.request(config);
          return res;
        } catch (retryErr) {
          // Retry also failed; fall through to clear and redirect
        }
      }
    }

    authClearCallback?.();
    if (typeof localStorage !== 'undefined') localStorage.removeItem('access_token');
    if (typeof window !== 'undefined' && !Router.asPath.startsWith('/login')) {
      const detail = error.response?.data?.detail || '';
      const expired = typeof detail === 'string' && detail.toLowerCase().includes('expired');
      Router.replace(expired ? '/login?reason=expired' : '/login');
    }
    return Promise.reject(error);
  }
);

export const authApi = {
  login: async (username: string, password: string): Promise<AuthResponse> => {
    const formData = new FormData();
    formData.append('username', username);
    formData.append('password', password);

    const response = await api.post<AuthResponse>('/token', formData, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });
    const data = response.data;
    if (!data?.access_token || typeof data.access_token !== 'string') {
      throw new Error('Invalid login response: missing access_token');
    }
    return data;
  },

  register: async (username: string, email: string, password: string): Promise<User> => {
    const response = await api.post('/register', {
      username,
      email,
      password,
    });
    return response.data;
  },

  /** Get current user. Pass token to use for this request only (e.g. right after login). */
  getCurrentUser: async (token?: string | null): Promise<User> => {
    const config = token
      ? { headers: { Authorization: `Bearer ${token}` } }
      : {};
    const response = await api.get<User>('/me', config);
    return response.data;
  },
};

export const documentsApi = {
  upload: async (file: File): Promise<UploadResponse> => {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await api.post('/upload', formData, {
      headers: multipartHeaders(),
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

export interface ServicesStatus {
  document_intelligence: boolean;
  openai: boolean;
  text_analytics: boolean;
  qna: boolean;
  clock: boolean;
  vision: boolean;
  search?: boolean;
  rag?: boolean;
}

export const servicesApi = {
  getStatus: async (): Promise<ServicesStatus> => {
    const response = await api.get<ServicesStatus>('/api/services/status');
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

export const qnaApi = {
  getInfo: async (): Promise<any> => {
    const response = await api.get('/qna/info');
    return response.data;
  },
  ask: async (question: string): Promise<any> => {
    const response = await api.post('/qna/ask', { question });
    return response.data;
  },
  askTop: async (question: string, top: number = 3): Promise<any> => {
    const response = await api.post('/qna/ask-top', { question, top });
    return response.data;
  },
};

export const clockApi = {
  getInfo: async (): Promise<any> => {
    const response = await api.get('/clock/info');
    return response.data;
  },
  analyze: async (query: string): Promise<any> => {
    const response = await api.post('/clock/analyze', { query });
    return response.data;
  },
};

export const visionApi = {
  getInfo: async (): Promise<any> => {
    const response = await api.get('/vision/info');
    return response.data;
  },
  analyzeImage: async (file: File, features: string[] = ['caption', 'tags', 'objects', 'people']): Promise<any> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('features', features.join(','));
    const response = await api.post('/vision/analyze', formData, {
      headers: multipartHeaders(),
    });
    return response.data;
  },
  readText: async (file: File): Promise<any> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post('/vision/read-text', formData, {
      headers: multipartHeaders(),
    });
    return response.data;
  },
};

export const infoExtractionApi = {
  analyze: async (file: File): Promise<{ fields: Record<string, string>; raw_text?: string; error?: string }> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post('/api/info-extraction/analyze', formData, {
      headers: multipartHeaders(),
    });
    return response.data;
  },
  analyzeInvoice: async (file: File): Promise<{ fields: Record<string, any>; content?: string; error?: string }> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post('/api/document-intelligence/analyze-invoice', formData, {
      headers: multipartHeaders(),
    });
    return response.data;
  },
};

export const knowledgeSearchApi = {
  search: async (query: string, index?: string): Promise<{ results: any[]; count: number; error?: string }> => {
    const response = await api.post('/api/knowledge/search', { query, index });
    return response.data;
  },
  searchGet: async (q: string, index?: string): Promise<{ results: any[]; count: number; error?: string }> => {
    const params = new URLSearchParams({ q });
    if (index) params.set('index', index);
    const response = await api.get(`/api/knowledge/search?${params}`);
    return response.data;
  },
};

export const ragApi = {
  ensureIndex: async (): Promise<{ ok: boolean; index?: string; error?: string }> => {
    const response = await api.post('/api/rag/ensure-index');
    return response.data;
  },
  ingest: async (documentId: number): Promise<{ indexed: number; chunks?: number; error?: string }> => {
    const response = await api.post('/api/rag/ingest', null, { params: { document_id: documentId } });
    return response.data;
  },
  ask: async (question: string): Promise<{ answer: string; sources: any[]; error?: string }> => {
    const response = await api.post('/api/rag/ask', { question });
    return response.data;
  },
};
