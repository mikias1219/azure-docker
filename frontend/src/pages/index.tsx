import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/hooks/useAuth';
import { Brain, FileText, MessageSquare, Eye, Search, Sparkles } from 'lucide-react';

const SERVICES = [
  { icon: Brain, label: 'Document Intelligence' },
  { icon: FileText, label: 'Text Analytics' },
  { icon: MessageSquare, label: 'Question Answering' },
  { icon: Eye, label: 'AI Vision' },
  { icon: Search, label: 'Knowledge Mining' },
  { icon: Sparkles, label: 'RAG Pipeline' },
];

export default function HomePage() {
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);
  const [tick, setTick] = useState(0);
  const hasRedirectedRef = useRef(false);

  useEffect(() => { setIsClient(true); }, []);

  // Cycle through service icons for visual interest
  useEffect(() => {
    const id = setInterval(() => setTick(t => (t + 1) % SERVICES.length), 800);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (!isClient || loading || hasRedirectedRef.current) return;
    hasRedirectedRef.current = true;
    if (isAuthenticated) {
      router.replace('/dashboard');
    } else {
      router.replace('/login');
    }
  }, [isAuthenticated, loading, router, isClient]);

  const ActiveIcon = SERVICES[tick].icon;

  return (
    <div className="min-h-screen flex items-center justify-center mesh-bg">
      {/* Animated background orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -left-32 w-[500px] h-[500px] rounded-full bg-indigo-600/15 blur-3xl animate-orb" />
        <div className="absolute -bottom-32 -right-32 w-[500px] h-[500px] rounded-full bg-blue-500/15 blur-3xl animate-orb delay-400" />
      </div>

      <div className="relative z-10 flex flex-col items-center gap-8 text-center px-6">
        {/* Logo mark */}
        <div className="relative">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-2xl shadow-blue-600/40 animate-float">
            <ActiveIcon className="w-10 h-10 text-white transition-all duration-500" />
          </div>
          {/* Pulse ring */}
          <div className="absolute inset-0 rounded-3xl bg-blue-600/30 animate-ping" style={{ animationDuration: '2s' }} />
        </div>

        {/* Brand name */}
        <div className="animate-fade-in">
          <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-2">
            AI Document{' '}
            <span className="gradient-text">Studio</span>
          </h1>
          <p className="text-slate-500 text-lg">Powered by 8 Azure AI services</p>
        </div>

        {/* Service chips */}
        <div className="flex flex-wrap justify-center gap-2 max-w-sm animate-fade-in delay-200">
          {SERVICES.map((s, i) => (
            <span
              key={s.label}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-500 ${i === tick
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30 scale-105'
                  : 'bg-white/80 text-slate-600 border border-slate-200'
                }`}
            >
              <s.icon className="w-3 h-3" />
              {s.label}
            </span>
          ))}
        </div>

        {/* Loading indicator */}
        <div className="flex items-center gap-2 text-slate-400 animate-fade-in delay-300">
          <div className="animate-spin rounded-full h-4 w-4 border-2 border-slate-200 border-t-blue-600" />
          <span className="text-sm">Loading your workspace…</span>
        </div>
      </div>
    </div>
  );
}
