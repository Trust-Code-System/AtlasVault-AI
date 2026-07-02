import Link from "next/link";
import { notFound } from "next/navigation";
import { requireSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { PageHeader, Card, CardHeader, StatusBadge, Badge } from "@/components/ui";
import { formatBytes, formatDate } from "@/lib/utils";
import { DocumentActions } from "./actions";
import { can } from "@/lib/rbac";

export default async function DocumentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireSession();
  const { id } = await params;

  const doc = await db.document.findFirst({
    where: { id, workspaceId: session.workspaceId },
    include: {
      uploader: { select: { name: true } },
      chunks: { orderBy: { index: "asc" } },
      citations: { where: {}, take: 20 },
      evidenceItems: true,
    },
  });
  if (!doc) notFound();

  const usedIn = await db.citation.findMany({
    where: { documentId: doc.id },
    take: 30,
  });
  const wikiTargets = usedIn.filter((c) => c.targetType === "WIKI_PAGE");
  const proposalTargets = usedIn.filter((c) => c.targetType === "PROPOSAL_SECTION");
  const reqTargets = usedIn.filter((c) => c.targetType === "REQUIREMENT");

  return (
    <>
      <PageHeader
        title={doc.title}
        subtitle={doc.fileName}
        action={can(session.role, "edit_content") ? <DocumentActions id={doc.id} status={doc.status} confidential={doc.confidential} /> : undefined}
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Card>
            <CardHeader title="AI summary" subtitle="Generated during processing — verify before external use" />
            <div className="px-5 py-4 text-sm leading-6 text-slate-700">
              {doc.summary ?? <span className="text-slate-400">No summary — reprocessing may be required.</span>}
            </div>
          </Card>

          <Card>
            <CardHeader title="Extracted content" subtitle={`${doc.chunks.length} searchable chunks — this is what retrieval and citations use`} />
            <div className="max-h-[480px] space-y-3 overflow-y-auto px-5 py-4">
              {doc.chunks.length === 0 && <p className="text-sm text-slate-400">No text could be extracted. Scanned documents need OCR (roadmap: Phase 2).</p>}
              {doc.chunks.map((c) => (
                <div key={c.id} className="rounded-lg border border-slate-100 bg-slate-50/60 px-3.5 py-2.5">
                  <p className="mb-1 text-[10px] font-medium uppercase tracking-wide text-slate-400">Chunk {c.index + 1}</p>
                  <p className="whitespace-pre-wrap text-[13px] leading-6 text-slate-600">{c.content}</p>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader title="Metadata" />
            <dl className="space-y-2.5 px-5 py-4 text-sm">
              <Row label="Status"><StatusBadge status={doc.status} /></Row>
              <Row label="Category"><Badge tone="slate">{doc.category.replace(/_/g, " ")}</Badge></Row>
              <Row label="Confidential">{doc.confidential ? <Badge tone="amber">Yes — restricted</Badge> : <span className="text-slate-500">No</span>}</Row>
              <Row label="Document date"><span className="text-slate-600">{formatDate(doc.docDate)}</span></Row>
              <Row label="Expiry date"><span className={doc.expiryDate && new Date(doc.expiryDate) < new Date() ? "font-medium text-red-600" : "text-slate-600"}>{formatDate(doc.expiryDate)}</span></Row>
              <Row label="Size"><span className="text-slate-600">{formatBytes(doc.sizeBytes)}</span></Row>
              <Row label="Uploaded by"><span className="text-slate-600">{doc.uploader?.name ?? "—"}</span></Row>
              <Row label="Uploaded"><span className="text-slate-600">{formatDate(doc.createdAt)}</span></Row>
              <Row label="Language"><span className="text-slate-600">{doc.language?.toUpperCase() ?? "—"}</span></Row>
            </dl>
          </Card>

          <Card>
            <CardHeader title="Used as evidence in" subtitle="Traceability: everywhere this document is cited" />
            <div className="px-5 py-4 text-sm">
              {usedIn.length === 0 && <p className="text-xs text-slate-400">Not cited anywhere yet.</p>}
              <ul className="space-y-1.5 text-[13px]">
                {wikiTargets.length > 0 && <li><Badge tone="violet">{wikiTargets.length}</Badge> <Link className="text-brand-600 hover:underline" href="/wiki">wiki page citation{wikiTargets.length > 1 ? "s" : ""}</Link></li>}
                {proposalTargets.length > 0 && <li><Badge tone="blue">{proposalTargets.length}</Badge> <Link className="text-brand-600 hover:underline" href="/proposals">proposal section citation{proposalTargets.length > 1 ? "s" : ""}</Link></li>}
                {reqTargets.length > 0 && <li><Badge tone="green">{reqTargets.length}</Badge> <Link className="text-brand-600 hover:underline" href="/opportunities">compliance requirement match{reqTargets.length > 1 ? "es" : ""}</Link></li>}
              </ul>
            </div>
          </Card>

          {doc.evidenceItems.length > 0 && (
            <Card>
              <CardHeader title="Evidence library entries" />
              <div className="space-y-2 px-5 py-4">
                {doc.evidenceItems.map((e) => (
                  <div key={e.id} className="flex items-center justify-between gap-2">
                    <p className="text-[13px] text-slate-700">{e.title}</p>
                    <StatusBadge status={e.strength} />
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      </div>
    </>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-xs text-slate-400">{label}</dt>
      <dd className="text-right">{children}</dd>
    </div>
  );
}
