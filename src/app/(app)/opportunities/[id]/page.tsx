import Link from "next/link";
import { notFound } from "next/navigation";
import { requireSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { PageHeader, Card, CardHeader, StatusBadge, Badge, ScoreRing } from "@/components/ui";
import { OpportunityActions } from "./actions";
import { formatDate, daysUntil } from "@/lib/utils";
import { FileText, AlertOctagon } from "lucide-react";
import { can } from "@/lib/rbac";

export default async function OpportunityDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireSession();
  const { id } = await params;

  const opp = await db.opportunity.findFirst({
    where: { id, workspaceId: session.workspaceId },
    include: {
      briefDocument: { select: { id: true, title: true } },
      requirements: { include: { evidenceDocument: { select: { id: true, title: true, fileName: true } } } },
      proposals: { select: { id: true, title: true, status: true } },
    },
  });
  if (!opp) notFound();

  const missing = opp.requirements.filter((r) => r.status === "MISSING");
  const partial = opp.requirements.filter((r) => r.status === "PARTIAL");
  const met = opp.requirements.filter((r) => r.status === "MET");
  const mandatoryMissing = missing.filter((r) => r.mandatory);

  return (
    <>
      <PageHeader
        title={opp.title}
        subtitle={`${opp.client ?? "Client not identified"}${opp.value ? ` · ${opp.value}` : ""}${opp.deadline ? ` · Deadline ${formatDate(opp.deadline)} (${daysUntil(opp.deadline)} days)` : ""}`}
        action={can(session.role, "generate") ? <OpportunityActions id={opp.id} hasProposal={opp.proposals.length > 0} status={opp.status} /> : undefined}
      />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <StatusBadge status={opp.status} />
        {opp.briefDocument && (
          <Link href={`/documents/${opp.briefDocument.id}`} className="inline-flex items-center gap-1 text-xs text-brand-600 hover:underline">
            <FileText size={12} /> View source brief
          </Link>
        )}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader title="Tender readiness" subtitle="Evidence-based score across all extracted requirements" />
          <div className="flex items-center gap-5 px-5 py-4">
            <ScoreRing score={opp.readinessScore ?? 0} />
            <div className="space-y-1 text-xs text-slate-600">
              <p><span className="font-semibold text-emerald-600">{met.length}</span> requirements met</p>
              <p><span className="font-semibold text-amber-600">{partial.length}</span> partially evidenced</p>
              <p><span className="font-semibold text-red-600">{missing.length}</span> missing</p>
            </div>
          </div>
          {mandatoryMissing.length > 0 && (
            <div className="mx-5 mb-4 rounded-lg bg-red-50 px-3.5 py-2.5 ring-1 ring-inset ring-red-200">
              <p className="flex items-center gap-1.5 text-xs font-semibold text-red-700">
                <AlertOctagon size={13} /> Disqualification risk
              </p>
              <p className="mt-1 text-xs leading-5 text-red-600">
                {mandatoryMissing.length} mandatory requirement{mandatoryMissing.length > 1 ? "s are" : " is"} not evidenced. Resolve before submitting.
              </p>
            </div>
          )}
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader title="Opportunity summary" />
          <p className="px-5 py-4 text-sm leading-6 text-slate-700">{opp.summary ?? "No summary yet — run analysis."}</p>
          {opp.proposals.length > 0 && (
            <div className="border-t border-slate-100 px-5 py-3">
              <p className="mb-2 text-xs font-medium text-slate-400">Linked proposals</p>
              {opp.proposals.map((p) => (
                <Link key={p.id} href={`/proposals/${p.id}`} className="flex items-center justify-between py-1.5 text-sm text-brand-700 hover:underline">
                  {p.title} <StatusBadge status={p.status} />
                </Link>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Missing documents checklist */}
      {(missing.length > 0 || partial.length > 0) && (
        <Card className="mt-4">
          <CardHeader title="Missing document checklist" subtitle="What to obtain or upload before submission" />
          <ul className="space-y-2 px-5 py-4">
            {[...missing, ...partial].map((r) => (
              <li key={r.id} className="flex items-start gap-2.5 text-sm">
                <span className={`mt-1 h-2 w-2 shrink-0 rounded-full ${r.status === "MISSING" ? "bg-red-500" : "bg-amber-400"}`} />
                <div>
                  <p className="text-slate-800">{r.text}</p>
                  {r.note && <p className="text-xs text-slate-500">{r.note}</p>}
                </div>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {/* Compliance matrix */}
      <Card className="mt-4">
        <CardHeader title="Compliance matrix" subtitle="Every requirement extracted from the brief, matched against your evidence library" />
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-left text-xs text-slate-400">
                <th className="px-5 py-3 font-medium">Requirement</th>
                <th className="px-3 py-3 font-medium">Category</th>
                <th className="px-3 py-3 font-medium">Mandatory</th>
                <th className="px-3 py-3 font-medium">Status</th>
                <th className="px-3 py-3 font-medium">Evidence</th>
                <th className="px-5 py-3 font-medium">Risk</th>
              </tr>
            </thead>
            <tbody>
              {opp.requirements.length === 0 && (
                <tr><td colSpan={6} className="px-5 py-8 text-center text-sm text-slate-400">No requirements extracted yet.</td></tr>
              )}
              {opp.requirements.map((r) => (
                <tr key={r.id} className="border-b border-slate-50 align-top last:border-0">
                  <td className="max-w-md px-5 py-3">
                    <p className="text-[13px] leading-5 text-slate-800">{r.text}</p>
                    {r.note && <p className="mt-1 text-[11px] leading-4 text-slate-400">{r.note}</p>}
                  </td>
                  <td className="px-3 py-3"><Badge tone="slate">{r.category}</Badge></td>
                  <td className="px-3 py-3 text-xs text-slate-500">{r.mandatory ? "Yes" : "No"}</td>
                  <td className="px-3 py-3"><StatusBadge status={r.status} /></td>
                  <td className="max-w-[200px] px-3 py-3">
                    {r.evidenceDocument ? (
                      <Link href={`/documents/${r.evidenceDocument.id}`} className="text-xs text-brand-600 hover:underline">
                        {r.evidenceDocument.title}
                      </Link>
                    ) : (
                      <span className="text-xs text-slate-300">—</span>
                    )}
                  </td>
                  <td className="px-5 py-3"><StatusBadge status={r.risk} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  );
}
