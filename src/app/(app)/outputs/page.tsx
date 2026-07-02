import Link from "next/link";
import { requireSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { PageHeader, Card, StatusBadge, ConfidenceBadge } from "@/components/ui";
import { OUTPUT_TEMPLATES } from "@/lib/outputs";
import { GenerateOutputButton } from "./generate-button";
import { timeAgo } from "@/lib/utils";
import { can } from "@/lib/rbac";
import { FileOutput, Building2, BookMarked, Award, Users, Briefcase } from "lucide-react";

const TEMPLATE_ICONS: Record<string, React.ReactNode> = {
  "company-profile": <Building2 size={17} />,
  "case-study": <BookMarked size={17} />,
  "capability-statement": <Award size={17} />,
  "cv-pack": <Users size={17} />,
  "executive-brief": <Briefcase size={17} />,
};

export default async function OutputsPage() {
  const session = await requireSession();
  const outputs = await db.generatedOutput.findMany({
    where: { workspaceId: session.workspaceId },
    orderBy: { createdAt: "desc" },
  });
  const canGenerate = can(session.role, "generate");

  return (
    <>
      <PageHeader
        title="Output Studio"
        subtitle="Turn your knowledge base into business documents: company profiles, case studies, capability statements, CV packs and executive briefs — cited, reviewable, and exportable as branded PDF or DOCX."
      />

      <h2 className="mb-3 text-sm font-semibold text-slate-700">Templates</h2>
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {OUTPUT_TEMPLATES.map((t) => (
          <Card key={t.key} className="flex flex-col px-5 py-4">
            <div className="mb-2 flex items-center gap-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                {TEMPLATE_ICONS[t.key] ?? <FileOutput size={17} />}
              </span>
              <div>
                <h3 className="text-sm font-semibold text-slate-900">{t.name}</h3>
                <p className="text-[11px] text-slate-400">{t.audience}</p>
              </div>
            </div>
            <p className="flex-1 text-[13px] leading-5 text-slate-500">{t.description}</p>
            <div className="mt-3">
              {canGenerate ? (
                <GenerateOutputButton templateKey={t.key} templateName={t.name} />
              ) : (
                <p className="text-[11px] text-slate-400">Viewers cannot generate outputs.</p>
              )}
            </div>
          </Card>
        ))}
      </div>

      <h2 className="mb-3 mt-8 text-sm font-semibold text-slate-700">Generated outputs</h2>
      {outputs.length === 0 ? (
        <Card className="px-6 py-10 text-center text-sm text-slate-400">
          Nothing generated yet. Pick a template above — every output is compiled from your documents with citations.
        </Card>
      ) : (
        <div className="space-y-2.5">
          {outputs.map((o) => (
            <Link key={o.id} href={`/outputs/${o.id}`} className="block">
              <Card className="px-5 py-3.5 transition hover:border-brand-200 hover:shadow-md">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <FileOutput size={16} className="text-slate-300" />
                    <div>
                      <h3 className="text-sm font-semibold text-slate-900">{o.title}</h3>
                      <p className="text-[11px] text-slate-400">Generated {timeAgo(o.createdAt)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <ConfidenceBadge level={o.confidence} />
                    <StatusBadge status={o.status} />
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
