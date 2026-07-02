export default function Loading() {
  return (
    <div className="animate-pulse">
      <div className="mb-2 h-6 w-64 rounded-lg bg-slate-200/70" />
      <div className="mb-8 h-4 w-96 max-w-full rounded-lg bg-slate-100" />
      <div className="grid gap-4 lg:grid-cols-3">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-40 rounded-xl border border-slate-100 bg-white p-5 shadow-card">
            <div className="mb-3 h-4 w-1/2 rounded bg-slate-100" />
            <div className="mb-2 h-3 w-full rounded bg-slate-50" />
            <div className="mb-2 h-3 w-5/6 rounded bg-slate-50" />
            <div className="h-3 w-2/3 rounded bg-slate-50" />
          </div>
        ))}
      </div>
    </div>
  );
}
