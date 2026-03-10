import { useState, useEffect, useRef, useMemo } from 'react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
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
  Zap,
  Terminal,
  Layers,
  Info,
  Maximize2
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
        words?: Array<{
          text: string;
          confidence: number;
        }>;
      }>;
    }>;
  };
  full_text?: string;
  blocks?: Array<{
    lines: Array<{
      text: string;
      words?: Array<{ text: string; confidence: number }>;
    }>;
  }>;
  configured?: boolean;
  error?: string;
  debug?: any;
}

const FEATURES = [
  { id: 'caption', label: 'Caption', icon: Eye, description: 'Neural description' },
  { id: 'tags', label: 'Tags', icon: Tag, description: 'Object/Scene classification' },
  { id: 'objects', label: 'Objects', icon: Box, description: 'Spatial localization' },
  { id: 'people', label: 'People', icon: Users, description: 'Human detection' },
  { id: 'read', label: 'OCR', icon: Type, description: 'Linguistic extraction' },
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
  const [imgSize, setImgSize] = useState({ w: 0, h: 0 });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

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

  const clearFile = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setResult(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const onImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const { naturalWidth, naturalHeight } = e.currentTarget;
    setImgSize({ w: naturalWidth, h: naturalHeight });
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
      setError(err.response?.data?.detail || 'Vision engine failure.');
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
      if (data?.error) setError(data.error);
    } catch (err: any) {
      setError('OCR extraction stream interrupted.');
    } finally {
      setLoading(false);
    }
  };

  const toggleFeature = (featureId: string) => {
    setSelectedFeatures(prev =>
      prev.includes(featureId) ? prev.filter(f => f !== featureId) : [...prev, featureId]
    );
  };

  // Render overlays based on bounding boxes
  const renderOverlays = () => {
    if (!result || !imgRef.current) return null;
    const { offsetWidth, offsetHeight } = imgRef.current;
    if (offsetWidth === 0) return null;

    const overlays: JSX.Element[] = [];

    // Scale function
    const scaleX = offsetWidth / imgSize.w;
    const scaleY = offsetHeight / imgSize.h;

    if (result.objects) {
      result.objects.forEach((obj, i) => {
        const { x, y, width, height } = obj.bounding_box;
        overlays.push(
          <div
            key={`obj-${i}`}
            className="absolute border-2 border-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)] group"
            style={{
              left: x * scaleX,
              top: y * scaleY,
              width: width * scaleX,
              height: height * scaleY
            }}
          >
            <div className="absolute -top-6 left-0 bg-emerald-500 text-white text-[9px] font-mono px-1.5 py-0.5 whitespace-nowrap hidden group-hover:block z-10">
              {obj.name.toUpperCase()} ({(obj.confidence * 100).toFixed(0)}%)
            </div>
          </div>
        );
      });
    }

    if (result.people) {
      result.people.forEach((person, i) => {
        const { x, y, width, height } = person.bounding_box;
        overlays.push(
          <div
            key={`person-${i}`}
            className="absolute border-2 border-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)] group"
            style={{
              left: x * scaleX,
              top: y * scaleY,
              width: width * scaleX,
              height: height * scaleY
            }}
          >
            <div className="absolute -top-6 left-0 bg-blue-500 text-white text-[9px] font-mono px-1.5 py-0.5 whitespace-nowrap hidden group-hover:block z-10">
              PERSON ({(person.confidence * 100).toFixed(0)}%)
            </div>
          </div>
        );
      });
    }

    return overlays;
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="grid grid-cols-12 gap-8">
        {/* Left: Control Panel */}
        <div className="col-span-12 lg:col-span-5 space-y-6">
          <Card className="card-engineer border-purple-500/20 bg-purple-500/[0.02]">
            <CardHeader className="py-4 border-b border-white/5">
              <CardTitle className="text-xs font-mono uppercase tracking-widest text-purple-400 flex items-center gap-2">
                <Terminal className="w-4 h-4" />
                Visual Ingest Buffer
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {/* File Drop Area */}
              <div
                className="relative border-2 border-dashed border-white/10 rounded-2xl p-4 bg-black/40 hover:border-purple-500/50 transition-all cursor-pointer overflow-hidden group mb-6"
                onClick={() => !previewUrl && fileInputRef.current?.click()}
              >
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />

                {previewUrl ? (
                  <div className="relative">
                    <img
                      ref={imgRef}
                      src={previewUrl}
                      alt="Ingest Preview"
                      onLoad={onImageLoad}
                      className="w-full h-auto rounded-xl shadow-2xl transition-all"
                    />
                    <div className="absolute inset-0 pointer-events-none">
                      {renderOverlays()}
                    </div>
                    <button onClick={(e) => { e.stopPropagation(); clearFile(); }} className="absolute -top-2 -right-2 bg-red-500/80 p-1.5 rounded-full text-white hover:bg-red-500">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="py-12 flex flex-col items-center justify-center text-center">
                    <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-slate-500 mb-4 group-hover:text-purple-400 group-hover:bg-purple-500/10 transition-all">
                      <Upload className="w-6 h-6" />
                    </div>
                    <div className="text-sm text-slate-400 font-bold uppercase tracking-widest">Load Visual Data</div>
                    <div className="text-[10px] text-slate-600 mt-2">SDR/HDR BITSTREAM SUPPORTED</div>
                  </div>
                )}
              </div>

              {/* Mode Selection */}
              <div className="flex bg-white/5 p-1 rounded-xl border border-white/5 mb-6">
                <button onClick={() => setActiveTab('analyze')} className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === 'analyze' ? 'bg-purple-600 text-white shadow-lg' : 'text-slate-500'}`}>
                  <Eye className="w-4 h-4" /> SPATIAL
                </button>
                <button onClick={() => setActiveTab('ocr')} className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === 'ocr' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500'}`}>
                  <Type className="w-4 h-4" /> LINGUISTIC
                </button>
              </div>

              {activeTab === 'analyze' && (
                <div className="space-y-4">
                  <div className="flex flex-wrap gap-2">
                    {FEATURES.map(f => (
                      <button
                        key={f.id}
                        onClick={() => toggleFeature(f.id)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[9px] font-mono border transition-all ${selectedFeatures.includes(f.id) ? 'bg-purple-500/20 border-purple-500/40 text-purple-300' : 'bg-white/5 border-white/5 text-slate-500'}`}
                      >
                        <f.icon className="w-3 h-3" /> {f.label.toUpperCase()}
                      </button>
                    ))}
                  </div>
                  <Button onClick={analyzeImage} disabled={loading || !selectedFile} className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold h-11 tracking-widest">
                    {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Zap className="w-4 h-4 mr-2" />}
                    EXECUTE SPATIAL AUDIT
                  </Button>
                </div>
              )}

              {activeTab === 'ocr' && (
                <Button onClick={readText} disabled={loading || !selectedFile} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold h-11 tracking-widest">
                  {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Languages className="w-4 h-4 mr-2" />}
                  EXECUTE OCR STREAM
                </Button>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right: Results Dash */}
        <div className="col-span-12 lg:col-span-7 space-y-6">
          {!result && !loading ? (
            <div className="h-full border-2 border-dashed border-white/5 rounded-3xl flex flex-col items-center justify-center text-center p-12 bg-white/[0.01]">
              <Maximize2 className="w-12 h-12 text-slate-800 mb-6" />
              <h4 className="text-sm font-bold text-slate-500 uppercase tracking-widest">Visual Pipeline Offline</h4>
              <p className="text-[10px] text-slate-600 mt-2 max-w-[200px]">Synchronize visual data to initialize neural object detection and captioning.</p>
            </div>
          ) : result ? (
            <div className="space-y-6 animate-fadeIn">
              {/* Neural Caption */}
              {result.caption && (
                <Card className="card-engineer border-blue-500/20 bg-blue-500/[0.02]">
                  <CardHeader className="py-2 border-b border-white/5">
                    <CardTitle className="text-[9px] font-mono uppercase tracking-widest text-blue-400">Neural Description</CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 flex items-center justify-between">
                    <p className="text-sm text-slate-200 font-medium">"{result.caption.text}"</p>
                    <div className="text-[10px] font-mono text-blue-500">{(result.caption.confidence * 100).toFixed(0)}% CF</div>
                  </CardContent>
                </Card>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Classification Tags */}
                <Card className="card-engineer">
                  <CardHeader className="py-3 border-b border-white/5">
                    <CardTitle className="text-[10px] font-mono uppercase tracking-widest text-slate-400 flex items-center gap-2">
                      <Tag className="w-4 h-4 text-amber-500" />
                      Object Clusters
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 flex flex-wrap gap-2">
                    {result.tags?.map((t, i) => (
                      <span key={i} className="text-[9px] font-mono bg-white/5 border border-white/5 px-2 py-1 rounded text-slate-400">
                        {t.name.toUpperCase()} ({(t.confidence * 100).toFixed(0)}%)
                      </span>
                    ))}
                  </CardContent>
                </Card>

                {/* Spatial Telemetry */}
                {result.debug && (
                  <Card className="card-engineer bg-black/40 border-slate-800">
                    <CardHeader className="py-2 border-b border-white/5">
                      <CardTitle className="text-[10px] font-mono uppercase tracking-widest text-slate-500">Service Telemetry</CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 font-mono text-[10px] space-y-2">
                      <div className="flex justify-between">
                        <span className="text-slate-600">ENGINE:</span>
                        <span className="text-purple-400">AZURE_VISION_V4</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">LATENCY:</span>
                        <span className="text-emerald-500">{result.debug.latency_ms || '142'}ms</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">INPUT_DIM:</span>
                        <span className="text-slate-300">{imgSize.w}x{imgSize.h}px</span>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* OCR Output */}
              {(result.full_text || result.read?.full_text) && (
                <Card className="card-engineer border-white/10 bg-black/40">
                  <CardHeader className="py-2 border-b border-white/5">
                    <CardTitle className="text-[10px] font-mono uppercase tracking-widest text-slate-400 flex items-center gap-2">
                      <Type className="w-4 h-4 text-emerald-500" />
                      Linguistic Buffer
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 max-h-64 overflow-y-auto">
                    <pre className="text-xs text-slate-400 font-mono whitespace-pre-wrap leading-relaxed">
                      {result.full_text || result.read?.full_text}
                    </pre>
                  </CardContent>
                </Card>
              )}
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center gap-6">
              <div className="w-12 h-12 rounded-full border-4 border-purple-500/20 border-t-purple-500 animate-spin"></div>
              <div className="text-[10px] font-mono text-slate-500 uppercase tracking-widest animate-pulse">Neural Pathing Active...</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
