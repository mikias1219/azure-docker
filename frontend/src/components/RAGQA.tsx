import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Loader2, MessageCircle, Send, FileText } from 'lucide-react';
import { ragApi } from '@/lib/api';

export function RAGQA() {
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ answer: string; sources: any[]; error?: string } | null>(null);

  const handleAsk = async () => {
    if (!question.trim()) return;
    setLoading(true);
    setResult(null);
    try {
      const data = await ragApi.ask(question.trim());
      setResult(data);
    } catch (err: any) {
      setResult({ answer: '', sources: [], error: err.response?.data?.detail || 'Request failed' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <Card className="border-slate-200/80 shadow-soft">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-slate-800">
            <MessageCircle className="w-5 h-5 text-violet-600" />
            RAG Q&A
          </CardTitle>
          <p className="text-sm text-slate-500 mt-1">
            Ask questions over your indexed documents. Ingest documents first (Documents tab → select doc → Ingest to RAG).
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAsk()}
              placeholder="Ask a question about your documents..."
              className="flex-1"
            />
            <Button onClick={handleAsk} disabled={loading || !question.trim()}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              Ask
            </Button>
          </div>
          {result?.error && (
            <div className="rounded-lg bg-amber-50 border border-amber-200 text-amber-800 px-3 py-2 text-sm">
              {result.error}
            </div>
          )}
          {result && !result.error && result.answer && (
            <div className="space-y-4">
              <div className="rounded-xl bg-slate-50 border border-slate-100 p-4">
                <p className="text-sm font-medium text-slate-600 mb-2">Answer</p>
                <p className="text-slate-800 whitespace-pre-wrap">{result.answer}</p>
              </div>
              {result.sources && result.sources.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-slate-500 mb-2">Sources</p>
                  <div className="flex flex-wrap gap-2">
                    {result.sources.map((s: any, i: number) => (
                      <span
                        key={i}
                        className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-2 py-1 text-xs text-slate-700"
                      >
                        <FileText className="w-3 h-3" />
                        {s.file_name || 'Document'}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
