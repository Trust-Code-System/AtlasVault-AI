import Link from "next/link";
import { notFound } from "next/navigation";
import { requireSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { PageHeader, Card, CardHeader, StatusBadge, ConfidenceBadge } from "@/components/ui";
import { Markdown } from "@/components/markdown";
import { WikiActions } from "./actions";
import { formatDate } from "@/lib/utils";
import { FileText } from "lucide-react";
import { can } from "@/lib/rbac";

export default async function WikiDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const session = await requireSession();
  const { slug } = await params;

  const page = await db.wikiPage.findFirst({
    where: { workspaceId: session.workspaceId, slug },
  });
  if (!page) notFound();

  const citations = await db.citation.findMany({
    where: { targetType: "WIKI_PAGE", targetId: page.id },
    include: { document: { select: { id: true, title: true, fileName: true } } },
  });
  const uniqueDocs = Array.from(new Map(citations.map((c) => [c.document.id, c])).values());

  return (
    <>
      <PageHeader
        title={page.title}
        subtitle={`Last updated ${formatDate(page.updatedAt)}`}
        action={<WikiActions id={page.id} status={page.status} canApprove={can(session.role, "approve")} canEdit={can(session.role, "edit_content")} content={page.content} />}
      />

      <div className="mb-4 flex gap-2">
        <StatusBadge status={page.status} />
        <ConfidenceBadge level={page.confidence} />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="px-6 py-5 lg:col-span-2">
          <Markdown>{page.content}</Markdown>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader title="Generated from these sources" subtitle="Every page traces back to real documents" />
            <div className="divide-y divide-slate-50 px-5 pb-2">
              {uniqueDocs.length === 0 && <p className="py-3 text-xs text-slate-400">No citations recorded.</p>}
              {uniqueDocs.map((c) => (
                <Link key={c.id} href={`/documents/${c.document.id}`} className="flex items-start gap-2.5 py-2.5 hover:bg-slate-50/60">
                  <FileText size={14} className="mt-0.5 shrink-0 text-slate-300" />
                  <div className="min-w-0">
                    <p className="truncate text-[13px] font-medium text-slate-800">{c.document.title}</p>
                    <p className="line-clamp-2 text-[11px] leading-4 text-slate-400">“{c.snippet}”</p>
                  </div>
                </Link>
              ))}
            </div>
          </Card>

          <Card className="px-5 py-4">
            <p className="text-xs leading-5 text-slate-500">
              <span className="font-semibold text-slate-700">Trust note:</span> AI-generated pages stay in
              <span className="mx-1 font-medium text-violet-700">AI generated</span>
              status until a knowledge manager reviews and approves them. Approved pages are preferred by the proposal generator.
            </p>
          </Card>
        </div>
      </div>
    </>
  );
}
