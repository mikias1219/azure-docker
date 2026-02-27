import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Upload, File, X, CheckCircle, AlertCircle } from 'lucide-react';

interface DocumentUploadProps {
  onUpload: (file: File) => Promise<{ success: boolean; error?: string }>;
}

export function DocumentUpload({ onUpload }: DocumentUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadResult, setUploadResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (acceptedFiles.length === 0) return;

      const file = acceptedFiles[0];
      setUploading(true);
      setUploadProgress(0);
      setUploadResult(null);

      try {
        // Simulate progress
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

        setUploadResult({
          success: result.success,
          message: result.success
            ? 'Document uploaded successfully!'
            : result.error || 'Upload failed',
        });

        if (!result.success) {
          setUploadProgress(0);
        }
      } catch (error) {
        setUploadResult({
          success: false,
          message: 'Upload failed. Please try again.',
        });
        setUploadProgress(0);
      } finally {
        setUploading(false);
      }
    },
    [onUpload]
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
    setUploadResult(null);
    setUploadProgress(0);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="p-6">
          <div
            {...getRootProps()}
            className={`dropzone border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
              isDragActive
                ? isDragReject
                  ? 'border-red-400 bg-red-50'
                  : 'border-primary-400 bg-primary-50'
                : 'border-gray-300 hover:border-gray-400'
            }`}
          >
            <input {...getInputProps()} />
            <div className="space-y-4">
              <div className="mx-auto w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                <Upload className="w-6 h-6 text-gray-600" />
              </div>
              
              <div>
                <p className="text-lg font-medium text-gray-900">
                  {isDragActive
                    ? isDragReject
                      ? 'File type not supported'
                      : 'Drop your document here'
                    : 'Drag and drop your document here'}
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  or click to browse
                </p>
              </div>

              <div className="text-xs text-gray-500 space-y-1">
                <p>Supported formats: PDF, DOC, DOCX, JPG, PNG, TIFF</p>
                <p>Maximum file size: 10MB</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {uploading && (
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-900">Uploading...</span>
                <span className="text-sm text-gray-600">{uploadProgress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="upload-progress bg-primary-600 h-2 rounded-full"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {uploadResult && (
        <Card>
          <CardContent className="p-6">
            <div className="flex items-start space-x-3">
              {uploadResult.success ? (
                <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-500 mt-0.5" />
              )}
              <div className="flex-1">
                <p
                  className={`text-sm ${
                    uploadResult.success ? 'text-green-700' : 'text-red-700'
                  }`}
                >
                  {uploadResult.message}
                </p>
                {!uploadResult.success && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={resetUpload}
                    className="mt-2"
                  >
                    Try Again
                  </Button>
                )}
              </div>
              {uploadResult.success && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={resetUpload}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
