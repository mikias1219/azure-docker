import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/hooks/useAuth';
import { LogIn, UserPlus, Brain, Shield, Zap, Globe, ArrowRight, AlertCircle } from 'lucide-react';

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

  // Redirect to dashboard only once when we know user is authenticated (no blink loop).
  useEffect(() => {
    if (authLoading || !isAuthenticated || hasRedirectedRef.current) return;
    hasRedirectedRef.current = true;
    router.replace('/dashboard');
  }, [authLoading, isAuthenticated, router]);

  if (authLoading || isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center mesh-bg">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-xl shadow-blue-600/30 animate-pulse">
            <Brain className="w-6 h-6 text-white" />
          </div>
          <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-200 border-t-blue-600" />
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
          // After successful registration, log them in
          const loginResult = await login(username, password);
          if (loginResult.success) {
            router.replace('/dashboard');
          } else {
            setError('Registration successful but login failed. Please try logging in.');
          }
        }
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const features = [
    { icon: Brain, label: 'Document Intelligence', desc: 'Extract text from any document' },
    { icon: Globe, label: 'Text & Language AI', desc: 'Sentiment, entities, key phrases' },
    { icon: Zap, label: 'Vision & OCR', desc: 'Analyze images, read text' },
    { icon: Shield, label: 'Secure & Private', desc: 'Your data stays yours' },
  ];

  return (
    <div className="min-h-screen flex mesh-bg">
      {/* ── Left panel — branding ───────────────────────────── */}
      <div className="hidden lg:flex lg:w-[52%] relative overflow-hidden">
        {/* Animated gradient orbs */}
        <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-indigo-600/30 blur-3xl animate-orb" />
        <div className="absolute bottom-0 right-0 w-80 h-80 rounded-full bg-blue-500/25 blur-3xl animate-orb delay-400" />
        <div className="absolute top-1/2 left-1/3 w-64 h-64 rounded-full bg-violet-500/20 blur-2xl animate-orb delay-200" />

        <div className="relative z-10 flex flex-col justify-center px-16 xl:px-20 py-16">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-16 animate-fade-in-left">
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center border border-white/30 shadow-lg">
              <Brain className="w-6 h-6 text-white" />
            </div>
            <span className="text-white font-bold text-xl tracking-tight">AI Document Studio</span>
          </div>

          {/* Headline */}
          <div className="mb-10 animate-slide-up">
            <h1 className="text-4xl xl:text-5xl font-black text-white leading-tight mb-4">
              Unlock the Power of
              <span className="block mt-1 bg-gradient-to-r from-blue-300 to-violet-300 bg-clip-text text-transparent">
                Azure AI Services
              </span>
            </h1>
            <p className="text-blue-100/80 text-lg leading-relaxed max-w-md">
              8 Azure AI capabilities in one beautiful dashboard — analyze documents, understand language, see through images, and more.
            </p>
          </div>

          {/* Feature list */}
          <div className="space-y-4">
            {features.map((f, i) => (
              <div
                key={f.label}
                className="flex items-center gap-4 animate-fade-in-left"
                style={{ animationDelay: `${0.1 + i * 0.1}s`, opacity: 0 }}
              >
                <div className="w-10 h-10 rounded-xl bg-white/15 border border-white/20 flex items-center justify-center flex-shrink-0">
                  <f.icon className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-white font-semibold text-sm">{f.label}</p>
                  <p className="text-blue-200/70 text-xs">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Right panel — form ──────────────────────────────── */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 lg:px-16">
        <div className="w-full max-w-md animate-fade-in">
          {/* Mobile logo */}
          <div className="flex lg:hidden items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-600/30">
              <Brain className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-slate-900 text-lg">AI Document Studio</span>
          </div>

          <h2 className="text-2xl font-black text-slate-900 mb-1">
            {isLogin ? 'Welcome back' : 'Create your account'}
          </h2>
          <p className="text-slate-500 text-sm mb-8">
            {isLogin
              ? 'Sign in to access your AI workspace'
              : 'Get started with all 8 Azure AI features for free'}
          </p>

          {/* Session expired banner */}
          {sessionExpired && (
            <div className="flex items-center gap-2 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 text-sm mb-6">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              Your session expired. Please sign in again.
            </div>
          )}

          {/* Card */}
          <div className="glass rounded-2xl shadow-xl shadow-slate-200/80 p-8">
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {error}
                </div>
              )}

              {/* Username */}
              <div>
                <label htmlFor="username" className="block text-sm font-semibold text-slate-700 mb-1.5">
                  Username
                </label>
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  placeholder="Enter your username"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all text-sm"
                />
              </div>

              {/* Email (register only) */}
              {!isLogin && (
                <div>
                  <label htmlFor="email" className="block text-sm font-semibold text-slate-700 mb-1.5">
                    Email
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="you@example.com"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all text-sm"
                  />
                </div>
              )}

              {/* Password */}
              <div>
                <label htmlFor="password" className="block text-sm font-semibold text-slate-700 mb-1.5">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all text-sm"
                />
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold py-2.5 px-6 rounded-xl transition-all duration-200 shadow-lg shadow-blue-600/25 hover:shadow-blue-600/40 disabled:opacity-60 disabled:cursor-not-allowed"
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

            {/* Toggle */}
            <div className="mt-6 pt-5 border-t border-slate-100 text-center">
              <p className="text-slate-500 text-sm">
                {isLogin ? "Don't have an account? " : 'Already have an account? '}
                <button
                  type="button"
                  onClick={() => { setIsLogin(!isLogin); setError(''); }}
                  className="text-blue-600 hover:text-blue-500 font-semibold transition-colors"
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
