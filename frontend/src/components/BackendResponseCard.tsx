import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { ChevronDown, ChevronRight, Code } from 'lucide-react';

interface BackendResponseCardProps {
  /** The API response object to display */
  data: unknown;
  /** Optional title override */
  title?: string;
  /** Optional step label e.g. "Step 3: Backend response" */
  stepLabel?: string;
}

/**
 * Shows the full backend API response so users see exactly what the service returned.
 * No hardcoded or mock content — only the actual response.
 */
export function BackendResponseCard({ data, title = 'Backend response', stepLabel }: BackendResponseCardProps) {
  const [open, setOpen] = useState(false);
  if (data == null) return null;

  const json = typeof data === 'object' ? JSON.stringify(data, null, 2) : String(data);

  return (
    <Card className="card-engineer border-slate-200">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full text-left"
        aria-expanded={open}
      >
        <CardHeader className="py-3 border-b border-slate-200 flex flex-row items-center justify-between gap-2">
          <CardTitle className="text-xs font-mono uppercase tracking-wider text-slate-500 flex items-center gap-2">
            <Code className="w-3.5 h-3.5" aria-hidden />
            {stepLabel ?? title}
          </CardTitle>
          {open ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
        </CardHeader>
      </button>
      {open && (
        <CardContent className="p-0">
          <pre className="p-4 bg-slate-50 border-t border-slate-200 text-xs font-mono text-slate-700 overflow-x-auto max-h-80 overflow-y-auto custom-scrollbar whitespace-pre-wrap break-words">
            {json}
          </pre>
        </CardContent>
      )}
    </Card>
  );
}
