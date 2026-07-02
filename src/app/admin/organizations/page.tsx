import { db } from "@/lib/db";
import { Card, Badge } from "@/components/ui";
import { formatDate } from "@/lib/utils";

function maskEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (!domain) return "***";
  return `${local.slice(0, 2)}***@${domain}`;
}

export default async function AdminOrganizationsPage() {
  const orgs = await db.organization.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      workspaces: {
        include: {
          memberships: { include: { user: { select: { email: true } } }, orderBy: { createdAt: "asc" }, take: 1 },
          _count: { select: { documents: true, proposals: true, memberships: true } },
        },
      },
    },
    take: 100,
  });

  return (
    <>
      <h1 className="mb-1 text-xl font-semibold tracking-tight text-slate-900">Organizations</h1>
      <p className="mb-5 text-sm text-slate-500">
        Privacy-safe metadata only: counts, plan signals and masked contact. Document titles and content are never shown here.
      </p>

      <Card>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 text-left text-xs text-slate-400">
              <th className="px-5 py-3 font-medium">Organization</th>
              <th className="px-3 py-3 font-medium">Industry / country</th>
              <th className="px-3 py-3 font-medium">Owner (masked)</th>
              <th className="px-3 py-3 font-medium">Members</th>
              <th className="px-3 py-3 font-medium">Documents</th>
              <th className="px-3 py-3 font-medium">Proposals</th>
              <th className="px-5 py-3 font-medium">Created</th>
            </tr>
          </thead>
          <tbody>
            {orgs.map((org) => {
              const ws = org.workspaces[0];
              return (
                <tr key={org.id} className="border-b border-slate-50 last:border-0">
                  <td className="px-5 py-3 font-medium text-slate-800">{org.name}</td>
                  <td className="px-3 py-3 text-xs text-slate-500">{org.industry ?? "—"}{org.country ? ` · ${org.country}` : ""}</td>
                  <td className="px-3 py-3 font-mono text-xs text-slate-500">{ws?.memberships[0] ? maskEmail(ws.memberships[0].user.email) : "—"}</td>
                  <td className="px-3 py-3"><Badge tone="slate">{ws?._count.memberships ?? 0}</Badge></td>
                  <td className="px-3 py-3 text-xs text-slate-600">{ws?._count.documents ?? 0}</td>
                  <td className="px-3 py-3 text-xs text-slate-600">{ws?._count.proposals ?? 0}</td>
                  <td className="whitespace-nowrap px-5 py-3 text-xs text-slate-400">{formatDate(org.createdAt)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>
    </>
  );
}
