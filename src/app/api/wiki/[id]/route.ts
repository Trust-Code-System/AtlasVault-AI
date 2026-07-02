import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireApiSession } from "@/lib/api-auth";
import { can } from "@/lib/rbac";
import { logAudit } from "@/lib/audit";

const schema = z.object({
  content: z.string().max(100_000).optional(),
  status: z.enum(["AI_GENERATED", "NEEDS_REVIEW", "APPROVED"]).optional(),
});

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireApiSession();
  if (auth.response) return auth.response;
  const { session } = auth;
  const { id } = await params;

  const page = await db.wikiPage.findFirst({ where: { id, workspaceId: session.workspaceId } });
  if (!page) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = schema.safeParse(await req.json().catch(() => null));
  if (!body.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  if (body.data.status === "APPROVED" && !can(session.role, "approve")) {
    return NextResponse.json({ error: "Only admins can approve pages" }, { status: 403 });
  }
  if (body.data.content !== undefined && !can(session.role, "edit_content")) {
    return NextResponse.json({ error: "Your role cannot edit pages" }, { status: 403 });
  }

  await db.wikiPage.update({ where: { id }, data: body.data });
  await logAudit({ workspaceId: session.workspaceId, userId: session.userId, action: "wiki.updated", targetType: "WIKI_PAGE", targetId: id, detail: `“${page.title}” ${body.data.status ? `status → ${body.data.status}` : "content edited"}` });
  return NextResponse.json({ ok: true });
}
