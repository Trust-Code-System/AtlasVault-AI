import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireApiRole } from "@/lib/api-auth";
import { searchChunks } from "@/lib/search";
import { PROPOSAL_SECTION_SPECS, generateProposalSection } from "@/lib/ai/tasks";
import { logAudit, logUsage } from "@/lib/audit";
import { aiModelLabel } from "@/lib/ai/client";
import { withApi } from "@/lib/errors";
import { rateLimit, LIMITS } from "@/lib/ratelimit";

export const maxDuration = 300;

const schema = z.object({ opportunityId: z.string().min(1) });

/** Generate a full proposal draft for an opportunity, section by section, with citations. */
export const POST = withApi(async (req: Request) => {
  const auth = await requireApiRole("generate", "Your role cannot generate proposals");
  if (auth.response) return auth.response;
  const { session } = auth;

  const rl = rateLimit(`gen:${session.userId}`, LIMITS.generate.limit, LIMITS.generate.windowMs);
  if (!rl.ok) return NextResponse.json({ error: `Rate limit reached — try again in ${rl.retryAfterSec}s.` }, { status: 429 });

  const body = schema.safeParse(await req.json().catch(() => null));
  if (!body.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const opp = await db.opportunity.findFirst({
    where: { id: body.data.opportunityId, workspaceId: session.workspaceId },
    include: { requirements: true, briefDocument: true },
  });
  if (!opp) return NextResponse.json({ error: "Opportunity not found" }, { status: 404 });

  const workspace = await db.workspace.findUnique({
    where: { id: session.workspaceId },
    include: { organization: { select: { brandVoice: true } } },
  });

  const context = [
    `Opportunity: ${opp.title}`,
    opp.client ? `Client: ${opp.client}` : "",
    opp.deadline ? `Deadline: ${opp.deadline.toISOString().slice(0, 10)}` : "",
    opp.summary ? `Summary: ${opp.summary}` : "",
    opp.requirements.length ? `Key requirements:\n${opp.requirements.map((r) => `- ${r.text}`).join("\n")}` : "",
    workspace?.organization.brandVoice ? `Company brand voice (follow this): ${workspace.organization.brandVoice}` : "",
  ].filter(Boolean).join("\n");

  const proposal = await db.proposal.create({
    data: {
      workspaceId: session.workspaceId,
      opportunityId: opp.id,
      createdById: session.userId,
      title: `Proposal — ${opp.title}`,
      status: "DRAFT",
    },
  });

  const companyCategories = ["COMPANY_PROFILE", "PROPOSAL", "PROJECT_REPORT", "STAFF_CV", "CERTIFICATE", "TECHNICAL", "OTHER"];

  for (let i = 0; i < PROPOSAL_SECTION_SPECS.length; i++) {
    const spec = PROPOSAL_SECTION_SPECS[i];
    // retrieval query blends the section intent with the opportunity subject
    const query = `${spec.query} ${opp.title} ${opp.client ?? ""}`;
    const chunks = await searchChunks(session.workspaceId, query, {
      topK: 6,
      categories: spec.categories ?? companyCategories,
    });
    // Never retrieve from the tender itself for company-evidence sections
    const filtered = chunks.filter((c) => c.documentId !== opp.briefDocumentId || spec.slug === "understanding");

    const result = await generateProposalSection(spec, context, spec.slug === "understanding" && opp.briefDocument?.extractedText
      ? [{
          chunkId: "",
          documentId: opp.briefDocument.id,
          documentTitle: opp.briefDocument.title,
          fileName: opp.briefDocument.fileName,
          category: "OPPORTUNITY",
          confidential: false,
          content: opp.briefDocument.extractedText.slice(0, 4000),
          score: 5,
        }]
      : filtered);

    const section = await db.proposalSection.create({
      data: {
        proposalId: proposal.id,
        index: i,
        title: spec.title,
        content: result.content,
        confidence: result.confidence,
        missing: result.missing,
        status: "AI_GENERATED",
      },
    });
    for (const c of result.citations) {
      if (!c.documentId) continue;
      await db.citation.create({
        data: {
          workspaceId: session.workspaceId,
          documentId: c.documentId,
          chunkId: c.chunkId || null,
          snippet: c.snippet,
          targetType: "PROPOSAL_SECTION",
          targetId: section.id,
        },
      });
    }
  }

  await logAudit({ workspaceId: session.workspaceId, userId: session.userId, action: "proposal.generated", targetType: "PROPOSAL", targetId: proposal.id, detail: `Generated “${proposal.title}” (${PROPOSAL_SECTION_SPECS.length} sections)` });
  await logUsage({ workspaceId: session.workspaceId, userId: session.userId, kind: "AI_CALL", model: aiModelLabel(), detail: "proposal generation" });

  return NextResponse.json({ id: proposal.id });
}, "PROPOSAL_GENERATION");
