import { Document } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { FileText, Brain, Download, Calendar, HardDrive } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface DocumentViewerProps {
  document: Document;
}

export function DocumentViewer({ document }: DocumentViewerProps) {
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

  return (
    <div className="space-y-6">
      {/* Document Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <span className="text-2xl">{getFileIcon(document.file_type)}</span>
            {document.original_filename}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <HardDrive className="w-4 h-4 text-gray-500" />
              <span className="text-gray-600">Size:</span>
              <span className="font-medium">{formatFileSize(document.file_size)}</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-gray-500" />
              <span className="text-gray-600">Created:</span>
              <span className="font-medium">
                {formatDistanceToNow(new Date(document.created_at), {
                  addSuffix: true,
                })}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-gray-500" />
              <span className="text-gray-600">Type:</span>
              <span className="font-medium">{document.file_type}</span>
            </div>
            <div className="flex items-center gap-2">
              <Brain className="w-4 h-4 text-gray-500" />
              <span className="text-gray-600">Status:</span>
              <span className="font-medium">
                {document.ai_analysis ? 'Analyzed' : 'Processing'}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Extracted Text */}
      {document.extracted_text && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Extracted Text
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-gray-50 rounded-lg p-4 max-h-96 overflow-y-auto">
              <pre className="whitespace-pre-wrap text-sm text-gray-700 font-mono">
                {document.extracted_text}
              </pre>
            </div>
            <div className="mt-4 flex justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  navigator.clipboard.writeText(document.extracted_text || '');
                }}
              >
                Copy Text
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* AI Analysis */}
      {document.ai_analysis && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="w-5 h-5" />
              AI Analysis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose max-w-none">
              <div
                className="bg-blue-50 rounded-lg p-4 text-sm text-gray-700 whitespace-pre-wrap"
                dangerouslySetInnerHTML={{
                  __html: document.ai_analysis.replace(/\n/g, '<br />'),
                }}
              />
            </div>
            {document.analysis_confidence && (
              <div className="mt-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Analysis Confidence</span>
                  <span className="font-medium">
                    {Math.round(document.analysis_confidence * 100)}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full"
                    style={{ width: `${document.analysis_confidence * 100}%` }}
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Processing Status */}
      {!document.extracted_text && !document.ai_analysis && (
        <Card>
          <CardContent className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-4"></div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Processing Document
            </h3>
            <p className="text-gray-600">
              We're analyzing your document. This may take a few moments...
            </p>
            <p className="text-sm text-gray-500 mt-2">
              You can check back later or refresh to see the results.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <div className="flex justify-end space-x-4">
        <Button variant="outline">
          <Download className="w-4 h-4 mr-2" />
          Download Original
        </Button>
        <Button>
          <FileText className="w-4 h-4 mr-2" />
          Export Analysis
        </Button>
      </div>
    </div>
  );
}
