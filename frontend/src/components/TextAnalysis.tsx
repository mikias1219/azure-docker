import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import {
  Languages, Send, Loader2, Zap, Terminal, Code,
  Eye, BarChart2, Tag, Quote, Info, Binary, ChevronRight
} from 'lucide-react';
import { textAnalyticsApi } from '@/lib/api';

export function TextAnalysis() {
  const [text, setText] = useState('');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [showRaw, setShowRaw] = useState(false);

  const keyPhrases: string[] = Array.isArray(result?.key_phrases) ? result.key_phrases : [];
  const entities: any[] = Array.isArray(result?.entities) ? result.entities : [];

  const handleAnalyze = async () => {
    if (!text.trim() || loading) return;
    setLoading(true);
    setResult(null);
    try {
      const res = await textAnalyticsApi.analyze(text.trim());
      setResult(res);
    } catch {
      setResult({ error: 'Linguistic Audit Pipeline failed to initialize.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-12 gap-8">
        {/* Input Pane */}
        <div className="col-span-12 lg:col-span-5 space-y-6">
          <p className="text-xs text-slate-500">Step 1: Paste text below. Step 2: Click &quot;Run linguistic audit&quot;. Step 3: See response (language, sentiment, phrases, entities) on the right.</p>
          <Card className="card-engineer border-blue-500/20 bg-blue-500/[0.02]">
            <CardHeader className="py-4 border-b border-white/5">
              <CardTitle className="text-xs font-mono uppercase tracking-widest text-blue-400 flex items-center gap-2">
                <Terminal className="w-4 h-4" />
                Enter text
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Paste linguistic data for deep analysis..."
                className="w-full h-64 bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-xs text-white placeholder:text-slate-700 focus:ring-1 focus:ring-blue-500 outline-none font-mono resize-none transition-all mb-4"
              />
              <Button
                onClick={handleAnalyze}
                disabled={loading || !text.trim()}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold h-11 shadow-[0_4px_15px_rgba(37,99,235,0.3)]"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Zap className="w-4 h-4 mr-2" />}
                {loading ? 'Analyzing…' : 'Step 2: Run analysis'}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Results Pane */}
        <div className="col-span-12 lg:col-span-7 space-y-6">
          {result?.error && (
            <div className="flex items-center gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-sm">
              {result.error}
            </div>
          )}
          {!result && !loading ? (
            <div className="h-full border-2 border-dashed border-white/5 rounded-3xl flex flex-col items-center justify-center text-center p-12 bg-white/[0.01]">
              <Languages className="w-16 h-16 text-slate-800 mb-6" />
              <h4 className="text-sm font-bold text-slate-500 uppercase tracking-widest">Step 3: Response</h4>
              <p className="text-[10px] text-slate-600 mt-2 max-w-[250px]">Analysis results will appear here after you run the audit.</p>
            </div>
          ) : result && !result.error ? (
            <div className="space-y-6">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-xs font-mono font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                  <BarChart2 className="w-4 h-4" />
                  Step 3: Response — Audit results
                </h3>
                <div className="flex bg-white/5 p-1 rounded-lg border border-white/10">
                  <button
                    onClick={() => setShowRaw(false)}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-[9px] font-bold transition-all ${!showRaw ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-slate-500 hover:text-slate-300'}`}
                  >
                    <Eye className="w-3 h-3" /> VISUAL
                  </button>
                  <button
                    onClick={() => setShowRaw(true)}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-[9px] font-bold transition-all ${showRaw ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-slate-500 hover:text-slate-300'}`}
                  >
                    <Code className="w-3 h-3" /> RAW JSON
                  </button>
                </div>
              </div>

              {showRaw ? (
                <div className="glass-studio p-0 rounded-2xl overflow-hidden border-white/10 shadow-2xl">
                  <div className="bg-black/80 p-6 font-mono text-[11px] leading-relaxed text-blue-400 max-h-[500px] overflow-y-auto custom-scrollbar">
                    <pre>{JSON.stringify(result, null, 2)}</pre>
                  </div>
                </div>
              ) : (
                <div className="space-y-6 animate-fadeIn">
                  {/* Language & Sentiment Row */}
                  <div className="grid grid-cols-2 gap-6">
                    <Card className="card-engineer border-blue-500/10 bg-blue-500/[0.01]">
                      <CardContent className="p-4 flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-500"><Languages className="w-4 h-4" /></div>
                        <div>
                          <div className="text-[8px] text-slate-500 uppercase font-bold tracking-widest">Detected Language</div>
                          <div className="text-sm font-bold text-white">{result.language?.name || 'EN'} ({((result.language?.confidence || 1) * 100).toFixed(0)}%)</div>
                        </div>
                      </CardContent>
                    </Card>
                    <Card className="card-engineer border-emerald-500/10 bg-emerald-500/[0.01]">
                      <CardContent className="p-4 flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500"><Binary className="w-4 h-4" /></div>
                        <div>
                          <div className="text-[8px] text-slate-500 uppercase font-bold tracking-widest">Global Sentiment</div>
                          <div className="text-sm font-bold text-white uppercase">{result.sentiment?.sentiment || 'NEUTRAL'}</div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Key Phrases */}
                  <Card className="card-engineer">
                    <CardHeader className="py-3 border-b border-white/5">
                      <CardTitle className="text-[10px] font-mono uppercase tracking-widest text-slate-400 flex items-center gap-2">
                        <Quote className="w-4 h-4 text-amber-500" />
                        Abstract Key Phrases
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 flex flex-wrap gap-2">
                      {keyPhrases.length > 0 ? (
                        keyPhrases.map((p: string, i: number) => (
                          <span key={i} className="text-[10px] font-mono bg-white/5 border border-white/5 px-2 py-1 rounded text-slate-300">
                            {p}
                          </span>
                        ))
                      ) : (
                        <span className="text-[10px] text-slate-600">No key phrases returned.</span>
                      )}
                    </CardContent>
                  </Card>

                  {/* Entity Mapping */}
                  <Card className="card-engineer">
                    <CardHeader className="py-3 border-b border-white/5">
                      <CardTitle className="text-[10px] font-mono uppercase tracking-widest text-slate-400 flex items-center gap-2">
                        <Tag className="w-4 h-4 text-purple-500" />
                        Entity Classification
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0 max-h-48 overflow-y-auto">
                      <div className="divide-y divide-white/5">
                        {entities.length > 0 ? (
                          entities.map((e: any, i: number) => (
                            <div key={i} className="flex items-center justify-between p-3 hover:bg-white/[0.02]">
                              <div className="flex items-center gap-3">
                                <span className="text-[10px] font-bold text-purple-400 font-mono w-24">[{e?.category ?? 'Entity'}]</span>
                                <span className="text-xs text-white font-medium">{e?.text ?? String(e ?? '')}</span>
                              </div>
                              <span className="text-[9px] font-mono text-slate-600">
                                {typeof e?.confidenceScore === 'number' ? `${(e.confidenceScore * 100).toFixed(0)}%` : '--'}
                              </span>
                            </div>
                          ))
                        ) : (
                          <div className="p-3 text-[10px] text-slate-600">No entities returned.</div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center gap-6">
              <div className="relative">
                <div className="w-16 h-16 rounded-full border-2 border-blue-500/10 border-t-blue-500 animate-spin"></div>
              </div>
              <div className="text-[10px] font-mono text-slate-500 uppercase tracking-widest animate-pulse">Running Service Pipeline...</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
