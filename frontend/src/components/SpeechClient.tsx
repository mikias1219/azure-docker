import React, { useState, useRef } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import {
    Mic,
    Volume2,
    FileAudio,
    Activity,
    Zap,
    CheckCircle,
    AlertCircle,
    Play,
    Pause,
    RefreshCw,
    Terminal,
    Cpu,
    Fingerprint
} from 'lucide-react';
import { speechApi } from '@/lib/api';

export const SpeechClient: React.FC = () => {
    const [file, setFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);
    const [synthText, setSynthText] = useState('');
    const [isSynthesizing, setIsSynthesizing] = useState(false);
    const [synthResult, setSynthResult] = useState<any>(null);
    const [synthError, setSynthError] = useState<string | null>(null);

    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
            setError(null);
        }
    };

    const handleTranscribe = async () => {
        if (!file) return;
        setLoading(true);
        setError(null);
        try {
            const data = await speechApi.transcribe(file);
            if (data.error) throw new Error(data.error);
            setResult(data);
        } catch (err: any) {
            setError(err.message || 'Transcription failed');
        } finally {
            setLoading(false);
        }
    };

    const handleSynthesize = async () => {
        if (!synthText.trim()) return;
        setIsSynthesizing(true);
        setSynthError(null);
        setSynthResult(null);
        try {
            const data = await speechApi.synthesize(synthText);
            if (data?.error) {
                setSynthError(data.error);
            } else {
                setSynthResult(data);
            }
        } catch (err: any) {
            setSynthError(err.message || 'Synthesis failed');
        } finally {
            setIsSynthesizing(false);
        }
    };

    return (
        <div className="space-y-8 animate-fadeIn pb-24">
            {/* Header Context */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20">
                            <Mic className="w-5 h-5 text-amber-500" />
                        </div>
                        <h1 className="text-3xl font-black text-white tracking-tighter uppercase italic">Azure AI Speech</h1>
                    </div>
                    <p className="text-slate-400 text-sm font-medium max-w-2xl leading-relaxed">
                        Neural Audio Processing: Convert spoken language to structured text and synthesize human-like speech with context-aware prosody.
                    </p>
                </div>
                <div className="flex gap-4">
                    <div className="px-4 py-2 rounded-2xl bg-white/[0.03] border border-white/5 flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                        <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest leading-none">Acoustic Model: Active</span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-12 gap-8">
                {/* Module 1: STT (Speech to Text) */}
                <div className="col-span-12 lg:col-span-6 space-y-6">
                    <Card className="card-engineer overflow-hidden group">
                        <div className="h-1 w-full bg-gradient-to-r from-amber-500/50 to-transparent"></div>
                        <CardHeader className="border-b border-white/5 bg-white/[0.02] py-4">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-xs font-black uppercase tracking-[0.2em] text-amber-500 flex items-center gap-2">
                                    <Fingerprint className="w-4 h-4" />
                                    Neural Transcription (STT)
                                </CardTitle>
                                <Terminal className="w-4 h-4 text-slate-700" />
                            </div>
                        </CardHeader>
                        <CardContent className="p-8">
                            <div className="space-y-6">
                                {/* Custom File Upload */}
                                <div
                                    onClick={() => fileInputRef.current?.click()}
                                    className={`
                    cursor-pointer border-2 border-dashed rounded-[32px] p-10
                    flex flex-col items-center justify-center text-center transition-all duration-500
                    ${file ? 'border-amber-500/40 bg-amber-500/5' : 'border-slate-800 hover:border-amber-500/30 hover:bg-white/[0.02]'}
                  `}
                                >
                                    <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="audio/*" />
                                    <div className={`w-16 h-16 rounded-[24px] flex items-center justify-center mb-4 transition-transform duration-500 ${file ? 'bg-amber-500 text-white scale-110' : 'bg-white/5 text-slate-500'}`}>
                                        <FileAudio className="w-8 h-8" />
                                    </div>
                                    <h4 className="text-white font-black uppercase italic tracking-wider mb-2">
                                        {file ? file.name : 'Select Audio Stream'}
                                    </h4>
                                    <p className="text-slate-500 text-xs font-mono lowercase">
                                        {file ? `${(file.size / 1024).toFixed(1)} KB indexed` : 'wav, mp3, ogg supported'}
                                    </p>
                                </div>

                                <Button
                                    disabled={!file || loading}
                                    onClick={handleTranscribe}
                                    className="w-full bg-amber-600 hover:bg-amber-500 text-white h-14 rounded-2xl font-black uppercase tracking-widest shadow-lg shadow-amber-900/20 disabled:opacity-20"
                                >
                                    {loading ? <RefreshCw className="w-5 h-5 animate-spin mr-2" /> : <Mic className="w-5 h-5 mr-2" />}
                                    {loading ? 'Analyzing Waveform...' : 'Execute Transcription'}
                                </Button>

                                {error && (
                                    <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center gap-3 text-red-500 text-xs font-mono">
                                        <AlertCircle className="w-4 h-4 shrink-0" />
                                        {error}
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Transcript Result */}
                    {result && (
                        <Card className="card-engineer border-amber-500/20 bg-amber-500/[0.02] animate-slideIn">
                            <CardHeader className="py-3 border-b border-white/5">
                                <div className="flex items-center gap-2">
                                    <CheckCircle className="w-4 h-4 text-emerald-500" />
                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Linguistic Output</span>
                                </div>
                            </CardHeader>
                            <CardContent className="p-6">
                                <p className="text-lg font-medium text-slate-200 leading-relaxed italic">
                                    "{result.text}"
                                </p>
                                <div className="mt-6 pt-6 border-t border-white/5 flex items-center justify-between text-[10px] font-mono text-slate-500">
                                    <div className="flex items-center gap-2 uppercase">
                                        <Activity className="w-3 h-3 text-amber-500" />
                                        Confidence: <span className="text-emerald-400">{(result.confidence * 100).toFixed(0)}%</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>

                {/* Module 2: TTS (Text to Speech) */}
                <div className="col-span-12 lg:col-span-6 space-y-6">
                    <Card className="card-engineer overflow-hidden group h-full">
                        <div className="h-1 w-full bg-gradient-to-r from-blue-500/50 to-transparent"></div>
                        <CardHeader className="border-b border-white/5 bg-white/[0.02] py-4">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-xs font-black uppercase tracking-[0.2em] text-blue-500 flex items-center gap-2">
                                    <Volume2 className="w-4 h-4" />
                                    Neural Synthesis (TTS)
                                </CardTitle>
                                <Cpu className="w-4 h-4 text-slate-700" />
                            </div>
                        </CardHeader>
                        <CardContent className="p-8 space-y-6">
                            <div className="relative">
                                <textarea
                                    value={synthText}
                                    onChange={(e) => setSynthText(e.target.value)}
                                    placeholder="Enter text context for synthesis..."
                                    className="w-full bg-[#0a0b10] border border-slate-800 rounded-[28px] p-6 text-slate-200 placeholder:text-slate-700 min-h-[160px] focus:border-blue-500/50 focus:ring-0 transition-all outline-none resize-none font-medium"
                                />
                            </div>

                            <Button
                                disabled={!synthText.trim() || isSynthesizing}
                                onClick={handleSynthesize}
                                className="w-full bg-blue-600 hover:bg-blue-500 text-white h-14 rounded-2xl font-black uppercase tracking-widest shadow-lg shadow-blue-900/20 disabled:opacity-20"
                            >
                                {isSynthesizing ? <RefreshCw className="w-5 h-5 animate-spin mr-2" /> : <Play className="w-5 h-5 mr-2" />}
                                {isSynthesizing ? 'Synthesizing…' : 'Synthesize (Step 2)'}
                            </Button>

                            {synthError && (
                                <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center gap-3 text-red-400 text-sm">
                                    <AlertCircle className="w-4 h-4 shrink-0" />
                                    {synthError}
                                </div>
                            )}

                            {synthResult && !synthResult.error && (
                                <div className="p-6 rounded-3xl bg-blue-500/5 border border-blue-500/20 space-y-4">
                                    <div className="flex items-center justify-between">
                                        <span className="text-[10px] font-black uppercase text-blue-400 tracking-widest">Synthesis Pipeline: Success</span>
                                        <div className="flex gap-1 animate-pulse">
                                            {[1, 2, 3, 4].map(i => <div key={i} className="w-1 h-3 bg-blue-500 rounded-full"></div>)}
                                        </div>
                                    </div>
                                    <div className="p-4 rounded-xl bg-black/40 border border-slate-800 flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 rounded-lg bg-blue-500 text-white"><Play className="w-4 h-4 fill-current" /></div>
                                            <div>
                                                <p className="text-[10px] font-mono text-slate-500 uppercase">Voice Profile</p>
                                                <p className="text-xs font-bold text-white">{synthResult.voice || 'AvaMultilingual'}</p>
                                            </div>
                                        </div>
                                        <span className="text-[10px] font-mono text-slate-600 italic">2.4s duration</span>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Global Transparency Panes */}
                {(result || synthResult) && (
                    <>
                        <div className="col-span-12 lg:col-span-8">
                            <Card className="card-engineer border-purple-500/20 bg-purple-500/5">
                                <CardHeader>
                                    <CardTitle className="text-[10px] font-black uppercase tracking-widest text-purple-400 flex items-center gap-2">
                                        <Zap className="w-4 h-4" />
                                        Technical Reasoning
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-xs text-purple-200/70 italic leading-relaxed font-medium">
                                        "{(result?.reasoning || synthResult?.reasoning)}"
                                    </p>
                                </CardContent>
                            </Card>
                        </div>
                        <div className="col-span-12 lg:col-span-4">
                            <Card className="card-engineer bg-black/40 border-slate-800">
                                <CardHeader>
                                    <CardTitle className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
                                        Performance Telemetry
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-2 font-mono text-[10px]">
                                    <div className="flex justify-between">
                                        <span className="text-slate-600 uppercase italic">ENGINE:</span>
                                        <span className="text-blue-400">{(result?.debug?.engine || synthResult?.debug?.engine)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-slate-600 uppercase italic">LATENCY:</span>
                                        <span className="text-emerald-400">{(result?.debug?.latency_ms || synthResult?.debug?.latency_ms)}ms</span>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};
