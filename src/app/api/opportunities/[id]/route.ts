import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireApiRole } from "@/lib/api-auth";
import { analyzeOpportunity } from "@/lib/opportunity";
import { logAudit } from "@/lib/audit";

export const maxDuration = 120;

const schema = z.object({
  action: z.enum(["reanalyze", "set_status"]),
  status: z.enum(["NEW", "IN_PROGRESS", "READY_FOR_REVIEW", "SUBMITTED", "WON", "LOST", "ARCHIVED"]).optional(),
});

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireApiRole("generate");
  if (auth.response) return auth.response;
  const { session } = auth;
  const { id } = await params;

  const opp = await db.opportunity.findFirst({
    where: { id, workspaceId: session.workspaceId },
    include: { briefDocument: true },
  });
  if (!opp) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = schema.safeParse(await req.json().catch(() => null));
  if (!body.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  if (body.data.action === "reanalyze") {
    if (!opp.briefDocument?.extractedText) return NextResponse.json({ error: "No brief text available to analyze" }, { status: 400 });
    const result = await analyzeOpportunity(opp.id, session.workspaceId, opp.briefDocument.extractedText);
    await logAudit({ workspaceId: session.workspaceId, userId: session.userId, action: "opportunity.reanalyzed", targetType: "OPPORTUNITY", targetId: opp.id, detail: `Re-analyzed — readiness ${result.readinessScore ?? "n/a"}%` });
    return NextResponse.json({ ok: true, ...result });
  }

  if (body.data.action === "set_status" && body.data.status) {
    await db.opportunity.update({ where: { id }, data: { status: body.data.status } });
    await logAudit({ workspaceId: session.workspaceId, userId: session.userId, action: "opportunity.status_changed", targetType: "OPPORTUNITY", targetId: opp.id, detail: `Status → ${body.data.status}` });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
