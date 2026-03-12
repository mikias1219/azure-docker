import { ReactNode } from 'react';
import { CheckCircle, AlertCircle } from 'lucide-react';

interface ServiceIntroProps {
  title: string;
  description: string;
  steps: string[];
  isLive?: boolean;
  children?: ReactNode;
}

export function ServiceIntro({ title, description, steps, isLive = false, children }: ServiceIntroProps) {
  return (
    <div className="mb-8 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-900 mb-1">{title}</h2>
          <p className="text-sm text-slate-600 max-w-2xl">{description}</p>
        </div>
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium ${isLive ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'}`}>
          {isLive ? <CheckCircle className="w-3.5 h-3.5 text-emerald-600" /> : <AlertCircle className="w-3.5 h-3.5 text-amber-600" />}
          {isLive ? 'Service live' : 'Service not configured'}
        </div>
      </div>
      {steps.length > 0 && (
        <ol className="flex flex-wrap gap-x-6 gap-y-1 text-xs text-slate-500">
          {steps.map((step, i) => (
            <li key={i} className="flex items-center gap-2">
              <span className="flex items-center justify-center w-5 h-5 rounded-full bg-slate-100 text-slate-600 font-mono">{i + 1}</span>
              {step}
            </li>
          ))}
        </ol>
      )}
      {children}
    </div>
  );
}
