import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import {
  Sparkles, Send, Loader2, Info, Zap, Terminal,
  MessageSquare, History, ChevronRight
} from 'lucide-react';
import { qnaApi } from '@/lib/api';

export function QuestionAnswering() {
  const [question, setQuestion] = useState('');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handleAsk = async () => {
    if (!question.trim() || loading) return;
    setLoading(true);
    setResult(null);
    try {
      const res = await qnaApi.ask(question.trim());
      setResult(res);
    } catch {
      setResult({ answer: 'Failed to connect to the Cognitive Language service.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Input Terminal */}
        <Card className="card-engineer border-blue-200 bg-blue-50/40">
          <CardHeader className="py-4 border-b border-slate-200">
            <CardTitle className="text-xs font-mono uppercase tracking-widest text-blue-400 flex items-center gap-2">
              <Terminal className="w-4 h-4" />
              Step 1: Ask a question
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <p className="text-[11px] text-slate-500 mb-4 font-mono">Step 2: Click Run. Step 3: Response appears on the right.</p>
            <div className="space-y-4">
              <textarea
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="Query syntax or natural language..."
                className="w-full h-32 bg-white border border-slate-200 rounded-xl px-4 py-3 text-xs text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/40 outline-none font-mono resize-none transition-all"
              />
              <Button
                onClick={handleAsk}
                disabled={loading || !question.trim()}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold h-11 shadow-[0_4px_15px_rgba(37,99,235,0.3)] transition-all active:scale-95"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Zap className="w-4 h-4 mr-2" />}
                {loading ? 'EXECUTING INFERENCE...' : 'RUN INFERENCE'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Results / Reasoning Terminal */}
        <div className="space-y-6">
          {!result && !loading ? (
            <div className="h-full border-2 border-dashed border-slate-200 rounded-3xl flex flex-col items-center justify-center text-center p-8 bg-white">
              <Sparkles className="w-12 h-12 text-slate-800 mb-4" />
              <h4 className="text-sm font-bold text-slate-500 uppercase tracking-widest">Awaiting Signal</h4>
              <p className="text-[10px] text-slate-600 mt-2 max-w-[200px]">Send a query to initialize the AI Language Q&A reasoning engine.</p>
            </div>
          ) : result ? (
            <>
              <Card className="card-engineer border-emerald-200 bg-emerald-50/40">
                <CardHeader className="py-3 border-b border-slate-200">
                  <CardTitle className="text-[10px] font-mono uppercase tracking-widest text-emerald-400 flex items-center gap-2">
                    <MessageSquare className="w-4 h-4" />
                    Step 3: Response — Answer
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-5">
                  <p className="text-sm text-slate-800 leading-relaxed">
                    {result.answer}
                  </p>
                </CardContent>
              </Card>

              {result.reasoning && (
                <Card className="card-engineer border-purple-200 bg-purple-50/40">
                  <CardHeader className="py-2 border-b border-slate-200">
                    <CardTitle className="text-[9px] font-mono uppercase tracking-widest text-purple-400 flex items-center gap-2">
                      <History className="w-3.5 h-3.5" />
                      Internal Reasoning
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4">
                    <p className="text-[11px] text-purple-700 italic font-mono leading-relaxed">
                      "{result.reasoning}"
                    </p>
                  </CardContent>
                </Card>
              )}

              {result.debug && (
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 font-mono text-[10px] space-y-2">
                  <div className="flex justify-between items-center text-slate-500">
                    <span>DOC_MODEL:</span>
                    <span className="text-blue-400">{result.debug.model || 'cognitiveservices-qna'}</span>
                  </div>
                  <div className="flex justify-between items-center text-slate-500">
                    <span>LATENCY:</span>
                    <span className="text-emerald-500">{result.debug.latency_ms}ms</span>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full gap-4">
              <div className="relative">
                <div className="w-12 h-12 rounded-full border-4 border-blue-500/20 border-t-blue-500 animate-spin"></div>
                <div className="absolute inset-0 blur-lg bg-blue-500/20 rounded-full"></div>
              </div>
              <span className="text-[10px] font-mono text-slate-500 animate-pulse">PROCESSING AI NEURONS...</span>
            </div>
          )}
        </div>
      </div>

      {/* Suggested Queries */}
      <div className="glass-studio p-4 rounded-xl">
        <h4 className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2">
          <ChevronRight className="w-3 h-3" />
          Pre-approved Context Queries
        </h4>
        <div className="flex flex-wrap gap-2">
          {['How do I reset my password?', 'What services can I use?', 'Contact support hours'].map(q => (
            <button
              key={q}
              onClick={() => setQuestion(q)}
              className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-[10px] text-slate-700 hover:bg-slate-50 transition-all"
            >
              {q}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
