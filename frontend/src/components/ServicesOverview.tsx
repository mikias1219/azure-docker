import { Card, CardContent } from '@/components/ui/Card';
import {
  ScanLine,
  FileImage,
  Languages,
  Mic,
  Database,
  Brain,
  CheckCircle,
  AlertCircle,
  ChevronRight,
} from 'lucide-react';
import type { ServicesStatus } from '@/lib/api';

export type ServiceTabId = 'overview' | 'documents' | 'text-analytics' | 'speech' | 'vision' | 'knowledge' | 'rag';

const SERVICE_CARDS: Array<{
  id: Exclude<ServiceTabId, 'overview'>;
  name: string;
  shortDesc: string;
  usage: string;
  icon: React.ComponentType<{ className?: string }>;
  statusKey: keyof ServicesStatus;
}> = [
  {
    id: 'documents',
    name: 'Document Intelligence',
    shortDesc: 'Extract text, forms, tables, and structured data from documents.',
    usage: 'Upload PDF/image → get extracted text, layout, and prebuilt models (invoice, business card).',
    icon: ScanLine,
    statusKey: 'document_intelligence',
  },
  {
    id: 'vision',
    name: 'Computer Vision',
    shortDesc: 'Analyze images: captions, tags, objects, people, and read text (OCR).',
    usage: 'Upload image → choose features (caption, tags, objects, read) → get analysis and OCR text.',
    icon: FileImage,
    statusKey: 'vision',
  },
  {
    id: 'text-analytics',
    name: 'Natural Language',
    shortDesc: 'Text Analytics, QnA, and CLU: sentiment, entities, key phrases, intents.',
    usage: 'Enter text or question → get language, sentiment, entities, QnA answers, or CLU intents.',
    icon: Languages,
    statusKey: 'text_analytics',
  },
  {
    id: 'speech',
    name: 'Speech',
    shortDesc: 'Speech-to-text (transcribe) and text-to-speech (synthesize).',
    usage: 'Upload audio for transcription, or enter text to generate speech and play it.',
    icon: Mic,
    statusKey: 'speech',
  },
  {
    id: 'knowledge',
    name: 'Knowledge Mining',
    shortDesc: 'Search over your indexed content with Azure AI Search.',
    usage: 'Enter a query → get matching documents and fields from the search index.',
    icon: Database,
    statusKey: 'search',
  },
  {
    id: 'rag',
    name: 'Generative AI (RAG)',
    shortDesc: 'Ask questions over your documents with retrieval-augmented generation.',
    usage: 'Ingest a document, then ask questions → get answers with cited sources.',
    icon: Brain,
    statusKey: 'rag',
  },
];

interface ServicesOverviewProps {
  servicesStatus: ServicesStatus | null;
  onOpenService: (tab: Exclude<ServiceTabId, 'overview'>) => void;
}

export function ServicesOverview({ servicesStatus, onOpenService }: ServicesOverviewProps) {
  const liveCount = servicesStatus
    ? Object.values(servicesStatus).filter(Boolean).length
    : 0;
  const totalCount = SERVICE_CARDS.length;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-slate-900 mb-1">Azure AI Services</h2>
          <p className="text-sm text-slate-600 max-w-2xl">
            All AI capabilities in one place. Click a service to use it. Status reflects your current Azure configuration.
          </p>
        </div>
        <div
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 border border-slate-200"
          role="status"
          aria-live="polite"
        >
          <span className="text-sm font-medium text-slate-700">Services:</span>
          <span className="text-sm font-semibold text-emerald-600">{liveCount}</span>
          <span className="text-sm text-slate-500">/ {totalCount} live</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {SERVICE_CARDS.map((card) => {
          const Icon = card.icon;
          const isLive = servicesStatus?.[card.statusKey] ?? false;
          return (
            <Card
              key={card.id}
              className="card-engineer overflow-hidden hover:border-blue-300 transition-all duration-200"
            >
              <CardContent className="p-0">
                <div className="p-5">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="w-11 h-11 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center flex-shrink-0 text-blue-600">
                      <Icon className="w-5 h-5" />
                    </div>
                    <span
                      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg text-xs font-medium ${
                        isLive
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}
                      aria-label={isLive ? 'Service available' : 'Service not configured'}
                    >
                      {isLive ? (
                        <CheckCircle className="w-3 h-3" />
                      ) : (
                        <AlertCircle className="w-3 h-3" />
                      )}
                      {isLive ? 'Live' : 'Not configured'}
                    </span>
                  </div>
                  <h3 className="text-base font-semibold text-slate-900 mb-1">{card.name}</h3>
                  <p className="text-sm text-slate-600 mb-3">{card.shortDesc}</p>
                  <p className="text-xs text-slate-500 bg-slate-50 rounded-lg p-3 border border-slate-100 mb-4">
                    <strong className="text-slate-600">Usage:</strong> {card.usage}
                  </p>
                  <button
                    type="button"
                    onClick={() => onOpenService(card.id)}
                    className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    aria-label={`Open ${card.name}`}
                  >
                    Open {card.name}
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="rounded-xl bg-slate-50 border border-slate-200 p-4">
        <h3 className="text-sm font-semibold text-slate-800 mb-2">Quick reference</h3>
        <ul className="text-xs text-slate-600 space-y-1.5">
          <li><strong>Document Intelligence</strong> — Upload → extract text; use Invoice/Business Card for structured fields.</li>
          <li><strong>Computer Vision</strong> — Upload image → caption, tags, objects, or OCR.</li>
          <li><strong>Natural Language</strong> — Text Analytics (sentiment, entities), QnA (questions), CLU (intents e.g. Clock).</li>
          <li><strong>Speech</strong> — Audio file → transcript; text → synthesized audio.</li>
          <li><strong>Knowledge Mining</strong> — Search query → results from Azure AI Search index.</li>
          <li><strong>RAG</strong> — Ingest document by ID → ask questions → answer with sources.</li>
        </ul>
      </div>
    </div>
  );
}
