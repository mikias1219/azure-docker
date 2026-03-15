import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import {
  Clock, Send, Loader2, Zap, Terminal, Navigation,
  MapPin, Calendar, Clock4, Info, Target
} from 'lucide-react';
import { clockApi } from '@/lib/api';

export function ClockClient() {
  const [query, setQuery] = useState('');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handleAnalyze = async () => {
    if (!query.trim() || loading) return;
    setLoading(true);
    setResult(null);
    try {
      const res = await clockApi.analyze(query.trim());
      setResult(res);
    } catch {
      setResult({ response: 'CLU Engine connection timeout.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="rounded-xl bg-slate-100 border border-slate-200 px-4 py-3 text-sm text-slate-700">
        <strong className="text-slate-800">Steps:</strong>{' '}
        <span className="font-medium">1.</span> Enter a phrase (e.g. &quot;What time is it?&quot; or &quot;What time is it in Tokyo?&quot;) →
        <span className="font-medium"> 2.</span> Click &quot;Run CLU&quot; →
        <span className="font-medium"> 3.</span> See the response and the detected intent and entities (e.g. location, time).
      </div>
      {/* Search Bar / Input */}
      <div className="glass-studio p-2 rounded-2xl flex items-center gap-2 shadow-sm">
        <div className="flex-1 relative">
          <Navigation className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 rotate-45" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAnalyze()}
            placeholder="Natural language temporal query (e.g. 'What time is it in Tokyo?')"
            className="w-full bg-white border border-slate-200 rounded-xl pl-11 pr-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/40 outline-none font-mono"
          />
        </div>
        <Button
          onClick={handleAnalyze}
          disabled={loading || !query.trim()}
          className="bg-blue-600 hover:bg-blue-500 text-white font-bold h-11 px-6 rounded-xl"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Zap className="w-4 h-4 mr-2" />}
          {loading ? 'ANALYZING...' : 'RUN CLU'}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Main Response Display */}
        <div className="md:col-span-7 space-y-6">
          {!result && !loading ? (
            <div className="h-64 border-2 border-dashed border-slate-200 rounded-3xl flex flex-col items-center justify-center text-center p-8 bg-white">
              <Clock4 className="w-12 h-12 text-slate-800 mb-4" />
              <h4 className="text-sm font-bold text-slate-500 uppercase tracking-widest">Temporal Logic Offline</h4>
              <p className="text-[10px] text-slate-600 mt-2">Awaiting natural language input for Conversational Language Understanding.</p>
            </div>
          ) : result ? (
            <Card className="card-engineer border-blue-200 bg-blue-50/40 h-full flex flex-col">
              <CardHeader className="py-4 border-b border-slate-200">
                <CardTitle className="text-[10px] font-mono uppercase tracking-widest text-blue-400 flex items-center gap-2">
                  <Terminal className="w-4 h-4" />
                  Processed Response
                </CardTitle>
              </CardHeader>
              <CardContent className="p-8 flex flex-col items-center justify-center flex-grow text-center">
                <div className="text-3xl font-black text-slate-900 tracking-tight mb-4">
                  {result.response}
                </div>
                <div className="flex items-center gap-2 text-[10px] text-slate-600 font-mono uppercase bg-white px-3 py-1.5 rounded-full border border-slate-200">
                  <MapPin className="w-3 h-3" />
                  Source: {result.entities?.find((e: any) => e.category === 'Location')?.text || 'System Local'}
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="h-64 flex flex-col items-center justify-center gap-4">
              <div className="w-10 h-10 rounded-full border-4 border-blue-500/20 border-t-blue-500 animate-spin"></div>
              <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">Parsing Intents...</span>
            </div>
          )}
        </div>

        {/* Intent Mapping & Metadata */}
        <div className="md:col-span-5 space-y-6">
          {result && (
            <>
              {/* Intent Confidence Gauge */}
              <Card className="card-engineer border-purple-200 bg-purple-50/40">
                <CardHeader className="py-2 border-b border-slate-200">
                  <CardTitle className="text-[9px] font-mono uppercase tracking-widest text-purple-400">CLU Intent Mapping</CardTitle>
                </CardHeader>
                <CardContent className="p-4 space-y-4">
                  <div>
                    <div className="flex justify-between items-end mb-1.5">
                      <span className="text-slate-900 text-xs font-bold font-mono">{result.top_intent}</span>
                      <span className="text-[10px] font-mono text-purple-400">{(result.confidence * 100).toFixed(1)}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-purple-500 shadow-[0_0_10px_#a855f7]"
                        style={{ width: `${result.confidence * 100}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Entities List */}
                  <div className="space-y-2">
                    <span className="text-[8px] font-bold text-slate-600 uppercase tracking-[0.2em]">Context Entities</span>
                    <div className="flex flex-wrap gap-2">
                      {result.entities?.length > 0 ? result.entities.map((e: any, i: number) => (
                        <div key={i} className="flex items-center gap-1.5 px-2 py-1 rounded bg-white border border-slate-200 text-[9px] font-mono text-slate-700">
                          <span className="text-blue-500 uppercase">{e.category}:</span>
                          <span className="text-slate-900">{e.text}</span>
                        </div>
                      )) : (
                        <span className="text-[9px] text-slate-700 italic">No entities extracted.</span>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Internal Reasoning */}
              <Card className="card-engineer border-emerald-500/10 bg-emerald-500/[0.01]">
                <CardHeader className="py-2 border-b border-white/5">
                  <CardTitle className="text-[9px] font-mono uppercase tracking-widest text-emerald-500 flex items-center gap-1.5">
                    <Target className="w-3 h-3" />
                    Logic Trace
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-3">
                  <p className="text-[10px] text-slate-400 font-mono italic leading-relaxed">
                    "{result.reasoning || 'Default heuristic logic applied.'}"
                  </p>
                </CardContent>
              </Card>

              {/* Telemetry */}
              {result.debug && (
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 font-mono text-[9px] space-y-1.5">
                  <div className="flex justify-between text-slate-600">
                    <span>PROJECT:</span>
                    <span className="text-slate-900">{result.debug.project}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>LATENCY:</span>
                    <span className="text-emerald-500">{result.debug.latency_ms}ms</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>API_VERSION:</span>
                    <span className="text-amber-500">2023-10-01-preview</span>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
