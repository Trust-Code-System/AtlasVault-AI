import { db } from "@/lib/db";
import { Card, CardHeader, Stat, Badge } from "@/components/ui";
import { timeAgo } from "@/lib/utils";
import { aiModelLabel } from "@/lib/ai/client";

export default async function AdminOverviewPage() {
  const [orgCount, workspaceCount, userCount, docCount, chunkCount, proposalCount, outputCount, aiCalls, exports, errors24h, criticalErrors, recentErrors, recentUsage] = await Promise.all([
    db.organization.count(),
    db.workspace.count(),
    db.user.count(),
    db.document.count(),
    db.documentChunk.count(),
    db.proposal.count(),
    db.generatedOutput.count(),
    db.usageLog.count({ where: { kind: "AI_CALL" } }),
    db.usageLog.count({ where: { kind: "EXPORT" } }),
    db.errorLog.count({ where: { createdAt: { gte: new Date(Date.now() - 86_400_000) } } }),
    db.errorLog.count({ where: { severity: "CRITICAL" } }),
    db.errorLog.findMany({ orderBy: { createdAt: "desc" }, take: 5 }),
    db.usageLog.groupBy({ by: ["kind"], _count: true }),
  ]);

  return (
    <>
      <h1 className="mb-1 text-xl font-semibold tracking-tight text-slate-900">Platform overview</h1>
      <p className="mb-6 text-sm text-slate-500">System health and aggregate usage. All figures are counts and metadata — customer content never appears here.</p>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label="Organizations" value={orgCount} hint={`${workspaceCount} workspaces · ${userCount} users`} />
        <Stat label="Documents processed" value={docCount} hint={`${chunkCount} searchable chunks`} />
        <Stat label="AI generations" value={aiCalls} hint={`${proposalCount} proposals · ${outputCount} outputs`} />
        <Stat label="Errors (24h)" value={errors24h} tone={errors24h > 10 ? "danger" : errors24h > 0 ? "warn" : "good"} hint={`${criticalErrors} critical all-time`} />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader title="System status" />
          <dl className="space-y-3 px-5 py-4 text-sm">
            <div className="flex items-center justify-between">
              <dt className="text-xs text-slate-400">AI engine</dt>
              <dd><Badge tone="green">{aiModelLabel()}</Badge></dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-xs text-slate-400">Database</dt>
              <dd><Badge tone="green">SQLite (dev) — reachable</Badge></dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-xs text-slate-400">Exports delivered</dt>
              <dd className="text-slate-700">{exports}</dd>
            </div>
            {recentUsage.map((u) => (
              <div key={u.kind} className="flex items-center justify-between">
                <dt className="text-xs text-slate-400">Usage · {u.kind.replace(/_/g, " ").toLowerCase()}</dt>
                <dd className="text-slate-700">{u._count}</dd>
              </div>
            ))}
          </dl>
        </Card>

        <Card>
          <CardHeader title="Latest errors" subtitle="Sanitized — see Errors tab for detail" />
          <div className="divide-y divide-slate-50 px-5 pb-2">
            {recentErrors.length === 0 && <p className="py-4 text-xs text-slate-400">No errors logged. Quiet is good.</p>}
            {recentErrors.map((e) => (
              <div key={e.id} className="py-2.5">
                <div className="flex items-center gap-2">
                  <Badge tone={e.severity === "CRITICAL" ? "red" : e.severity === "ERROR" ? "amber" : "slate"}>{e.severity}</Badge>
                  <span className="font-mono text-[11px] text-slate-400">{e.ref}</span>
                  <span className="text-[11px] text-slate-400">{timeAgo(e.createdAt)}</span>
                </div>
                <p className="mt-1 truncate text-[13px] text-slate-700">{e.message}</p>
                <p className="text-[11px] text-slate-400">{e.route ?? "—"} · {e.category}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </>
  );
}
