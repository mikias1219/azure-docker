import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/hooks/useAuth';
import { useDocuments } from '@/hooks/useDocuments';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { DocumentUpload } from '@/components/DocumentUpload';
import { DocumentList } from '@/components/DocumentList';
import { DocumentViewer } from '@/components/DocumentViewer';
import { TextAnalysis } from '@/components/TextAnalysis';
import { QuestionAnswering } from '@/components/QuestionAnswering';
import { ClockClient } from '@/components/ClockClient';
import { AIVision } from '@/components/AIVision';
import { InfoExtraction } from '@/components/InfoExtraction';
import { KnowledgeMining } from '@/components/KnowledgeMining';
import { RAGQA } from '@/components/RAGQA';
import {
  FileText, LogOut, Brain, Languages, Sparkles, Clock, FolderOpen, X,
  Search, FileImage, CheckCircle, AlertCircle, ScanLine, Database,
  MessageSquare, Terminal, Activity, ChevronUp, ChevronDown, ListFilter,
  HelpCircle, ChevronRight, Zap, ShieldCheck, Box
} from 'lucide-react';
import { servicesApi, type ServicesStatus } from '@/lib/api';

interface ConsoleLog {
  id: string;
  timestamp: string;
  type: 'info' | 'api' | 'success' | 'error';
  service: string;
  message: string;
  data?: any;
}

