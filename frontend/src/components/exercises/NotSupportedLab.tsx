export function NotSupportedLab({
  title,
  reason,
  requiredResources,
}: {
  title: string;
  reason: string;
  requiredResources: string[];
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
      <div className="text-sm font-semibold text-slate-900">{title}</div>
      <div className="mt-1 text-sm text-slate-700">{reason}</div>
      {requiredResources.length > 0 ? (
        <ul className="mt-3 list-disc pl-5 text-sm text-slate-700">
          {requiredResources.map((r) => (
            <li key={r}>{r}</li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

