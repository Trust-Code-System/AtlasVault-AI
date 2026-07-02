import Link from "next/link";
import { notFound } from "next/navigation";
import { requireSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { PageHeader, Card, StatusBadge } from "@/components/ui";
import { ProposalToolbar, SectionCard } from "./builder";
import { can } from "@/lib/rbac";
import { formatDate } from "@/lib/utils";

export default async function ProposalDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireSession();
  const { id } = await params;

  const proposal = await db.proposal.findFirst({
    where: { id, workspaceId: session.workspaceId },
    include: {
      sections: { orderBy: { index: "asc" } },
      opportunity: { select: { id: true, title: true, client: true, deadline: true, readinessScore: true } },
      approvals: { orderBy: { createdAt: "desc" }, take: 1 },
    },
  });
  if (!proposal) notFound();

  const citations = await db.citation.findMany({
    where: { targetType: "PROPOSAL_SECTION", targetId: { in: proposal.sections.map((s) => s.id) } },
    include: { document: { select: { id: true, title: true } } },
  });
  const comments = await db.comment.findMany({
    where: { workspaceId: session.workspaceId, targetType: "PROPOSAL", targetId: proposal.id },
    include: { author: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
  });

  const citationsBySection: Record<string, { documentId: string; title: string; snippet: string }[]> = {};
  for (const c of citations) {
    (citationsBySection[c.targetId] ??= []).push({ documentId: c.document.id, title: c.document.title, snippet: c.snippet });
  }

  const pendingApproval = proposal.approvals[0]?.status === "PENDING";

  return (
    <>
      <PageHeader
        title={proposal.title}
        subtitle={
          proposal.opportunity
            ? `For ${proposal.opportunity.client ?? "client"} · ${proposal.opportunity.deadline ? `deadline ${formatDate(proposal.opportunity.deadline)}` : "no deadline"}`
            : undefined
        }
        action={
          <ProposalToolbar
            id={proposal.id}
            status={proposal.status}
            pendingApproval={pendingApproval}
            canApprove={can(session.role, "approve")}
            canExport={can(session.role, "export")}
          />
        }
      />

      <div className="mb-5 flex flex-wrap items-center gap-2">
        <StatusBadge status={proposal.status} />
        {proposal.opportunity && (
          <Link href={`/opportunities/${proposal.opportunity.id}`} className="text-xs text-brand-600 hover:underline">
            View opportunity & compliance matrix →
          </Link>
        )}
      </div>

      {proposal.status !== "APPROVED" && proposal.status !== "EXPORTED" && (
        <div className="mb-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs leading-5 text-amber-800">
          <span className="font-semibold">Human review required.</span> This draft was generated from your documents with citations, but it must be approved by an admin before it can be exported. Verify low-confidence sections and missing-evidence notes first.
        </div>
      )}

      <div className="space-y-4">
        {proposal.sections.map((s) => (
          <SectionCard
            key={s.id}
            proposalId={proposal.id}
            section={{ id: s.id, title: s.title, content: s.content, status: s.status, confidence: s.confidence, missing: s.missing }}
            sources={citationsBySection[s.id] ?? []}
            canEdit={can(session.role, "edit_content")}
            canApprove={can(session.role, "approve")}
          />
        ))}
      </div>

      <Card className="mt-6">
        <div className="border-b border-slate-100 px-5 py-3">
          <h3 className="text-sm font-semibold text-slate-900">Review comments</h3>
        </div>
        <div className="divide-y divide-slate-50 px-5">
          {comments.length === 0 && <p className="py-4 text-xs text-slate-400">No comments yet.</p>}
          {comments.map((c) => (
            <div key={c.id} className="py-3">
              <p className="text-[13px] text-slate-700">{c.body}</p>
              <p className="mt-1 text-[11px] text-slate-400">{c.author.name} · {formatDate(c.createdAt)}</p>
            </div>
          ))}
        </div>
      </Card>
    </>
  );
}
