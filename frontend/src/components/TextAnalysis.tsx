import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Textarea } from '@/components/ui/Textarea';
import { Loader2, Languages, Smile, KeyRound, Users, Link2, FileText } from 'lucide-react';
import { textAnalyticsApi } from '@/lib/api';

interface AnalysisResult {
  language?: {
    language: string;
    iso_code?: string;
    confidence?: number;
    error?: string;
  };
  sentiment?: {
    sentiment: string;
    confidence?: {
      positive: number;
      neutral: number;
      negative: number;
    };
    error?: string;
  };
  key_phrases?: {
    key_phrases: string[];
    error?: string;
  };
  entities?: {
    entities: Array<{
      text: string;
      category: string;
      subcategory?: string;
      confidence: number;
    }>;
    error?: string;
  };
  linked_entities?: {
    linked_entities: Array<{
      name: string;
      url: string;
      data_source: string;
    }>;
    error?: string;
  };
  note?: string;
  error?: string;
}

export function TextAnalysis() {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const analyzeText = async () => {
    if (!text.trim()) {
      setError('Please enter some text to analyze');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const data = await textAnalyticsApi.analyze(text);
      setResult(data);
      setError(data?.error || null);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to analyze text. Please try again.');
      console.error('Text analysis error:', err);
    } finally {
      setLoading(false);
    }
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment?.toLowerCase()) {
      case 'positive':
        return 'text-emerald-600 bg-emerald-50';
      case 'negative':
        return 'text-red-600 bg-red-50';
      case 'neutral':
        return 'text-slate-600 bg-slate-50';
      case 'mixed':
        return 'text-amber-600 bg-amber-50';
      default:
        return 'text-slate-600 bg-slate-50';
    }
  };

  return (
    <Card className="border-slate-200/80 shadow-soft">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-primary-500" />
          Azure AI Language - Text Analytics
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Text Input */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">
            Enter text to analyze (hotel reviews, articles, etc.)
          </label>
          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Example: The hotel was amazing! The staff was friendly and the room was clean. Great location near the beach..."
            className="min-h-[150px] resize-none"
          />
          <p className="text-xs text-slate-500">
            {text.length} characters
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {/* Analyze Button */}
        <Button
          onClick={analyzeText}
          disabled={loading || !text.trim()}
          className="w-full"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Analyzing with Azure AI...
            </>
          ) : (
            <>
              <FileText className="w-4 h-4 mr-2" />
              Analyze Text
            </>
          )}
        </Button>

        {/* Demo Mode Notice */}
        {result?.note && (
          <div className="bg-amber-50 border border-amber-200 text-amber-700 px-4 py-3 rounded-lg">
            {result.note}
          </div>
        )}

        {/* Analysis Results */}
        {result && (
          <div className="space-y-4 animate-fade-in">
            <h3 className="text-lg font-semibold text-slate-900">Analysis Results</h3>

            {/* Top-level API error (e.g. service not configured) */}
            {result.error && (
              <div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-lg">
                <p className="font-medium">Service message</p>
                <p className="text-sm mt-1">{result.error}</p>
              </div>
            )}

            {/* Language Detection */}
            {result.language && !result.language.error && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Languages className="w-5 h-5 text-blue-600" />
                  <span className="font-medium text-blue-900">Detected Language</span>
                </div>
                <p className="text-slate-700">
                  <span className="font-semibold">{result.language.language}</span>
                  {result.language.iso_code && (
                    <span className="text-slate-500 ml-2">({result.language.iso_code})</span>
                  )}
                  {result.language.confidence && (
                    <span className="text-slate-500 ml-2">
                      - {(result.language.confidence * 100).toFixed(1)}% confidence
                    </span>
                  )}
                </p>
              </div>
            )}

            {/* Sentiment Analysis */}
            {result.sentiment && !result.sentiment.error && (
              <div className={`border rounded-lg p-4 ${getSentimentColor(result.sentiment.sentiment)}`}>
                <div className="flex items-center gap-2 mb-2">
                  <Smile className="w-5 h-5" />
                  <span className="font-medium">Sentiment Analysis</span>
                </div>
                <p className="font-semibold text-lg capitalize mb-2">{result.sentiment.sentiment}</p>
                {result.sentiment.confidence && (
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>Positive:</span>
                      <span>{(result.sentiment.confidence.positive * 100).toFixed(1)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Neutral:</span>
                      <span>{(result.sentiment.confidence.neutral * 100).toFixed(1)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Negative:</span>
                      <span>{(result.sentiment.confidence.negative * 100).toFixed(1)}%</span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Key Phrases */}
            {result.key_phrases && !result.key_phrases.error && result.key_phrases.key_phrases.length > 0 && (
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <KeyRound className="w-5 h-5 text-purple-600" />
                  <span className="font-medium text-purple-900">Key Phrases</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {result.key_phrases.key_phrases.map((phrase, index) => (
                    <span
                      key={index}
                      className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-sm"
                    >
                      {phrase}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Named Entities */}
            {result.entities && !result.entities.error && result.entities.entities.length > 0 && (
              <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="w-5 h-5 text-indigo-600" />
                  <span className="font-medium text-indigo-900">Named Entities</span>
                </div>
                <div className="space-y-2">
                  {result.entities.entities.map((entity, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between bg-white rounded px-3 py-2 text-sm"
                    >
                      <span className="font-medium">{entity.text}</span>
                      <span className="text-slate-500">
                        {entity.category}
                        {entity.subcategory && ` - ${entity.subcategory}`}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Linked Entities */}
            {result.linked_entities && !result.linked_entities.error && result.linked_entities.linked_entities.length > 0 && (
              <div className="bg-teal-50 border border-teal-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Link2 className="w-5 h-5 text-teal-600" />
                  <span className="font-medium text-teal-900">Linked Entities</span>
                </div>
                <div className="space-y-2">
                  {result.linked_entities.linked_entities.map((entity, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between bg-white rounded px-3 py-2 text-sm"
                    >
                      <span className="font-medium">{entity.name}</span>
                      <a
                        href={entity.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-teal-600 hover:underline truncate max-w-[200px]"
                      >
                        {entity.url}
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
