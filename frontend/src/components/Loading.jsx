export default function Loading({ label = 'Loading...' }) {
  return (
    <div className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600">
      <span className="inline-block h-3 w-3 animate-pulse rounded-full bg-primary" />
      <span>{label}</span>
    </div>
  );
}
