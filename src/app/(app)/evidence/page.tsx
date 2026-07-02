import Link from "next/link";
import { requireSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { PageHeader, Card, StatusBadge, Badge, EmptyState } from "@/components/ui";
import { EvidenceControls } from "./controls";
import { formatDate, daysUntil } from "@/lib/utils";
import { ShieldCheck, Lock } from "lucide-react";
import { can } from "@/lib/rbac";

const TYPE_LABELS: Record<string, string> = {
  PROJECT_PROOF: "Project proof",
  TESTIMONIAL: "Testimonial",
  CERTIFICATE: "Certificate",
  CASE_STUDY: "Case study",
  CV: "Staff CV",
  FINANCIAL: "Financial",
  OTHER: "Other",
};

export default async function EvidencePage() {
  const session = await requireSession();
  const items = await db.evidenceItem.findMany({
    where: { workspaceId: session.workspaceId },
    orderBy: { createdAt: "desc" },
    include: { document: { select: { id: true, title: true } } },
  });

  const canEdit = can(session.role, "edit_content");
  const canApprove = can(session.role, "approve");

  return (
    <>
      <PageHeader
        title="Evidence Library"
        subtitle="Reusable proof for proposals: project references, testimonials, certificates and CVs. Only evidence approved for external use should appear in submitted documents."
      />

      {items.length === 0 ? (
        <EmptyState
          icon={<ShieldCheck size={32} />}
          title="No evidence items yet"
          body="Upload documents and tag the strongest ones as evidence. The proposal generator prefers strong, externally-approved evidence."
        />
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {items.map((e) => {
            const expired = e.expiresAt && daysUntil(e.expiresAt) < 0;
            return (
              <Card key={e.id} className="px-5 py-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="flex items-center gap-1.5 text-sm font-semibold text-slate-900">
                      {e.title}
                      {e.confidential && <Lock size={12} className="shrink-0 text-amber-500" />}
                    </h3>
                    <p className="mt-0.5 text-xs text-slate-400">
                      {TYPE_LABELS[e.type] ?? e.type}
                      {e.expiresAt && ` · ${expired ? "Expired" : "Expires"} ${formatDate(e.expiresAt)}`}
                    </p>
                  </div>
                  <StatusBadge status={e.strength} />
                </div>
                {e.notes && <p className="mt-2 text-[13px] leading-5 text-slate-600">{e.notes}</p>}
                <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {e.approvedForExternal
                      ? <Badge tone="green">Approved for external use</Badge>
                      : <Badge tone="slate">Internal only</Badge>}
                    {e.document && (
                      <Link href={`/documents/${e.document.id}`} className="text-[11px] text-brand-600 hover:underline">
                        Source document →
                      </Link>
                    )}
                  </div>
                  {canEdit && <EvidenceControls id={e.id} strength={e.strength} approvedForExternal={e.approvedForExternal} canApprove={canApprove} />}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </>
  );
}
