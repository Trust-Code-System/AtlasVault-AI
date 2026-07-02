/**
 * Local Knowledge Mode — deterministic, extractive implementations of every
 * AI task. Used when no ANTHROPIC_API_KEY is configured, and as the fallback
 * when a model call fails. Everything produced here is assembled verbatim
 * from source text, so citations are always genuine.
 */
import type { ScoredChunk } from "../search";
import type {
  ClassifyResult,
  OpportunityAnalysis,
  QaResult,
  SectionResult,
  WikiPageResult,
  SectionSpec,
} from "./tasks";

const CATEGORY_RULES: [RegExp, string][] = [
  [/request for proposal|rfp|invitation to tender|tender no|bid submission|expression of interest|terms of reference/i, "OPPORTUNITY"],
  [/curriculum vitae|\bcv\b|professional experience|work history|education\s*:/i, "STAFF_CV"],
  [/certificate|certification|iso \d|tax clearance|incorporation|license|accredit/i, "CERTIFICATE"],
  [/proposal|scope of work|our approach|methodology/i, "PROPOSAL"],
  [/project (completion |final )?report|deliverables|lessons learned|project outcome/i, "PROJECT_REPORT"],
  [/company profile|about us|who we are|our services|mission|vision/i, "COMPANY_PROFILE"],
  [/invoice|balance sheet|financial statement|audited/i, "FINANCIAL"],
  [/agreement|contract|memorandum of understanding|nda|non-disclosure/i, "LEGAL"],
  [/architecture|technical specification|api|system design/i, "TECHNICAL"],
];

export function mockClassify(text: string, fileName: string): ClassifyResult {
  const sample = `${fileName}\n${text.slice(0, 4000)}`;
  let category = "OTHER";
  for (const [re, cat] of CATEGORY_RULES) {
    if (re.test(sample)) {
      category = cat;
      break;
    }
  }
  const sentences = text.replace(/\s+/g, " ").match(/[^.!?]+[.!?]/g) ?? [];
  const summary = sentences.slice(0, 3).join(" ").trim().slice(0, 500) || "No readable text extracted from this document.";

  let expiryDate: string | undefined;
  const expiryMatch = text.match(/(?:valid until|expires? on|expiry date|valid through)[:\s]*([A-Za-z]+ \d{1,2},? \d{4}|\d{4}-\d{2}-\d{2}|\d{1,2}\/\d{1,2}\/\d{4})/i);
  if (expiryMatch) {
    const parsed = new Date(expiryMatch[1]);
    if (!isNaN(parsed.getTime())) expiryDate = parsed.toISOString();
  }

  const title = fileName.replace(/\.[a-z0-9]+$/i, "").replace(/[_-]+/g, " ").trim();
  return { title, summary, category, expiryDate, language: "en" };
}

export function mockExtractRequirements(text: string): OpportunityAnalysis {
  const clean = text.replace(/\s+/g, " ");
  const sentences = clean.match(/[^.!?\n]+[.!?]/g) ?? [];
  const reqPattern = /\b(must|shall|required|mandatory|should (?:provide|submit|include|have)|evidence of|minimum of|at least|bidders? (?:are|is) (?:required|expected))\b/i;

  const requirements: OpportunityAnalysis["requirements"] = [];
  for (const s of sentences) {
    const t = s.trim();
    if (t.length < 25 || t.length > 400) continue;
    if (!reqPattern.test(t)) continue;
    let category = "GENERAL";
    if (/certificat|tax|registration|license|compliance|iso|insurance/i.test(t)) category = "COMPLIANCE";
    else if (/experience|similar project|past project|track record|reference|case stud/i.test(t)) category = "EXPERIENCE";
    else if (/cv|personnel|staff|team|key expert|project manager|qualification/i.test(t)) category = "TEAM";
    else if (/financial|turnover|bank|statement|budget|price|cost/i.test(t)) category = "FINANCIAL";
    else if (/technical|system|platform|software|integrat|api|security|host/i.test(t)) category = "TECHNICAL";
    requirements.push({ text: t, category, mandatory: /must|shall|mandatory|required/i.test(t) });
    if (requirements.length >= 18) break;
  }

  let deadline: string | undefined;
  const deadlineMatch = clean.match(/(?:deadline|due date|closing date|submission(?:s)? (?:close|due|deadline)|submitted? (?:by|no later than|on or before))[:\s]*([A-Za-z]+ \d{1,2},? \d{4}|\d{4}-\d{2}-\d{2}|\d{1,2}\/\d{1,2}\/\d{4})/i);
  if (deadlineMatch) {
    const parsed = new Date(deadlineMatch[1]);
    if (!isNaN(parsed.getTime())) deadline = parsed.toISOString();
  }

  const clientMatch = clean.match(/(?:issued by|on behalf of|the client,?|procuring entity[:\s]+)\s*([A-Z][A-Za-z&., ]{3,60}?)(?:\s+(?:invites|is|hereby|wishes|seeks)|[.,])/);
  const sentencesForSummary = sentences.slice(0, 3).join(" ").slice(0, 400);

  return {
    client: clientMatch?.[1]?.trim(),
    deadline,
    summary: sentencesForSummary,
    requirements,
  };
}

