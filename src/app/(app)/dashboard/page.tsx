import Link from "next/link";
import { requireSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { runHealthCheck } from "@/lib/health";
import { Badge, Card, CardHeader, ScoreRing, StatusBadge } from "@/components/ui";
import { formatDate, timeAgo, daysUntil } from "@/lib/utils";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  FileText,
  MoreHorizontal,
  Sparkles,
  Target,
  UploadCloud,
  Users,
} from "lucide-react";

const actionCards = [
  {
    href: "/documents",
    title: "Upload Documents",
    body: "Add RFPs, certificates, policy documents, and reusable evidence.",
    icon: UploadCloud,
  },
  {
    href: "/opportunities",
    title: "Analyze RFP",
    body: "Run AI extraction against a tender or client brief.",
    icon: Sparkles,
  },
  {
    href: "/settings",
    title: "Manage Workspace",
    body: "Review team access, branding, and integrations.",
    icon: Users,
  },
];

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
  const scoredOpportunities = opportunities.filter((o) => o.readinessScore != null);
  const readinessScore = scoredOpportunities.length
    ? Math.round(scoredOpportunities.reduce((sum, o) => sum + (o.readinessScore ?? 0), 0) / scoredOpportunities.length)
    : health.score;

  const onboarding = [
    { done: docCount > 0, label: "Upload first company documents", href: "/documents" },
    { done: wikiCount > 0, label: "Compile knowledge base", href: "/wiki" },
    { done: opportunityCount > 0, label: "Analyze a tender or client brief", href: "/opportunities" },
    { done: proposalCount > 0, label: "Generate a cited proposal", href: "/opportunities" },
    { done: Boolean(workspace?.organization.brandColor), label: "Set export brand color", href: "/settings" },
    { done: memberCount > 1, label: "Invite a teammate", href: "/settings" },
  ];
  const onboardingDone = onboarding.filter((s) => s.done).length;

  return (
    <div className="space-y-7">
      <header className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-cyan-200/70">Vault intelligence</p>
          <h1 className="max-w-3xl text-4xl font-black tracking-tight text-white sm:text-5xl">
            Welcome back, {session.name.split(" ")[0]}
          </h1>
          <p className="mt-3 max-w-2xl text-base leading-7 text-slate-400">
            Your company knowledge, evidence readiness, proposal activity, and compliance risk in one spatial overview.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden items-center -space-x-3 sm:flex">
            <div className="grid h-10 w-10 place-items-center rounded-full border-2 border-[#050506] bg-cyan-300 text-xs font-black text-[#002f39]">
              {session.name.slice(0, 1)}
            </div>
            <div className="grid h-10 w-10 place-items-center rounded-full border-2 border-[#050506] bg-violet-300 text-xs font-black text-[#20123d]">
              AV
            </div>
            <div className="grid h-10 w-10 place-items-center rounded-full border-2 border-[#050506] bg-white/10 text-xs font-bold text-slate-300">
              +{Math.max(memberCount - 2, 0)}
            </div>
          </div>
          <Link href="/settings" className="rounded-full border border-white/10 bg-white/[0.05] px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/[0.08]">
            Invite team
          </Link>
        </div>
      </header>

      {onboardingDone < onboarding.length && (
        <Card className="overflow-hidden">
          <CardHeader title={`Getting started - ${onboardingDone}/${onboarding.length} complete`} subtitle="Finish setup to unlock the full workflow" />
          <div className="grid gap-2 px-5 py-4 sm:grid-cols-2 lg:grid-cols-3">
            {onboarding.map((step) => (
              <Link
                key={step.label}
                href={step.href}
                className="flex items-center gap-2 rounded-2xl px-3 py-2.5 text-sm transition hover:bg-white/[0.06]"
              >
                <span className={`grid h-5 w-5 shrink-0 place-items-center rounded-full ${step.done ? "bg-emerald-300 text-[#062d20]" : "bg-white/10 text-slate-500"}`}>
                  {step.done && <CheckCircle2 size={13} />}
                </span>
                <span className={step.done ? "text-slate-500 line-through" : "text-slate-300"}>{step.label}</span>
              </Link>
            ))}
          </div>
        </Card>
      )}

      <section className="grid grid-cols-1 gap-5 lg:grid-cols-12">
        {actionCards.map(({ href, title, body, icon: Icon }) => (
          <Link
            key={title}
            href={href}
            className="group relative overflow-hidden rounded-3xl border border-white/10 bg-[#151518]/[0.68] p-6 shadow-[0_18px_54px_rgba(0,0,0,0.26)] backdrop-blur-2xl transition hover:-translate-y-0.5 hover:border-cyan-300/30 hover:bg-white/[0.07] lg:col-span-4"
          >
            <div className="absolute right-0 top-0 h-28 w-28 rounded-full bg-cyan-300/10 blur-3xl transition group-hover:bg-cyan-300/[0.16]" />
            <div className="relative grid h-12 w-12 place-items-center rounded-full bg-cyan-300/[0.14] text-cyan-100 ring-1 ring-cyan-300/20 transition group-hover:scale-105">
              <Icon size={21} />
            </div>
            <h2 className="relative mt-7 text-xl font-bold text-white">{title}</h2>
            <p className="relative mt-2 text-sm leading-6 text-slate-400">{body}</p>
          </Link>
        ))}

        <Card className="relative overflow-hidden p-6 lg:col-span-8">
          <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-cyan-300/[0.08] to-transparent" />
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-cyan-100/[0.55]">Vault intelligence</p>
          <div className="relative mt-6 grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
            {[
              ["Total documents", docCount, "active files"],
              ["Knowledge pages", wikiCount, "compiled wiki"],
              ["Active proposals", proposalCount, "drafts and exports"],
              ["Open tasks", tasks.length, "needs action"],
            ].map(([label, value, hint]) => (
              <div key={label} className="border-l-2 border-cyan-300/25 pl-4">
                <p className="text-sm text-slate-400">{label}</p>
                <p className="mt-2 text-3xl font-black text-white">{value}</p>
                <p className="mt-2 text-xs text-cyan-100/[0.55]">{hint}</p>
              </div>
            ))}
          </div>
          <div className="relative mt-8 h-24 overflow-hidden rounded-2xl border border-white/10 bg-black/[0.18]">
            <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent,rgba(0,180,216,0.22),transparent)]" />
            <div className="grid h-full grid-cols-12 items-end gap-2 px-5 pb-4 opacity-80">
              {[30, 54, 42, 76, 58, 88, 64, 72, 46, 84, 67, 92].map((height, index) => (
                <span key={index} className="rounded-t-full bg-cyan-300/[0.55] shadow-[0_0_18px_rgba(0,180,216,0.25)]" style={{ height: `${height}%` }} />
              ))}
            </div>
          </div>
        </Card>

        <Card className="relative flex flex-col items-center justify-center p-6 lg:col-span-4">
          <div className="flex w-full items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-cyan-100/[0.55]">Tender readiness</p>
            <MoreHorizontal className="h-5 w-5 text-slate-500" />
          </div>
          <div className="mt-8">
            <ScoreRing score={readinessScore} size={176} />
          </div>
          <div className="mt-6 flex gap-4 text-xs text-slate-300">
            <span className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-cyan-300 shadow-[0_0_8px_rgba(0,180,216,0.8)]" />Compliance</span>
            <span className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-violet-300" />Content</span>
          </div>
        </Card>
      </section>

      <section className="grid gap-5 lg:grid-cols-3">
        <Card>
          <CardHeader title="Knowledge health" action={<Link href="/health" className="text-xs font-semibold text-cyan-200 hover:underline">Full report</Link>} />
          <div className="flex flex-col gap-5 px-5 py-5 sm:flex-row sm:items-center">
            <ScoreRing score={health.score} />
            <div className="min-w-0 space-y-2 text-sm">
              {highIssues.length > 0 ? (
                highIssues.slice(0, 3).map((i, idx) => (
                  <p key={idx} className="flex min-w-0 items-start gap-2 break-words text-xs leading-5 text-slate-300">
                    <AlertTriangle size={14} className="mt-0.5 shrink-0 text-rose-300" />
                    <span className="min-w-0">{i.message}</span>
                  </p>
                ))
              ) : (
                <p className="text-xs text-slate-400">No critical issues. {health.issues.length} improvement suggestions available.</p>
              )}
            </div>
          </div>
        </Card>

        <Card>
          <CardHeader title="Upcoming deadlines" action={<Link href="/opportunities" className="text-xs font-semibold text-cyan-200 hover:underline">All opportunities</Link>} />
          <div className="divide-y divide-white/10 px-5">
            {opportunities.length === 0 && <p className="py-5 text-xs text-slate-400">No active opportunities. Upload a tender to get started.</p>}
            {opportunities.map((o) => (
              <Link key={o.id} href={`/opportunities/${o.id}`} className="flex items-center justify-between gap-3 py-4 transition hover:bg-white/[0.04]">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-white">{o.title}</p>
                  <p className="mt-1 text-xs text-slate-500">
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

        <Card>
          <CardHeader title="Certificate expiry" action={<Link href="/documents" className="text-xs font-semibold text-cyan-200 hover:underline">Library</Link>} />
          <div className="divide-y divide-white/10 px-5">
            {expiring.length === 0 && <p className="py-5 text-xs text-slate-400">No documents with expiry dates tracked yet.</p>}
            {expiring.map((d) => {
              const days = d.expiryDate ? daysUntil(d.expiryDate) : 0;
              return (
                <Link key={d.id} href={`/documents/${d.id}`} className="flex items-center justify-between gap-3 py-4">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-white">{d.title}</p>
                    <p className="mt-1 text-xs text-slate-500">{formatDate(d.expiryDate)}</p>
                  </div>
                  <Badge tone={days < 0 ? "red" : days < 60 ? "amber" : "green"}>
                    {days < 0 ? `Expired ${-days}d ago` : `${days}d left`}
                  </Badge>
                </Link>
              );
            })}
          </div>
        </Card>
      </section>

      <section className="grid gap-5 lg:grid-cols-3">
        <Card>
          <CardHeader title="Recent documents" />
          <div className="divide-y divide-white/10 px-5 pb-2">
            {recentDocs.map((d) => (
              <Link key={d.id} href={`/documents/${d.id}`} className="flex items-center gap-3 py-3">
                <FileText size={16} className="shrink-0 text-cyan-100/40" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-white">{d.title}</p>
                  <p className="text-xs text-slate-500">{timeAgo(d.createdAt)}</p>
                </div>
                <StatusBadge status={d.status} />
              </Link>
            ))}
          </div>
        </Card>

        <Card>
          <CardHeader title="Open tasks" />
          <div className="divide-y divide-white/10 px-5 pb-2">
            {tasks.length === 0 && <p className="py-5 text-xs text-slate-400">No open tasks.</p>}
            {tasks.map((t) => (
              <div key={t.id} className="flex items-start gap-3 py-3">
                <Target size={15} className="mt-0.5 shrink-0 text-amber-300" />
                <p className="text-sm leading-6 text-slate-300">{t.title}</p>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <CardHeader title="Team activity" action={<Link href="/settings" className="text-xs font-semibold text-cyan-200 hover:underline">Audit log</Link>} />
          <div className="divide-y divide-white/10 px-5 pb-2">
            {activity.map((a) => (
              <div key={a.id} className="py-3">
                <p className="text-sm leading-6 text-slate-300">{a.detail ?? a.action}</p>
                <p className="text-xs text-slate-500">
                  {a.user?.name ?? "System"} - {timeAgo(a.createdAt)}
                </p>
              </div>
            ))}
          </div>
        </Card>
      </section>

      <section className="rounded-3xl border border-cyan-300/20 bg-[#151518]/[0.72] px-6 py-5 shadow-[0_0_50px_rgba(0,180,216,0.08)] backdrop-blur-2xl">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-base font-bold text-white">The AtlasVault workflow</p>
            <p className="mt-1 text-sm text-cyan-100/70">
              Upload documents, compile the knowledge base, analyze a tender, then generate an evidence-backed proposal.
            </p>
          </div>
          <Link href="/opportunities" className="inline-flex items-center justify-center gap-2 rounded-full bg-cyan-300 px-4 py-2 text-sm font-bold text-[#002f39] transition hover:bg-cyan-200">
            Analyze a tender <ArrowRight size={15} />
          </Link>
        </div>
      </section>
    </div>
  );
}
