export default function DashboardCard({ title, value, hint, trend = 'neutral' }) {
  const trendClass = {
    up: 'text-emerald-600 bg-emerald-50 border-emerald-100',
    down: 'text-red-600 bg-red-50 border-red-100',
    neutral: 'text-slate-600 bg-slate-50 border-slate-100',
  }[trend] || 'text-slate-600 bg-slate-50 border-slate-100';

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-soft transition hover:-translate-y-0.5 hover:shadow-lg">
      <p className="text-sm font-medium text-slate-500">{title}</p>
      <p className="mt-2 text-3xl font-semibold tracking-tight text-dark">{value}</p>
      {hint ? (
        <span className={`mt-3 inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${trendClass}`}>
          {hint}
        </span>
      ) : null}
    </article>
  );
}
