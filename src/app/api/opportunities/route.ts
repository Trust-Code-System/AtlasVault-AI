import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireApiRole } from "@/lib/api-auth";
import { extractText, isSupported } from "@/lib/extract";
import { chunkText } from "@/lib/chunk";
import { analyzeOpportunity } from "@/lib/opportunity";
import { logAudit, logUsage } from "@/lib/audit";
import { aiModelLabel } from "@/lib/ai/client";
import { withApi } from "@/lib/errors";
import { rateLimit, LIMITS } from "@/lib/ratelimit";
import { saveWorkspaceFile } from "@/lib/storage";

export const maxDuration = 120;

/** Upload a tender/RFP/client brief → create opportunity → analyze requirements. */
export const POST = withApi(async (req: Request) => {
  const auth = await requireApiRole("generate", "Your role cannot create opportunities");
  if (auth.response) return auth.response;
  const { session } = auth;

  const rl = rateLimit(`gen:${session.userId}`, LIMITS.generate.limit, LIMITS.generate.windowMs);
  if (!rl.ok) return NextResponse.json({ error: `Rate limit reached — try again in ${rl.retryAfterSec}s.` }, { status: 429 });

  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "Attach the tender/RFP document" }, { status: 400 });
  if (!isSupported(file.name)) return NextResponse.json({ error: "Unsupported file type" }, { status: 400 });

  const buffer = Buffer.from(await file.arrayBuffer());
  const text = await extractText(buffer, file.name, file.type);
  if (!text.trim()) {
    return NextResponse.json({ error: "Could not read any text from this file. Scanned tenders need OCR (roadmap)." }, { status: 400 });
  }

  const filePath = await saveWorkspaceFile({
    workspaceId: session.workspaceId,
    fileName: file.name,
    mimeType: file.type,
    buffer,
  });

  const briefDoc = await db.document.create({
    data: {
      workspaceId: session.workspaceId,
      uploaderId: session.userId,
      title: file.name.replace(/\.[a-z0-9]+$/i, "").replace(/[_-]+/g, " "),
      fileName: file.name,
      filePath,
      mimeType: file.type || "application/octet-stream",
      sizeBytes: file.size,
      category: "OPPORTUNITY",
      status: "PROCESSED",
      extractedText: text,
    },
  });
  const chunks = chunkText(text);
  for (let i = 0; i < chunks.length; i++) {
    await db.documentChunk.create({ data: { documentId: briefDoc.id, index: i, content: chunks[i] } });
  }

  const opportunity = await db.opportunity.create({
    data: {
      workspaceId: session.workspaceId,
      title: briefDoc.title,
      status: "ANALYZING",
      briefDocumentId: briefDoc.id,
    },
  });

  const result = await analyzeOpportunity(opportunity.id, session.workspaceId, text);

  await logAudit({
    workspaceId: session.workspaceId, userId: session.userId,
    action: "opportunity.analyzed", targetType: "OPPORTUNITY", targetId: opportunity.id,
    detail: `Analyzed “${briefDoc.title}” — ${result.requirementCount} requirements, readiness ${result.readinessScore ?? "n/a"}%`,
  });
  await logUsage({ workspaceId: session.workspaceId, userId: session.userId, kind: "AI_CALL", model: aiModelLabel(), detail: "opportunity analysis" });

  return NextResponse.json({ id: opportunity.id, ...result });
}, "OPPORTUNITY_ANALYSIS");
