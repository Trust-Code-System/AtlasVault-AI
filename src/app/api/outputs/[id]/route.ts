import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireApiRole, requireApiSession } from "@/lib/api-auth";
import { can } from "@/lib/rbac";
import { withApi } from "@/lib/errors";
import { logAudit } from "@/lib/audit";

const schema = z.object({
  content: z.string().max(200_000).optional(),
  status: z.enum(["AI_GENERATED", "EDITED", "APPROVED"]).optional(),
});

export const PATCH = withApi(async (req: Request, { params }: { params: Promise<{ id: string }> }) => {
  const auth = await requireApiSession();
  if (auth.response) return auth.response;
  const { session } = auth;
  const { id } = await params;

  const output = await db.generatedOutput.findFirst({ where: { id, workspaceId: session.workspaceId } });
  if (!output) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = schema.safeParse(await req.json().catch(() => null));
  if (!body.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  if (body.data.status === "APPROVED" && !can(session.role, "approve")) {
    return NextResponse.json({ error: "Only admins can approve outputs" }, { status: 403 });
  }
  if (body.data.content !== undefined && !can(session.role, "edit_content")) {
    return NextResponse.json({ error: "Your role cannot edit outputs" }, { status: 403 });
  }

  await db.generatedOutput.update({
    where: { id },
    data: {
      ...(body.data.content !== undefined ? { content: body.data.content, status: "EDITED" } : {}),
      ...(body.data.status ? { status: body.data.status } : {}),
    },
  });
  await logAudit({ workspaceId: session.workspaceId, userId: session.userId, action: "output.updated", targetType: "OUTPUT", targetId: id, detail: `“${output.title}” ${body.data.status ?? "content edited"}` });
  return NextResponse.json({ ok: true });
}, "OUTPUT_UPDATE");

export const DELETE = withApi(async (_req: Request, { params }: { params: Promise<{ id: string }> }) => {
  const auth = await requireApiRole("delete", "Only admins can delete outputs");
  if (auth.response) return auth.response;
  const { session } = auth;
  const { id } = await params;
  const output = await db.generatedOutput.findFirst({ where: { id, workspaceId: session.workspaceId } });
  if (!output) return NextResponse.json({ error: "Not found" }, { status: 404 });
  await db.generatedOutput.delete({ where: { id } });
  await logAudit({ workspaceId: session.workspaceId, userId: session.userId, action: "output.deleted", targetType: "OUTPUT", targetId: id, detail: output.title });
  return NextResponse.json({ ok: true });
}, "OUTPUT_DELETE");
