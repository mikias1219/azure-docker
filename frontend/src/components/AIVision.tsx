import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { 
  Loader2, 
  Upload, 
  Eye, 
  Type, 
  Tag, 
  Users, 
  Box, 
  CheckCircle, 
  AlertCircle,
  FileImage,
  X,
  Languages,
  ExternalLink
} from 'lucide-react';
import { visionApi } from '@/lib/api';

interface VisionResult {
  caption?: {
    text: string;
    confidence: number;
  };
  tags?: Array<{
    name: string;
    confidence: number;
  }>;
  objects?: Array<{
    name: string;
    confidence: number;
    bounding_box: {
      x: number;
      y: number;
      width: number;
      height: number;
    };
  }>;
  people?: Array<{
    confidence: number;
    bounding_box: {
      x: number;
      y: number;
      width: number;
      height: number;
    };
  }>;
  read?: {
    full_text: string;
    blocks: Array<{
      lines: Array<{
        text: string;
        words: Array<{
          text: string;
          confidence: number;
        }>;
      }>;
    }>;
  };
  configured: boolean;
  error?: string;
}

const FEATURES = [
  { id: 'caption', label: 'Caption', icon: Eye, description: 'Generate image description' },
  { id: 'tags', label: 'Tags', icon: Tag, description: 'Identify objects and scenes' },
  { id: 'objects', label: 'Objects', icon: Box, description: 'Detect objects with bounding boxes' },
  { id: 'people', label: 'People', icon: Users, description: 'Detect people in images' },
  { id: 'read', label: 'OCR Text', icon: Type, description: 'Extract text from images' },
];

