import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/hooks/useAuth';
import { useDocuments } from '@/hooks/useDocuments';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { DocumentUpload } from '@/components/DocumentUpload';
import { DocumentList } from '@/components/DocumentList';
import { DocumentViewer } from '@/components/DocumentViewer';
import { Upload, FileText, LogOut, Brain, Search } from 'lucide-react';

export default function DashboardPage() {
  const { user, logout, loading: authLoading } = useAuth();
  const { documents, loading, uploadDocument } = useDocuments();
  const router = useRouter();
  const [selectedDocument, setSelectedDocument] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'upload' | 'documents' | 'analysis'>('upload');
  const [isClient, setIsClient] = useState(false);

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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
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
    return result;
  };

  const tabs = [
    { id: 'upload', label: 'Upload', icon: Upload },
    { id: 'documents', label: 'Documents', icon: FileText },
    { id: 'analysis', label: 'Analysis', icon: Brain },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Brain className="w-8 h-8 text-primary-600 mr-3" />
              <h1 className="text-xl font-bold text-gray-900">Document Intelligence</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-700">Welcome, {user.username}</span>
              <Button
                variant="outline"
                size="sm"
                onClick={logout}
                className="flex items-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center px-1 py-4 border-b-2 text-sm font-medium ${
                    activeTab === tab.id
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="w-4 h-4 mr-2" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'upload' && (
          <div className="animate-fade-in">
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Upload Document</h2>
              <p className="text-gray-600">
                Upload your documents for AI-powered analysis and text extraction
              </p>
            </div>
            <DocumentUpload onUpload={handleUpload} />
          </div>
        )}

        {activeTab === 'documents' && (
          <div className="animate-fade-in">
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Your Documents</h2>
              <p className="text-gray-600">
                View and manage your uploaded documents
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
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Document Analysis</h2>
              <p className="text-gray-600">
                AI-powered insights and extracted information from your documents
              </p>
            </div>
            {selectedDocument ? (
              <DocumentViewer document={selectedDocument} />
            ) : (
              <Card>
                <CardContent className="text-center py-12">
                  <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No Document Selected
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Select a document from the Documents tab to view its analysis
                  </p>
                  <Button onClick={() => setActiveTab('documents')}>
                    Go to Documents
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
