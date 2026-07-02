import Link from "next/link";
import { requireSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { PageHeader, Card, StatusBadge, Badge } from "@/components/ui";
import { UploadDropzone } from "@/components/upload-dropzone";
import { formatBytes, formatDate } from "@/lib/utils";
import { FileText, Lock } from "lucide-react";
import { can } from "@/lib/rbac";

const CATEGORY_LABELS: Record<string, string> = {
  COMPANY_PROFILE: "Company profile",
  PROPOSAL: "Proposal",
  PROJECT_REPORT: "Project report",
  STAFF_CV: "Staff CV",
  CERTIFICATE: "Certificate",
  LEGAL: "Legal",
  FINANCIAL: "Financial",
  TECHNICAL: "Technical",
  OPPORTUNITY: "Tender / RFP",
  OTHER: "Other",
};

export default async function DocumentsPage({ searchParams }: { searchParams: Promise<{ category?: string }> }) {
  const session = await requireSession();
  const { category } = await searchParams;

  const documents = await db.document.findMany({
    where: {
      workspaceId: session.workspaceId,
      status: { not: "ARCHIVED" },
      ...(category ? { category } : {}),
    },
    orderBy: { createdAt: "desc" },
    include: { uploader: { select: { name: true } } },
  });

  const counts = await db.document.groupBy({
    by: ["category"],
    where: { workspaceId: session.workspaceId, status: { not: "ARCHIVED" } },
    _count: true,
  });

  return (
    <>
      <PageHeader
        title="Document Library"
        subtitle="Every file is preserved as-is, then extracted, summarized and classified by the AI so it can be reused as evidence."
      />

      {can(session.role, "upload") && (
        <div className="mb-6">
          <UploadDropzone />
        </div>
      )}

      <div className="mb-4 flex flex-wrap gap-1.5">
        <Link href="/documents" className={`rounded-full px-3 py-1 text-xs font-medium ring-1 ring-inset ${!category ? "bg-brand-600 text-white ring-brand-600" : "bg-white text-slate-600 ring-slate-200 hover:bg-slate-50"}`}>
          All ({counts.reduce((a, c) => a + c._count, 0)})
        </Link>
        {counts.map((c) => (
          <Link
            key={c.category}
            href={`/documents?category=${c.category}`}
            className={`rounded-full px-3 py-1 text-xs font-medium ring-1 ring-inset ${category === c.category ? "bg-brand-600 text-white ring-brand-600" : "bg-white text-slate-600 ring-slate-200 hover:bg-slate-50"}`}
          >
            {CATEGORY_LABELS[c.category] ?? c.category} ({c._count})
          </Link>
        ))}
      </div>

      <Card>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 text-left text-xs text-slate-400">
              <th className="px-5 py-3 font-medium">Document</th>
              <th className="px-3 py-3 font-medium">Category</th>
              <th className="px-3 py-3 font-medium">Status</th>
              <th className="px-3 py-3 font-medium">Expiry</th>
              <th className="px-3 py-3 font-medium">Size</th>
              <th className="px-5 py-3 font-medium">Uploaded</th>
            </tr>
          </thead>
          <tbody>
            {documents.length === 0 && (
              <tr><td colSpan={6} className="px-5 py-10 text-center text-sm text-slate-400">No documents yet. Upload your company profile, past proposals, project reports, staff CVs and certificates to build your knowledge base.</td></tr>
            )}
            {documents.map((d) => (
              <tr key={d.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/60">
                <td className="px-5 py-3">
                  <Link href={`/documents/${d.id}`} className="flex items-center gap-2.5">
                    <FileText size={15} className="shrink-0 text-slate-300" />
                    <span className="font-medium text-slate-800 hover:text-brand-700">{d.title}</span>
                    {d.confidential && <Lock size={12} className="text-amber-500" />}
                  </Link>
                </td>
                <td className="px-3 py-3"><Badge tone="slate">{CATEGORY_LABELS[d.category] ?? d.category}</Badge></td>
                <td className="px-3 py-3"><StatusBadge status={d.status} /></td>
                <td className="px-3 py-3 text-xs text-slate-500">{d.expiryDate ? formatDate(d.expiryDate) : "—"}</td>
                <td className="px-3 py-3 text-xs text-slate-500">{formatBytes(d.sizeBytes)}</td>
                <td className="px-5 py-3 text-xs text-slate-500">{formatDate(d.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </>
  );
}
