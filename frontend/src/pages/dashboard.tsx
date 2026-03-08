import { useState, useEffect } from 'react';
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
import { FileText, LogOut, Brain, Languages, Sparkles, Clock, FolderOpen, X, Search, FileImage, CheckCircle, AlertCircle } from 'lucide-react';
import { servicesApi, type ServicesStatus } from '@/lib/api';

export default function DashboardPage() {
  const { user, logout, loading: authLoading } = useAuth();
  const { documents, loading, uploadDocument, getDocument, fetchDocuments } = useDocuments();
  const router = useRouter();
  const [selectedDocument, setSelectedDocument] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'documents' | 'text-analytics' | 'qna' | 'clock' | 'vision'>('documents');
  const [isClient, setIsClient] = useState(false);
  const [servicesStatus, setServicesStatus] = useState<ServicesStatus | null>(null);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!user) return;
    servicesApi.getStatus().then(setServicesStatus).catch(() => setServicesStatus(null));
  }, [user]);

  useEffect(() => {
    if (isClient && !authLoading && !user) {
      router.replace('/login');
    }
  }, [user, authLoading, isClient, router]);

  const handleUpload = async (file: File) => {
    const result = await uploadDocument(file);
    if (result.success) {
      await fetchDocuments();
    }
    return result;
  };

  const handleSelectDocument = (doc: any) => {
    setSelectedDocument(doc);
  };

  const handleCloseDocument = () => {
    setSelectedDocument(null);
  };

  if (!isClient || authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-3 border-blue-200 border-t-blue-600 shadow-lg"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const tabs = [
    { id: 'documents', label: 'Documents & Analysis', icon: FolderOpen, description: 'Upload, view and analyze documents' },
    { id: 'text-analytics', label: 'Text Analytics', icon: Languages, description: 'Language detection, sentiment & entities' },
    { id: 'qna', label: 'Ask AI Assistant', icon: Sparkles, description: 'Intelligent Q&A with LLM enhancement' },
    { id: 'clock', label: 'Smart Clock', icon: Clock, description: 'Natural language time queries' },
    { id: 'vision', label: 'AI Vision', icon: FileImage, description: 'Image analysis and OCR' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Modern Header */}
      <header className="bg-white/90 backdrop-blur-xl border-b border-slate-200/60 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-blue-600/20">
                <Brain className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-slate-900 tracking-tight">AI Document Intelligence</h1>
                <p className="text-xs text-slate-500">Powered by Azure AI</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-slate-600 font-medium">{user.username}</span>
              <Button
                variant="outline"
                size="sm"
                onClick={logout}
                className="flex items-center gap-2 border-slate-300 hover:bg-slate-100 text-slate-700"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </Button>
            </div>
          </div>
        </div>
        {servicesStatus && (
          <div className="border-t border-slate-200/60 px-6 py-2 bg-slate-50/80">
            <div className="flex flex-wrap items-center gap-3 text-xs">
              <span className="text-slate-500 font-medium">Services:</span>
              {[
                { key: 'document_intelligence', label: 'Document Intelligence' },
                { key: 'openai', label: 'OpenAI' },
                { key: 'text_analytics', label: 'Text Analytics' },
                { key: 'qna', label: 'Q&A' },
                { key: 'clock', label: 'Clock (CLU)' },
                { key: 'vision', label: 'AI Vision' },
              ].map(({ key, label }) => {
                const ok = servicesStatus[key as keyof ServicesStatus];
                return (
                  <span
                    key={key}
                    className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 ${
                      ok ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                    }`}
                  >
                    {ok ? <CheckCircle className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
                    {label} {ok ? 'Live' : '—'}
                  </span>
                );
              })}
            </div>
          </div>
        )}
      </header>

      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* Modern Tab Navigation */}
        <div className="mb-6">
          <nav className="flex items-center gap-2 bg-white/80 backdrop-blur p-1.5 rounded-2xl border border-slate-200/60 shadow-sm">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === (tab.id as any);
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-600/20'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Main Content Area */}
        <div className="grid grid-cols-12 gap-6">
          {/* Documents Sidebar - Only show when documents tab is active */}
          {activeTab === 'documents' && (
            <>
              {/* Document Sidebar */}
              <div className="col-span-12 lg:col-span-4 xl:col-span-3 space-y-4">
                {/* Upload Section */}
                <Card className="border-slate-200/60 shadow-sm overflow-hidden">
                  <CardHeader className="bg-gradient-to-r from-slate-50 to-slate-100 border-b border-slate-200/60 py-4">
                    <CardTitle className="flex items-center gap-2 text-slate-800 text-sm font-semibold">
                      <FileText className="w-4 h-4 text-blue-600" />
                      Upload Document
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4">
                    <DocumentUpload onUpload={handleUpload} getDocument={getDocument} compact />
                  </CardContent>
                </Card>

                {/* Document List */}
                <Card className="border-slate-200/60 shadow-sm">
                  <CardHeader className="bg-gradient-to-r from-slate-50 to-slate-100 border-b border-slate-200/60 py-4">
                    <CardTitle className="flex items-center gap-2 text-slate-800 text-sm font-semibold">
                      <FolderOpen className="w-4 h-4 text-blue-600" />
                      Your Documents
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

              {/* Document Analysis Area */}
              <div className="col-span-12 lg:col-span-8 xl:col-span-9">
                {selectedDocument ? (
                  <div className="space-y-4">
                    {/* Document Header */}
                    <div className="flex items-center justify-between bg-white/80 backdrop-blur p-4 rounded-xl border border-slate-200/60 shadow-sm">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center">
                          <FileText className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <h2 className="font-semibold text-slate-900">{selectedDocument.filename}</h2>
                          <p className="text-sm text-slate-500">
                            {selectedDocument.ai_analysis ? 'Analysis complete' : 'Processing...'}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={handleCloseDocument}
                        className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-400 hover:text-slate-600"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                    
                    {/* Document Viewer */}
                    <DocumentViewer document={selectedDocument} onRefresh={fetchDocuments} />
                  </div>
                ) : (
                  <Card className="border-slate-200/60 shadow-sm h-96 flex items-center justify-center">
                    <div className="text-center">
                      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center mx-auto mb-4">
                        <FolderOpen className="w-8 h-8 text-slate-400" />
                      </div>
                      <h3 className="text-lg font-medium text-slate-900 mb-2">Select a Document</h3>
                      <p className="text-slate-500 max-w-sm mx-auto">
                        Choose a document from the sidebar to view AI-powered analysis and insights
                      </p>
                    </div>
                  </Card>
                )}
              </div>
            </>
          )}

          {/* Text Analytics Tab */}
          {activeTab === 'text-analytics' && (
            <div className="col-span-12">
              <div className="mb-4">
                <h2 className="text-xl font-bold text-slate-900">Text Analytics</h2>
                <p className="text-slate-600">Analyze text using Azure AI Language services</p>
              </div>
              <TextAnalysis />
            </div>
          )}

          {/* Q&A Tab with LLM */}
          {activeTab === 'qna' && (
            <div className="col-span-12">
              <div className="mb-4">
                <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                  <Sparkles className="w-6 h-6 text-blue-600" />
                  AI Assistant
                </h2>
                <p className="text-slate-600">Ask questions and get intelligent answers enhanced with LLM</p>
              </div>
              <QuestionAnswering />
            </div>
          )}

          {/* Clock CLU Tab */}
          {activeTab === 'clock' && (
            <div className="col-span-12 max-w-3xl mx-auto">
              <div className="mb-4">
                <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                  <Clock className="w-6 h-6 text-blue-600" />
                  Smart Clock
                </h2>
                <p className="text-slate-600">Ask about time, day, or date in natural language</p>
              </div>
              <ClockClient />
            </div>
          )}

          {/* AI Vision Tab */}
          {activeTab === 'vision' && (
            <div className="col-span-12">
              <div className="mb-4">
                <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                  <FileImage className="w-6 h-6 text-purple-600" />
                  AI Vision
                </h2>
                <p className="text-slate-600">Analyze images, detect objects, and extract text with Azure AI Vision</p>
              </div>
              <AIVision />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
