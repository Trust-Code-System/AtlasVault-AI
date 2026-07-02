import Link from "next/link";
import { requireSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { PageHeader, Card, StatusBadge, ConfidenceBadge, EmptyState } from "@/components/ui";
import { CompileButton } from "./compile-button";
import { timeAgo } from "@/lib/utils";
import { BookOpen, Building2, Wrench, FolderKanban, Users, ShieldCheck } from "lucide-react";
import { can } from "@/lib/rbac";

const TYPE_ICONS: Record<string, React.ReactNode> = {
  COMPANY: <Building2 size={16} />,
  SERVICES: <Wrench size={16} />,
  PROJECTS: <FolderKanban size={16} />,
  PEOPLE: <Users size={16} />,
  CERTIFICATES: <ShieldCheck size={16} />,
};

export default async function WikiPage() {
  const session = await requireSession();
  const pages = await db.wikiPage.findMany({
    where: { workspaceId: session.workspaceId },
    orderBy: { createdAt: "asc" },
  });
  const citationCounts = await db.citation.groupBy({
    by: ["targetId"],
    where: { workspaceId: session.workspaceId, targetType: "WIKI_PAGE" },
    _count: true,
  });
  const countFor = (id: string) => citationCounts.find((c) => c.targetId === id)?._count ?? 0;

  return (
    <>
      <PageHeader
        title="Knowledge Base"
        subtitle="Your company's living wiki — compiled by AI from uploaded documents, with citations back to every source. Review and approve pages before relying on them."
        action={can(session.role, "generate") ? <CompileButton /> : undefined}
      />

      {pages.length === 0 ? (
        <EmptyState
          icon={<BookOpen size={32} />}
          title="No knowledge pages yet"
          body="Upload your company documents in the Document Library, then compile the knowledge base. AtlasVault will build Company Overview, Services, Past Projects, Team and Certificates pages automatically."
          action={can(session.role, "generate") ? <CompileButton /> : undefined}
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {pages.map((p) => (
            <Link key={p.id} href={`/wiki/${p.slug}`}>
              <Card className="h-full px-5 py-4 transition hover:border-brand-200 hover:shadow-md">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                      {TYPE_ICONS[p.type] ?? <BookOpen size={16} />}
                    </span>
                    <div>
                      <h3 className="text-sm font-semibold text-slate-900">{p.title}</h3>
                      <p className="text-[11px] text-slate-400">Updated {timeAgo(p.updatedAt)} · {countFor(p.id)} source citation{countFor(p.id) === 1 ? "" : "s"}</p>
                    </div>
                  </div>
                </div>
                <p className="mt-3 line-clamp-3 text-[13px] leading-6 text-slate-500">
                  {p.content.replace(/[#*>|_`-]/g, "").slice(0, 220)}
                </p>
                <div className="mt-3 flex gap-2">
                  <StatusBadge status={p.status} />
                  <ConfidenceBadge level={p.confidence} />
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
