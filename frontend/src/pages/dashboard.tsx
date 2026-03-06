import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/hooks/useAuth';
import { useDocuments } from '@/hooks/useDocuments';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { DocumentUpload } from '@/components/DocumentUpload';
import { DocumentList } from '@/components/DocumentList';
import { DocumentViewer } from '@/components/DocumentViewer';
import { VoiceRecorder } from '@/components/VoiceRecorder';
import { TextAnalysis } from '@/components/TextAnalysis';
import { QuestionAnswering } from '@/components/QuestionAnswering';
import { ClockClient } from '@/components/ClockClient';
import { Upload, FileText, LogOut, Brain, Search, Mic, Languages, MessageCircle, Clock } from 'lucide-react';

export default function DashboardPage() {
  const { user, logout, loading: authLoading } = useAuth();
  const { documents, loading, uploadDocument, getDocument, fetchDocuments } = useDocuments();
  const router = useRouter();
  const [selectedDocument, setSelectedDocument] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'upload' | 'documents' | 'analysis' | 'voice' | 'text-analytics' | 'qna' | 'clock'>('upload');
  const [isClient, setIsClient] = useState(false);

  const handleRefreshDocument = async () => {
    const list = await fetchDocuments();
    const doc = list.find((d) => d.id === selectedDocument?.id);
    if (doc) setSelectedDocument(doc);
  };

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    // Important: don't redirect until auth loading has finished,
    // otherwise we bounce dashboard -> login -> dashboard repeatedly ("blinking").
    if (isClient && !authLoading && !user) {
      router.replace('/login');
    }
  }, [user, authLoading, isClient, router]);

  if (!isClient || authLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary-200 border-t-primary-600"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const handleUpload = async (file: File) => {
    const result = await uploadDocument(file);
    if (result.success) {
      setActiveTab('documents');
    }
    return { success: result.success, error: result.error, documentId: result.documentId };
  };

  const tabs = [
    { id: 'upload', label: 'Upload', icon: Upload },
    { id: 'documents', label: 'Documents', icon: FileText },
    { id: 'analysis', label: 'Analysis', icon: Brain },
    { id: 'voice', label: 'Voice', icon: Mic },
    { id: 'text-analytics', label: 'Text Analytics', icon: Languages },
    { id: 'qna', label: 'Q&A', icon: MessageCircle },
    { id: 'clock', label: 'Clock CLU', icon: Clock },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white/80 backdrop-blur border-b border-slate-200/80 shadow-soft">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-primary-500 flex items-center justify-center text-white shadow-soft">
                <Brain className="w-5 h-5" />
              </div>
              <h1 className="text-xl font-bold text-slate-900">Document Intelligence</h1>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-slate-600">Welcome, {user.username}</span>
              <Button
                variant="outline"
                size="sm"
                onClick={logout}
                className="flex items-center gap-2 border-slate-200 hover:bg-slate-50"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="bg-white border-b border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex gap-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 px-4 py-3.5 text-sm font-medium rounded-t-lg transition-colors ${
                    activeTab === tab.id
                      ? 'bg-slate-100 text-primary-600 border-b-2 border-primary-500 -mb-px'
                      : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'upload' && (
          <div className="animate-fade-in">
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-slate-900 mb-2">Upload Document</h2>
              <p className="text-slate-600">
                Upload for AI-powered extraction and analysis. Steps run automatically.
              </p>
            </div>
            <DocumentUpload onUpload={handleUpload} getDocument={getDocument} />
          </div>
        )}

        {activeTab === 'documents' && (
          <div className="animate-fade-in">
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-slate-900 mb-2">Your Documents</h2>
              <p className="text-slate-600">
                Search and manage your documents
              </p>
            </div>
            <DocumentList
              documents={documents}
              loading={loading}
              onSelectDocument={setSelectedDocument}
              onGoToUpload={() => setActiveTab('upload')}
            />
          </div>
        )}

        {activeTab === 'analysis' && (
          <div className="animate-fade-in">
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-slate-900 mb-2">Document Analysis</h2>
              <p className="text-slate-600">
                View insights and ask questions about the selected document
              </p>
            </div>
            {selectedDocument ? (
              <DocumentViewer document={selectedDocument} onRefresh={handleRefreshDocument} />
            ) : (
              <Card className="border-slate-200/80 shadow-soft">
                <CardContent className="text-center py-12">
                  <Search className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-slate-900 mb-2">No document selected</h3>
                  <p className="text-slate-600 mb-4">
                    Select a document from the Documents tab to view analysis and Q&A
                  </p>
                  <Button onClick={() => setActiveTab('documents')}>Go to Documents</Button>
                </CardContent>
              </Card>
            )}
          </div>
        )}
        {activeTab === 'voice' && (
          <div className="animate-fade-in">
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-slate-900 mb-2">Voice Recording</h2>
              <p className="text-slate-600">
                Record your voice and get AI-powered transcription using Azure Speech Services
              </p>
            </div>
            <VoiceRecorder />
          </div>
        )}

        {activeTab === 'text-analytics' && (
          <div className="animate-fade-in">
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-slate-900 mb-2">Text Analytics</h2>
              <p className="text-slate-600">
                Analyze text using Azure AI Language - detect language, sentiment, key phrases, and entities
              </p>
            </div>
            <TextAnalysis />
          </div>
        )}

        {activeTab === 'qna' && (
          <div className="animate-fade-in">
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-slate-900 mb-2">Question Answering</h2>
              <p className="text-slate-600">
                Ask questions and get answers from a knowledge base using Azure AI Language
              </p>
            </div>
            <QuestionAnswering />
          </div>
        )}

        {activeTab === 'clock' && (
          <div className="animate-fade-in">
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-slate-900 mb-2">Clock - Conversational Language Understanding</h2>
              <p className="text-slate-600">
                Ask about time, day, or date in natural language using Azure AI CLU
              </p>
            </div>
            <ClockClient />
          </div>
        )}

      </main>
    </div>
  );
}
