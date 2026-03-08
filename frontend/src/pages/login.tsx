import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { LogIn, UserPlus } from 'lucide-react';

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
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary-200 border-t-primary-600" />
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

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 animate-fade-in">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-bold text-slate-900">Document Intelligence</h2>
          <p className="mt-2 text-sm text-slate-600">AI-powered document analysis</p>
        </div>

        {sessionExpired && (
          <div className="rounded-lg bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 text-sm mb-4">
            Your session expired. Please log in again.
          </div>
        )}
        <Card className="border-slate-200/80 shadow-soft overflow-hidden">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-slate-900">
              {isLogin ? <LogIn className="w-5 h-5 text-primary-500" /> : <UserPlus className="w-5 h-5 text-primary-500" />}
              {isLogin ? 'Sign in' : 'Create account'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    placeholder="Username"
                    className="rounded-lg border-slate-300"
                  />
                </div>

                {!isLogin && (
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      placeholder="Email"
                      className="rounded-lg border-slate-300"
                    />
                  </div>
                )}

                <div>
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="Password"
                    className="rounded-lg border-slate-300"
                  />
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Please wait…' : isLogin ? 'Sign in' : 'Sign up'}
              </Button>

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => { setIsLogin(!isLogin); setError(''); }}
                  className="text-primary-600 hover:text-primary-500 text-sm font-medium"
                >
                  {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
                </button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
