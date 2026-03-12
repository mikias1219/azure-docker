import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/hooks/useAuth';
import { LogIn, UserPlus, Brain, Globe, Zap, Shield, ArrowRight, AlertCircle } from 'lucide-react';

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { login, register, isAuthenticated, loading: authLoading } = useAuth();
  const router = useRouter();
  const hasRedirectedRef = useRef(false);
  const sessionExpired = router.isReady && router.query.reason === 'expired';

  useEffect(() => {
    if (authLoading || !isAuthenticated || hasRedirectedRef.current) return;
    hasRedirectedRef.current = true;
    router.replace('/dashboard');
  }, [authLoading, isAuthenticated, router]);

  if (authLoading || isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0b10] mesh-accent-1">
        <div className="flex flex-col items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center shadow-glow-sm">
            <Brain className="w-7 h-7 text-blue-400" />
          </div>
          <div className="animate-spin rounded-full h-6 w-6 border-2 border-blue-500/30 border-t-blue-500" />
          <p className="text-xs text-slate-500 font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (isLogin) {
        const result = await login(username, password);
        if (!result.success) {
          setError(result.error || 'Login failed');
        } else {
          router.replace('/dashboard');
        }
      } else {
        const result = await register(username, email, password);
        if (!result.success) {
          setError(result.error || 'Registration failed');
        } else {
          const loginResult = await login(username, password);
          if (loginResult.success) {
            router.replace('/dashboard');
          } else {
            setError('Registration successful but login failed. Please try logging in.');
          }
        }
      }
    } catch {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const features = [
    { icon: Brain, label: 'Document Intelligence', desc: 'Extract text and data from documents' },
    { icon: Globe, label: 'Natural Language', desc: 'Text analytics, QnA, CLU' },
    { icon: Zap, label: 'Computer Vision', desc: 'Image analysis and OCR' },
    { icon: Shield, label: 'Secure', desc: 'Register once, use all services' },
  ];

  return (
    <div className="min-h-screen flex bg-slate-50 text-slate-900 mesh-accent-1">
      {/* Left panel — branding */}
      <div className="hidden lg:flex lg:w-[48%] relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-blue-500/10 via-transparent to-indigo-500/10" />
        <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-blue-600/10 blur-3xl animate-orb" />
        <div className="absolute bottom-0 right-0 w-80 h-80 rounded-full bg-indigo-500/10 blur-3xl animate-orb delay-400" />
        <div className="relative z-10 flex flex-col justify-center px-14 xl:px-20 py-16">
          <div className="flex items-center gap-3 mb-14">
            <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-glow-sm">
              <Brain className="w-6 h-6" />
            </div>
            <span className="text-slate-900 font-bold text-xl tracking-tight">Azure AI Solution</span>
          </div>
          <h1 className="text-4xl xl:text-5xl font-black text-slate-900 leading-tight mb-4">
            Azure AI Solution
            <span className="block mt-1 text-xl font-normal text-slate-600">
              Exam AI-102 — Designing and Implementing a Microsoft Azure AI Solution
            </span>
          </h1>
          <p className="text-slate-600 text-lg leading-relaxed max-w-md mb-12">
            Sign in to use Document Intelligence, Computer Vision, Natural Language, Speech, Knowledge Mining, and Generative AI (RAG) in one place.
          </p>
          <div className="space-y-4">
            {features.map((f, i) => (
              <div
                key={f.label}
                className="flex items-center gap-4 text-slate-700"
              >
                <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center flex-shrink-0 shadow-sm">
                  <f.icon className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-slate-900 font-semibold text-sm">{f.label}</p>
                  <p className="text-slate-600 text-xs">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 lg:px-16">
        <div className="w-full max-w-md">
          <div className="flex lg:hidden items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center">
              <Brain className="w-5 h-5" />
            </div>
            <span className="font-bold text-slate-900 text-lg">Azure AI Solution</span>
          </div>

          <h2 className="text-2xl font-bold text-slate-900 mb-1">
            {isLogin ? 'Welcome back' : 'Create your account'}
          </h2>
          <p className="text-slate-500 text-sm mb-8">
            {isLogin
              ? 'Sign in to access your AI workspace'
              : 'Get started with all Azure AI features'}
          </p>

          {sessionExpired && (
            <div className="flex items-center gap-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-200 px-4 py-3 text-sm mb-6">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              Your session expired. Please sign in again.
            </div>
          )}

          <div className="glass-studio rounded-2xl p-8 shadow-xl">
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 text-red-300 px-4 py-3 rounded-xl text-sm">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {error}
                </div>
              )}

              <div>
                <label htmlFor="username" className="block text-sm font-medium text-slate-700 mb-1.5">
                  Username
                </label>
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  placeholder="Enter your username"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/40 transition-all text-sm"
                />
              </div>

              {!isLogin && (
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1.5">
                    Email
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="you@example.com"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/40 transition-all text-sm"
                  />
                </div>
              )}

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-1.5">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/40 transition-all text-sm"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2.5 px-6 rounded-xl transition-all duration-200 shadow-lg shadow-blue-600/25 hover:shadow-glow-sm disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:shadow-lg"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="animate-spin w-4 h-4 border-2 border-white/30 border-t-white rounded-full" />
                    Please wait…
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    {isLogin ? <LogIn className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
                    {isLogin ? 'Sign in' : 'Create account'}
                    <ArrowRight className="w-4 h-4" />
                  </span>
                )}
              </button>
            </form>

            <div className="mt-6 pt-5 border-t border-white/5 text-center">
              <p className="text-slate-500 text-sm">
                {isLogin ? "Don't have an account? " : 'Already have an account? '}
                <button
                  type="button"
                  onClick={() => { setIsLogin(!isLogin); setError(''); }}
                  className="text-blue-400 hover:text-blue-300 font-medium transition-colors"
                >
                  {isLogin ? 'Sign up' : 'Sign in'}
                </button>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
