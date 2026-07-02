import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireApiSession } from "@/lib/api-auth";
import { withApi } from "@/lib/errors";
import { getWorkspaceSettings } from "@/lib/settings";
import { chunkText } from "@/lib/chunk";
import { logAudit } from "@/lib/audit";

const schema = z.object({
  targetType: z.enum(["ANSWER", "PROPOSAL_SECTION", "OUTPUT"]),
  targetId: z.string().min(1),
  rating: z.enum(["UP", "DOWN"]),
  note: z.string().max(1000).optional(),
});

const MEMORY_TITLE = "Workspace Memory — Approved Answers";

/**
 * Feedback + workspace-scoped learning. A thumbs-up on an answer stores the
 * Q&A into a "Workspace Memory" document whose chunks join retrieval — so
 * approved knowledge genuinely improves future answers, without any
 * cross-workspace training. Disabled via the workspace learning setting.
 */
export const POST = withApi(async (req: Request) => {
  const auth = await requireApiSession();
  if (auth.response) return auth.response;
  const { session } = auth;

  const body = schema.safeParse(await req.json().catch(() => null));
  if (!body.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  const { targetType, targetId, rating, note } = body.data;

  // verify target belongs to this workspace
  const exists =
    targetType === "ANSWER"
      ? await db.answer.findFirst({ where: { id: targetId, workspaceId: session.workspaceId } })
      : targetType === "OUTPUT"
        ? await db.generatedOutput.findFirst({ where: { id: targetId, workspaceId: session.workspaceId } })
        : await db.proposalSection.findFirst({ where: { id: targetId, proposal: { workspaceId: session.workspaceId } } });
  if (!exists) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await db.feedback.create({
    data: { workspaceId: session.workspaceId, userId: session.userId, targetType, targetId, rating, note },
  });

  // learning loop: approved answers become searchable workspace memory
  let learned = false;
  if (rating === "UP" && targetType === "ANSWER") {
    const settings = await getWorkspaceSettings(session.workspaceId);
    if (settings.learningEnabled) {
      const answer = exists as { question: string; answer: string };
      let memoryDoc = await db.document.findFirst({
        where: { workspaceId: session.workspaceId, title: MEMORY_TITLE },
      });
      if (!memoryDoc) {
        memoryDoc = await db.document.create({
          data: {
            workspaceId: session.workspaceId,
            uploaderId: session.userId,
            title: MEMORY_TITLE,
            fileName: "workspace-memory.md",
            mimeType: "text/markdown",
            category: "OTHER",
            status: "APPROVED",
            summary: "Answers your team approved. These join retrieval so the AI reuses verified knowledge. Managed automatically by the learning system.",
            extractedText: "",
          },
        });
      }
      const entry = `Q: ${answer.question}\nApproved answer: ${answer.answer.replace(/\[C\d+\]/g, "").slice(0, 1200)}`;
      const newText = `${memoryDoc.extractedText ?? ""}\n\n${entry}`.trim();
      const chunkCount = await db.documentChunk.count({ where: { documentId: memoryDoc.id } });
      const newChunks = chunkText(entry);
      await db.$transaction([
        db.document.update({ where: { id: memoryDoc.id }, data: { extractedText: newText } }),
        ...newChunks.map((content, i) =>
          db.documentChunk.create({ data: { documentId: memoryDoc!.id, index: chunkCount + i, content } })
        ),
      ]);
      learned = true;
      await logAudit({ workspaceId: session.workspaceId, userId: session.userId, action: "learning.answer_approved", detail: `Approved answer added to workspace memory: “${answer.question.slice(0, 80)}”` });
    }
  }

  return NextResponse.json({ ok: true, learned });
}, "FEEDBACK");
