import { requireSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { PageHeader, Card, CardHeader, Badge } from "@/components/ui";
import { TeamManager } from "./team-manager";
import { BrandKit, AiSettings } from "./workspace-controls";
import { IntegrationsPanel } from "./integrations-panel";
import { aiEnabled, aiModelLabel } from "@/lib/ai/client";
import { getWorkspaceSettings } from "@/lib/settings";
import { formatDate } from "@/lib/utils";
import { can } from "@/lib/rbac";

export default async function SettingsPage() {
  const session = await requireSession();

  const [workspace, members, auditLogs, usage, settings, integrations] = await Promise.all([
    db.workspace.findUnique({ where: { id: session.workspaceId }, include: { organization: true } }),
    db.membership.findMany({
      where: { workspaceId: session.workspaceId },
      include: { user: { select: { name: true, email: true } } },
      orderBy: { createdAt: "asc" },
    }),
    db.auditLog.findMany({
      where: { workspaceId: session.workspaceId },
      orderBy: { createdAt: "desc" },
      take: 40,
      include: { user: { select: { name: true } } },
    }),
    db.usageLog.groupBy({ by: ["kind"], where: { workspaceId: session.workspaceId }, _count: true }),
    getWorkspaceSettings(session.workspaceId),
    db.integration.findMany({ where: { workspaceId: session.workspaceId } }),
  ]);

  const canManage = can(session.role, "manage_team");
  const connectedMap = Object.fromEntries(integrations.map((i) => [i.key, i.status]));

  return (
    <>
      <PageHeader title="Settings" subtitle="Workspace, team roles, AI configuration and the audit trail." />

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader title="Workspace" />
          <dl className="space-y-2.5 px-5 py-4 text-sm">
            <Row label="Company">{workspace?.organization.name}</Row>
            <Row label="Workspace">{workspace?.name}</Row>
            <Row label="Industry">{workspace?.organization.industry ?? "—"}</Row>
            <Row label="Country">{workspace?.organization.country ?? "—"}</Row>
            <Row label="Created">{workspace ? formatDate(workspace.createdAt) : "—"}</Row>
          </dl>
        </Card>

        <Card>
          <CardHeader title="AI engine" subtitle="Model routing for generation, classification and Q&A" />
          <div className="px-5 py-4 text-sm">
            <div className="flex items-center gap-2">
              <Badge tone={aiEnabled() ? "green" : "amber"}>{aiEnabled() ? "Claude connected" : "Local Knowledge Mode"}</Badge>
              <span className="text-xs text-slate-500">{aiModelLabel()}</span>
            </div>
            <p className="mt-3 text-xs leading-5 text-slate-500">
              {aiEnabled()
                ? "Generation, classification and Q&A run on Claude. Retrieval stays local; only relevant excerpts are sent to the model, and answers must cite them."
                : "No ANTHROPIC_API_KEY configured. AtlasVault is running in deterministic Local Knowledge Mode: summaries, classification and answers are extracted verbatim from your documents (never invented). Add a key to .env and restart to enable full generative drafting."}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {usage.map((u) => (
                <Badge key={u.kind} tone="slate">{u.kind.replace("_", " ")}: {u._count}</Badge>
              ))}
            </div>
          </div>
        </Card>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader title="Brand kit" subtitle="Your exports carry your identity — color on covers, headings and tables" />
          <BrandKit
            brandColor={workspace?.organization.brandColor ?? null}
            brandVoice={workspace?.organization.brandVoice ?? null}
            canManage={canManage}
          />
        </Card>

        <Card>
          <CardHeader title="AI, learning & privacy" subtitle="Workspace-scoped controls — your data never trains other companies' results" />
          <AiSettings settings={settings} canManage={canManage} />
        </Card>
      </div>

      <div className="mt-4">
        <Card>
          <CardHeader title="Integrations" subtitle="Permission-based connectors — declared scopes, admin approval, full audit" />
          <IntegrationsPanel connected={connectedMap} canManage={canManage} />
        </Card>
      </div>

      <div className="mt-4">
        <Card>
          <CardHeader title="Team & roles" subtitle="Owner > Admin (approve/export/manage) > Member (upload/generate) > Viewer (read + ask, no confidential retrieval)" />
          <TeamManager
            members={members.map((m) => ({ id: m.id, name: m.user.name, email: m.user.email, role: m.role }))}
            canManage={canManage}
          />
        </Card>
      </div>

      <div className="mt-4">
        <Card>
          <CardHeader title="Audit log" subtitle="Every upload, generation, approval, export and permission change is recorded" />
          <div className="max-h-[420px] overflow-y-auto">
            <table className="w-full text-sm">
              <tbody>
                {auditLogs.map((log) => (
                  <tr key={log.id} className="border-b border-slate-50 last:border-0">
                    <td className="px-5 py-2.5">
                      <Badge tone="slate">{log.action}</Badge>
                    </td>
                    <td className="px-3 py-2.5 text-[13px] text-slate-600">{log.detail ?? "—"}</td>
                    <td className="px-3 py-2.5 text-xs text-slate-400">{log.user?.name ?? "System"}</td>
                    <td className="whitespace-nowrap px-5 py-2.5 text-right text-xs text-slate-400">{formatDate(log.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-xs text-slate-400">{label}</dt>
      <dd className="text-slate-700">{children}</dd>
    </div>
  );
}
