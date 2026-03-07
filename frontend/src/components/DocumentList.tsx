import { useState, useEffect, useRef } from 'react';
import { Document } from '@/types';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { FileText, Calendar, Trash2, Eye, Search, Loader2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { documentsApi } from '@/lib/api';

interface DocumentListProps {
  documents: Document[];
  loading: boolean;
  onSelectDocument: (document: Document) => void;
  onGoToUpload?: () => void;
  compact?: boolean;
  selectedDocumentId?: number;
}

const SEARCH_DEBOUNCE_MS = 400;

export function DocumentList({ documents, loading, onSelectDocument, onGoToUpload, compact, selectedDocumentId }: DocumentListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [serverResults, setServerResults] = useState<Document[] | null>(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!searchTerm.trim()) {
      setServerResults(null);
      return;
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      debounceRef.current = null;
      setSearchLoading(true);
      documentsApi
        .searchDocuments(searchTerm.trim())
        .then(setServerResults)
        .catch(() => setServerResults([]))
        .finally(() => setSearchLoading(false));
    }, SEARCH_DEBOUNCE_MS);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [searchTerm]);

  const effectiveList =
    searchTerm.trim() && serverResults !== null
      ? serverResults
      : documents.filter((doc) =>
          doc.original_filename.toLowerCase().includes(searchTerm.toLowerCase())
        );
  const isServerSearch = searchTerm.trim() && serverResults !== null;

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (fileType: string) => {
    if (fileType.includes('pdf')) return '📄';
    if (fileType.includes('word') || fileType.includes('doc')) return '📝';
    if (fileType.includes('image')) return '🖼️';
    return '📄';
  };

  if (loading && documents.length === 0) {
    return (
      <div className={compact ? "space-y-2" : "space-y-4"}>
        {[...Array(compact ? 2 : 3)].map((_, i) => (
          <Card key={i} className="border-slate-200/80">
            <CardContent className={compact ? "p-3" : "p-6"}>
              <div className="animate-pulse space-y-3">
                <div className="flex items-center space-x-3">
                  <div className={`bg-slate-200 rounded-xl ${compact ? "w-8 h-8" : "w-12 h-12"}`} />
                  <div className="flex-1 space-y-2">
                    <div className={`h-3 bg-slate-200 rounded ${compact ? "w-2/3" : "w-3/4"}`} />
                    {!compact && <div className="h-2 bg-slate-200 rounded w-1/2" />}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className={compact ? "space-y-2" : "space-y-6"}>
      {!compact && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name or content..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white"
          />
          {searchLoading && (
            <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary-500 animate-spin" />
          )}
        </div>
      )}
      {isServerSearch && !compact && (
        <p className="text-xs text-slate-500">
          Showing results from document content and analysis
        </p>
      )}

      {effectiveList.length === 0 && (
        <Card className="border-slate-200/80 shadow-soft">
          <CardContent className="text-center py-12">
            <FileText className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-900 mb-2">
              {documents.length === 0 ? 'No documents yet' : 'No documents found'}
            </h3>
            <p className="text-slate-600 mb-4">
              {documents.length === 0
                ? 'Upload your first document to get started'
                : 'Try a different search or clear the search box'}
            </p>
            {documents.length === 0 && onGoToUpload && (
              <Button onClick={onGoToUpload}>Upload document</Button>
            )}
          </CardContent>
        </Card>
      )}

      {effectiveList.length > 0 && (
        <div className={compact ? "space-y-2" : "space-y-4"}>
          {effectiveList.map((document) => (
            <div
              key={document.id}
              onClick={() => onSelectDocument(document)}
              className={`cursor-pointer rounded-xl border transition-all duration-200 ${
                compact
                  ? selectedDocumentId === document.id
                    ? 'bg-blue-50 border-blue-300 shadow-sm'
                    : 'bg-white border-slate-200 hover:border-blue-300 hover:shadow-sm'
                  : 'bg-white border-slate-200/80 shadow-soft hover:shadow-md'
              }`}
            >
              <div className={compact ? "p-3" : "p-6"}>
                <div className="flex items-center gap-3">
                  <div className={`shrink-0 ${compact ? "text-lg" : "text-2xl"}`}>{getFileIcon(document.file_type)}</div>
                  <div className="flex-1 min-w-0">
                    <h3 className={`font-medium text-slate-900 truncate ${compact ? "text-sm" : "text-lg"}`}>
                      {document.original_filename}
                    </h3>
                    {!compact && (
                      <div className="flex items-center flex-wrap gap-x-4 gap-y-1 text-sm text-slate-500 mt-1">
                        <span>{formatFileSize(document.file_size)}</span>
                        <span className="flex items-center">
                          <Calendar className="w-4 h-4 mr-1" />
                          {formatDistanceToNow(new Date(document.created_at), { addSuffix: true })}
                        </span>
                      </div>
                    )}
                    {compact && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {document.extracted_text && (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-emerald-100 text-emerald-800">
                            ✓
                          </span>
                        )}
                        {document.ai_analysis && (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                            AI
                          </span>
                        )}
                      </div>
                    )}
                    {!compact && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {document.extracted_text && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                            Text extracted
                          </span>
                        )}
                        {document.ai_analysis && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-700">
                            AI analysis
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  {!compact && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onSelectDocument(document)}
                      className="flex items-center gap-2 shrink-0 border-slate-200"
                    >
                      <Eye className="w-4 h-4" />
                      View
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
