import { useState, useMemo } from 'react';
import { Document } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import {
  FileText, Brain, Download, Calendar, HardDrive, MessageCircle,
  Send, Loader2, CheckCircle, Database, Terminal, Zap, Info, ShieldCheck
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { documentsApi, ragApi } from '@/lib/api';

interface DocumentViewerProps {
  document: Document;
  onRefresh?: () => void;
}

export function DocumentViewer({ document, onRefresh }: DocumentViewerProps) {
  const [question, setQuestion] = useState('');
  const [askResult, setAskResult] = useState<any>(null);
  const [asking, setAsking] = useState(false);
  const [ingesting, setIngesting] = useState(false);
  const [ingestMsg, setIngestMsg] = useState<string | null>(null);

  // Parse structured AI analysis if it's JSON
  const analysisData = useMemo(() => {
    if (!document.ai_analysis) return null;
    try {
      // If it starts with {, it's likely our new JSON format
      if (document.ai_analysis.trim().startsWith('{')) {
        return JSON.parse(document.ai_analysis);
      }
      return { report: document.ai_analysis, reasoning: 'Legacy analysis format.' };
    } catch (e) {
      return { report: document.ai_analysis, reasoning: 'Text-only analysis.' };
    }
  }, [document.ai_analysis]);

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizeLabels = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizeLabels[i];
  };

  const handleAsk = async () => {
    if (!question.trim() || asking) return;
    setAsking(true);
    setAskResult(null);
    try {
      const res = await documentsApi.askDocument(document.id, question.trim());
      setAskResult(res);
    } catch {
      setAskResult({ answer: 'Failed to get an answer. Try again.' });
    } finally {
      setAsking(false);
    }
  };

  const handleIngestToRag = async () => {
    if (ingesting || !document.extracted_text) return;
    setIngesting(true);
    setIngestMsg(null);
    try {
      const res = await ragApi.ingest(document.id);
      if (res.error) setIngestMsg(res.error);
      else setIngestMsg(`SUCCESS: Vectorized ${res.indexed} nodes.`);
    } catch {
      setIngestMsg('ERROR: Ingestion stream interrupted.');
    } finally {
      setIngesting(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* File Metadata Header */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass-studio p-4 rounded-xl flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-500">
            <HardDrive className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">Storage Size</div>
            <div className="text-sm font-mono text-white font-bold">{formatFileSize(document.file_size)}</div>
          </div>
        </div>
        <div className="glass-studio p-4 rounded-xl flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-500">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">Initialized</div>
            <div className="text-sm font-mono text-white font-bold">{formatDistanceToNow(new Date(document.created_at), { addSuffix: true })}</div>
          </div>
        </div>
        <div className="glass-studio p-4 rounded-xl flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">System Status</div>
            <div className="text-sm font-mono text-emerald-500 font-bold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              VERIFIED
            </div>
          </div>
        </div>
      </div>

      {/* Main Content: Extracted Text */}
      {document.extracted_text && (
        <Card className="card-engineer">
          <CardHeader className="border-b border-white/5 bg-white/[0.02] flex flex-row items-center justify-between py-3">
            <CardTitle className="text-xs font-mono uppercase tracking-widest text-slate-400 flex items-center gap-2">
              <FileText className="w-4 h-4 text-blue-500" />
              Raw OCR Output
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigator.clipboard.writeText(document.extracted_text || '')}
              className="h-7 text-[10px] px-2 bg-white/5 border-white/10 hover:bg-white/10"
            >
              COPY BUFFER
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            <div className="bg-black/50 p-6 max-h-80 overflow-y-auto font-mono text-xs leading-relaxed text-slate-400">
              <pre className="whitespace-pre-wrap">{document.extracted_text}</pre>
            </div>
          </CardContent>
        </Card>
      )}

      {/* AI Intelligence Panel */}
      {analysisData && (
        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-12 lg:col-span-8">
            <Card className="card-engineer h-full">
              <CardHeader className="border-b border-white/5 bg-white/[0.02]">
                <CardTitle className="text-xs font-mono uppercase tracking-widest text-slate-400 flex items-center gap-2">
                  <Brain className="w-5 h-5 text-purple-500" />
                  AI Synthesis Report
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 prose prose-invert max-w-none">
                <div
                  className="text-slate-300 text-sm leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: analysisData.report?.replace(/\n/g, '<br />') }}
                />
              </CardContent>
            </Card>
          </div>

          <div className="col-span-12 lg:col-span-4 space-y-6">
            {/* Reasoning Module */}
            <Card className="card-engineer border-purple-500/20 bg-purple-500/5">
              <CardHeader className="py-3 border-b border-white/5">
                <CardTitle className="text-[10px] font-mono uppercase tracking-widest text-purple-400 flex items-center gap-2">
                  <Zap className="w-4 h-4" />
                  Internal Reasoning
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <p className="text-xs text-purple-200/70 italic leading-relaxed">
                  "{analysisData.reasoning}"
                </p>
              </CardContent>
            </Card>

            {/* Performance/Debug Metadata */}
            {analysisData.debug && (
              <Card className="card-engineer bg-black/40 border-slate-800">
                <CardHeader className="py-2 border-b border-white/5">
                  <CardTitle className="text-[9px] font-mono uppercase tracking-widest text-slate-500">System Metadata</CardTitle>
                </CardHeader>
                <CardContent className="p-4 space-y-2 font-mono text-[10px]">
                  <div className="flex justify-between">
                    <span className="text-slate-500">ENGINE:</span>
                    <span className="text-blue-400">{analysisData.debug.model}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">LATENCY:</span>
                    <span className="text-emerald-500">{analysisData.debug.latency_ms}ms</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">TOKENS:</span>
                    <span className="text-amber-500">{analysisData.debug.tokens || 'N/A'}</span>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}

      {/* Interactive Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* RAG Ingestion */}
        <Card className="card-engineer bg-emerald-500/[0.02] border-emerald-500/10">
          <CardHeader className="py-4">
            <CardTitle className="text-sm font-bold flex items-center gap-2 text-emerald-400">
              <Database className="w-4 h-4" />
              Vector Knowledge Mining
            </CardTitle>
          </CardHeader>
          <CardContent className="px-6 pb-6 pt-0">
            <p className="text-xs text-slate-500 mb-4 font-medium">Inject this document context into the global RAG vector store for semantic querying.</p>
            <Button onClick={handleIngestToRag} disabled={ingesting || !document.extracted_text} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold h-10">
              {ingesting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Zap className="w-4 h-4 mr-2" />}
              {ingesting ? 'PROCESSING STREAM...' : 'EXECUTE INGESTION'}
            </Button>
            {ingestMsg && (
              <div className="mt-3 p-2 bg-black/40 border border-white/5 rounded font-mono text-[10px] text-emerald-500">
                {ingestMsg}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Local Q&A */}
        <Card className="card-engineer border-blue-500/20 flex flex-col">
          <CardHeader className="py-4">
            <CardTitle className="text-sm font-bold flex items-center gap-2 text-blue-400">
              <MessageCircle className="w-4 h-4" />
              Scoped QA Assistant
            </CardTitle>
          </CardHeader>
          <CardContent className="px-6 pb-6 pt-0 flex-grow">
            <div className="flex gap-2">
              <input
                type="text"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAsk()}
                placeholder="Query scoped to this context..."
                className="flex-1 bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-xs text-white placeholder:text-slate-600 focus:ring-1 focus:ring-blue-500 outline-none font-mono"
              />
              <Button
                onClick={handleAsk}
                disabled={asking || !question.trim()}
                className="bg-blue-600 hover:bg-blue-500 h-9"
              >
                {asking ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </Button>
            </div>
            {askResult && (
              <div className="mt-4 space-y-3">
                <div className="p-3 bg-white/[0.02] border border-white/5 rounded-xl text-xs text-slate-300">
                  <div className="font-bold text-blue-500 mb-1 uppercase tracking-widest text-[9px]">Answer Synthesized:</div>
                  {askResult.answer}
                </div>
                {askResult.reasoning && (
                  <div className="flex items-start gap-2 text-[10px] text-slate-500 italic">
                    <Info className="w-3 h-3 mt-0.5 shrink-0" />
                    <span>Logic: {askResult.reasoning}</span>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Footer Actions */}
      <div className="flex justify-end gap-3 pt-6 border-t border-white/5">
        <Button variant="ghost" className="text-slate-500 hover:text-white hover:bg-white/5 text-xs">
          <Download className="w-3.5 h-3.5 mr-2" />
          EXTRACT RAW (.TXT)
        </Button>
        <Button variant="outline" className="border-white/10 bg-white/5 text-white hover:bg-white/10 text-xs">
          <FileText className="w-3.5 h-3.5 mr-2" />
          GENERATE FULL AUDIT
        </Button>
      </div>
    </div>
  );
}
