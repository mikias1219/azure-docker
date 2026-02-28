import { useState, useEffect, useRef, useCallback } from 'react';
import { Document } from '@/types';
import { documentsApi } from '@/lib/api';

export function useDocuments() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const initialFetchDoneRef = useRef(false);

  const fetchDocuments = useCallback(async (): Promise<Document[]> => {
    try {
      setLoading(true);
      const docs = await documentsApi.getDocuments();
      setDocuments(docs);
      return docs;
    } catch (error) {
      console.error('Failed to fetch documents:', error);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      setLoading(false);
      return;
    }
    if (initialFetchDoneRef.current) return;
    initialFetchDoneRef.current = true;
    let cancelled = false;
    setLoading(true);
    documentsApi
      .getDocuments()
      .then((docs) => {
        if (!cancelled) setDocuments(docs);
      })
      .catch((err) => {
        if (!cancelled) console.error('Failed to fetch documents:', err);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const uploadDocument = async (file: File) => {
    try {
      setUploading(true);
      setUploadProgress(0);
      
      const response = await documentsApi.upload(file);
      await fetchDocuments();
      
      return { success: true, documentId: response.document_id };
    } catch (error: any) {
      return { 
        success: false, 
        error: error.response?.data?.detail || 'Upload failed' 
      };
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const deleteDocument = async (id: number) => {
    try {
      await documentsApi.deleteDocument(id);
      setDocuments(prev => prev.filter(doc => doc.id !== id));
    } catch (error) {
      console.error('Failed to delete document:', error);
      throw error;
    }
  };

  const getDocument = useCallback(async (id: number) => {
    return documentsApi.getDocument(id);
  }, []);

  return {
    documents,
    loading,
    uploading,
    uploadProgress,
    fetchDocuments,
    uploadDocument,
    deleteDocument,
    getDocument,
  };
}
