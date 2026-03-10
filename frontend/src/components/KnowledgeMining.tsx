import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import {
  Search, Send, Loader2, Database, Zap, Terminal,
  Layers, Share2, Info, ChevronRight, BarChart3,
  ExternalLink, FileText
} from 'lucide-react';
import { searchApi } from '@/lib/api';

export function KnowledgeMining() {
  const [query, setQuery] = useState('');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    if (!query.trim() || loading) return;
    setLoading(true);
    setResult(null);
    try {
      const res = await searchApi.search(query.trim());
      setResult(res);
    } catch {
      setResult({ results: [], error: 'Search Engine non-responsive.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Precision Search Header */}
      <div className="glass-studio p-2 rounded-2xl flex items-center gap-3 border-white/5 shadow-2xl">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="Query indexed corpus (Hybrid Vector + Keyword)..."
            className="w-full bg-black/20 border-none rounded-xl pl-11 pr-4 py-3 text-sm text-white placeholder:text-slate-700 focus:ring-1 focus:ring-blue-500 outline-none font-mono"
          />
        </div>
        <Button
          onClick={handleSearch}
          disabled={loading || !query.trim()}
          className="bg-blue-600 hover:bg-blue-500 text-white font-bold h-11 px-8 rounded-xl shadow-lg shadow-blue-500/20"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Zap className="w-4 h-4 mr-2" />}
          {loading ? 'EXECUTING...' : 'RUN MINER'}
        </Button>
      </div>

      <div className="grid grid-cols-12 gap-8">
        {/* Results Feed */}
        <div className="col-span-12 lg:col-span-8 space-y-4">
          {!result && !loading ? (
            <div className="h-[450px] border-2 border-dashed border-white/5 rounded-3xl flex flex-col items-center justify-center text-center p-12 bg-white/[0.01]">
              <div className="w-16 h-16 rounded-2xl bg-white/[0.02] flex items-center justify-center mb-6">
                <Database className="w-8 h-8 text-slate-700" />
              </div>
              <h4 className="text-lg font-bold text-slate-500 uppercase tracking-widest">Mining Corpus Idle</h4>
              <p className="text-slate-600 text-sm max-w-sm mt-3">Perform semantic discovery across documented datasets using Azure AI Search.</p>
            </div>
          ) : result ? (
            <div className="space-y-4 animate-fadeIn">
              <div className="flex items-center justify-between mb-4">
                <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">
                  Found {result.results?.length || 0} Relevant Documents
                </span>
              </div>
              {result.results?.map((item: any, i: number) => (
                <Card key={i} className="card-engineer bg-white/[0.01] border-white/5 hover:border-blue-500/30 transition-all group">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-500">
                          <FileText className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-white group-hover:text-blue-400 transition-colors">{item.file_name}</h4>
                          <div className="text-[9px] font-mono text-slate-600 uppercase tracking-tighter">SCORE: {item['@search.score']?.toFixed(4) || 'N/A'}</div>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-slate-600 hover:text-white hover:bg-white/5">
                        <ExternalLink className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed font-sans line-clamp-3">
                      "{item.content}"
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="h-[450px] flex flex-col items-center justify-center gap-6">
              <div className="w-12 h-12 relative">
                <div className="absolute inset-0 border-2 border-blue-500/10 rounded-full"></div>
                <div className="absolute inset-0 border-2 border-blue-500 border-t-white rounded-full animate-spin"></div>
              </div>
              <div className="text-[10px] font-mono text-slate-500 uppercase tracking-[0.2em] animate-pulse">Scanning Partition...</div>
            </div>
          )}
        </div>

        {/* Internal State / Telemetry Sidebar */}
        <div className="col-span-12 lg:col-span-4 space-y-6">
          <Card className="card-engineer bg-black/40 border-slate-800">
            <CardHeader className="py-3 border-b border-white/5">
              <CardTitle className="text-[10px] font-mono uppercase tracking-widest text-slate-500 flex items-center gap-2">
                <BarChart3 className="w-4 h-4" />
                Search Telemetry
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-3 font-mono text-[10px]">
              <div className="flex justify-between border-b border-white/5 pb-2">
                <span className="text-slate-500">INDEX_ID:</span>
                <span className="text-blue-400 underline decoration-dotted">vector-knowledge-mining</span>
              </div>
              <div className="flex justify-between border-b border-white/5 pb-2">
                <span className="text-slate-500">ALGORITHM:</span>
                <span className="text-emerald-500">HNSW + BM25</span>
              </div>
              <div className="flex justify-between pb-2 text-[11px] text-white font-bold">
                <span className="text-slate-500 uppercase tracking-tighter">Status:</span>
                <span className="text-emerald-500 animate-pulse">ACTIVE</span>
              </div>
            </CardContent>
          </Card>

          <Card className="card-engineer border-purple-500/10 bg-purple-500/[0.01]">
            <CardHeader className="py-2 border-b border-white/5">
              <CardTitle className="text-[9px] font-mono uppercase tracking-widest text-purple-400 flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5" />
                Engineer Note
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <p className="text-[11px] text-slate-500 italic leading-relaxed">
                "Knowledge Mining combines keyword matching with vector embeddings to find relevant document fragments even when exact words don't match."
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
