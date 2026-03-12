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
    <div className="min-h-screen flex items-center justify-center bg-[#0a0b10] mesh-accent-1">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -left-32 w-[500px] h-[500px] rounded-full bg-blue-600/12 blur-3xl animate-orb" />
        <div className="absolute -bottom-32 -right-32 w-[500px] h-[500px] rounded-full bg-blue-500/10 blur-3xl animate-orb delay-400" />
      </div>

      <div className="relative z-10 flex flex-col items-center gap-8 text-center px-6">
        <div className="relative">
          <div className="w-20 h-20 rounded-3xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center shadow-glow">
            <ActiveIcon className="w-10 h-10 text-blue-400 transition-all duration-500" />
          </div>
        </div>

        <div className="animate-fade-in">
          <h1 className="text-4xl font-black text-white tracking-tight mb-2">
            Azure AI Solution
          </h1>
          <p className="text-slate-500 text-lg">Exam AI-102 — Document Intelligence, Vision, Language, Speech, Knowledge Mining, RAG</p>
        </div>

        <div className="flex flex-wrap justify-center gap-2 max-w-sm animate-fade-in">
          {SERVICES.map((s, i) => (
            <span
              key={s.label}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all duration-300 ${
                i === tick
                  ? 'bg-blue-600/30 text-blue-200 border border-blue-500/30'
                  : 'bg-white/5 text-slate-500 border border-white/5'
              }`}
            >
              <s.icon className="w-3 h-3" />
              {s.label}
            </span>
          ))}
        </div>

        <div className="flex items-center gap-2 text-slate-500 animate-fade-in">
          <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-500/30 border-t-blue-500" />
          <span className="text-sm">Loading your workspace…</span>
        </div>
      </div>
    </div>
  );
}
