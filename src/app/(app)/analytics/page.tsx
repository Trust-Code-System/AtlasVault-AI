import Link from "next/link";
import { requireSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { PageHeader, Card, CardHeader, Stat, Badge } from "@/components/ui";

export default async function AnalyticsPage() {
  const session = await requireSession();
  const ws = session.workspaceId;

  const [docCount, proposalCount, outputCount, answerCount, exportCount, opportunities, topCited, feedback, recentWeeks] = await Promise.all([
    db.document.count({ where: { workspaceId: ws, status: { not: "ARCHIVED" } } }),
    db.proposal.count({ where: { workspaceId: ws } }),
    db.generatedOutput.count({ where: { workspaceId: ws } }),
    db.answer.count({ where: { workspaceId: ws } }),
    db.usageLog.count({ where: { workspaceId: ws, kind: "EXPORT" } }),
    db.opportunity.findMany({ where: { workspaceId: ws }, select: { status: true, value: true } }),
    db.citation.groupBy({ by: ["documentId"], where: { workspaceId: ws }, _count: true, orderBy: { _count: { documentId: "desc" } }, take: 6 }),
    db.feedback.groupBy({ by: ["rating"], where: { workspaceId: ws }, _count: true }),
    db.auditLog.findMany({ where: { workspaceId: ws, createdAt: { gte: new Date(Date.now() - 56 * 86_400_000) } }, select: { createdAt: true, action: true } }),
  ]);

  const citedDocs = await db.document.findMany({
    where: { id: { in: topCited.map((c) => c.documentId) } },
    select: { id: true, title: true, category: true },
  });

  const won = opportunities.filter((o) => o.status === "WON").length;
  const lost = opportunities.filter((o) => o.status === "LOST").length;
  const submitted = opportunities.filter((o) => ["SUBMITTED", "WON", "LOST"].includes(o.status)).length;
  const winRate = won + lost > 0 ? Math.round((won / (won + lost)) * 100) : null;

  // conservative estimate: proposal draft ≈ 6h saved, output ≈ 2h, cited answer ≈ 15min
  const hoursSaved = Math.round(proposalCount * 6 + outputCount * 2 + answerCount * 0.25);

  // weekly activity buckets (8 weeks)
  const weeks: { label: string; count: number }[] = [];
  for (let w = 7; w >= 0; w--) {
    const start = Date.now() - (w + 1) * 7 * 86_400_000;
    const end = Date.now() - w * 7 * 86_400_000;
    const count = recentWeeks.filter((a) => a.createdAt.getTime() >= start && a.createdAt.getTime() < end).length;
    weeks.push({ label: w === 0 ? "This wk" : `-${w}w`, count });
  }
  const maxWeek = Math.max(1, ...weeks.map((w) => w.count));

  const up = feedback.find((f) => f.rating === "UP")?._count ?? 0;
  const down = feedback.find((f) => f.rating === "DOWN")?._count ?? 0;

  return (
    <>
      <PageHeader
        title="Analytics"
        subtitle="What AtlasVault is producing for your team — documents processed, outputs generated, evidence reuse and win performance."
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label="Est. hours saved" value={`${hoursSaved}h`} hint="6h per proposal, 2h per output, 15min per cited answer" tone="good" />
        <Stat label="Proposals generated" value={proposalCount} hint={`${exportCount} exports delivered`} />
        <Stat label="Documents processed" value={docCount} hint={`${answerCount} questions answered with citations`} />
        <Stat label="Win rate" value={winRate != null ? `${winRate}%` : "—"} hint={winRate != null ? `${won} won · ${lost} lost · ${submitted} submitted` : "Mark opportunities Won/Lost to track"} tone={winRate != null && winRate >= 50 ? "good" : "default"} />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader title="Team activity" subtitle="Workspace actions per week (uploads, generations, approvals, exports)" />
          <div className="flex h-44 items-end gap-3 px-6 pb-5 pt-4">
            {weeks.map((w) => (
              <div key={w.label} className="flex flex-1 flex-col items-center gap-1.5">
                <div className="flex w-full flex-1 items-end">
                  <div
                    className="w-full rounded-t-md bg-brand-500/80 transition-all"
                    style={{ height: `${Math.max(4, (w.count / maxWeek) * 100)}%` }}
                    title={`${w.count} actions`}
                  />
                </div>
                <span className="text-[10px] text-slate-400">{w.label}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <CardHeader title="Most reused evidence" subtitle="Documents cited most across wiki, answers, proposals and compliance" />
          <div className="divide-y divide-slate-50 px-5 pb-2">
            {topCited.length === 0 && <p className="py-4 text-xs text-slate-400">No citations yet — compile the knowledge base or generate a proposal.</p>}
            {topCited.map((c) => {
              const doc = citedDocs.find((d) => d.id === c.documentId);
              if (!doc) return null;
              return (
                <Link key={c.documentId} href={`/documents/${doc.id}`} className="flex items-center justify-between gap-3 py-2.5 hover:bg-slate-50/50">
                  <div className="min-w-0">
                    <p className="truncate text-[13px] font-medium text-slate-800">{doc.title}</p>
                    <p className="text-[11px] text-slate-400">{doc.category.replace(/_/g, " ").toLowerCase()}</p>
                  </div>
                  <Badge tone="blue">{c._count} citations</Badge>
                </Link>
              );
            })}
          </div>
        </Card>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader title="AI feedback & learning" subtitle="Workspace-scoped: approved answers join retrieval as workspace memory" />
          <div className="flex items-center gap-6 px-5 py-5">
            <div>
              <p className="text-2xl font-semibold text-emerald-600">{up}</p>
              <p className="text-xs text-slate-500">answers approved</p>
            </div>
            <div>
              <p className="text-2xl font-semibold text-red-500">{down}</p>
              <p className="text-xs text-slate-500">flagged for improvement</p>
            </div>
            <p className="flex-1 text-xs leading-5 text-slate-500">
              Thumbs-up an answer in Ask AI and it becomes verified workspace memory — the AI reuses it in future answers. Learning never crosses workspaces.
            </p>
          </div>
        </Card>

        <Card>
          <CardHeader title="Pipeline" subtitle="Opportunity outcomes" />
          <div className="grid grid-cols-4 gap-3 px-5 py-5 text-center">
            {[
              ["Active", opportunities.filter((o) => ["NEW", "ANALYZING", "IN_PROGRESS", "READY_FOR_REVIEW"].includes(o.status)).length, "text-brand-600"],
              ["Submitted", opportunities.filter((o) => o.status === "SUBMITTED").length, "text-slate-700"],
              ["Won", won, "text-emerald-600"],
              ["Lost", lost, "text-red-500"],
            ].map(([label, value, color]) => (
              <div key={label as string}>
                <p className={`text-2xl font-semibold ${color}`}>{value as number}</p>
                <p className="text-xs text-slate-500">{label as string}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </>
  );
}
