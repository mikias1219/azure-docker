import { CheckCircle, AlertCircle, ListOrdered, ArrowRight, FileInput, FileOutput } from 'lucide-react';
import type { ServiceUsageContent } from '@/lib/serviceUsage';

interface ServiceUsagePanelProps {
  content: ServiceUsageContent;
  isLive?: boolean;
}

export function ServiceUsagePanel({ content, isLive = false }: ServiceUsagePanelProps) {
  return (
    <div className="mb-8 rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      {/* Header with title and status */}
      <div className="flex flex-wrap items-center justify-between gap-4 px-6 py-4 border-b border-slate-200 bg-slate-50/80">
        <h2 className="text-lg font-semibold text-slate-900">{content.title}</h2>
        <span
          className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium ${
            isLive ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
          }`}
          role="status"
          aria-label={isLive ? 'Service available' : 'Service not configured'}
        >
          {isLive ? <CheckCircle className="w-3.5 h-3.5" aria-hidden /> : <AlertCircle className="w-3.5 h-3.5" aria-hidden />}
          {isLive ? 'Service live' : 'Not configured'}
        </span>
      </div>

      <div className="p-6 space-y-6">
        {/* What this service does */}
        <section aria-labelledby="what-it-does-heading">
          <h3 id="what-it-does-heading" className="text-sm font-semibold text-slate-800 mb-2">What this service does</h3>
          <p className="text-sm text-slate-600 leading-relaxed">{content.whatItDoes}</p>
        </section>

        {/* Capabilities */}
        {content.capabilities.length > 0 && (
          <section aria-labelledby="capabilities-heading">
            <h3 id="capabilities-heading" className="text-sm font-semibold text-slate-800 mb-2">Capabilities</h3>
            <ul className="list-disc list-inside text-sm text-slate-600 space-y-1">
              {content.capabilities.map((cap, i) => (
                <li key={i}>{cap}</li>
              ))}
            </ul>
          </section>
        )}

        {/* How to use it — prominent numbered steps */}
        <section aria-labelledby="steps-heading" className="rounded-xl bg-blue-50/60 border border-blue-100 p-4">
          <h3 id="steps-heading" className="text-sm font-semibold text-slate-800 mb-3 flex items-center gap-2">
            <ListOrdered className="w-4 h-4 text-blue-600" aria-hidden />
            How to use it
          </h3>
          <ol className="space-y-2" role="list">
            {content.steps.map((step, i) => (
              <li key={i} className="flex gap-3 text-sm text-slate-700">
                <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold" aria-hidden>
                  {i + 1}
                </span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
        </section>

        {/* Input / Output */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <section aria-labelledby="input-heading" className="rounded-xl border border-slate-200 bg-slate-50/50 p-4">
            <h3 id="input-heading" className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-2">
              <FileInput className="w-3.5 h-3.5" aria-hidden />
              Input
            </h3>
            <p className="text-sm text-slate-700">{content.input}</p>
          </section>
          <section aria-labelledby="output-heading" className="rounded-xl border border-slate-200 bg-slate-50/50 p-4">
            <h3 id="output-heading" className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-2">
              <FileOutput className="w-3.5 h-3.5" aria-hidden />
              Output
            </h3>
            <p className="text-sm text-slate-700">{content.output}</p>
          </section>
        </div>
      </div>
    </div>
  );
}
