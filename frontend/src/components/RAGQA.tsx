import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import {
  MessageSquare, Send, Loader2, Database, Zap, Terminal,
  Layers, Search, Share2, Info, ChevronRight, BarChart3, AlertCircle
} from 'lucide-react';
import { ragApi } from '@/lib/api';

export function RAGQA() {
  const [question, setQuestion] = useState('');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handleAsk = async () => {
    if (!question.trim() || loading) return;
    setLoading(true);
    setResult(null);
    try {
      const res = await ragApi.ask(question.trim());
      setResult(res);
    } catch {
      setResult({ answer: 'Communication error: RAG pipeline non-responsive.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Search Header */}
      <div className="glass-studio p-1.5 rounded-2xl flex items-center gap-2 border-white/5 shadow-2xl">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAsk()}
            placeholder="Query global vectorized knowledge store..."
            className="w-full bg-black/20 border-none rounded-xl pl-11 pr-4 py-3 text-sm text-white placeholder:text-slate-600 focus:ring-1 focus:ring-blue-500 outline-none font-mono"
          />
        </div>
        <Button
          onClick={handleAsk}
          disabled={loading || !question.trim()}
          className="bg-blue-600 hover:bg-blue-500 text-white font-bold h-11 px-6 rounded-xl"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Zap className="w-4 h-4 mr-2" />}
          {loading ? 'MINING...' : 'RUN PIPELINE'}
        </Button>
      </div>

      <div className="grid grid-cols-12 gap-8">
        {/* Main Answer Panel */}
        <div className="col-span-12 lg:col-span-8 space-y-6">
          {result?.error && (
            <div className="flex items-center gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-sm">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span>{result.error}</span>
            </div>
          )}
          {!result && !loading ? (
            <div className="h-[400px] border-2 border-dashed border-white/5 rounded-3xl flex flex-col items-center justify-center text-center p-12 bg-white/[0.01]">
              <div className="w-16 h-16 rounded-2xl bg-white/[0.02] flex items-center justify-center mb-6">
                <Database className="w-8 h-8 text-slate-700" />
              </div>
              <h4 className="text-lg font-bold text-slate-500 uppercase tracking-widest">Knowledge Store Idle</h4>
              <p className="text-slate-600 text-sm max-w-sm">Step 1: Enter a question above. Step 2: Click Run. Step 3: View the answer and sources here.</p>
            </div>
          ) : result && !result.error ? (
            <>
              <Card className="card-engineer border-blue-500/20 bg-blue-500/[0.02]">
                <CardHeader className="py-4 border-b border-white/10 flex flex-row items-center justify-between">
                  <CardTitle className="text-[10px] font-mono uppercase tracking-widest text-blue-400 flex items-center gap-2">
                    <Terminal className="w-4 h-4" />
                    Synthesized Knowledge Result
                  </CardTitle>
                  <span className="text-[9px] font-mono text-slate-500">ENGINE: RAG-V3-ALPHA</span>
                </CardHeader>
                <CardContent className="p-6">
                  <p className="text-base text-slate-100 leading-relaxed font-sans">
                    {result.answer}
                  </p>
                </CardContent>
              </Card>

              {/* Internal Reasoning Section */}
              <Card className="card-engineer border-purple-500/20 bg-purple-500/[0.02]">
                <CardHeader className="py-3 border-b border-white/5">
                  <CardTitle className="text-[10px] font-mono uppercase tracking-widest text-purple-400 flex items-center gap-2">
                    <Zap className="w-4 h-4" />
                    Strategic Reasoning
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  <p className="text-xs text-purple-200/70 italic font-mono leading-relaxed">
                    "{result.reasoning || 'Heuristic logic applied to retrieved chunks.'}"
                  </p>
                </CardContent>
              </Card>
            </>
          ) : result?.error ? (
            <div className="h-[300px] border-2 border-dashed border-white/5 rounded-3xl flex flex-col items-center justify-center text-center p-8 bg-white/[0.01]">
              <p className="text-slate-500 text-sm">An error occurred. See the message above. Ensure Azure OpenAI and the RAG index are configured.</p>
            </div>
          ) : (
            <div className="h-[400px] flex flex-col items-center justify-center gap-6">
              <div className="relative">
                <div className="w-20 h-20 rounded-full border-4 border-blue-500/10 border-t-blue-500 animate-spin"></div>
                <div className="absolute inset-0 blur-2xl bg-blue-500/10 rounded-full animate-pulse"></div>
              </div>
              <div className="text-center space-y-2">
                <div className="text-xs font-mono text-slate-400 uppercase tracking-[0.2em] animate-pulse">Scanning Vector Space</div>
                <div className="text-[10px] font-mono text-slate-600">Retrieving Top-K Semantic Chunks...</div>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar: Chunks & Metadata */}
        <div className="col-span-12 lg:col-span-4 space-y-6">
          {result?.debug && (
            <Card className="card-engineer bg-black/40 border-slate-800">
              <CardHeader className="py-3 border-b border-white/5">
                <CardTitle className="text-[10px] font-mono uppercase tracking-widest text-slate-500 flex items-center gap-2">
                  <BarChart3 className="w-4 h-4" />
                  Pipeline Telemetry
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-3 font-mono text-[10px]">
                <div className="flex justify-between border-b border-white/5 pb-2">
                  <span className="text-slate-500">RETRIEVAL ENGINE:</span>
                  <span className="text-blue-400">AZURE SEARCH</span>
                </div>
                <div className="flex justify-between border-b border-white/5 pb-2">
                  <span className="text-slate-500">LATENCY:</span>
                  <span className="text-emerald-500">{result.debug.latency_ms}ms</span>
                </div>
                <div className="flex justify-between border-b border-white/5 pb-2">
                  <span className="text-slate-500">MODEL_ID:</span>
                  <span className="text-amber-500">{result.debug.model}</span>
                </div>
                <div className="flex justify-between pb-2 text-[11px] text-white font-bold">
                  <span className="text-slate-500">TOKENS:</span>
                  <span>{result.debug.tokens || 'N/A'}</span>
                </div>
              </CardContent>
            </Card>
          )}

          {result?.sources && result.sources.length > 0 && (
            <div className="space-y-4">
              <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                <Layers className="w-3 h-3" />
                Semantic Source Chunks
              </h4>
              {result.sources.map((src: any, i: number) => (
                <Card key={i} className="card-engineer bg-white/[0.01] border-white/5 group hover:border-blue-500/30">
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-[9px] font-mono text-blue-500 uppercase tracking-tight font-bold truncate max-w-[150px]">
                        FILE: {src.file_name}
                      </div>
                      <div className="text-[9px] font-mono text-slate-600 bg-white/5 px-1.5 py-0.5 rounded">
                        SCORE: {src.score?.toFixed(3) || '0.00'}
                      </div>
                    </div>
                    <p className="text-[10px] text-slate-500 line-clamp-3 leading-relaxed group-hover:text-slate-300 transition-colors">
                      "{src.content_preview}"
                    </p>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
