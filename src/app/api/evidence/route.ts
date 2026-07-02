import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireApiRole } from "@/lib/api-auth";
import { can } from "@/lib/rbac";
import { logAudit } from "@/lib/audit";

const createSchema = z.object({
  documentId: z.string().optional(),
  title: z.string().min(1).max(300),
  type: z.enum(["PROJECT_PROOF", "TESTIMONIAL", "CERTIFICATE", "CASE_STUDY", "CV", "FINANCIAL", "OTHER"]),
  notes: z.string().max(2000).optional(),
});

export async function POST(req: Request) {
  const auth = await requireApiRole("edit_content");
  if (auth.response) return auth.response;
  const { session } = auth;

  const body = createSchema.safeParse(await req.json().catch(() => null));
  if (!body.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  if (body.data.documentId) {
    const doc = await db.document.findFirst({ where: { id: body.data.documentId, workspaceId: session.workspaceId } });
    if (!doc) return NextResponse.json({ error: "Document not found" }, { status: 404 });
  }

  const item = await db.evidenceItem.create({
    data: { workspaceId: session.workspaceId, ...body.data },
  });
  await logAudit({ workspaceId: session.workspaceId, userId: session.userId, action: "evidence.created", targetType: "EVIDENCE", targetId: item.id, detail: item.title });
  return NextResponse.json({ id: item.id });
}

const patchSchema = z.object({
  id: z.string(),
  strength: z.enum(["STRONG", "WEAK", "EXPIRED", "NEEDS_REVIEW"]).optional(),
  approvedForExternal: z.boolean().optional(),
  confidential: z.boolean().optional(),
});

export async function PATCH(req: Request) {
  const auth = await requireApiRole("edit_content");
  if (auth.response) return auth.response;
  const { session } = auth;

  const body = patchSchema.safeParse(await req.json().catch(() => null));
  if (!body.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  const { id, ...data } = body.data;

  // approving for external use is an admin action
  if (data.approvedForExternal === true && !can(session.role, "approve")) {
    return NextResponse.json({ error: "Only admins can approve evidence for external use" }, { status: 403 });
  }

  const item = await db.evidenceItem.findFirst({ where: { id, workspaceId: session.workspaceId } });
  if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await db.evidenceItem.update({ where: { id }, data });
  await logAudit({ workspaceId: session.workspaceId, userId: session.userId, action: "evidence.updated", targetType: "EVIDENCE", targetId: id, detail: `${item.title}: ${Object.keys(data).join(", ")}` });
  return NextResponse.json({ ok: true });
}
