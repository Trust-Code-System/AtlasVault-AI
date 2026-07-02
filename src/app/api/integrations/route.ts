import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireApiRole } from "@/lib/api-auth";
import { withApi } from "@/lib/errors";
import { logAudit } from "@/lib/audit";

const VALID_KEYS = [
  "google-drive", "dropbox", "onedrive", "gmail", "outlook", "slack", "teams",
  "notion", "hubspot", "quickbooks", "docusign", "github", "web-research",
];

const schema = z.object({
  key: z.string().refine((k) => VALID_KEYS.includes(k), "Unknown integration"),
  action: z.enum(["enable", "disable"]),
});

/**
 * Integration enable/disable. OAuth-backed sync is Phase 2 — the UI is honest
 * about that — but the permission model (admin-gated, workspace-scoped,
 * audit-logged, revocable) is live now.
 */
export const POST = withApi(async (req: Request) => {
  const auth = await requireApiRole("manage_team", "Only workspace admins can manage integrations");
  if (auth.response) return auth.response;
  const { session } = auth;

  const body = schema.safeParse(await req.json().catch(() => null));
  if (!body.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  const { key, action } = body.data;

  await db.integration.upsert({
    where: { workspaceId_key: { workspaceId: session.workspaceId, key } },
    create: { workspaceId: session.workspaceId, key, status: action === "enable" ? "CONNECTED" : "DISABLED" },
    update: { status: action === "enable" ? "CONNECTED" : "DISABLED" },
  });

  await logAudit({ workspaceId: session.workspaceId, userId: session.userId, action: `integration.${action}d`, detail: key });
  return NextResponse.json({ ok: true });
}, "INTEGRATIONS");
