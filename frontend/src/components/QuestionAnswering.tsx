import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Loader2, MessageCircle, HelpCircle, BookOpen, CheckCircle, AlertCircle, ChevronDown, Search } from 'lucide-react';
import { qnaApi } from '@/lib/api';

interface Answer {
  answer: string;
  confidence: number;
  source: string;
  questions?: string[];
  metadata?: Record<string, string>;
}

interface QnAResult {
  answers: Answer[];
  question: string;
  project_name: string;
  deployment_name: string;
  note?: string;
  error?: string;
}

interface QnAInfo {
  project_name: string;
  deployment_name: string;
  endpoint: string;
  configured: boolean;
  endpoint_configured: boolean;
  key_configured: boolean;
}

// Simplified popular questions from the recruitment procedure
const QUICK_QUESTIONS = [
  'What is the recruitment process?',
  'How is recruitment initiated?',
  'What is the hiring plan?',
  'What is internal delegation?',
  'What is external job advertisement?',
  'What is pre-selection?',
  'What is the interview process?',
  'What is the offering process?',
  'What is pre-onboarding?',
  'What is probation period?',
  'What is mid evaluation?',
  'How are foreign employees hired?',
];

export function QuestionAnswering() {
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<QnAResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<QnAInfo | null>(null);
  const [infoLoading, setInfoLoading] = useState(true);
  const [showQuickQuestions, setShowQuickQuestions] = useState(false);

  useEffect(() => {
    loadInfo();
  }, []);

  const loadInfo = async () => {
    try {
      const data = await qnaApi.getInfo();
      setInfo(data);
    } catch (err: any) {
      console.error('Failed to load QnA info:', err);
    } finally {
      setInfoLoading(false);
    }
  };

  const askQuestion = async () => {
    if (!question.trim()) {
      setError('Please enter a question');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const data = await qnaApi.ask(question);
      setResult(data);
      setError(data?.error || null);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to get answer. Please try again.');
      console.error('Question answering error:', err);
    } finally {
      setLoading(false);
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-emerald-600 bg-emerald-50';
    if (confidence >= 0.5) return 'text-amber-600 bg-amber-50';
    return 'text-red-600 bg-red-50';
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !loading) {
      askQuestion();
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      {/* Main Q&A Card */}
      <Card className="border-slate-200/60 shadow-sm overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-slate-200/60 py-4">
          <CardTitle className="flex items-center gap-2 text-slate-800">
            <HelpCircle className="w-5 h-5 text-blue-600" />
            Ask Your Question
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 space-y-4">
          {/* Quick Questions Toggle */}
          <div>
            <button
              onClick={() => setShowQuickQuestions(!showQuickQuestions)}
              className="flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
            >
              <BookOpen className="w-4 h-4" />
              {showQuickQuestions ? 'Hide' : 'Show'} common questions
              <ChevronDown className={`w-4 h-4 transition-transform ${showQuickQuestions ? 'rotate-180' : ''}`} />
            </button>

            {/* Quick Questions Grid */}
            {showQuickQuestions && (
              <div className="mt-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                <p className="text-xs text-slate-500 mb-2">Click any question to auto-fill:</p>
                <div className="flex flex-wrap gap-2">
                  {QUICK_QUESTIONS.map((q) => (
                    <button
                      key={q}
                      onClick={() => {
                        setQuestion(q);
                        setShowQuickQuestions(false);
                      }}
                      className={`text-xs px-3 py-1.5 rounded-lg transition-colors ${
                        question === q
                          ? 'bg-blue-600 text-white'
                          : 'bg-white border border-slate-200 text-slate-600 hover:border-blue-400 hover:text-blue-600'
                      }`}
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Question Input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <Input
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your question or select from above..."
              disabled={loading}
              className="w-full pl-10 pr-4 py-3 text-base"
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Ask Button */}
          <Button
            onClick={askQuestion}
            disabled={loading || !question.trim()}
            className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Getting answer...
              </>
            ) : (
              <>
                <MessageCircle className="w-4 h-4 mr-2" />
                Ask AI Assistant
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Answer Card */}
      {result && (
        <Card className="border-slate-200/60 shadow-sm overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-emerald-50 to-teal-50 border-b border-slate-200/60 py-4">
            <CardTitle className="flex items-center gap-2 text-slate-800">
              <MessageCircle className="w-5 h-5 text-emerald-600" />
              Answer
              {result.note && (
                <span className="text-xs font-normal text-amber-600 bg-amber-50 px-2 py-1 rounded">
                  {result.note}
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-4">
            <div className="text-sm text-slate-500 bg-slate-100 px-3 py-2 rounded-lg">
              <strong>Q:</strong> {result.question}
            </div>

            {result.answers && result.answers.length > 0 ? (
              <div className="space-y-4">
                {result.answers.map((answer, index) => (
                  <div key={index} className="bg-slate-50 rounded-xl p-4 space-y-3">
                    <div className="text-slate-800 leading-relaxed text-base">
                      {answer.answer}
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${getConfidenceColor(answer.confidence)}`}>
                        {Math.round(answer.confidence * 100)}% confidence
                      </span>
                      <span className="text-xs text-slate-500 bg-slate-200 px-2 py-1 rounded-full">
                        {answer.source}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-slate-600 text-center py-4">
                No answer found. Try rephrasing your question.
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Info Footer */}
      <div className="flex items-center justify-center gap-4 text-xs text-slate-500">
        {infoLoading ? (
          <span className="flex items-center gap-1">
            <Loader2 className="w-3 h-3 animate-spin" />
            Loading...
          </span>
        ) : info?.configured ? (
          <span className="flex items-center gap-1 text-emerald-600">
            <CheckCircle className="w-3 h-3" />
            Azure AI Q&A connected
          </span>
        ) : (
          <span className="flex items-center gap-1 text-amber-600">
            <AlertCircle className="w-3 h-3" />
            Demo mode
          </span>
        )}
      </div>
    </div>
  );
}
