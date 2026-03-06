import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Loader2, MessageCircle, HelpCircle, BookOpen, CheckCircle, AlertCircle } from 'lucide-react';
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

export function QuestionAnswering() {
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<QnAResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<QnAInfo | null>(null);
  const [infoLoading, setInfoLoading] = useState(true);

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
    <div className="space-y-6">
      {/* Info Card */}
      <Card className="border-slate-200/80 shadow-soft">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-slate-800">
            <BookOpen className="w-5 h-5 text-primary-500" />
            Knowledge Base Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          {infoLoading ? (
            <div className="flex items-center gap-2 text-slate-500">
              <Loader2 className="w-4 h-4 animate-spin" />
              Loading...
            </div>
          ) : info ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                {info.configured ? (
                  <CheckCircle className="w-5 h-5 text-emerald-500" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-amber-500" />
                )}
                <span className={info.configured ? 'text-emerald-700' : 'text-amber-700'}>
                  {info.configured ? 'Azure AI Language QnA is configured' : 'Running in demo mode'}
                </span>
              </div>
              <div className="text-sm text-slate-600">
                <p><strong>Project:</strong> {info.project_name}</p>
                <p><strong>Deployment:</strong> {info.deployment_name}</p>
              </div>
              {!info.configured && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-800">
                  To enable full QnA capabilities, configure AZURE_LANGUAGE_ENDPOINT, 
                  AZURE_LANGUAGE_KEY, AZURE_QNA_PROJECT_NAME, and AZURE_QNA_DEPLOYMENT_NAME 
                  environment variables.
                </div>
              )}
            </div>
          ) : null}
        </CardContent>
      </Card>

      {/* Question Input */}
      <Card className="border-slate-200/80 shadow-soft">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-slate-800">
            <HelpCircle className="w-5 h-5 text-primary-500" />
            Ask a Question
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">
              Your Question
            </label>
            <Input
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="What is Microsoft Learn?"
              disabled={loading}
              className="w-full"
            />
            <p className="text-xs text-slate-500">
              Try asking about Microsoft Learn, training modules, or say "Hello" for chit-chat
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {/* Ask Button */}
          <Button
            onClick={askQuestion}
            disabled={loading || !question.trim()}
            className="w-full"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Getting answer from knowledge base...
              </>
            ) : (
              <>
                <MessageCircle className="w-4 h-4 mr-2" />
                Ask Question
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Results */}
      {result && (
        <Card className="border-slate-200/80 shadow-soft">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-slate-800">
              <MessageCircle className="w-5 h-5 text-primary-500" />
              Answer
              {result.note && (
                <span className="text-xs font-normal text-amber-600 bg-amber-50 px-2 py-1 rounded">
                  {result.note}
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-sm text-slate-500">
              <strong>Question:</strong> {result.question}
            </div>

            {result.answers && result.answers.length > 0 ? (
              <div className="space-y-4">
                {result.answers.map((answer, index) => (
                  <div key={index} className="bg-slate-50 rounded-lg p-4 space-y-3">
                    <div className="text-slate-800 leading-relaxed">
                      {answer.answer}
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${getConfidenceColor(answer.confidence)}`}>
                        Confidence: {Math.round(answer.confidence * 100)}%
                      </span>
                      <span className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded-full">
                        Source: {answer.source}
                      </span>
                    </div>

                    {answer.questions && answer.questions.length > 0 && (
                      <div className="text-xs text-slate-600">
                        <strong>Alternate questions:</strong>
                        <ul className="mt-1 space-y-1 ml-4 list-disc">
                          {answer.questions.map((q, i) => (
                            <li key={i}>{q}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-slate-600">
                No answer found for your question. Try rephrasing or asking something else.
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Example Questions */}
      <Card className="border-slate-200/80 shadow-soft">
        <CardHeader>
          <CardTitle className="text-slate-800 text-base">
            Example Questions to Try
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {['What is Microsoft Learn?', 'Hello', 'What are learning paths?', 'Thanks!'].map((q) => (
              <button
                key={q}
                onClick={() => setQuestion(q)}
                className="text-sm bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-full transition-colors"
              >
                {q}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
