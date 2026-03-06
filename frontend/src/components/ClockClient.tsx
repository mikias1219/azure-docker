import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Clock, Send, Loader2, Info, Brain, Globe, Calendar, Sun } from 'lucide-react';
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

export function ClockClient() {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ClockResult | null>(null);
  const [info, setInfo] = useState<any>(null);
  const [history, setHistory] = useState<ClockResult[]>([]);

  useEffect(() => {
    loadInfo();
  }, []);

  const loadInfo = async () => {
    try {
      const data = await clockApi.getInfo();
      setInfo(data);
    } catch (err: any) {
      console.error('Failed to load clock info:', err);
    }
  };

  const analyzeQuery = async () => {
    if (!query.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const data = await clockApi.analyze(query);
      setResult(data);
      setHistory((prev) => [data, ...prev].slice(0, 10)); // Keep last 10
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
        return 'bg-blue-100 text-blue-800';
      case 'GetDay':
        return 'bg-yellow-100 text-yellow-800';
      case 'GetDate':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const exampleQueries = info?.examples || [
    "What's the time?",
    "What time is it in London?",
    "What day is it?",
    "What day was 01/01/2020?",
    "What's the date?",
    "What date is Friday?"
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <Clock className="w-6 h-6 text-primary-600" />
            <div>
              <CardTitle>Natural Language Clock</CardTitle>
              <p className="text-sm text-slate-500 mt-1">
                Ask about time, day, or date in natural language
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Configuration Status */}
          <div className="flex items-center gap-2 text-sm mb-4">
            <Badge variant={info?.configured ? 'default' : 'secondary'}>
              {info?.configured ? 'Azure AI CLU' : 'Demo Mode'}
            </Badge>
            {info?.demo_mode && (
              <span className="text-amber-600 text-xs">
                Using demo responses. Configure Azure AI Language for full functionality.
              </span>
            )}
          </div>

          {/* Query Input */}
          <div className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="Ask about time, day, or date... (e.g., 'What's the time in London?')"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyPress={handleKeyPress}
                className="flex-1"
                disabled={loading}
              />
              <Button
                onClick={analyzeQuery}
                disabled={!query.trim() || loading}
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </Button>
            </div>

            {/* Error */}
            {error && (
              <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm">
                {error}
              </div>
            )}

            {/* Result */}
            {result && (
              <Card className="border-primary-200">
                <CardContent className="p-4">
                  {/* Intent */}
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`p-2 rounded-lg ${getIntentColor(result.top_intent)}`}>
                      {getIntentIcon(result.top_intent)}
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900">{result.top_intent}</p>
                      <p className="text-xs text-slate-500">
                        Confidence: {(result.confidence * 100).toFixed(1)}%
                      </p>
                    </div>
                  </div>

                  {/* Response */}
                  <div className="p-3 bg-slate-50 rounded-lg mb-4">
                    <p className="text-slate-900 font-medium">{result.response}</p>
                  </div>

                  {/* Entities */}
                  {result.entities && result.entities.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-slate-700 flex items-center gap-2">
                        <Globe className="w-4 h-4" />
                        Detected Entities
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {result.entities.map((entity, idx) => (
                          <Badge
                            key={idx}
                            variant="outline"
                            className="flex items-center gap-1"
                          >
                            <span className="font-medium">{entity.category}:</span>
                            <span>{entity.text}</span>
                            <span className="text-xs text-slate-500">
                              ({(entity.confidence * 100).toFixed(0)}%)
                            </span>
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Example Queries */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Try These Examples</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {exampleQueries.map((example: string, idx: number) => (
              <Button
                key={idx}
                variant="outline"
                size="sm"
                onClick={() => {
                  setQuery(example);
                  setResult(null);
                }}
              >
                {example}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* History */}
      {history.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Info className="w-4 h-4" />
              Recent Queries
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {history.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-2 bg-slate-50 rounded-lg cursor-pointer hover:bg-slate-100"
                  onClick={() => setResult(item)}
                >
                  <span className="text-sm text-slate-700 truncate flex-1">
                    {item.query}
                  </span>
                  <Badge
                    variant="outline"
                    className={`text-xs ml-2 ${getIntentColor(item.top_intent)}`}
                  >
                    {item.top_intent}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Supported Features */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Supported Intents & Entities</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium text-slate-900 mb-2">Intents</h4>
              <ul className="space-y-1 text-sm text-slate-600">
                <li className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-blue-500" />
                  GetTime - Get current time
                </li>
                <li className="flex items-center gap-2">
                  <Sun className="w-4 h-4 text-yellow-500" />
                  GetDay - Get day of week
                </li>
                <li className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-green-500" />
                  GetDate - Get date
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-slate-900 mb-2">Entities</h4>
              <ul className="space-y-1 text-sm text-slate-600">
                <li className="flex items-center gap-2">
                  <Globe className="w-4 h-4 text-purple-500" />
                  Location - City names (London, Paris, etc.)
                </li>
                <li className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-orange-500" />
                  Weekday - Days of the week
                </li>
                <li className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-red-500" />
                  Date - Date references
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
