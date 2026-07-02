import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireApiRole } from "@/lib/api-auth";
import { extractText, isSupported } from "@/lib/extract";
import { chunkText } from "@/lib/chunk";
import { classifyDocument } from "@/lib/ai/tasks";
import { logAudit, logUsage } from "@/lib/audit";
import { aiModelLabel } from "@/lib/ai/client";
import { withApi } from "@/lib/errors";
import { rateLimit, LIMITS } from "@/lib/ratelimit";
import { saveWorkspaceFile } from "@/lib/storage";

const MAX_SIZE = 20 * 1024 * 1024; // 20 MB

export const POST = withApi(async (req: Request) => {
  const auth = await requireApiRole("upload", "Your role cannot upload documents");
  if (auth.response) return auth.response;
  const { session } = auth;

  const rl = rateLimit(`upload:${session.userId}`, LIMITS.upload.limit, LIMITS.upload.windowMs);
  if (!rl.ok) return NextResponse.json({ error: `Upload rate limit reached — try again in ${rl.retryAfterSec}s.` }, { status: 429 });

  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "No file provided" }, { status: 400 });
  if (!isSupported(file.name)) return NextResponse.json({ error: "Unsupported file type. Use PDF, DOCX, TXT, MD, CSV or HTML." }, { status: 400 });
  if (file.size > MAX_SIZE) return NextResponse.json({ error: "File exceeds the 20 MB limit" }, { status: 400 });

  const buffer = Buffer.from(await file.arrayBuffer());

  const filePath = await saveWorkspaceFile({
    workspaceId: session.workspaceId,
    fileName: file.name,
    mimeType: file.type,
    buffer,
  });

  const doc = await db.document.create({
    data: {
      workspaceId: session.workspaceId,
      uploaderId: session.userId,
      title: file.name.replace(/\.[a-z0-9]+$/i, "").replace(/[_-]+/g, " "),
      fileName: file.name,
      filePath,
      mimeType: file.type || "application/octet-stream",
      sizeBytes: file.size,
      status: "PROCESSING",
    },
  });

  // Process inline for the MVP (queue worker in production)
  try {
    const text = await extractText(buffer, file.name, file.type);
    const analysis = await classifyDocument(text, file.name);
    const chunks = chunkText(text);

    await db.$transaction([
      db.document.update({
        where: { id: doc.id },
        data: {
          title: analysis.title || doc.title,
          summary: analysis.summary,
          category: analysis.category,
          language: analysis.language,
          docDate: analysis.docDate ? new Date(analysis.docDate) : undefined,
          expiryDate: analysis.expiryDate ? new Date(analysis.expiryDate) : undefined,
          extractedText: text || null,
          status: text.trim() ? "PROCESSED" : "NEEDS_REVIEW",
        },
      }),
      ...chunks.map((content, index) =>
        db.documentChunk.create({ data: { documentId: doc.id, index, content } })
      ),
    ]);

    await logAudit({ workspaceId: session.workspaceId, userId: session.userId, action: "document.uploaded", targetType: "DOCUMENT", targetId: doc.id, detail: `Uploaded and processed “${file.name}” (${analysis.category})` });
    await logUsage({ workspaceId: session.workspaceId, userId: session.userId, kind: "AI_CALL", model: aiModelLabel(), detail: "document classification + summary" });

    return NextResponse.json({ id: doc.id, status: text.trim() ? "PROCESSED" : "NEEDS_REVIEW", category: analysis.category });
  } catch (e) {
    console.error("processing failed", e);
    await db.document.update({ where: { id: doc.id }, data: { status: "NEEDS_REVIEW" } });
    return NextResponse.json({ id: doc.id, status: "NEEDS_REVIEW", warning: "Uploaded, but automatic processing failed. The document needs manual review." });
  }
}, "DOCUMENT_UPLOAD");
