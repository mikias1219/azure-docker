import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Loader2, Search, FileText } from 'lucide-react';
import { knowledgeSearchApi } from '@/lib/api';

export function KnowledgeMining() {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ results: any[]; count: number; error?: string } | null>(null);

  const handleSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setResult(null);
    try {
      const data = await knowledgeSearchApi.search(query.trim());
      setResult(data);
    } catch (err: any) {
      setResult({ results: [], count: 0, error: err.response?.data?.detail || 'Search failed' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <Card className="border-slate-200/80 shadow-soft">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-slate-800">
            <Search className="w-5 h-5 text-emerald-600" />
            Knowledge Mining
          </CardTitle>
          <p className="text-sm text-slate-500 mt-1">
            Search across indexed documents (Azure AI Search). Index documents via RAG ingest first.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Enter search query..."
              className="flex-1"
            />
            <Button onClick={handleSearch} disabled={loading || !query.trim()}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              Search
            </Button>
          </div>
          {result?.error && (
            <div className="rounded-lg bg-amber-50 border border-amber-200 text-amber-800 px-3 py-2 text-sm">
              {result.error}
            </div>
          )}
          {result && !result.error && (
            <div className="space-y-2">
              <p className="text-sm text-slate-600">{result.count} result(s)</p>
              <div className="space-y-3">
                {result.results.map((doc: any, i: number) => (
                  <div key={i} className="rounded-lg border border-slate-200 bg-white p-3">
                    <p className="text-xs text-slate-500 flex items-center gap-1">
                      <FileText className="w-3.5 h-3.5" />
                      {doc.file_name || doc.metadata_storage_name || 'Document'}
                    </p>
                    <p className="text-sm text-slate-700 mt-1 line-clamp-3">
                      {doc.content || doc.summary || '—'}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
