import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Clock, Send, Loader2, Info, Brain, Globe, Calendar, Sun, MapPin, CheckCircle, AlertCircle } from 'lucide-react';
import { clockApi } from '@/lib/api';

interface ClockResult {
  query: string;
  top_intent: string;
  confidence: number;
  entities: Array<{
    category: string;
    text: string;
    confidence: number;
    offset: number;
    length: number;
  }>;
  response: string;
  demo_mode?: boolean;
  raw_result?: any;
}

const EXAMPLE_QUERIES = [
  'What time is it?',
  'What time is it in London?',
  'What day is it?',
  'What date is it today?',
  'What day was January 1st 2020?',
];

export function ClockClient() {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ClockResult | null>(null);
  const [info, setInfo] = useState<any>(null);
  const [infoLoading, setInfoLoading] = useState(true);

  useEffect(() => {
    loadInfo();
  }, []);

  const loadInfo = async () => {
    try {
      const data = await clockApi.getInfo();
      setInfo(data);
    } catch (err: any) {
      console.error('Failed to load clock info:', err);
    } finally {
      setInfoLoading(false);
    }
  };

  const analyzeQuery = async () => {
    if (!query.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const data = await clockApi.analyze(query);
      setResult(data);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to analyze query');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !loading) {
      analyzeQuery();
    }
  };

  const getIntentIcon = (intent: string) => {
    switch (intent) {
      case 'GetTime':
        return <Clock className="w-5 h-5" />;
      case 'GetDay':
        return <Sun className="w-5 h-5" />;
      case 'GetDate':
        return <Calendar className="w-5 h-5" />;
      default:
        return <Brain className="w-5 h-5" />;
    }
  };

  const getIntentColor = (intent: string) => {
    switch (intent) {
      case 'GetTime':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'GetDay':
        return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'GetDate':
        return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="space-y-4">
      {/* Main Input Card */}
      <Card className="border-slate-200/60 shadow-sm overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-indigo-50 to-purple-50 border-b border-slate-200/60 py-4">
          <CardTitle className="flex items-center gap-2 text-slate-800">
            <Globe className="w-5 h-5 text-indigo-600" />
            Natural Language Clock
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 space-y-4">
          {/* Info Badge */}
          <div className="flex items-center gap-2 text-xs">
            {infoLoading ? (
              <span className="flex items-center gap-1 text-slate-500">
                <Loader2 className="w-3 h-3 animate-spin" />
                Loading...
              </span>
            ) : info?.project_name ? (
              <span className="flex items-center gap-1 text-emerald-600">
                <CheckCircle className="w-3 h-3" />
                Azure CLU connected: {info.project_name}
              </span>
            ) : (
              <span className="flex items-center gap-1 text-amber-600">
                <AlertCircle className="w-3 h-3" />
                Demo mode - Using local processing
              </span>
            )}
          </div>

          {/* Query Input */}
          <div className="relative">
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask about time, day, or date..."
              disabled={loading}
              className="w-full pr-12 py-3 text-base"
            />
            <button
              onClick={analyzeQuery}
              disabled={loading || !query.trim()}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Quick Examples */}
          <div>
            <p className="text-xs text-slate-500 mb-2">Try asking:</p>
            <div className="flex flex-wrap gap-2">
              {EXAMPLE_QUERIES.map((q) => (
                <button
                  key={q}
                  onClick={() => setQuery(q)}
                  className={`text-xs px-3 py-1.5 rounded-lg transition-colors ${
                    query === q
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Result Card */}
      {result && (
        <Card className="border-slate-200/60 shadow-sm overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-slate-50 to-slate-100 border-b border-slate-200/60 py-4">
            <CardTitle className="flex items-center gap-2 text-slate-800">
              <Brain className="w-5 h-5 text-indigo-600" />
              Understanding Result
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-4">
            {/* Intent Badge */}
            <div className="flex items-center gap-3">
              <div className={`flex items-center gap-2 px-4 py-2 rounded-xl border ${getIntentColor(result.top_intent)}`}>
                {getIntentIcon(result.top_intent)}
                <span className="font-medium">{result.top_intent}</span>
              </div>
              <Badge variant="outline" className="text-xs">
                {Math.round(result.confidence * 100)}% confidence
              </Badge>
            </div>

            {/* Extracted Entities */}
            {result.entities && result.entities.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-slate-700 flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  Detected Locations/Entities:
                </p>
                <div className="flex flex-wrap gap-2">
                  {result.entities.map((entity, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center gap-1 px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm"
                    >
                      <span className="font-medium">{entity.category}:</span>
                      <span>{entity.text}</span>
                      <span className="text-xs text-blue-500">
                        ({Math.round(entity.confidence * 100)}%)
                      </span>
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Response */}
            <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-4">
              <p className="text-sm font-medium text-slate-600 mb-1">Response:</p>
              <p className="text-lg text-slate-800">{result.response}</p>
            </div>

            {/* Query Display */}
            <div className="text-sm text-slate-500 bg-slate-100 px-3 py-2 rounded-lg">
              <strong>Your query:</strong> "{result.query}"
            </div>
          </CardContent>
        </Card>
      )}

      {/* Info Card */}
      {!result && info && (
        <Card className="border-slate-200/60 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-slate-400 mt-0.5" />
              <div className="text-sm text-slate-600 space-y-1">
                <p className="font-medium text-slate-800">Supported Queries:</p>
                <ul className="space-y-1 ml-4 list-disc">
                  <li>Current time: "What time is it?"</li>
                  <li>Time in city: "What time is it in London?"</li>
                  <li>Day of week: "What day is it today?"</li>
                  <li>Specific date: "What date was January 1st?"</li>
                </ul>
                {info.supported_cities && info.supported_cities.length > 0 && (
                  <p className="text-xs text-slate-500 mt-2">
                    Supported cities: {info.supported_cities.slice(0, 10).join(', ')}
                    {info.supported_cities.length > 10 && '...'}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
