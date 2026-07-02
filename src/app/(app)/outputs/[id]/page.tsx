import Link from "next/link";
import { notFound } from "next/navigation";
import { requireSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { PageHeader, Card, CardHeader, StatusBadge, ConfidenceBadge } from "@/components/ui";
import { Markdown } from "@/components/markdown";
import { OutputActions } from "./actions";
import { can } from "@/lib/rbac";
import { formatDate } from "@/lib/utils";
import { FileText } from "lucide-react";

export default async function OutputDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireSession();
  const { id } = await params;

  const output = await db.generatedOutput.findFirst({
    where: { id, workspaceId: session.workspaceId },
  });
  if (!output) notFound();

  const citations = await db.citation.findMany({
    where: { targetType: "OUTPUT", targetId: output.id },
    include: { document: { select: { id: true, title: true } } },
  });
  const uniqueDocs = Array.from(new Map(citations.map((c) => [c.document.id, c])).values());

  return (
    <>
      <PageHeader
        title={output.title}
        subtitle={`Generated ${formatDate(output.createdAt)} · compiled from ${uniqueDocs.length} source document${uniqueDocs.length === 1 ? "" : "s"}`}
        action={
          <OutputActions
            id={output.id}
            status={output.status}
            canApprove={can(session.role, "approve")}
            canEdit={can(session.role, "edit_content")}
            content={output.content}
          />
        }
      />

      <div className="mb-4 flex gap-2">
        <StatusBadge status={output.status} />
        <ConfidenceBadge level={output.confidence} />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="px-6 py-5 lg:col-span-2">
          <Markdown>{output.content}</Markdown>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader title="Sources used" subtitle="Every section cites the documents it came from" />
            <div className="divide-y divide-slate-50 px-5 pb-2">
              {uniqueDocs.length === 0 && <p className="py-3 text-xs text-slate-400">No citations recorded — treat this output as unverified.</p>}
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
              <span className="font-semibold text-slate-700">Review before use:</span> this document was generated
              from your company files. Approve it to unlock export, then download it as a branded PDF or DOCX.
            </p>
          </Card>
        </div>
      </div>
    </>
  );
}
