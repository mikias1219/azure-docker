import { ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { CheckCircle, AlertCircle, MinusCircle } from 'lucide-react';

export type ExerciseStatus = 'live' | 'not_configured' | 'not_supported';

export function ExerciseCard({
  title,
  objective,
  steps,
  status,
  statusDetail,
  children,
}: {
  title: string;
  objective: string;
  steps: string[];
  status: ExerciseStatus;
  statusDetail?: string;
  children?: ReactNode;
}) {
  const badge =
    status === 'live'
      ? { icon: CheckCircle, text: 'Ready', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' }
      : status === 'not_configured'
        ? { icon: AlertCircle, text: 'Not configured', cls: 'bg-amber-50 text-amber-700 border-amber-200' }
        : { icon: MinusCircle, text: 'Not supported', cls: 'bg-slate-100 text-slate-700 border-slate-200' };

  const Icon = badge.icon;

  return (
    <Card className="card-engineer">
      <CardHeader className="pb-3 border-b border-slate-200">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <CardTitle className="text-base">{title}</CardTitle>
            <div className="mt-1 text-sm text-slate-600">{objective}</div>
          </div>
          <div className={`shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs border ${badge.cls}`}>
            <Icon className="w-3.5 h-3.5" />
            {badge.text}
          </div>
        </div>
        {statusDetail ? (
          <div className="mt-2 text-xs text-slate-500">{statusDetail}</div>
        ) : null}
        {steps?.length ? (
          <ol className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-xs text-slate-600">
            {steps.map((s, i) => (
              <li key={i} className="flex items-center gap-2">
                <span className="flex items-center justify-center w-5 h-5 rounded-full bg-slate-100 text-slate-700 font-mono">
                  {i + 1}
                </span>
                {s}
              </li>
            ))}
          </ol>
        ) : null}
      </CardHeader>
      <CardContent className="pt-6">{children}</CardContent>
    </Card>
  );
}

