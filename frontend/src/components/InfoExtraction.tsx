import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import {
  Loader2, FileUp, User, Building, Mail, Phone,
  Briefcase, FileText, Receipt, Zap, Terminal,
  ShieldCheck, Info, Database, Search
} from 'lucide-react';
import { infoExtractionApi } from '@/lib/api';

const FIELD_LABELS: Record<string, { label: string; icon: any; color: string }> = {
  Name: { label: 'ENTITY_NAME', icon: User, color: 'text-blue-400' },
  Company: { label: 'ORG_AFFILIATION', icon: Building, color: 'text-purple-400' },
  Title: { label: 'ROLE_IDENTIFIER', icon: Briefcase, color: 'text-amber-400' },
  Email: { label: 'CONTACT_SMTP', icon: Mail, color: 'text-emerald-400' },
  Phone: { label: 'CONTACT_TEL', icon: Phone, color: 'text-rose-400' },
  VendorName: { label: 'VENDOR_UID', icon: Building, color: 'text-purple-400' },
  CustomerName: { label: 'CLIENT_UID', icon: User, color: 'text-blue-400' },
  InvoiceTotal: { label: 'FINANCIAL_SUM', icon: Receipt, color: 'text-emerald-400' },
  InvoiceId: { label: 'TRANSACTION_ID', icon: FileText, color: 'text-slate-400' },
  DueDate: { label: 'TEMPORAL_DEADLINE', icon: FileText, color: 'text-rose-400' },
  InvoiceDate: { label: 'TEMPORAL_STAMP', icon: FileText, color: 'text-slate-400' },
};

type Mode = 'businesscard' | 'invoice';

export function InfoExtraction() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<Mode>('businesscard');
  const [result, setResult] = useState<any>(null);

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
      setResult({ fields: {}, error: 'Prebuilt extraction engine failure.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="rounded-xl bg-slate-100 border border-slate-200 px-4 py-3 text-sm text-slate-700">
        <strong className="text-slate-800">Steps:</strong>{' '}
        <span className="font-medium">1.</span> Choose <strong>Business Card</strong> or <strong>Invoice</strong> above →
        <span className="font-medium"> 2.</span> Upload a PDF or image of the document →
        <span className="font-medium"> 3.</span> Click &quot;Execute extraction&quot; →
        <span className="font-medium"> 4.</span> Review the extracted fields (name, company, totals, etc.) in the results.
      </div>
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
        {/* Input Panel */}
        <div className="md:col-span-5 space-y-6">
          <Card className="card-engineer border-indigo-200 bg-indigo-50/40">
            <CardHeader className="py-4 border-b border-slate-200">
              <CardTitle className="text-xs font-mono uppercase tracking-widest text-indigo-400 flex items-center gap-2">
                <Terminal className="w-4 h-4" />
                Extraction Controller
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="flex bg-white p-1 rounded-xl border border-slate-200 mb-6">
                <button
                  onClick={() => { setMode('businesscard'); setResult(null); }}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-[10px] font-bold transition-all ${mode === 'businesscard' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-700 hover:text-slate-900'}`}
                >
                  <Briefcase className="w-3.5 h-3.5" /> CARDS
                </button>
                <button
                  onClick={() => { setMode('invoice'); setResult(null); }}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-[10px] font-bold transition-all ${mode === 'invoice' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-700 hover:text-slate-900'}`}
                >
                  <Receipt className="w-3.5 h-3.5" /> INVOICES
                </button>
              </div>

              <div className="space-y-4">
                <div className="border-2 border-dashed border-slate-200 rounded-xl p-8 text-center bg-white hover:border-indigo-500/40 transition-all cursor-pointer relative group">
                  <input type="file" accept=".pdf,image/*" onChange={handleFileChange} className="absolute inset-0 opacity-0 cursor-pointer" />
                  <FileUp className="w-8 h-8 text-slate-600 mx-auto mb-3 group-hover:text-indigo-400 transition-colors" />
                  <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{file ? file.name : 'Ingest Document'}</div>
                  <div className="text-[8px] text-slate-600 mt-1 uppercase">PDF, PNG, JPEG SUPPORTED</div>
                </div>

                <Button onClick={handleAnalyze} disabled={loading || !file} className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold h-11 tracking-widest">
                  {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Zap className="w-4 h-4 mr-2" />}
                  {loading ? 'PARSING FIELDSTREAM...' : 'EXECUTE EXTRACTION'}
                </Button>
              </div>

              {result?.error && (
                <div className="mt-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-[10px] font-mono flex items-center gap-2 tracking-tight">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span>
                  {result.error}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Results Pane */}
        <div className="md:col-span-7 space-y-6">
          {!result && !loading ? (
            <div className="h-full border-2 border-dashed border-slate-200 rounded-3xl flex flex-col items-center justify-center text-center p-12 bg-white">
              <Database className="w-12 h-12 text-slate-800 mb-6" />
              <h4 className="text-sm font-bold text-slate-500 uppercase tracking-widest">Field Mapping Idle</h4>
              <p className="text-[10px] text-slate-600 mt-2 max-w-[250px]">Upload a document to initialize the Azure Document Intelligence prebuilt model.</p>
            </div>
          ) : result ? (
            <div className="space-y-6 animate-fadeIn">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-mono font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4" />
                  Neural Field Map
                </h3>
                <span className="text-[9px] font-mono text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">VERIFIED</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {Object.entries(result.fields || {}).map(([key, value]) => {
                  const meta = FIELD_LABELS[key] || { label: key.toUpperCase(), icon: FileText, color: 'text-slate-400' };
                  const Icon = meta.icon;
                  if (!value) return null;
                  const str = typeof value === 'object' ? JSON.stringify(value) : String(value);

                  return (
                    <Card key={key} className="card-engineer group hover:border-indigo-500/30 transition-all">
                      <CardContent className="p-4 flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center ${meta.color}`}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-[8px] font-mono text-slate-500 uppercase tracking-tighter mb-0.5">{meta.label}</div>
                          <div className="text-xs font-bold text-slate-900 truncate">{str}</div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              {/* Audit Context */}
              {(result.raw_text || result.content) && (
                <Card className="card-engineer">
                  <CardHeader className="py-2 border-b border-slate-200">
                    <CardTitle className="text-[9px] font-mono uppercase tracking-widest text-slate-500 flex items-center gap-2">
                      <Search className="w-3 h-3" />
                      Linguistic Base Layer
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 max-h-48 overflow-y-auto custom-scrollbar font-mono text-[10px] text-slate-700 leading-relaxed">
                    <pre className="whitespace-pre-wrap">{result.raw_text ?? result.content ?? ''}</pre>
                  </CardContent>
                </Card>
              )}
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center gap-6">
              <div className="w-16 h-16 relative">
                <div className="absolute inset-0 border-4 border-indigo-500/10 rounded-full"></div>
                <div className="absolute inset-0 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
              <div className="text-[10px] font-mono text-slate-500 uppercase tracking-widest animate-pulse">Mapping Key-Value Pairs...</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
