import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireApiSession } from "@/lib/api-auth";
import { can } from "@/lib/rbac";
import { searchChunks } from "@/lib/search";
import { PROPOSAL_SECTION_SPECS, generateProposalSection } from "@/lib/ai/tasks";
import { logAudit } from "@/lib/audit";

export const maxDuration = 120;

const schema = z.object({
  action: z.enum(["edit", "regenerate", "approve"]),
  content: z.string().max(100_000).optional(),
});

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string; sectionId: string }> }) {
  const auth = await requireApiSession();
  if (auth.response) return auth.response;
  const { session } = auth;
  const { id, sectionId } = await params;

  const section = await db.proposalSection.findFirst({
    where: { id: sectionId, proposalId: id, proposal: { workspaceId: session.workspaceId } },
    include: { proposal: { include: { opportunity: true } } },
  });
  if (!section) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = schema.safeParse(await req.json().catch(() => null));
  if (!body.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  if (body.data.action === "edit") {
    if (!can(session.role, "edit_content")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    await db.proposalSection.update({
      where: { id: sectionId },
      data: { content: body.data.content ?? section.content, status: "EDITED" },
    });
    await logAudit({ workspaceId: session.workspaceId, userId: session.userId, action: "proposal.section_edited", targetType: "PROPOSAL_SECTION", targetId: sectionId, detail: `Edited “${section.title}”` });
    return NextResponse.json({ ok: true });
  }

  if (body.data.action === "approve") {
    if (!can(session.role, "approve")) return NextResponse.json({ error: "Only admins can approve sections" }, { status: 403 });
    await db.proposalSection.update({ where: { id: sectionId }, data: { status: "APPROVED" } });
    return NextResponse.json({ ok: true });
  }

  // regenerate
  if (!can(session.role, "generate")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const spec = PROPOSAL_SECTION_SPECS.find((s) => s.title === section.title) ?? {
    slug: "custom", title: section.title, query: section.title, instruction: `Draft the section "${section.title}".`,
  };
  const opp = section.proposal.opportunity;
  const context = opp ? `Opportunity: ${opp.title}\nClient: ${opp.client ?? "n/a"}\nSummary: ${opp.summary ?? ""}` : "";
  const chunks = await searchChunks(session.workspaceId, `${spec.query} ${opp?.title ?? ""}`, { topK: 6, categories: spec.categories });
  const result = await generateProposalSection(spec, context, chunks);

  await db.proposalSection.update({
    where: { id: sectionId },
    data: { content: result.content, confidence: result.confidence, missing: result.missing, status: "AI_GENERATED" },
  });
  await db.citation.deleteMany({ where: { targetType: "PROPOSAL_SECTION", targetId: sectionId } });
  for (const c of result.citations) {
    await db.citation.create({
      data: {
        workspaceId: session.workspaceId, documentId: c.documentId, chunkId: c.chunkId,
        snippet: c.snippet, targetType: "PROPOSAL_SECTION", targetId: sectionId,
      },
    });
  }
  await logAudit({ workspaceId: session.workspaceId, userId: session.userId, action: "proposal.section_regenerated", targetType: "PROPOSAL_SECTION", targetId: sectionId, detail: `Regenerated “${section.title}”` });
  return NextResponse.json({ ok: true });
}
