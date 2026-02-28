import { useCallback, useState, useEffect, useRef } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Upload, FileText, Sparkles, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { Document } from '@/types';

interface DocumentUploadProps {
  onUpload: (file: File) => Promise<{ success: boolean; error?: string; documentId?: number }>;
  getDocument?: (id: number) => Promise<Document>;
}

type Step = 'idle' | 'upload' | 'extracting' | 'analyzing' | 'ready';

export function DocumentUpload({ onUpload, getDocument }: DocumentUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadResult, setUploadResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);
  const [step, setStep] = useState<Step>('idle');
  const [processingDocumentId, setProcessingDocumentId] = useState<number | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
    setProcessingDocumentId(null);
  }, []);

  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (acceptedFiles.length === 0) return;

      const file = acceptedFiles[0];
      setUploading(true);
      setUploadProgress(0);
      setUploadResult(null);
      setStep('upload');

      try {
        const progressInterval = setInterval(() => {
          setUploadProgress((prev) => {
            if (prev >= 90) {
              clearInterval(progressInterval);
              return 90;
            }
            return prev + 10;
          });
        }, 200);

        const result = await onUpload(file);
        clearInterval(progressInterval);
        setUploadProgress(100);
        setStep('extracting');

        setUploadResult({
          success: result.success,
          message: result.success
            ? 'Document uploaded. Processing…'
            : result.error || 'Upload failed',
        });

        if (!result.success) {
          setUploadProgress(0);
          setStep('idle');
        } else if (result.documentId && getDocument) {
          setProcessingDocumentId(result.documentId);
          const docId = result.documentId;
          pollRef.current = setInterval(async () => {
            try {
              const doc = await getDocument(docId);
              if (doc.ai_analysis) {
                setStep('ready');
                setUploadResult({ success: true, message: 'Document ready. View it in Documents.' });
                stopPolling();
              } else if (doc.extracted_text) {
                setStep('analyzing');
              }
            } catch {
              // keep polling
            }
          }, 2500);
        } else if (result.success) {
          setUploadResult({ success: true, message: 'Document uploaded successfully!' });
          setStep('idle');
        }
      } catch (error) {
        setUploadResult({
          success: false,
          message: 'Upload failed. Please try again.',
        });
        setUploadProgress(0);
        setStep('idle');
      } finally {
        setUploading(false);
      }
    },
    [onUpload, getDocument, stopPolling]
  );

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'image/tiff': ['.tiff', '.tif'],
    },
    maxSize: 10 * 1024 * 1024, // 10MB
    multiple: false,
  });

  const resetUpload = () => {
    stopPolling();
    setUploadResult(null);
    setUploadProgress(0);
    setStep('idle');
  };

  const steps: { id: Step; label: string; icon: typeof Upload }[] = [
    { id: 'upload', label: 'Upload', icon: Upload },
    { id: 'extracting', label: 'Extract text', icon: FileText },
    { id: 'analyzing', label: 'AI analysis', icon: Sparkles },
    { id: 'ready', label: 'Ready', icon: CheckCircle },
  ];
  const stepOrder: Step[] = ['upload', 'extracting', 'analyzing', 'ready'];
  const currentStepIndex = stepOrder.indexOf(step);

  return (
    <div className="space-y-6">
      <Card className="overflow-hidden shadow-soft border-slate-200/80">
        <CardContent className="p-6">
          <div
            {...getRootProps()}
            className={`dropzone border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200 ${
              isDragActive
                ? isDragReject
                  ? 'border-red-400 bg-red-50'
                  : 'border-primary-400 bg-primary-50'
                : 'border-slate-300 hover:border-primary-300 hover:bg-primary-50/50'
            }`}
          >
            <input {...getInputProps()} />
            <div className="space-y-4">
              <div className="mx-auto w-14 h-14 bg-primary-100 rounded-xl flex items-center justify-center text-primary-600">
                <Upload className="w-7 h-7" />
              </div>
              <div>
                <p className="text-lg font-semibold text-slate-900">
                  {isDragActive
                    ? isDragReject
                      ? 'File type not supported'
                      : 'Drop your document here'
                    : 'Drag and drop your document here'}
                </p>
                <p className="text-sm text-slate-500 mt-1">or click to browse</p>
              </div>
              <div className="text-xs text-slate-400 space-y-1">
                <p>PDF, DOC, DOCX, JPG, PNG, TIFF — max 10MB</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {(uploading || processingDocumentId !== null) && (
        <Card className="overflow-hidden shadow-soft border-slate-200/80 animate-fade-in">
          <CardContent className="p-6">
            <p className="text-sm font-medium text-slate-700 mb-4">Processing steps</p>
            <div className="flex items-center justify-between gap-2">
              {steps.map((s, i) => {
                const idx = stepOrder.indexOf(s.id);
                const done = currentStepIndex > idx || (step === 'ready' && idx < 4);
                const current = step === s.id;
                const Icon = s.icon;
                return (
                  <div key={s.id} className="flex flex-1 items-center">
                    <div
                      className={`flex items-center gap-2 rounded-lg px-3 py-2 transition-all ${
                        current ? 'bg-primary-100 text-primary-700' : done ? 'bg-slate-100 text-slate-600' : 'bg-slate-50 text-slate-400'
                      }`}
                    >
                      {current && step !== 'ready' ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Icon className={`w-4 h-4 ${done ? 'text-primary-600' : ''}`} />
                      )}
                      <span className="text-xs font-medium hidden sm:inline">{s.label}</span>
                    </div>
                    {i < steps.length - 1 && (
                      <div className="flex-1 h-0.5 mx-1 bg-slate-200 min-w-[8px]" />
                    )}
                  </div>
                );
              })}
            </div>
            {uploading && (
              <div className="mt-4">
                <div className="flex justify-between text-sm text-slate-600 mb-1">
                  <span>Uploading…</span>
                  <span>{uploadProgress}%</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                  <div
                    className="upload-progress bg-primary-500 h-2 rounded-full"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {uploadResult && !processingDocumentId && (
        <Card className="overflow-hidden shadow-soft border-slate-200/80 animate-fade-in">
          <CardContent className="p-6">
            <div className="flex items-start gap-3">
              {uploadResult.success ? (
                <CheckCircle className="w-5 h-5 text-emerald-500 mt-0.5 shrink-0" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <p className={`text-sm ${uploadResult.success ? 'text-emerald-700' : 'text-red-700'}`}>
                  {uploadResult.message}
                </p>
                {!uploadResult.success && (
                  <Button variant="outline" size="sm" onClick={resetUpload} className="mt-2">
                    Try again
                  </Button>
                )}
              </div>
              {uploadResult.success && (
                <Button variant="ghost" size="sm" onClick={resetUpload} className="text-slate-500 hover:text-slate-700 shrink-0">
                  Dismiss
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
