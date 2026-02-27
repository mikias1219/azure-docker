import { useState, useEffect } from 'react';
import { Document } from '@/types';
import { documentsApi } from '@/lib/api';

export function useDocuments() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const docs = await documentsApi.getDocuments();
      setDocuments(docs);
    } catch (error) {
      console.error('Failed to fetch documents:', error);
    } finally {
      setLoading(false);
    }
  };

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

  return {
    documents,
    loading,
    uploading,
    uploadProgress,
    fetchDocuments,
    uploadDocument,
    deleteDocument,
  };
}
