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
import { SpeechClient } from '@/components/SpeechClient';
import {
  FileText, LogOut, Brain, Languages, FolderOpen, X,
  Search, FileImage, ScanLine, Database, Terminal, ChevronUp, ChevronDown, ListFilter,
  HelpCircle, ChevronRight, Zap, Box, Mic
} from 'lucide-react';
import { servicesApi, type ServicesStatus } from '@/lib/api';
import { ServiceIntro } from '@/components/ServiceIntro';
import { ExerciseCard, NotSupportedLab } from '@/components/exercises';

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
  const [activeTab, setActiveTab] = useState<'documents' | 'text-analytics' | 'speech' | 'vision' | 'knowledge' | 'rag'>('documents');
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

  const handleSelectDocument = (doc: any) => {
    setSelectedDocument(doc);
    addLog('info', 'System', `Context switch: Analyzing ${doc.filename}`);
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
    { id: 'documents', label: 'Document Intelligence', icon: ScanLine, desc: 'Extract text, forms, invoices' },
    { id: 'vision', label: 'Computer Vision', icon: FileImage, desc: 'Analyze images, OCR' },
    { id: 'text-analytics', label: 'Natural Language', icon: Languages, desc: 'Text analytics, QnA, CLU' },
    { id: 'speech', label: 'Speech', icon: Mic, desc: 'Transcription & synthesis' },
    { id: 'knowledge', label: 'Knowledge Mining', icon: Database, desc: 'Azure AI Search' },
    { id: 'rag', label: 'Generative AI (RAG)', icon: Brain, desc: 'Question answering over docs' },
  ];

  const wizardSteps = [
    { title: 'Welcome', desc: 'This app demonstrates Azure AI services aligned with Exam AI-102. Register or log in, then use each service from the sidebar.', icon: Terminal, color: 'bg-blue-600' },
    { title: 'Document Intelligence', desc: 'Upload documents to extract text and structure. Use prebuilt models for invoices and business cards.', icon: FolderOpen, color: 'bg-purple-600' },
    { title: 'All services in one place', desc: 'Computer Vision, Natural Language, Speech, Knowledge Mining, and Generative AI (RAG). Each tab runs one service and shows the response clearly.', icon: Box, color: 'bg-emerald-600' },
    { title: 'You\'re ready', desc: 'Pick a service from the left, follow the steps, and see results. No repetitive setup — everything is automated.', icon: Mic, color: 'bg-amber-600' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 mesh-accent-1 relative overflow-x-hidden">

      {/* Wizard Overlay */}
      {showWizard && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/70 backdrop-blur-sm animate-fadeIn">
          <Card className="max-w-lg w-full card-engineer border-white/10 shadow-xl">
            <CardHeader className="flex flex-row items-center justify-between border-b border-white/5 py-4">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white ${wizardSteps[wizardStep - 1].color}`}>
                  {(() => { const Icon = wizardSteps[wizardStep - 1].icon; return <Icon className="w-5 h-5" /> })()}
                </div>
                <CardTitle className="text-base font-semibold text-white">Step {wizardStep} of 4</CardTitle>
              </div>
              <button onClick={closeWizard} className="p-2 hover:bg-white/5 rounded-lg text-slate-400"><X className="w-5 h-5" /></button>
            </CardHeader>
            <CardContent className="p-6 space-y-5">
              <h3 className="text-xl font-semibold text-white">{wizardSteps[wizardStep - 1].title}</h3>
              <p className="text-slate-400 text-sm leading-relaxed">{wizardSteps[wizardStep - 1].desc}</p>
              <div className="flex gap-2">
                {[1, 2, 3, 4].map(s => (
                  <div key={s} className={`h-1 flex-1 rounded-full ${s === wizardStep ? 'bg-blue-500' : s < wizardStep ? 'bg-emerald-500' : 'bg-white/10'}`} />
                ))}
              </div>
              <div className="flex justify-between pt-2">
                <button type="button" onClick={closeWizard} className="text-xs text-slate-500 hover:text-slate-400">Skip</button>
                <div className="flex gap-2">
                  {wizardStep > 1 && (
                    <Button variant="outline" onClick={() => setWizardStep(prev => prev - 1)} className="border-white/10 text-white hover:bg-white/5">Back</Button>
                  )}
                  <Button onClick={() => wizardStep < 4 ? setWizardStep(prev => prev + 1) : closeWizard()} className="bg-blue-600 hover:bg-blue-500">
                    {wizardStep === 4 ? 'Done' : 'Next'} <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Header */}
      <header className="glass-studio border-b border-white/5 sticky top-0 z-[60]">
        <div className="max-w-[1700px] mx-auto px-6 h-14 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center shadow-[0_0_12px_rgba(37,99,235,0.35)]">
              <Brain className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="font-semibold text-slate-900 tracking-tight">Azure AI Solution</div>
              <div className="text-[10px] text-slate-600">Exam AI-102 — Designing and Implementing a Microsoft Azure AI Solution</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => setShowWizard(true)} className="text-slate-600 hover:text-slate-900 text-xs">
              <HelpCircle className="w-4 h-4 mr-1.5" /> Get started
            </Button>
            <span className="text-xs text-slate-600 hidden sm:inline">{user.username}</span>
            <button onClick={logout} className="p-2 hover:bg-slate-100 rounded-lg text-slate-600 hover:text-slate-900 transition-colors" title="Sign out">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-[1700px] mx-auto px-6 py-8 pb-32">
        <div className="flex gap-8">
          {/* Vertical Stepper Navigation */}
          <aside className="w-56 flex-shrink-0 hidden lg:block">
            <div className="sticky top-28 space-y-1.5">
              <h3 className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-4 px-3">
                Azure AI services
              </h3>
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === (tab.id as any);
                const isLive = servicesStatus ? (
                  tab.id === 'documents' ? servicesStatus.document_intelligence :
                    tab.id === 'vision' ? servicesStatus.vision :
                      tab.id === 'text-analytics' ? servicesStatus.text_analytics :
                        tab.id === 'speech' ? servicesStatus.speech :
                          tab.id === 'knowledge' ? servicesStatus.search :
                            tab.id === 'rag' ? servicesStatus.rag : false
                ) : false;

                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-500 group relative ${isActive
                      ? 'bg-blue-50 text-slate-900 border border-blue-200'
                      : 'text-slate-700 hover:text-slate-900 hover:bg-slate-50'
                      }`}
                  >
                    {isActive && <div className="absolute left-0 w-1 h-6 bg-blue-600 rounded-r-full"></div>}
                    <div className={`p-2 rounded-xl transition-all duration-500 ${isActive ? 'bg-blue-600 text-white shadow-sm' : 'bg-white border border-slate-200 group-hover:bg-slate-50'}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="text-left flex-grow">
                      <div className={`text-[11px] font-black leading-tight uppercase tracking-tight flex items-center justify-between`}>
                        {tab.label}
                        <div className={`w-1.5 h-1.5 rounded-full ${isLive ? 'bg-emerald-600' : 'bg-amber-500'}`}></div>
                      </div>
                      <div className="text-[9px] opacity-40 font-mono italic">{tab.desc}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </aside>

          {/* Dynamic Content Area */}
          <section className="flex-grow min-w-0">
            {/* Mobile: service tabs */}
            <div className="lg:hidden overflow-x-auto pb-4 mb-4 -mx-1 px-1">
              <div className="flex gap-2 min-w-max">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === (tab.id as typeof activeTab);
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as typeof activeTab)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${isActive ? 'bg-blue-600 text-white' : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'}`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      {tab.label}
                    </button>
                  );
                })}
              </div>
            </div>
            {activeTab === 'documents' && (
              <ServiceIntro
                title="Document Intelligence"
                description="Practice exercise: upload a document, extract text/structure, then review the extracted content and run structured extraction (invoice/business card)."
                steps={['Upload a document', 'Open it from the list', 'Review extracted text + analysis', 'Run structured extraction (Invoice/Business Card) if needed']}
                isLive={!!servicesStatus?.document_intelligence}
              />
            )}
            {activeTab === 'vision' && (
              <ServiceIntro
                title="Computer Vision"
                description="Practice exercise: upload an image, select features (caption/tags/objects/OCR), then run analysis and inspect results."
                steps={['Upload an image', 'Choose features', 'Run', 'Review results (and OCR text if selected)']}
                isLive={!!servicesStatus?.vision}
              />
            )}
            {activeTab === 'text-analytics' && (
              <ServiceIntro
                title="Natural Language Processing"
                description="Practice exercises: run Text Analytics (sentiment/entities/key phrases), ask a question with QnA, and test intent recognition with CLU (Clock)."
                steps={['Enter text or a question', 'Run', 'Review response and confidence/metadata']}
                isLive={!!servicesStatus?.text_analytics}
              />
            )}
            {activeTab === 'speech' && (
              <ServiceIntro
                title="Speech"
                description="Practice exercises: transcribe audio (STT) and synthesize speech from text (TTS)."
                steps={['Upload audio or enter text', 'Run STT or TTS', 'Review transcript or play audio']}
                isLive={!!servicesStatus?.speech}
              />
            )}
            {activeTab === 'knowledge' && (
              <ServiceIntro
                title="Knowledge Mining"
                description="Practice exercise: search your indexed content with Azure AI Search. (Tip: ingest documents via RAG first to populate the index.)"
                steps={['Enter a search query', 'Run search', 'Inspect matching documents and fields']}
                isLive={!!servicesStatus?.search}
              />
            )}
            {activeTab === 'rag' && (
              <ServiceIntro
                title="Generative AI (RAG)"
                description="Practice exercise: ingest a document, then ask questions. The app retrieves sources from the index and answers with Azure OpenAI."
                steps={['Ingest a document', 'Ask a question', 'Review answer + sources']}
                isLive={!!servicesStatus?.rag}
              />
            )}

            <div className="space-y-6">
              {activeTab === 'documents' && (
                <div className="space-y-6">
                  <ExerciseCard
                    title="Lab: Upload and extract content"
                    objective="Upload a file, then select it to view extracted text and AI analysis."
                    steps={['Upload a document', 'Select it from the list', 'Review extracted text + analysis']}
                    status={servicesStatus?.document_intelligence ? 'live' : 'not_configured'}
                    statusDetail={servicesStatus?.document_intelligence ? undefined : 'Document Intelligence is not configured for this deployment.'}
                  >
                    <div className="grid grid-cols-12 gap-6">
                      <div className="col-span-12 lg:col-span-5">
                        <div className="space-y-4">
                          <div className="text-sm font-semibold text-slate-900">Step 1: Upload</div>
                          <DocumentUpload onUpload={handleUpload} getDocument={getDocument} compact />
                        </div>
                      </div>
                      <div className="col-span-12 lg:col-span-7">
                        <div className="space-y-3">
                          <div className="text-sm font-semibold text-slate-900">Step 2: Select a document</div>
                          <DocumentList
                            documents={documents}
                            loading={loading}
                            onSelectDocument={handleSelectDocument}
                            selectedDocumentId={selectedDocument?.id}
                            compact
                          />
                        </div>
                      </div>
                    </div>
                  </ExerciseCard>

                  <ExerciseCard
                    title="Lab: Review extracted text and analysis"
                    objective="Open the selected document to see extracted text and AI analysis generated by the backend pipeline."
                    steps={['Select a document', 'Review extracted text', 'Refresh if needed']}
                    status={selectedDocument ? 'live' : 'not_configured'}
                    statusDetail={selectedDocument ? undefined : 'Select a document above to enable this lab.'}
                  >
                    {selectedDocument ? (
                      <div className="rounded-2xl border border-slate-200 bg-white p-4">
                        <div className="flex items-center justify-between gap-3 pb-4 border-b border-slate-200">
                          <div className="min-w-0">
                            <div className="text-sm font-semibold text-slate-900 truncate">{selectedDocument.filename}</div>
                            <div className="text-xs text-slate-600">Document ID: {selectedDocument.id}</div>
                          </div>
                          <Button variant="outline" onClick={() => setSelectedDocument(null)}>Clear</Button>
                        </div>
                        <div className="pt-4">
                          <DocumentViewer document={selectedDocument} onRefresh={fetchDocuments} />
                        </div>
                      </div>
                    ) : (
                      <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-10 text-center text-sm text-slate-600">
                        Select a document in the previous lab to view results here.
                      </div>
                    )}
                  </ExerciseCard>

                  <ExerciseCard
                    title="Lab: Structured extraction (Invoice / Business Card)"
                    objective="Extract structured fields from a document using prebuilt models (where applicable)."
                    steps={['Select a document', 'Run structured extraction', 'Review extracted fields']}
                    status={selectedDocument ? 'live' : 'not_configured'}
                    statusDetail={selectedDocument ? undefined : 'Select a document first.'}
                  >
                    {selectedDocument ? <InfoExtraction /> : null}
                  </ExerciseCard>
                </div>
              )}

              {activeTab === 'vision' && (
                <div className="space-y-6">
                  <ExerciseCard
                    title="Lab: Analyze images"
                    objective="Upload an image and run feature extraction (caption, tags, objects)."
                    steps={['Upload an image', 'Select features', 'Run analyze and review output']}
                    status={servicesStatus?.vision ? 'live' : 'not_configured'}
                    statusDetail={servicesStatus?.vision ? undefined : 'Azure AI Vision is not configured for this deployment.'}
                  >
                    <AIVision />
                  </ExerciseCard>

                  <ExerciseCard
                    title="Lab: Face detection, classification, object detection, Video Indexer"
                    objective="These labs require additional Azure resource types beyond what this deployment provisions."
                    steps={[]}
                    status="not_supported"
                    statusDetail="Not supported in this deployment (resource types not provisioned by CI/CD)."
                  >
                    <NotSupportedLab
                      title="Not supported labs in this deployment"
                      reason="To enable these labs, we would need to provision additional Azure services and wire their keys/endpoints into CI/CD."
                      requiredResources={[
                        'Custom Vision (training + prediction) resources',
                        'Azure AI Video Indexer',
                        'Azure OpenAI image generation / DALL·E (if used)',
                      ]}
                    />
                  </ExerciseCard>
                </div>
              )}

              {activeTab === 'text-analytics' && (
                <div className="space-y-6">
                  <ExerciseCard
                    title="Lab: Analyze text"
                    objective="Run language detection, sentiment analysis, key phrase extraction, and entity recognition."
                    steps={['Enter text', 'Run analysis', 'Review key phrases + entities']}
                    status={servicesStatus?.text_analytics ? 'live' : 'not_configured'}
                    statusDetail={servicesStatus?.text_analytics ? undefined : 'Azure AI Language / Text Analytics is not configured for this deployment.'}
                  >
                    <TextAnalysis />
                  </ExerciseCard>

                  <ExerciseCard
                    title="Lab: Question Answering"
                    objective="Ask a question against your QnA project and review the answer and confidence."
                    steps={['Enter a question', 'Run', 'Review answer and confidence']}
                    status={servicesStatus?.qna ? 'live' : 'not_configured'}
                    statusDetail={servicesStatus?.qna ? undefined : 'Question Answering is not configured for this deployment.'}
                  >
                    <QuestionAnswering />
                  </ExerciseCard>

                  <ExerciseCard
                    title="Lab: Language Understanding (CLU)"
                    objective="Test intent recognition (Clock) and inspect the detected intent and extracted entities."
                    steps={['Enter a phrase', 'Run', 'Review intent + entities']}
                    status={servicesStatus?.clock ? 'live' : 'not_configured'}
                    statusDetail={servicesStatus?.clock ? undefined : 'CLU/Clock is not configured for this deployment.'}
                  >
                    <ClockClient />
                  </ExerciseCard>

                  <ExerciseCard
                    title="Lab: Translation, custom entity recognition, custom classification"
                    objective="These labs require additional resource types or studio training flows not provisioned in this deployment."
                    steps={[]}
                    status="not_supported"
                  >
                    <NotSupportedLab
                      title="Not supported labs in this deployment"
                      reason="To enable, we’d need to provision additional Azure services and/or support training workflows."
                      requiredResources={[
                        'Azure AI Translator',
                        'Custom text classification / custom NER training resources',
                      ]}
                    />
                  </ExerciseCard>
                </div>
              )}

              {activeTab === 'speech' && (
                <div className="space-y-6">
                  <ExerciseCard
                    title="Lab: Speech services (STT + TTS)"
                    objective="Transcribe audio to text and synthesize speech from text."
                    steps={['Upload audio or enter text', 'Run STT or TTS', 'Review results']}
                    status={servicesStatus?.speech ? 'live' : 'not_configured'}
                    statusDetail={servicesStatus?.speech ? undefined : 'Azure AI Speech is not configured for this deployment.'}
                  >
                    <SpeechClient />
                  </ExerciseCard>

                  <ExerciseCard
                    title="Lab: Speech translation and advanced speech scenarios"
                    objective="These labs require additional configuration beyond basic Speech keys/region."
                    steps={[]}
                    status="not_supported"
                  >
                    <NotSupportedLab
                      title="Not supported labs in this deployment"
                      reason="To enable, we’d add speech translation and additional APIs/configuration to the backend."
                      requiredResources={['Speech translation configuration / additional APIs']}
                    />
                  </ExerciseCard>
                </div>
              )}

              {activeTab === 'knowledge' && (
                <div className="space-y-6">
                  <ExerciseCard
                    title="Lab: Knowledge mining (keyword search)"
                    objective="Query the Azure AI Search index and review matching documents."
                    steps={['Enter query', 'Run search', 'Review matches']}
                    status={servicesStatus?.search ? 'live' : 'not_configured'}
                    statusDetail={servicesStatus?.search ? undefined : 'Azure AI Search is not configured for this deployment.'}
                  >
                    <KnowledgeMining />
                  </ExerciseCard>
                </div>
              )}

              {activeTab === 'rag' && (
                <div className="space-y-6">
                  <ExerciseCard
                    title="Lab: RAG (ingest + ask)"
                    objective="Ingest content into the index, then ask grounded questions and inspect sources."
                    steps={['Ensure index', 'Ingest document', 'Ask question and review sources']}
                    status={servicesStatus?.rag ? 'live' : 'not_configured'}
                    statusDetail={servicesStatus?.rag ? undefined : 'RAG requires Azure AI Search + Azure OpenAI embeddings + chat deployment.'}
                  >
                    <RAGQA />
                  </ExerciseCard>
                </div>
              )}
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