export function mockAnswer(question: string, chunks: ScoredChunk[]): QaResult {
  if (chunks.length === 0 || chunks[0].score < 1.2) {
    return {
      answer:
        "There is not enough evidence in your knowledge base to answer this question reliably. No uploaded document contains material matching your query. Consider uploading relevant documents, then ask again.",
      confidence: "LOW",
      insufficient: true,
      citations: [],
    };
  }
  const top = chunks.slice(0, 3);
  const parts = top.map((c, i) => `**${i + 1}. From “${c.documentTitle}”:**\n\n> ${excerpt(c.content, question)}`);
  return {
    answer:
      `Based on your uploaded documents, here is the most relevant evidence:\n\n${parts.join("\n\n")}\n\n` +
      `*Local Knowledge Mode returns verbatim evidence. Add an Anthropic API key in Settings to enable synthesized answers.*`,
    confidence: top[0].score > 3 ? "HIGH" : "MEDIUM",
    insufficient: false,
    citations: top.map((c) => ({ chunkId: c.chunkId, documentId: c.documentId, snippet: excerpt(c.content, question, 180) })),
  };
}

export function mockWikiPage(spec: SectionSpec, chunks: ScoredChunk[]): WikiPageResult {
  if (chunks.length === 0) {
    return {
      content: `_No source documents found yet for this page. Upload relevant documents and re-run **Compile knowledge base**._`,
      confidence: "LOW",
      citations: [],
    };
  }
  const byDoc = new Map<string, ScoredChunk[]>();
  for (const c of chunks) {
    const list = byDoc.get(c.documentTitle) ?? [];
    list.push(c);
    byDoc.set(c.documentTitle, list);
  }
  const sections: string[] = [];
  for (const [docTitle, docChunks] of byDoc) {
    const body = docChunks
      .slice(0, 2)
      .map((c) => c.content.slice(0, 600).trim())
      .join("\n\n");
    sections.push(`## ${docTitle}\n\n${body}`);
  }
  return {
    content: sections.join("\n\n"),
    confidence: byDoc.size >= 2 ? "MEDIUM" : "LOW",
    citations: chunks.slice(0, 6).map((c) => ({ chunkId: c.chunkId, documentId: c.documentId, snippet: c.content.slice(0, 180) })),
  };
}

export function mockSection(spec: SectionSpec, context: string, chunks: ScoredChunk[]): SectionResult {
  if (chunks.length === 0) {
    return {
      content: `_Insufficient evidence in the knowledge base to draft this section. ${spec.missingHint ?? "Upload supporting documents and regenerate."}_`,
      confidence: "LOW",
      missing: spec.missingHint ?? "No supporting documents found for this section.",
      citations: [],
    };
  }
  const evidence = chunks
    .slice(0, 3)
    .map((c) => `From **${c.documentTitle}**:\n\n${c.content.slice(0, 700).trim()}`)
    .join("\n\n---\n\n");
  return {
    content: `${spec.leadIn ?? ""}${spec.leadIn ? "\n\n" : ""}${evidence}`,
    confidence: chunks[0].score > 3 ? "HIGH" : "MEDIUM",
    missing: chunks.length < 2 ? "Only one supporting source found — consider adding more evidence." : undefined,
    citations: chunks.slice(0, 3).map((c) => ({ chunkId: c.chunkId, documentId: c.documentId, snippet: c.content.slice(0, 180) })),
  };
}

function excerpt(content: string, query: string, maxLen = 400): string {
  const qWords = query.toLowerCase().split(/\s+/).filter((w) => w.length > 3);
  const sentences = content.match(/[^.!?]+[.!?]/g) ?? [content];
  let best = sentences[0];
  let bestScore = -1;
  for (const s of sentences) {
    const low = s.toLowerCase();
    const score = qWords.reduce((acc, w) => acc + (low.includes(w) ? 1 : 0), 0);
    if (score > bestScore) {
      bestScore = score;
      best = s;
    }
  }
  const idx = sentences.indexOf(best);
  const combined = sentences.slice(Math.max(0, idx), idx + 3).join(" ").trim();
  return combined.length > maxLen ? combined.slice(0, maxLen) + "…" : combined;
}