export function AIVision() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>(['caption', 'tags', 'objects']);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<VisionResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<any>(null);
  const [infoLoading, setInfoLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'analyze' | 'ocr'>('analyze');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadInfo();
  }, []);

  const loadInfo = async () => {
    try {
      const data = await visionApi.getInfo();
      setInfo(data);
    } catch (err: any) {
      console.error('Failed to load vision info:', err);
    } finally {
      setInfoLoading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setResult(null);
      setError(null);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setResult(null);
      setError(null);
    }
  };

  const clearFile = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const analyzeImage = async () => {
    if (!selectedFile) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const data = await visionApi.analyzeImage(selectedFile, selectedFeatures);
      setResult(data);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to analyze image');
      console.error('Vision analysis error:', err);
    } finally {
      setLoading(false);
    }
  };

  const readText = async () => {
    if (!selectedFile) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const data = await visionApi.readText(selectedFile);
      setResult(data);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to read text');
      console.error('OCR error:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleFeature = (featureId: string) => {
    setSelectedFeatures(prev => 
      prev.includes(featureId) 
        ? prev.filter(f => f !== featureId)
        : [...prev, featureId]
    );
  };

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      {/* Header Card */}
      <Card className="border-slate-200/60 shadow-sm overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 border-b border-slate-200/60 py-4">
          <CardTitle className="flex items-center gap-2 text-slate-800">
            <FileImage className="w-5 h-5 text-purple-600" />
            AI Vision Analysis
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          {/* Status Badge + Learn link */}
          <div className="flex flex-wrap items-center gap-2 text-xs mb-4">
            {infoLoading ? (
              <span className="flex items-center gap-1 text-slate-500">
                <Loader2 className="w-3 h-3 animate-spin" />
                Loading...
              </span>
            ) : info?.configured ? (
              <span className="flex items-center gap-1 text-emerald-600">
                <CheckCircle className="w-3 h-3" />
                Azure AI Vision connected
              </span>
            ) : (
              <span className="flex items-center gap-1 text-amber-600">
                <AlertCircle className="w-3 h-3" />
                Demo mode
              </span>
            )}
            <a
              href="https://learn.microsoft.com/training/paths/create-computer-vision-solutions-azure-ai/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-purple-600 hover:underline ml-auto"
            >
              <ExternalLink className="w-3 h-3" />
              Microsoft Learn: AI Vision
            </a>
          </div>

          {/* Tabs */}
          <div className="flex items-center gap-2 mb-4">
            <button
              onClick={() => setActiveTab('analyze')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'analyze'
                  ? 'bg-purple-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <Eye className="w-4 h-4" />
              Analyze Image
            </button>
            <button
              onClick={() => setActiveTab('ocr')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'ocr'
                  ? 'bg-purple-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <Type className="w-4 h-4" />
              Read Text (OCR)
            </button>
          </div>

          {/* File Upload Area */}
          <div
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            className={`border-2 border-dashed rounded-xl p-6 text-center transition-colors ${
              selectedFile 
                ? 'border-purple-300 bg-purple-50/50' 
                : 'border-slate-300 hover:border-purple-300 hover:bg-purple-50/30'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />
            
            {previewUrl ? (
              <div className="relative">
                <img 
                  src={previewUrl} 
                  alt="Preview" 
                  className="max-h-48 mx-auto rounded-lg shadow-sm"
                />
                <button
                  onClick={clearFile}
                  className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                >
                  <X className="w-4 h-4" />
                </button>
                <p className="mt-2 text-sm text-slate-600">{selectedFile?.name}</p>
              </div>
            ) : (
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="cursor-pointer"
              >
                <div className="mx-auto w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center text-purple-600 mb-3">
                  <Upload className="w-6 h-6" />
                </div>
                <p className="text-sm font-medium text-slate-700">
                  Drop an image here or click to browse
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Supports: JPG, PNG, GIF, BMP, TIFF
                </p>
              </div>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <div className="mt-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Analyze Tab Content */}
          {activeTab === 'analyze' && (
            <>
              {/* Feature Selection */}
              <div className="mt-4">
                <p className="text-sm font-medium text-slate-700 mb-2">Select features to analyze:</p>
                <div className="flex flex-wrap gap-2">
                  {FEATURES.slice(0, 4).map((feature) => {
                    const Icon = feature.icon;
                    const isSelected = selectedFeatures.includes(feature.id);
                    return (
                      <button
                        key={feature.id}
                        onClick={() => toggleFeature(feature.id)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                          isSelected
                            ? 'bg-purple-100 text-purple-700 border border-purple-200'
                            : 'bg-slate-100 text-slate-600 border border-transparent hover:bg-slate-200'
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                        {feature.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Analyze Button */}
              <Button
                onClick={analyzeImage}
                disabled={loading || !selectedFile || selectedFeatures.length === 0}
                className="w-full mt-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Eye className="w-4 h-4 mr-2" />
                    Analyze Image
                  </>
                )}
              </Button>
            </>
          )}

          {/* OCR Tab Content */}
          {activeTab === 'ocr' && (
            <Button
              onClick={readText}
              disabled={loading || !selectedFile}
              className="w-full mt-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Reading text...
                </>
              ) : (
                <>
                  <Languages className="w-4 h-4 mr-2" />
                  Extract Text
                </>
              )}
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Results Card */}
      {result && !result.error && (
        <Card className="border-slate-200/60 shadow-sm overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-slate-50 to-slate-100 border-b border-slate-200/60 py-4">
            <CardTitle className="flex items-center gap-2 text-slate-800">
              <CheckCircle className="w-5 h-5 text-emerald-600" />
              Analysis Results
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-4">
            {/* Caption */}
            {result.caption && (
              <div className="bg-purple-50 rounded-xl p-4">
                <p className="text-sm font-medium text-purple-700 mb-1">Caption:</p>
                <p className="text-lg text-slate-800">{result.caption.text}</p>
                <p className="text-xs text-purple-600 mt-1">
                  Confidence: {Math.round(result.caption.confidence * 100)}%
                </p>
              </div>
            )}

            {/* Tags */}
            {result.tags && result.tags.length > 0 && (
              <div>
                <p className="text-sm font-medium text-slate-700 mb-2 flex items-center gap-1">
                  <Tag className="w-4 h-4" />
                  Detected Tags:
                </p>
                <div className="flex flex-wrap gap-2">
                  {result.tags.slice(0, 10).map((tag, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center px-2.5 py-1 bg-blue-50 text-blue-700 rounded-full text-sm"
                    >
                      {tag.name}
                      <span className="text-xs text-blue-500 ml-1">
                        ({Math.round(tag.confidence * 100)}%)
                      </span>
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Objects */}
            {result.objects && result.objects.length > 0 && (
              <div>
                <p className="text-sm font-medium text-slate-700 mb-2 flex items-center gap-1">
                  <Box className="w-4 h-4" />
                  Detected Objects ({result.objects.length}):
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {result.objects.slice(0, 6).map((obj, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between px-3 py-2 bg-slate-50 rounded-lg"
                    >
                      <span className="text-sm font-medium text-slate-700">{obj.name}</span>
                      <span className="text-xs text-slate-500">
                        {Math.round(obj.confidence * 100)}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* People */}
            {result.people && result.people.length > 0 && (
              <div>
                <p className="text-sm font-medium text-slate-700 mb-2 flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  People Detected: {result.people.length}
                </p>
                <p className="text-xs text-slate-500">
                  {result.people.length} person(s) found in the image
                </p>
              </div>
            )}

            {/* OCR Text */}
            {result.read?.full_text && (
              <div>
                <p className="text-sm font-medium text-slate-700 mb-2 flex items-center gap-1">
                  <Type className="w-4 h-4" />
                  Extracted Text:
                </p>
                <div className="bg-slate-50 rounded-xl p-4">
                  <pre className="text-sm text-slate-800 whitespace-pre-wrap font-sans">
                    {result.read.full_text}
                  </pre>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
