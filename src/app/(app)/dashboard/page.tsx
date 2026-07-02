import Link from "next/link";
import { requireSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { runHealthCheck } from "@/lib/health";
import { Card, CardHeader, PageHeader, Stat, StatusBadge, ScoreRing, Badge } from "@/components/ui";
import { formatDate, timeAgo, daysUntil } from "@/lib/utils";
import { ArrowRight, FileText, Target, AlertTriangle } from "lucide-react";

export default async function DashboardPage() {
  const session = await requireSession();
  const ws = session.workspaceId;

  const [docCount, wikiCount, proposalCount, opportunityCount, memberCount, workspace, opportunities, recentDocs, expiring, tasks, activity, health] = await Promise.all([
    db.document.count({ where: { workspaceId: ws, status: { not: "ARCHIVED" } } }),
    db.wikiPage.count({ where: { workspaceId: ws } }),
    db.proposal.count({ where: { workspaceId: ws } }),
    db.opportunity.count({ where: { workspaceId: ws } }),
    db.membership.count({ where: { workspaceId: ws } }),
    db.workspace.findUnique({ where: { id: ws }, include: { organization: true } }),
    db.opportunity.findMany({
      where: { workspaceId: ws, status: { notIn: ["ARCHIVED", "WON", "LOST"] } },
      orderBy: { deadline: "asc" },
      take: 4,
    }),
    db.document.findMany({ where: { workspaceId: ws }, orderBy: { createdAt: "desc" }, take: 5 }),
    db.document.findMany({
      where: { workspaceId: ws, expiryDate: { not: null }, status: { not: "ARCHIVED" } },
      orderBy: { expiryDate: "asc" },
      take: 4,
    }),
    db.task.findMany({ where: { workspaceId: ws, status: "OPEN" }, orderBy: { createdAt: "desc" }, take: 5 }),
    db.auditLog.findMany({ where: { workspaceId: ws }, orderBy: { createdAt: "desc" }, take: 6, include: { user: true } }),
    runHealthCheck(ws),
  ]);

  const highIssues = health.issues.filter((i) => i.severity === "HIGH");

  const onboarding = [
    { done: docCount > 0, label: "Upload your first company documents", href: "/documents" },
    { done: wikiCount > 0, label: "Compile your knowledge base", href: "/wiki" },
    { done: opportunityCount > 0, label: "Analyze a tender or client brief", href: "/opportunities" },
    { done: proposalCount > 0, label: "Generate your first cited proposal", href: "/opportunities" },
    { done: Boolean(workspace?.organization.brandColor), label: "Set your brand color for exports", href: "/settings" },
    { done: memberCount > 1, label: "Invite a teammate", href: "/settings" },
  ];
  const onboardingDone = onboarding.filter((s) => s.done).length;

  return (
    <>
      <PageHeader
        title={`Welcome back, ${session.name.split(" ")[0]}`}
        subtitle="Here is the state of your company knowledge and active opportunities."
      />

      {onboardingDone < onboarding.length && (
        <Card className="mb-6">
          <CardHeader
            title={`Getting started — ${onboardingDone}/${onboarding.length} complete`}
            subtitle="Finish setup to unlock the full workflow"
          />
          <div className="grid gap-1.5 px-5 py-3 sm:grid-cols-2 lg:grid-cols-3">
            {onboarding.map((step) => (
              <Link
                key={step.label}
                href={step.href}
                className={`flex items-center gap-2 rounded-lg px-2.5 py-2 text-[13px] transition ${step.done ? "text-slate-400 line-through" : "text-slate-700 hover:bg-brand-50"}`}
              >
                <span className={`flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${step.done ? "bg-emerald-100 text-emerald-600" : "bg-slate-100 text-slate-400"}`}>
                  {step.done ? "✓" : ""}
                </span>
                {step.label}
              </Link>
            ))}
          </div>
        </Card>
      )}

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label="Documents" value={docCount} hint="in your library" />
        <Stat label="Knowledge pages" value={wikiCount} hint="AI-compiled wiki" />
        <Stat label="Active opportunities" value={opportunities.length} hint="tenders & briefs in play" />
        <Stat label="Proposals" value={proposalCount} hint="drafted with citations" />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        {/* Health */}
        <Card>
          <CardHeader title="Knowledge health" action={<Link href="/health" className="text-xs font-medium text-brand-600 hover:underline">Full report</Link>} />
          <div className="flex items-center gap-5 px-5 py-4">
            <ScoreRing score={health.score} />
            <div className="space-y-1.5 text-sm">
              {highIssues.length > 0 ? (
                highIssues.slice(0, 3).map((i, idx) => (
                  <p key={idx} className="flex items-start gap-1.5 text-xs text-slate-600">
                    <AlertTriangle size={13} className="mt-0.5 shrink-0 text-red-500" />
                    {i.message}
                  </p>
                ))
              ) : (
                <p className="text-xs text-slate-500">No critical issues. {health.issues.length} improvement suggestions available.</p>
              )}
            </div>
          </div>
        </Card>

        {/* Deadlines */}
        <Card>
          <CardHeader title="Upcoming deadlines" action={<Link href="/opportunities" className="text-xs font-medium text-brand-600 hover:underline">All opportunities</Link>} />
          <div className="divide-y divide-slate-50 px-5">
            {opportunities.length === 0 && <p className="py-4 text-xs text-slate-500">No active opportunities. Upload a tender to get started.</p>}
            {opportunities.map((o) => (
              <Link key={o.id} href={`/opportunities/${o.id}`} className="flex items-center justify-between gap-2 py-3 hover:bg-slate-50/50">
                <div className="min-w-0">
                  <p className="truncate text-[13px] font-medium text-slate-800">{o.title}</p>
                  <p className="text-xs text-slate-400">
                    {o.deadline ? `Due ${formatDate(o.deadline)} (${daysUntil(o.deadline)}d)` : "No deadline set"}
                  </p>
                </div>
                {o.readinessScore != null && (
                  <Badge tone={o.readinessScore >= 80 ? "green" : o.readinessScore >= 60 ? "amber" : "red"}>{o.readinessScore}% ready</Badge>
                )}
              </Link>
            ))}
          </div>
        </Card>

        {/* Expiring documents */}
        <Card>
          <CardHeader title="Certificate & document expiry" action={<Link href="/documents" className="text-xs font-medium text-brand-600 hover:underline">Library</Link>} />
          <div className="divide-y divide-slate-50 px-5">
            {expiring.length === 0 && <p className="py-4 text-xs text-slate-500">No documents with expiry dates tracked yet.</p>}
            {expiring.map((d) => {
              const days = d.expiryDate ? daysUntil(d.expiryDate) : 0;
              return (
                <Link key={d.id} href={`/documents/${d.id}`} className="flex items-center justify-between gap-2 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-[13px] font-medium text-slate-800">{d.title}</p>
                    <p className="text-xs text-slate-400">{formatDate(d.expiryDate)}</p>
                  </div>
                  <Badge tone={days < 0 ? "red" : days < 60 ? "amber" : "green"}>
                    {days < 0 ? `Expired ${-days}d ago` : `${days}d left`}
                  </Badge>
                </Link>
              );
            })}
          </div>
        </Card>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        {/* Recent documents */}
        <Card className="lg:col-span-1">
          <CardHeader title="Recent documents" />
          <div className="divide-y divide-slate-50 px-5 pb-2">
            {recentDocs.map((d) => (
              <Link key={d.id} href={`/documents/${d.id}`} className="flex items-center gap-3 py-2.5">
                <FileText size={15} className="shrink-0 text-slate-300" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-medium text-slate-800">{d.title}</p>
                  <p className="text-[11px] text-slate-400">{timeAgo(d.createdAt)}</p>
                </div>
                <StatusBadge status={d.status} />
              </Link>
            ))}
          </div>
        </Card>

        {/* Open tasks */}
        <Card>
          <CardHeader title="Open tasks" />
          <div className="divide-y divide-slate-50 px-5 pb-2">
            {tasks.length === 0 && <p className="py-4 text-xs text-slate-500">No open tasks.</p>}
            {tasks.map((t) => (
              <div key={t.id} className="flex items-start gap-2.5 py-2.5">
                <Target size={14} className="mt-0.5 shrink-0 text-amber-500" />
                <p className="text-[13px] text-slate-700">{t.title}</p>
              </div>
            ))}
          </div>
        </Card>

        {/* Activity */}
        <Card>
          <CardHeader title="Team activity" action={<Link href="/settings" className="text-xs font-medium text-brand-600 hover:underline">Audit log</Link>} />
          <div className="divide-y divide-slate-50 px-5 pb-2">
            {activity.map((a) => (
              <div key={a.id} className="py-2.5">
                <p className="text-[13px] text-slate-700">{a.detail ?? a.action}</p>
                <p className="text-[11px] text-slate-400">
                  {a.user?.name ?? "System"} · {timeAgo(a.createdAt)}
                </p>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="mt-6 rounded-xl border border-brand-100 bg-brand-50/60 px-5 py-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-brand-900">The AtlasVault workflow</p>
            <p className="text-xs text-brand-700">
              Upload company documents → compile the knowledge base → upload a tender → generate an evidence-backed proposal.
            </p>
          </div>
          <Link href="/opportunities" className="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-brand-700">
            Analyze a new tender <ArrowRight size={13} />
          </Link>
        </div>
      </div>
    </>
  );
}