export default function DashboardPage() {
  const { user, logout, loading: authLoading } = useAuth();
  const { documents, loading, uploadDocument, getDocument, fetchDocuments } = useDocuments();
  const router = useRouter();
  const [selectedDocument, setSelectedDocument] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'documents' | 'text-analytics' | 'qna' | 'clock' | 'vision' | 'info-extraction' | 'knowledge' | 'rag'>('documents');
  const [isClient, setIsClient] = useState(false);
  const [servicesStatus, setServicesStatus] = useState<ServicesStatus | null>(null);

  // Wizard State
  const [showWizard, setShowWizard] = useState(false);
  const [wizardStep, setWizardStep] = useState(1);

  // Engineering Console State
  const [logs, setLogs] = useState<ConsoleLog[]>([]);
  const [isConsoleOpen, setIsConsoleOpen] = useState(false);
  const consoleEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsClient(true);
    addLog('info', 'System', 'AI Studio initialized. All modules loaded.');

    // Auto-show wizard for new sessions
    const hasSeenWizard = localStorage.getItem('ai_studio_wizard_seen');
    if (!hasSeenWizard) {
      setTimeout(() => setShowWizard(true), 1500);
    }
  }, []);

  useEffect(() => {
    if (!user) return;
    servicesApi.getStatus()
      .then(status => {
        setServicesStatus(status);
        addLog('info', 'Azure', `Status check complete. ${Object.values(status).filter(v => v).length} services live.`);
      })
      .catch(() => {
        setServicesStatus(null);
        addLog('error', 'Azure', 'Communication error: Could not reach service status endpoint.');
      });
  }, [user]);

  useEffect(() => {
    if (isClient && !authLoading && !user) {
      router.replace('/login');
    }
  }, [user, authLoading, isClient, router]);

  useEffect(() => {
    if (isConsoleOpen) {
      consoleEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, isConsoleOpen]);

  const addLog = (type: ConsoleLog['type'], service: string, message: string, data?: any) => {
    const newLog: ConsoleLog = {
      id: Math.random().toString(36).substring(7),
      timestamp: new Date().toLocaleTimeString(),
      type,
      service,
      message,
      data
    };
    setLogs(prev => [...prev.slice(-49), newLog]);
  };

  const handleUpload = async (file: File) => {
    addLog('api', 'Storage', `Uploading file: ${file.name} (${(file.size / 1024).toFixed(1)} KB)`);
    const result = await uploadDocument(file);
    if (result.success) {
      addLog('success', 'Storage', 'Upload successful. Document indexed.');
      await fetchDocuments();
    } else {
      addLog('error', 'Storage', `Upload failed: ${result.error || 'Unknown error'}`);
    }
    return result;
  };

  const closeWizard = () => {
    setShowWizard(false);
    localStorage.setItem('ai_studio_wizard_seen', 'true');
  };

  if (!isClient || authLoading) {
    return (
      <div className="min-h-screen bg-[#0a0b10] flex items-center justify-center">
        <div className="relative">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500/20 border-t-blue-500"></div>
          <div className="absolute inset-0 bg-blue-500/10 blur-xl rounded-full"></div>
        </div>
      </div>
    );
  }

  if (!user) return null;

  const tabs = [
    { id: 'documents', label: '1. Ingest', icon: FolderOpen, desc: 'Source Aggregation' },
    { id: 'text-analytics', label: '2. Audit', icon: Languages, desc: 'Linguistic Logic' },
    { id: 'qna', label: '3. Reasoning', icon: Sparkles, desc: 'LLM Inference' },
    { id: 'rag', label: '4. Memory', icon: MessageSquare, desc: 'Vector Context' },
    { id: 'knowledge', label: '5. Mining', icon: Database, desc: 'Hybrid Discovery' },
    { id: 'vision', label: '6. Spatial', icon: FileImage, desc: 'Visual Parsing' },
    { id: 'info-extraction', label: '7. Schema', icon: ScanLine, desc: 'Structured OCR' },
    { id: 'clock', label: '8. Temporal', icon: Clock, desc: 'CLU Intentions' },
  ];

  const wizardSteps = [
    {
      title: "Welcome to AI Studio",
      desc: "This platform is designed for AI Engineers to inspect, audit, and pipe Azure AI services. Let's walk through the neural pipeline.",
      icon: Terminal,
      color: "bg-blue-600"
    },
    {
      title: "Phase 1: Source Ingestion",
      desc: "Upload documents or images. Our system performs deep OCR and AI elaboration automatically. Check the 'Ingest' tab to see extracted metadata.",
      icon: FolderOpen,
      color: "bg-purple-600"
    },
    {
      title: "Phase 2: Logic Audit",
      desc: "Use the 'Audit' and 'Spatial' tabs to see how the model 'thinks'. Every response includes 'Technical Reasoning' and 'Performance Telemetry'.",
      icon: Brain,
      color: "bg-emerald-600"
    },
    {
      title: "Phase 3: Global Memory (RAG)",
      desc: "Ingest your docs into the Vector Store to chat with your knowledge base across the entire platform. Real-time hybrid search ensures precision.",
      icon: Database,
      color: "bg-amber-600"
    }
  ];

  return (
    <div className="min-h-screen bg-[#0a0b10] text-slate-200 mesh-accent-1 relative overflow-x-hidden">
      <div className="scanline"></div>

      {/* Wizard Overlay */}
      {showWizard && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md animate-fadeIn">
          <Card className="max-w-xl w-full card-engineer border-white/10 shadow-[0_0_100px_rgba(37,99,235,0.2)]">
            <CardHeader className="flex flex-row items-center justify-between border-b border-white/5 py-4">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white ${wizardSteps[wizardStep - 1].color} shadow-lg`}>
                  {(() => { const Icon = wizardSteps[wizardStep - 1].icon; return <Icon className="w-5 h-5" /> })()}
                </div>
                <CardTitle className="text-lg font-black tracking-tight uppercase italic">SYSTEM_GUIDE :: STEP_0{wizardStep}</CardTitle>
              </div>
              <button onClick={closeWizard} className="p-2 hover:bg-white/5 rounded-full"><X className="w-5 h-5 text-slate-600" /></button>
            </CardHeader>
            <CardContent className="p-8 space-y-6">
              <h3 className="text-2xl font-black text-white">{wizardSteps[wizardStep - 1].title}</h3>
              <p className="text-slate-400 leading-relaxed font-medium">{wizardSteps[wizardStep - 1].desc}</p>

              <div className="flex gap-2">
                {[1, 2, 3, 4].map(s => (
                  <div key={s} className={`h-1 flex-1 rounded-full transition-all duration-300 ${s === wizardStep ? 'bg-blue-500 shadow-[0_0_10px_#3b82f6]' : s < wizardStep ? 'bg-emerald-500' : 'bg-white/5'}`}></div>
                ))}
              </div>

              <div className="flex items-center justify-between pt-4">
                <button onClick={closeWizard} className="text-xs font-mono text-slate-600 hover:text-slate-400 uppercase tracking-widest">Skip Initiative</button>
                <div className="flex gap-3">
                  {wizardStep > 1 && (
                    <Button variant="outline" onClick={() => setWizardStep(prev => prev - 1)} className="border-white/10 text-white hover:bg-white/5">BACK</Button>
                  )}
                  <Button
                    onClick={() => wizardStep < 4 ? setWizardStep(prev => prev + 1) : closeWizard()}
                    className="bg-blue-600 hover:bg-blue-500 px-8 font-black"
                  >
                    {wizardStep === 4 ? 'DISENGAGE' : 'CONTINUE'}
                    <ChevronRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* AI Studio Header */}
      <header className="glass-studio border-b border-white/5 sticky top-0 z-[60]">
        <div className="max-w-[1700px] mx-auto px-6 h-14 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center shadow-[0_0_15px_rgba(37,99,235,0.4)]">
              <Terminal className="w-4 h-4 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black tracking-tighter text-white">AI STUDIO <span className="text-blue-500 font-mono text-[10px] ml-1">TERMINAL_v2</span></span>
                <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 text-[10px] font-mono border border-emerald-500/20 uppercase tracking-tighter">DECRYPTED</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="hidden xl:flex items-center gap-6 text-[11px] font-mono text-slate-500 px-6 border-x border-white/5 h-14">
              <div className="flex items-center gap-2"><Activity className="w-3.5 h-3.5 text-blue-500" /> <span>OPS: 284/s</span></div>
              <div className="flex items-center gap-2 font-bold text-emerald-500"><ShieldCheck className="w-3.5 h-3.5" /> <span>FIREWALL: SECURE</span></div>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="sm" onClick={() => setShowWizard(true)} className="text-slate-500 hover:text-white hover:bg-white/5 font-mono text-[10px]">
                <HelpCircle className="w-3.5 h-3.5 mr-1" /> GUIDE
              </Button>
              <div className="h-6 w-px bg-white/5"></div>
              <span className="text-[11px] font-mono text-white tracking-widest uppercase">{user.username}</span>
              <button onClick={logout} className="p-2 hover:bg-white/5 rounded-lg text-slate-500 hover:text-white transition-colors">
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-[1700px] mx-auto px-6 py-8 pb-32">
        <div className="flex gap-8">
          {/* Vertical Stepper Navigation */}
          <aside className="w-56 flex-shrink-0 hidden lg:block">
            <div className="sticky top-28 space-y-1.5">
              <h3 className="text-[9px] font-black text-slate-600 uppercase tracking-[0.3em] mb-4 px-3 flex items-center gap-2">
                <Box className="w-3 h-3" /> Core Pipeline
              </h3>
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === (tab.id as any);
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-300 group relative ${isActive
                      ? 'bg-blue-600/10 text-blue-400 border border-blue-500/10 shadow-lg'
                      : 'text-slate-500 hover:text-white hover:bg-white/[0.03]'
                      }`}
                  >
                    {isActive && <div className="absolute left-0 w-1 h-6 bg-blue-500 rounded-r-full shadow-[0_0_10px_#3b82f6]"></div>}
                    <Icon className={`w-4 h-4 transition-colors ${isActive ? 'text-blue-500' : 'group-hover:text-white'}`} />
                    <div className="text-left">
                      <div className={`text-[11px] font-black leading-tight uppercase tracking-tight ${isActive ? 'text-white' : ''}`}>{tab.label}</div>
                      <div className="text-[9px] opacity-40 font-mono italic">{tab.desc}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </aside>

          {/* Dynamic Content Area */}
          <section className="flex-grow min-w-0">
            <div className="grid grid-cols-12 gap-8">
              {activeTab === 'documents' && (
                <>
                  <div className="col-span-12 xl:col-span-4 space-y-6">
                    <Card className="card-engineer">
                      <CardHeader className="border-b border-white/5 bg-white/[0.02] py-3">
                        <CardTitle className="text-[10px] font-mono uppercase tracking-widest text-slate-500 flex items-center gap-2">
                          <Zap className="w-4 h-4 text-amber-500" />
                          Source Stream
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-6">
                        <DocumentUpload onUpload={handleUpload} getDocument={getDocument} compact />
                      </CardContent>
                    </Card>

                    <Card className="card-engineer border-none bg-transparent shadow-none">
                      <CardHeader className="px-0 py-2">
                        <CardTitle className="text-[10px] font-mono uppercase tracking-widest text-slate-600 flex items-center gap-2">
                          <ListFilter className="w-3.5 h-3.5" /> Repository Registry
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-0">
                        <DocumentList
                          documents={documents}
                          loading={loading}
                          onSelectDocument={handleSelectDocument}
                          selectedDocumentId={selectedDocument?.id}
                          compact
                        />
                      </CardContent>
                    </Card>
                  </div>

                  <div className="col-span-12 xl:col-span-8">
                    {selectedDocument ? (
                      <div className="space-y-6 glass-studio p-1 rounded-3xl border-white/5 shadow-2xl overflow-hidden">
                        <div className="bg-white/[0.02] p-5 border-b border-white/5 flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-blue-600/10 border border-blue-500/20 flex items-center justify-center">
                              <FileText className="w-6 h-6 text-blue-400" />
                            </div>
                            <div>
                              <h2 className="text-xl font-black text-white tracking-tighter uppercase">{selectedDocument.filename}</h2>
                              <div className="text-[10px] font-mono text-slate-500 flex items-center gap-3">
                                <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> ID: {selectedDocument.id}</span>
                                <span className="opacity-40">|</span>
                                <span>STATUS: DEPLOYED</span>
                              </div>
                            </div>
                          </div>
                          <button onClick={() => setSelectedDocument(null)} className="p-2 hover:bg-white/5 rounded-full text-slate-500"><X className="w-5 h-5" /></button>
                        </div>
                        <div className="p-6 bg-[#0f111a]/80">
                          <DocumentViewer document={selectedDocument} onRefresh={fetchDocuments} />
                        </div>
                      </div>
                    ) : (
                      <div className="h-[600px] border border-white/5 rounded-[40px] flex flex-col items-center justify-center text-center p-12 bg-white/[0.01]">
                        <div className="w-24 h-24 rounded-[40px] bg-white/[0.02] flex items-center justify-center mb-8 border border-white/5 shadow-2xl">
                          <FolderOpen className="w-10 h-10 text-slate-800" />
                        </div>
                        <h4 className="text-2xl font-black text-slate-500 tracking-tight uppercase mb-3 italic">Awaiting Context</h4>
                        <p className="text-slate-600 text-sm max-w-sm font-medium leading-relaxed">System state: IDLE. Initialize the neural pipeline by selecting a source from the registry or uploading a new bitstream.</p>
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* Module Content Switcher */}
              <div className="col-span-12">
                <div className="animate-fadeIn">
                  {activeTab === 'text-analytics' && <TextAnalysis />}
                  {activeTab === 'qna' && <QuestionAnswering />}
                  {activeTab === 'clock' && <ClockClient />}
                  {activeTab === 'vision' && <AIVision />}
                  {activeTab === 'info-extraction' && <InfoExtraction />}
                  {activeTab === 'knowledge' && <KnowledgeMining />}
                  {activeTab === 'rag' && <RAGQA />}
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>

      {/* Engineering Console Overlay */}
      <div className={`fixed bottom-0 left-0 right-0 z-[100] transition-all duration-500 ease-in-out ${isConsoleOpen ? 'h-[450px]' : 'h-11'}`}>
        <div className="console-container h-full rounded-t-[32px] shadow-[0_-20px_100px_rgba(0,0,0,0.8)] border-t border-white/10 flex flex-col">
          <button
            onClick={() => setIsConsoleOpen(!isConsoleOpen)}
            className="console-header cursor-pointer select-none h-11 border-b border-white/5 flex items-center justify-between px-8"
          >
            <div className="flex items-center gap-4">
              <Terminal className="w-4 h-4 text-blue-500" />
              <span className="text-[10px] font-black font-mono tracking-[0.3em] uppercase text-white">Engineering Logs</span>
              <div className="h-4 w-px bg-white/10"></div>
              <span className="text-[9px] font-mono text-emerald-500 uppercase flex items-center gap-1.5 leading-none">
                <div className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse"></div>
                Stream: Live
              </span>
            </div>
            <div className="flex items-center gap-6">
              <span className="text-[9px] font-mono text-slate-600">EVENTS: {logs.length}</span>
              {isConsoleOpen ? <ChevronDown className="w-4 h-4 text-slate-500" /> : <ChevronUp className="w-4 h-4 text-slate-500" />}
            </div>
          </button>

          <div className="console-body flex-grow overflow-y-auto console-font custom-scrollbar bg-black/60 p-6 space-y-1.5">
            {logs.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-800 text-xs font-mono">
                [SYSTEM_MESSAGE] AWAITING_UPSTREAM_SIGNAL...
              </div>
            ) : (
              logs.map(log => (
                <div key={log.id} className="flex gap-4 group hover:bg-white/[0.03] py-1 px-3 rounded-lg transition-colors border-l-2 border-transparent hover:border-blue-500">
                  <span className="text-slate-700 shrink-0 select-none font-mono text-[10px]">[{log.timestamp}]</span>
                  <span className={`shrink-0 font-black uppercase text-[9px] w-14 text-center py-0.5 rounded ${log.type === 'error' ? 'bg-red-500/10 text-red-500 shadow-[0_0_10px_rgba(239,68,68,0.2)]' :
                    log.type === 'success' ? 'bg-emerald-500/10 text-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.2)]' :
                      log.type === 'api' ? 'bg-blue-500/10 text-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.2)]' : 'bg-slate-500/10 text-slate-500'
                    }`}>{log.type}</span>
                  <span className="text-white/40 shrink-0 font-mono text-[10px]">[SYS::{log.service}]</span>
                  <span className="text-slate-400 font-mono text-[11px] leading-tight">{log.message}</span>
                </div>
              ))
            )}
            <div ref={consoleEndRef} />
          </div>
        </div>
      </div>
    </div>
  );
}
