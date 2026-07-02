import { db } from "./db";

/**
 * Hybrid-lite retrieval for the MVP: lexical scoring (term frequency with
 * IDF-style dampening + title boost) over document chunks, scoped to a
 * workspace and to documents the caller may access.
 *
 * In production this is replaced by pgvector semantic search + keyword
 * search + reranking; the call-site contract (scored chunks with document
 * metadata) stays the same, which is why it lives behind this interface.
 */

export type ScoredChunk = {
  chunkId: string;
  documentId: string;
  documentTitle: string;
  fileName: string;
  category: string;
  confidential: boolean;
  content: string;
  score: number;
};

const STOP = new Set(
  "the a an and or of to in for on with by is are was were be been at as that this these those from it its we our you your they their have has had will shall must can may do does did not no yes if then than so such any all each per".split(" ")
);

export function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length > 2 && !STOP.has(t));
}

export async function searchChunks(
  workspaceId: string,
  query: string,
  opts: { topK?: number; includeConfidential?: boolean; categories?: string[] } = {}
): Promise<ScoredChunk[]> {
  const { topK = 8, includeConfidential = true, categories } = opts;
  const qTokens = Array.from(new Set(tokenize(query)));
  if (qTokens.length === 0) return [];

  const chunks = await db.documentChunk.findMany({
    where: {
      document: {
        workspaceId,
        status: { notIn: ["ARCHIVED"] },
        ...(includeConfidential ? {} : { confidential: false }),
        ...(categories ? { category: { in: categories } } : {}),
      },
    },
    include: { document: { select: { id: true, title: true, fileName: true, category: true, confidential: true } } },
  });

  const scored: ScoredChunk[] = [];
  for (const c of chunks) {
    const text = c.content.toLowerCase();
    const titleText = c.document.title.toLowerCase();
    let score = 0;
    let matched = 0;
    for (const t of qTokens) {
      const tf = countOccurrences(text, t);
      if (tf > 0) {
        matched++;
        score += 1 + Math.log(1 + tf); // dampened term frequency
      }
      if (titleText.includes(t)) score += 1.5;
    }
    if (matched === 0) continue;
    // reward chunks matching a larger fraction of the query
    score *= matched / qTokens.length;
    scored.push({
      chunkId: c.id,
      documentId: c.document.id,
      documentTitle: c.document.title,
      fileName: c.document.fileName,
      category: c.document.category,
      confidential: c.document.confidential,
      content: c.content,
      score,
    });
  }

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, topK);
}

function countOccurrences(haystack: string, needle: string): number {
  let count = 0;
  let idx = haystack.indexOf(needle);
  while (idx !== -1 && count < 50) {
    count++;
    idx = haystack.indexOf(needle, idx + needle.length);
  }
  return count;
}

/** A crude relevance threshold used to decide "not enough evidence". */
export function isConfidentMatch(results: ScoredChunk[]): boolean {
  return results.length > 0 && results[0].score >= 1.2;
}
