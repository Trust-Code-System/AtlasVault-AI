import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireApiRole } from "@/lib/api-auth";
import { searchChunks } from "@/lib/search";
import { WIKI_PAGE_SPECS, generateWikiPage } from "@/lib/ai/tasks";
import { logAudit, logUsage } from "@/lib/audit";
import { aiModelLabel } from "@/lib/ai/client";

export const maxDuration = 120;

/**
 * Knowledge Compiler: builds/refreshes the canonical wiki pages (company
 * overview, services, past projects, team, certificates) from the document
 * library, storing citations back to source chunks for every page.
 */
export async function POST() {
  const auth = await requireApiRole("generate", "Your role cannot compile the knowledge base");
  if (auth.response) return auth.response;
  const { session } = auth;

  const docCount = await db.document.count({
    where: { workspaceId: session.workspaceId, status: { notIn: ["ARCHIVED"] }, category: { not: "OPPORTUNITY" } },
  });
  if (docCount === 0) {
    return NextResponse.json({ error: "Upload company documents first — there is nothing to compile yet." }, { status: 400 });
  }

  const results: { slug: string; confidence: string }[] = [];

  for (const spec of WIKI_PAGE_SPECS) {
    const chunks = await searchChunks(session.workspaceId, spec.query, {
      topK: 10,
      categories: spec.categories,
    });
    const page = await generateWikiPage(spec, chunks);

    const saved = await db.wikiPage.upsert({
      where: { workspaceId_slug: { workspaceId: session.workspaceId, slug: spec.slug } },
      create: {
        workspaceId: session.workspaceId,
        slug: spec.slug,
        title: spec.title,
        type: spec.type,
        content: page.content,
        confidence: page.confidence,
        status: "AI_GENERATED",
      },
      update: { content: page.content, confidence: page.confidence, status: "AI_GENERATED" },
    });

    await db.citation.deleteMany({ where: { targetType: "WIKI_PAGE", targetId: saved.id } });
    for (const c of page.citations) {
      await db.citation.create({
        data: {
          workspaceId: session.workspaceId,
          documentId: c.documentId,
          chunkId: c.chunkId,
          snippet: c.snippet,
          targetType: "WIKI_PAGE",
          targetId: saved.id,
        },
      });
    }
    results.push({ slug: spec.slug, confidence: page.confidence });
  }

  await logAudit({ workspaceId: session.workspaceId, userId: session.userId, action: "wiki.compiled", detail: `Compiled ${results.length} knowledge pages from ${docCount} documents` });
  await logUsage({ workspaceId: session.workspaceId, userId: session.userId, kind: "AI_CALL", model: aiModelLabel(), detail: "knowledge base compile" });

  return NextResponse.json({ ok: true, pages: results });
}
