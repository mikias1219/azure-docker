import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Loader2, FileUp, User, Building, Mail, Phone, Briefcase, FileText, Receipt } from 'lucide-react';
import { infoExtractionApi } from '@/lib/api';

const FIELD_LABELS: Record<string, { label: string; icon: any }> = {
  Name: { label: 'Name', icon: User },
  Company: { label: 'Company', icon: Building },
  Title: { label: 'Title', icon: Briefcase },
  Email: { label: 'Email', icon: Mail },
  Phone: { label: 'Phone', icon: Phone },
  VendorName: { label: 'Vendor', icon: Building },
  CustomerName: { label: 'Customer', icon: User },
  InvoiceTotal: { label: 'Total', icon: Receipt },
  InvoiceId: { label: 'Invoice ID', icon: FileText },
  DueDate: { label: 'Due Date', icon: FileText },
  InvoiceDate: { label: 'Invoice Date', icon: FileText },
};

type Mode = 'businesscard' | 'invoice';

export function InfoExtraction() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<Mode>('businesscard');
  const [result, setResult] = useState<{ fields: Record<string, any>; raw_text?: string; content?: string; error?: string } | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    setFile(f || null);
    setResult(null);
  };

  const handleAnalyze = async () => {
    if (!file) return;
    setLoading(true);
    setResult(null);
    try {
      const data = mode === 'invoice'
        ? await infoExtractionApi.analyzeInvoice(file)
        : await infoExtractionApi.analyze(file);
      setResult(data);
    } catch (err: any) {
      setResult({ fields: {}, error: err.response?.data?.detail || 'Analysis failed' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <Card className="border-slate-200/80 shadow-soft">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-slate-800">
            <FileText className="w-5 h-5 text-indigo-600" />
            Information Extraction
          </CardTitle>
          <p className="text-sm text-slate-500 mt-1">
            Extract structured data: business card (Name, Company, Email, Phone) or invoice (Vendor, Customer, Total).
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => { setMode('businesscard'); setResult(null); }}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium ${mode === 'businesscard' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'}`}
            >
              Business card
            </button>
            <button
              type="button"
              onClick={() => { setMode('invoice'); setResult(null); }}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium ${mode === 'invoice' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'}`}
            >
              Invoice
            </button>
          </div>
          <div className="flex gap-2 items-end">
            <input
              type="file"
              accept={mode === 'invoice' ? '.pdf,image/*' : 'image/*,.pdf'}
              onChange={handleFileChange}
              className="block w-full text-sm text-slate-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border file:border-slate-300 file:bg-slate-50 file:text-slate-700"
            />
            <Button onClick={handleAnalyze} disabled={loading || !file}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileUp className="w-4 h-4" />}
              {loading ? 'Extracting…' : 'Extract'}
            </Button>
          </div>
          {result?.error && (
            <div className="rounded-lg bg-amber-50 border border-amber-200 text-amber-800 px-3 py-2 text-sm">
              {result.error}
            </div>
          )}
          {result && !result.error && (
            <div className="space-y-4">
              <div className="grid gap-3">
                {Object.entries(result.fields || {}).map(([key, value]) => {
                  const meta = FIELD_LABELS[key] || { label: key.replace(/([A-Z])/g, ' $1').trim(), icon: FileText };
                  const Icon = meta.icon;
                  if (value == null || value === '') return null;
                  const str = typeof value === 'object' ? JSON.stringify(value) : String(value);
                  return (
                    <div key={key} className="flex items-center gap-3 rounded-lg bg-slate-50 px-3 py-2">
                      <Icon className="w-4 h-4 text-slate-500 shrink-0" />
                      <div>
                        <p className="text-xs text-slate-500">{meta.label}</p>
                        <p className="text-sm font-medium text-slate-800">{str}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
              {(result.raw_text || result.content) && (
                <details className="rounded-lg border border-slate-200 bg-slate-50/50">
                  <summary className="px-3 py-2 text-sm font-medium text-slate-600 cursor-pointer">Raw extracted text</summary>
                  <pre className="p-3 text-xs text-slate-700 whitespace-pre-wrap max-h-40 overflow-y-auto">
                    {result.raw_text ?? result.content ?? ''}
                  </pre>
                </details>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
