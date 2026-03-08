import { useState } from 'react';
import { Document } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { FileText, Brain, Download, Calendar, HardDrive, MessageCircle, Send, Loader2, CheckCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { documentsApi } from '@/lib/api';

interface DocumentViewerProps {
  document: Document;
  onRefresh?: () => void;
}

export function DocumentViewer({ document, onRefresh }: DocumentViewerProps) {
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState<string | null>(null);
  const [asking, setAsking] = useState(false);

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

  const handleAsk = async () => {
    if (!question.trim() || asking) return;
    setAsking(true);
    setAnswer(null);
    try {
      const res = await documentsApi.askDocument(document.id, question.trim());
      setAnswer(res.answer);
    } catch {
      setAnswer('Failed to get an answer. Try again.');
    } finally {
      setAsking(false);
    }
  };

  const steps = [
    { done: !!document.extracted_text, label: 'Text extracted' },
    { done: !!document.ai_analysis, label: 'AI analysis' },
  ];
  const allDone = document.extracted_text && document.ai_analysis;

  return (
    <div className="space-y-6">
      <Card className="border-slate-200/80 shadow-soft overflow-hidden">
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <span className="text-2xl">{getFileIcon(document.file_type)}</span>
            {document.original_filename}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 mb-4">
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <HardDrive className="w-4 h-4 text-slate-400" />
              <span>{formatFileSize(document.file_size)}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <Calendar className="w-4 h-4 text-slate-400" />
              <span>{formatDistanceToNow(new Date(document.created_at), { addSuffix: true })}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <FileText className="w-4 h-4 text-slate-400" />
              <span>{document.file_type}</span>
            </div>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-sm font-medium text-slate-700">Steps:</span>
            {steps.map((s, i) => (
              <span
                key={i}
                className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
                  s.done ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-500'
                }`}
              >
                {s.done ? <CheckCircle className="w-3.5 h-3.5" /> : null}
                {s.label}
              </span>
            ))}
            {allDone && (
              <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium bg-primary-100 text-primary-700">
                <CheckCircle className="w-3.5 h-3.5" /> Ready
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      {!document.extracted_text && !document.ai_analysis && (
        <Card className="border-amber-200 bg-amber-50/50">
          <CardContent className="py-6">
            <p className="text-amber-800 font-medium">Processing or waiting for results</p>
            <p className="text-sm text-amber-700 mt-1">
              Extracted text and AI analysis are not ready yet. This can take a minute after upload. Click Refresh below to check again. If it stays empty, check that Document Intelligence and OpenAI are configured.
            </p>
            {onRefresh && (
              <Button variant="outline" size="sm" onClick={onRefresh} className="mt-3 border-amber-300 text-amber-800">
                Refresh
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {document.extracted_text && (
        <Card className="border-slate-200/80 shadow-soft">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-slate-900">
              <FileText className="w-5 h-5 text-primary-500" />
              Extracted Text
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-slate-50 rounded-xl p-4 max-h-96 overflow-y-auto border border-slate-100">
              <pre className="whitespace-pre-wrap text-sm text-slate-700 font-mono">
                {document.extracted_text}
              </pre>
            </div>
            <div className="mt-4 flex justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigator.clipboard.writeText(document.extracted_text || '')}
                className="border-slate-200"
              >
                Copy text
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {document.ai_analysis && (
        <Card className="border-slate-200/80 shadow-soft">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-slate-900">
              <Brain className="w-5 h-5 text-primary-500" />
              AI Analysis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div
              className="bg-primary-50/50 rounded-xl p-4 text-sm text-slate-700 whitespace-pre-wrap border border-primary-100"
              dangerouslySetInnerHTML={{
                __html: document.ai_analysis.replace(/\n/g, '<br />'),
              }}
            />
            {document.analysis_confidence != null && (
              <div className="mt-4">
                <div className="flex items-center justify-between text-sm text-slate-600 mb-1">
                  <span>Confidence</span>
                  <span className="font-medium">{Math.round(document.analysis_confidence * 100)}%</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-primary-500 h-2 rounded-full transition-all"
                    style={{ width: `${document.analysis_confidence * 100}%` }}
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {document.extracted_text && (
        <Card className="border-slate-200/80 shadow-soft">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-slate-900">
              <MessageCircle className="w-5 h-5 text-primary-500" />
              Ask a question
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-600 mb-3">
              Get answers from the document content using AI.
            </p>
            <div className="flex gap-2">
              <input
                type="text"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAsk()}
                placeholder="e.g. What is the main conclusion?"
                className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
              <Button onClick={handleAsk} disabled={asking || !question.trim()}>
                {asking ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                <span className="ml-2">{asking ? 'Asking…' : 'Ask'}</span>
              </Button>
            </div>
            {answer != null && (
              <div className="mt-4 rounded-xl bg-slate-50 border border-slate-100 p-4 text-sm text-slate-700 animate-fade-in">
                <p className="font-medium text-slate-600 mb-1">Answer</p>
                <p className="whitespace-pre-wrap">{answer}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <div className="flex justify-end gap-3">
        <Button variant="outline" className="border-slate-200">
          <Download className="w-4 h-4 mr-2" />
          Download original
        </Button>
        <Button>
          <FileText className="w-4 h-4 mr-2" />
          Export analysis
        </Button>
      </div>
    </div>
  );
}
