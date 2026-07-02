import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireApiRole } from "@/lib/api-auth";
import { logAudit } from "@/lib/audit";

const patchSchema = z.object({
  status: z.enum(["PROCESSED", "NEEDS_REVIEW", "APPROVED", "EXPIRED", "ARCHIVED"]).optional(),
  category: z.string().max(40).optional(),
  confidential: z.boolean().optional(),
  title: z.string().min(1).max(300).optional(),
});

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireApiRole("edit_content");
  if (auth.response) return auth.response;
  const { session } = auth;
  const { id } = await params;

  const doc = await db.document.findFirst({ where: { id, workspaceId: session.workspaceId } });
  if (!doc) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = patchSchema.safeParse(await req.json().catch(() => null));
  if (!body.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const updated = await db.document.update({ where: { id }, data: body.data });
  await logAudit({ workspaceId: session.workspaceId, userId: session.userId, action: "document.updated", targetType: "DOCUMENT", targetId: id, detail: `Updated “${doc.title}”: ${Object.keys(body.data).join(", ")}` });
  return NextResponse.json({ ok: true, status: updated.status });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireApiRole("delete", "Only admins can delete documents");
  if (auth.response) return auth.response;
  const { session } = auth;
  const { id } = await params;

  const doc = await db.document.findFirst({ where: { id, workspaceId: session.workspaceId } });
  if (!doc) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await db.document.delete({ where: { id } });
  await logAudit({ workspaceId: session.workspaceId, userId: session.userId, action: "document.deleted", targetType: "DOCUMENT", targetId: id, detail: `Deleted “${doc.title}”` });
  return NextResponse.json({ ok: true });
}
