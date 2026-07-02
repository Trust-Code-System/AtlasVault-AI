import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireApiSession } from "@/lib/api-auth";
import { can } from "@/lib/rbac";
import { logAudit } from "@/lib/audit";

const schema = z.object({
  action: z.enum(["request", "approve", "reject"]),
  note: z.string().max(2000).optional(),
});

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireApiSession();
  if (auth.response) return auth.response;
  const { session } = auth;
  const { id } = await params;

  const proposal = await db.proposal.findFirst({ where: { id, workspaceId: session.workspaceId } });
  if (!proposal) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = schema.safeParse(await req.json().catch(() => null));
  if (!body.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  const { action, note } = body.data;

  if (action === "request") {
    await db.approval.create({
      data: {
        workspaceId: session.workspaceId, proposalId: id, targetType: "PROPOSAL", targetId: id,
        status: "PENDING", requestedById: session.userId, note,
      },
    });
    await db.proposal.update({ where: { id }, data: { status: "NEEDS_REVIEW" } });
    await logAudit({ workspaceId: session.workspaceId, userId: session.userId, action: "approval.requested", targetType: "PROPOSAL", targetId: id, detail: `Review requested for “${proposal.title}”` });
    return NextResponse.json({ ok: true });
  }

  if (!can(session.role, "approve")) {
    return NextResponse.json({ error: "Only admins and owners can approve or reject proposals" }, { status: 403 });
  }

  await db.approval.updateMany({
    where: { proposalId: id, status: "PENDING" },
    data: { status: action === "approve" ? "APPROVED" : "REJECTED", reviewerId: session.userId, note, resolvedAt: new Date() },
  });
  await db.proposal.update({ where: { id }, data: { status: action === "approve" ? "APPROVED" : "DRAFT" } });
  await logAudit({
    workspaceId: session.workspaceId, userId: session.userId,
    action: action === "approve" ? "approval.approved" : "approval.rejected",
    targetType: "PROPOSAL", targetId: id,
    detail: `“${proposal.title}” ${action === "approve" ? "approved for export" : "sent back to draft"}${note ? ` — ${note}` : ""}`,
  });
  return NextResponse.json({ ok: true });
}
