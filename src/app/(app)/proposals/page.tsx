import Link from "next/link";
import { requireSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { PageHeader, Card, StatusBadge, EmptyState } from "@/components/ui";
import { timeAgo } from "@/lib/utils";
import { FileSignature } from "lucide-react";

export default async function ProposalsPage() {
  const session = await requireSession();
  const proposals = await db.proposal.findMany({
    where: { workspaceId: session.workspaceId },
    orderBy: { createdAt: "desc" },
    include: {
      opportunity: { select: { title: true, client: true, deadline: true } },
      createdBy: { select: { name: true } },
      _count: { select: { sections: true } },
    },
  });

  return (
    <>
      <PageHeader
        title="Proposals"
        subtitle="AI-drafted, evidence-cited proposals. Every section shows its sources and confidence; approval is required before export."
      />

      {proposals.length === 0 ? (
        <EmptyState
          icon={<FileSignature size={32} />}
          title="No proposals yet"
          body="Open an opportunity and click “Generate proposal”. AtlasVault drafts every section from your own documents, with citations."
          action={<Link href="/opportunities" className="rounded-lg bg-brand-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-brand-700">Go to opportunities</Link>}
        />
      ) : (
        <div className="space-y-3">
          {proposals.map((p) => (
            <Link key={p.id} href={`/proposals/${p.id}`} className="block">
              <Card className="px-5 py-4 transition hover:border-brand-200 hover:shadow-md">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate text-sm font-semibold text-slate-900">{p.title}</h3>
                    <p className="mt-0.5 text-xs text-slate-500">
                      {p.opportunity?.client ?? "No client"} · {p._count.sections} sections · by {p.createdBy?.name ?? "—"} · {timeAgo(p.createdAt)}
                    </p>
                  </div>
                  <StatusBadge status={p.status} />
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
