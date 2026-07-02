import Link from "next/link";
import { requireSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { PageHeader, Card, StatusBadge, Badge } from "@/components/ui";
import { UploadDropzone } from "@/components/upload-dropzone";
import { formatDate, daysUntil } from "@/lib/utils";
import { can } from "@/lib/rbac";

export default async function OpportunitiesPage() {
  const session = await requireSession();
  const opportunities = await db.opportunity.findMany({
    where: { workspaceId: session.workspaceId },
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { requirements: true, proposals: true } } },
  });

  return (
    <>
      <PageHeader
        title="Opportunities"
        subtitle="Upload a tender, RFP or client brief. AtlasVault extracts every requirement, matches it against your evidence, and scores your readiness before you commit to bidding."
      />

      {can(session.role, "generate") && (
        <div className="mb-6">
          <UploadDropzone
            endpoint="/api/opportunities"
            hint="Drop the tender / RFP / client brief here. AtlasVault will extract requirements and build a compliance matrix in seconds."
          />
        </div>
      )}

      <div className="space-y-3">
        {opportunities.length === 0 && (
          <Card className="px-6 py-10 text-center text-sm text-slate-400">
            No opportunities yet. Upload your first tender above to see the magic moment.
          </Card>
        )}
        {opportunities.map((o) => (
          <Link key={o.id} href={`/opportunities/${o.id}`} className="block">
            <Card className="px-5 py-4 transition hover:border-brand-200 hover:shadow-md">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <h3 className="truncate text-sm font-semibold text-slate-900">{o.title}</h3>
                  <p className="mt-0.5 text-xs text-slate-500">
                    {o.client ?? "Client not identified"} · {o._count.requirements} requirements · {o._count.proposals} proposal{o._count.proposals === 1 ? "" : "s"}
                    {o.value ? ` · ${o.value}` : ""}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {o.deadline && (
                    <Badge tone={daysUntil(o.deadline) < 7 ? "red" : daysUntil(o.deadline) < 21 ? "amber" : "slate"}>
                      Due {formatDate(o.deadline)}
                    </Badge>
                  )}
                  {o.readinessScore != null && (
                    <Badge tone={o.readinessScore >= 80 ? "green" : o.readinessScore >= 60 ? "amber" : "red"}>
                      {o.readinessScore}% ready
                    </Badge>
                  )}
                  <StatusBadge status={o.status} />
                </div>
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </>
  );
}
