import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireApiSession } from "@/lib/api-auth";
import { searchChunks } from "@/lib/search";
import { answerQuestion } from "@/lib/ai/tasks";
import { logAudit, logUsage } from "@/lib/audit";
import { aiModelLabel } from "@/lib/ai/client";
import { withApi } from "@/lib/errors";
import { rateLimit, LIMITS } from "@/lib/ratelimit";

const schema = z.object({ question: z.string().min(3).max(2000) });

export const maxDuration = 60;

export const POST = withApi(async (req: Request) => {
  const auth = await requireApiSession();
  if (auth.response) return auth.response;
  const { session } = auth;

  const rl = rateLimit(`ask:${session.userId}`, LIMITS.ask.limit, LIMITS.ask.windowMs);
  if (!rl.ok) return NextResponse.json({ error: `You're asking very quickly — try again in ${rl.retryAfterSec}s.` }, { status: 429 });

  const body = schema.safeParse(await req.json().catch(() => null));
  if (!body.success) return NextResponse.json({ error: "Please ask a question" }, { status: 400 });
  const question = body.data.question;

  // Viewers may ask, but retrieval excludes confidential documents for them.
  const includeConfidential = session.role !== "VIEWER";
  const chunks = await searchChunks(session.workspaceId, question, { topK: 8, includeConfidential });

  const result = await answerQuestion(question, chunks);

  const saved = await db.answer.create({
    data: {
      workspaceId: session.workspaceId,
      userId: session.userId,
      question,
      answer: result.answer,
      confidence: result.confidence,
      insufficient: result.insufficient,
    },
  });
  for (const c of result.citations) {
    await db.citation.create({
      data: {
        workspaceId: session.workspaceId,
        documentId: c.documentId,
        chunkId: c.chunkId,
        snippet: c.snippet,
        targetType: "ANSWER",
        targetId: saved.id,
      },
    });
  }

  const citedDocs = await db.document.findMany({
    where: { id: { in: result.citations.map((c) => c.documentId) } },
    select: { id: true, title: true, fileName: true },
  });

  await logAudit({ workspaceId: session.workspaceId, userId: session.userId, action: "ai.question_asked", detail: question.slice(0, 140) });
  await logUsage({ workspaceId: session.workspaceId, userId: session.userId, kind: "AI_CALL", model: aiModelLabel(), detail: "ask" });

  return NextResponse.json({
    answerId: saved.id,
    answer: result.answer,
    confidence: result.confidence,
    insufficient: result.insufficient,
    sources: result.citations.map((c) => ({
      documentId: c.documentId,
      snippet: c.snippet,
      title: citedDocs.find((d) => d.id === c.documentId)?.title ?? "Document",
    })),
  });
}, "ASK");
