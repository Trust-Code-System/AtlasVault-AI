import Link from "next/link";
import { requireSession } from "@/lib/auth";
import { runHealthCheck } from "@/lib/health";
import { PageHeader, Card, CardHeader, ScoreRing, Badge } from "@/components/ui";
import { AlertOctagon, AlertTriangle, Info } from "lucide-react";

export default async function HealthPage() {
  const session = await requireSession();
  const report = await runHealthCheck(session.workspaceId);

  const groups = new Map<string, typeof report.issues>();
  for (const issue of report.issues) {
    const list = groups.get(issue.category) ?? [];
    list.push(issue);
    groups.set(issue.category, list);
  }

  return (
    <>
      <PageHeader
        title="Knowledge Health Check"
        subtitle="AtlasVault continuously inspects your knowledge base for expired documents, coverage gaps, weak evidence and unreviewed AI content — so you're always tender-ready."
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="flex items-center gap-6 px-6 py-5">
          <ScoreRing score={report.score} size={110} />
          <div>
            <p className="text-sm font-semibold text-slate-900">Overall health</p>
            <p className="mt-1 text-xs leading-5 text-slate-500">
              {report.score >= 80 ? "Strong. Keep documents fresh and evidence reviewed."
                : report.score >= 60 ? "Usable, but issues below will weaken proposals."
                : "At risk — resolve the high-severity issues before your next bid."}
            </p>
          </div>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader title="Score breakdown" />
          <div className="space-y-3 px-5 py-4">
            {report.breakdown.map((b) => (
              <div key={b.label}>
                <div className="mb-1 flex items-center justify-between text-xs">
                  <span className="font-medium text-slate-600">{b.label}</span>
                  <span className="text-slate-400">{b.score}%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className={`h-full rounded-full ${b.score >= 80 ? "bg-emerald-500" : b.score >= 60 ? "bg-amber-400" : "bg-red-500"}`}
                    style={{ width: `${b.score}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="mt-6 space-y-4">
        {Array.from(groups.entries()).map(([category, issues]) => (
          <Card key={category}>
            <CardHeader title={category} action={<Badge tone="slate">{issues.length}</Badge>} />
            <ul className="divide-y divide-slate-50 px-5">
              {issues.map((issue, i) => (
                <li key={i} className="flex items-start gap-2.5 py-3">
                  {issue.severity === "HIGH" ? (
                    <AlertOctagon size={15} className="mt-0.5 shrink-0 text-red-500" />
                  ) : issue.severity === "MEDIUM" ? (
                    <AlertTriangle size={15} className="mt-0.5 shrink-0 text-amber-500" />
                  ) : (
                    <Info size={15} className="mt-0.5 shrink-0 text-slate-400" />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] leading-5 text-slate-700">{issue.message}</p>
                  </div>
                  {issue.link && (
                    <Link href={issue.link} className="shrink-0 text-xs font-medium text-brand-600 hover:underline">
                      Fix →
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </Card>
        ))}
        {report.issues.length === 0 && (
          <Card className="px-6 py-10 text-center text-sm text-slate-500">No issues found. Your knowledge base is in excellent shape.</Card>
        )}
      </div>
    </>
  );
}
