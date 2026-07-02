import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireApiRole } from "@/lib/api-auth";
import { withApi } from "@/lib/errors";
import { updateWorkspaceSettings } from "@/lib/settings";
import { logAudit } from "@/lib/audit";

const schema = z.object({
  brandColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).nullable().optional(),
  brandVoice: z.string().max(2000).nullable().optional(),
  settings: z
    .object({
      learningEnabled: z.boolean().optional(),
      exportApprovalRequired: z.boolean().optional(),
      sensitiveWarnings: z.boolean().optional(),
      webResearchEnabled: z.boolean().optional(),
    })
    .optional(),
});

export const PATCH = withApi(async (req: Request) => {
  const auth = await requireApiRole("manage_team", "Only admins can change workspace settings");
  if (auth.response) return auth.response;
  const { session } = auth;

  const body = schema.safeParse(await req.json().catch(() => null));
  if (!body.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const changed: string[] = [];

  if (body.data.brandColor !== undefined || body.data.brandVoice !== undefined) {
    const ws = await db.workspace.findUnique({ where: { id: session.workspaceId } });
    if (!ws) return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
    await db.organization.update({
      where: { id: ws.orgId },
      data: {
        ...(body.data.brandColor !== undefined ? { brandColor: body.data.brandColor } : {}),
        ...(body.data.brandVoice !== undefined ? { brandVoice: body.data.brandVoice } : {}),
      },
    });
    if (body.data.brandColor !== undefined) changed.push("brand color");
    if (body.data.brandVoice !== undefined) changed.push("brand voice");
  }

  if (body.data.settings) {
    await updateWorkspaceSettings(session.workspaceId, body.data.settings);
    changed.push(...Object.keys(body.data.settings));
  }

  await logAudit({ workspaceId: session.workspaceId, userId: session.userId, action: "workspace.settings_changed", detail: changed.join(", ") || "no-op" });
  return NextResponse.json({ ok: true });
}, "WORKSPACE_SETTINGS");
