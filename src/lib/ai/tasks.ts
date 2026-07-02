/**
 * AI task layer. Every product capability (classify, extract requirements,
 * answer with citations, compile wiki pages, draft proposal sections) is a
 * typed function here. Each has a Claude-backed path and a deterministic
 * local fallback, so the workflow never breaks and never invents facts.
 */
import { aiEnabled, completeJson } from "./client";
import { mockAnswer, mockClassify, mockExtractRequirements, mockSection, mockWikiPage } from "./mock";
import type { ScoredChunk } from "../search";

export type CitationRef = { chunkId: string | null; documentId: string; snippet: string };

export type ClassifyResult = {
  title: string;
  summary: string;
  category: string;
  docDate?: string;
  expiryDate?: string;
  language?: string;
};

export type OpportunityAnalysis = {
  client?: string;
  deadline?: string;
  value?: string;
  summary: string;
  requirements: { text: string; category: string; mandatory: boolean }[];
};

export type QaResult = {
  answer: string;
  confidence: "HIGH" | "MEDIUM" | "LOW";
  insufficient: boolean;
  citations: CitationRef[];
};

export type WikiPageResult = {
  content: string;
  confidence: "HIGH" | "MEDIUM" | "LOW";
  citations: CitationRef[];
};

export type SectionResult = {
  content: string;
  confidence: "HIGH" | "MEDIUM" | "LOW";
  missing?: string;
  citations: CitationRef[];
};

export type SectionSpec = {
  slug: string;
  title: string;
  /** categories of documents to retrieve from */
  categories?: string[];
  /** retrieval query */
  query: string;
  /** instruction for the model */
  instruction: string;
  leadIn?: string;
  missingHint?: string;
};

const VALID_CATEGORIES = [
  "COMPANY_PROFILE", "PROPOSAL", "PROJECT_REPORT", "STAFF_CV",
  "CERTIFICATE", "LEGAL", "FINANCIAL", "TECHNICAL", "OPPORTUNITY", "OTHER",
];

// ---------------------------------------------------------------- classify

export async function classifyDocument(text: string, fileName: string): Promise<ClassifyResult> {
  const fallback = mockClassify(text, fileName);
  if (!aiEnabled() || !text.trim()) return fallback;

  const result = await completeJson<ClassifyResult>(
    `You are AtlasVault's document classification agent. Classify company documents and summarize them factually. Never invent facts not present in the text. Valid categories: ${VALID_CATEGORIES.join(", ")}.`,
    `Filename: ${fileName}\n\nDocument text (may be truncated):\n"""\n${text.slice(0, 12000)}\n"""\n\nReturn JSON: {"title": string (clean human title), "summary": string (2-4 factual sentences), "category": string (one of the valid categories), "docDate": ISO date or null, "expiryDate": ISO date or null (only if the document itself states an expiry/validity date), "language": ISO 639-1 code}`
  );
  if (!result || !result.summary || !VALID_CATEGORIES.includes(result.category)) return fallback;
  return { ...result, title: result.title || fallback.title };
}

// ------------------------------------------------- opportunity requirements

export async function extractOpportunity(text: string): Promise<OpportunityAnalysis> {
  const fallback = mockExtractRequirements(text);
  if (!aiEnabled() || !text.trim()) return fallback;

  const result = await completeJson<OpportunityAnalysis>(
    `You are AtlasVault's tender analysis agent. Extract requirements from RFPs/tenders/client briefs exactly as stated — do not invent requirements. Categories: COMPLIANCE, EXPERIENCE, TEAM, FINANCIAL, TECHNICAL, GENERAL.`,
    `Tender/brief text:\n"""\n${text.slice(0, 30000)}\n"""\n\nReturn JSON: {"client": string|null, "deadline": ISO date|null, "value": string|null (contract value if stated), "summary": string (3 sentences), "requirements": [{"text": string (the requirement, concise), "category": string, "mandatory": boolean}]}. Extract every distinct requirement (max 25).`,
    4000
  );
  if (!result || !Array.isArray(result.requirements) || result.requirements.length === 0) return fallback;
  return result;
}

// -------------------------------------------------------------------- Q&A

export async function answerQuestion(question: string, chunks: ScoredChunk[]): Promise<QaResult> {
  if (!aiEnabled()) return mockAnswer(question, chunks);
  if (chunks.length === 0) return mockAnswer(question, chunks);

  const labeled = chunks
    .map((c, i) => `[C${i + 1}] (from "${c.documentTitle}")\n${c.content.slice(0, 1500)}`)
    .join("\n\n");
  const result = await completeJson<{ answer: string; confidence: string; insufficient: boolean; used: number[] }>(
    `You are AtlasVault's Q&A agent. Answer questions using ONLY the provided company document excerpts. Rules:
- Cite excerpts inline as [C1], [C2] etc. after each claim.
- If the excerpts do not contain enough evidence, set insufficient=true and say clearly what is missing. NEVER invent facts.
- confidence: HIGH only if multiple excerpts directly support the answer; MEDIUM if partially supported; LOW otherwise.
Writing style — executive-grade markdown:
- Lead with the direct answer in one or two sentences, then supporting detail.
- Short paragraphs; a bold key phrase where it genuinely helps scanning; bullets only for true lists; a small table only when comparing items.
- Numbered steps only when order matters. No walls of text, no heading-spam, no emoji, no over-bolding.
- Polished business punctuation — em dashes where they improve flow, not in every sentence.`,
    `Question: ${question}\n\nExcerpts:\n${labeled}\n\nReturn JSON: {"answer": string (markdown, with [Cn] citations), "confidence": "HIGH"|"MEDIUM"|"LOW", "insufficient": boolean, "used": [excerpt numbers actually cited]}`
  );
  if (!result?.answer) return mockAnswer(question, chunks);
  const used = (result.used ?? []).filter((n) => n >= 1 && n <= chunks.length);
  return {
    answer: result.answer,
    confidence: (["HIGH", "MEDIUM", "LOW"].includes(result.confidence) ? result.confidence : "MEDIUM") as QaResult["confidence"],
    insufficient: Boolean(result.insufficient),
    citations: used.map((n) => ({
      chunkId: chunks[n - 1].chunkId,
      documentId: chunks[n - 1].documentId,
      snippet: chunks[n - 1].content.slice(0, 180),
    })),
  };
}

// -------------------------------------------------------------- wiki pages

export async function generateWikiPage(spec: SectionSpec, chunks: ScoredChunk[]): Promise<WikiPageResult> {
  if (!aiEnabled() || chunks.length === 0) return mockWikiPage(spec, chunks);

  const labeled = chunks.map((c, i) => `[C${i + 1}] (from "${c.documentTitle}")\n${c.content.slice(0, 1400)}`).join("\n\n");
  const result = await completeJson<{ content: string; confidence: string; used: number[] }>(
    `You are AtlasVault's knowledge compiler agent. You turn raw company documents into clean, reusable wiki pages. Use ONLY facts present in the excerpts. Write in clear professional markdown with headings. Cite sources inline as [C1] etc. Never invent numbers, dates, clients, or capabilities.`,
    `Compile the wiki page "${spec.title}".\nInstruction: ${spec.instruction}\n\nSource excerpts:\n${labeled}\n\nReturn JSON: {"content": string (markdown), "confidence": "HIGH"|"MEDIUM"|"LOW", "used": [excerpt numbers cited]}`,
    4000
  );
  if (!result?.content) return mockWikiPage(spec, chunks);
  const used = (result.used ?? []).filter((n) => n >= 1 && n <= chunks.length);
  return {
    content: result.content,
    confidence: (["HIGH", "MEDIUM", "LOW"].includes(result.confidence) ? result.confidence : "MEDIUM") as WikiPageResult["confidence"],
    citations: (used.length ? used : chunks.slice(0, 4).map((_, i) => i + 1)).map((n) => ({
      chunkId: chunks[n - 1].chunkId,
      documentId: chunks[n - 1].documentId,
      snippet: chunks[n - 1].content.slice(0, 180),
    })),
  };
}

// ------------------------------------------------------- proposal sections

export async function generateProposalSection(
  spec: SectionSpec,
  context: string,
  chunks: ScoredChunk[]
): Promise<SectionResult> {
  if (!aiEnabled()) return mockSection(spec, context, chunks);

  const labeled = chunks.length
    ? chunks.map((c, i) => `[C${i + 1}] (from "${c.documentTitle}")\n${c.content.slice(0, 1400)}`).join("\n\n")
    : "(no supporting excerpts found)";
  const result = await completeJson<{ content: string; confidence: string; missing: string | null; used: number[] }>(
    `You are AtlasVault's proposal writing agent. Draft professional proposal sections grounded in the company's own documents. Rules:
- Base every factual claim (projects, clients, certifications, staff, numbers) on the excerpts and cite [C1] etc.
- General best-practice prose (methodology structure, plan phrasing) is allowed, but company-specific claims MUST be evidenced.
- If evidence is missing for something the section needs, note it in "missing" instead of inventing it.
- Formal, persuasive, concise. Markdown.`,
    `Opportunity context:\n${context.slice(0, 4000)}\n\nSection to draft: "${spec.title}"\nInstruction: ${spec.instruction}\n\nCompany evidence excerpts:\n${labeled}\n\nReturn JSON: {"content": string (markdown), "confidence": "HIGH"|"MEDIUM"|"LOW", "missing": string|null (what evidence is missing, if any), "used": [excerpt numbers cited]}`,
    4000
  );
  if (!result?.content) return mockSection(spec, context, chunks);
  const used = (result.used ?? []).filter((n) => n >= 1 && n <= chunks.length);
  return {
    content: result.content,
    confidence: (["HIGH", "MEDIUM", "LOW"].includes(result.confidence) ? result.confidence : "MEDIUM") as SectionResult["confidence"],
    missing: result.missing ?? undefined,
    citations: used.map((n) => ({
      chunkId: chunks[n - 1].chunkId,
      documentId: chunks[n - 1].documentId,
      snippet: chunks[n - 1].content.slice(0, 180),
    })),
  };
}

// --------------------------------------------------------- canonical specs

export const WIKI_PAGE_SPECS: (SectionSpec & { type: string })[] = [
  {
    slug: "company-overview",
    title: "Company Overview",
    type: "COMPANY",
    categories: ["COMPANY_PROFILE", "PROPOSAL", "LEGAL"],
    query: "company overview mission vision services history founded team about",
    instruction: "Write a factual company overview: what the company does, mission, history, differentiators.",
  } as SectionSpec & { type: string },
  {
    slug: "services",
    title: "Services",
    type: "SERVICES",
    categories: ["COMPANY_PROFILE", "PROPOSAL", "TECHNICAL"],
    query: "services offerings solutions capabilities development consulting delivery",
    instruction: "List and describe the services the company offers, grouped logically.",
  } as SectionSpec & { type: string },
  {
    slug: "past-projects",
    title: "Past Projects",
    type: "PROJECTS",
    categories: ["PROJECT_REPORT", "PROPOSAL"],
    query: "project client delivered outcome results implementation completed scope",
    instruction: "Compile a page of past projects: client, scope, outcomes, dates. One section per project.",
  } as SectionSpec & { type: string },
  {
    slug: "team-expertise",
    title: "Team & Expertise",
    type: "PEOPLE",
    categories: ["STAFF_CV", "COMPANY_PROFILE"],
    query: "experience skills role qualifications education certifications years",
    instruction: "Compile staff expertise: one section per person with role, experience, skills, certifications.",
  } as SectionSpec & { type: string },
  {
    slug: "certificates-compliance",
    title: "Certificates & Compliance",
    type: "CERTIFICATES",
    categories: ["CERTIFICATE", "LEGAL", "FINANCIAL"],
    query: "certificate registration tax clearance license valid expiry compliance insurance",
    instruction: "List company certificates and compliance documents with validity/expiry dates where stated.",
  } as SectionSpec & { type: string },
] as (SectionSpec & { type: string })[];

export const PROPOSAL_SECTION_SPECS: SectionSpec[] = [
  {
    slug: "executive-summary",
    title: "Executive Summary",
    query: "company services experience delivered results",
    instruction: "Summarize why the company is the right fit for this opportunity, referencing real strengths from evidence.",
    missingHint: "Needs a company profile and past project evidence.",
  },
  {
    slug: "company-introduction",
    title: "Company Introduction",
    categories: ["COMPANY_PROFILE", "PROPOSAL", "CERTIFICATE"],
    query: "company profile about registered services mission team",
    instruction: "Introduce the company: registration, history, services, differentiators.",
    missingHint: "Upload a company profile document.",
  },
  {
    slug: "understanding",
    title: "Understanding of the Assignment",
    query: "requirements objectives scope deliverables",
    instruction: "Restate the client's needs from the tender and show understanding of the assignment's objectives and constraints.",
  },
  {
    slug: "technical-approach",
    title: "Technical Approach & Methodology",
    categories: ["PROPOSAL", "TECHNICAL", "PROJECT_REPORT"],
    query: "methodology approach implementation phases technical architecture delivery process",
    instruction: "Describe the proposed approach and methodology, grounded in how the company has delivered similar work before.",
    missingHint: "Needs past proposals or technical documents describing methodology.",
  },
  {
    slug: "relevant-experience",
    title: "Relevant Experience & Case Studies",
    categories: ["PROJECT_REPORT", "PROPOSAL"],
    query: "similar project client delivered outcome results completed",
    instruction: "Present the most relevant past projects as evidence of capability, with client names, scope, and outcomes.",
    missingHint: "Upload project reports or case studies.",
  },
  {
    slug: "team",
    title: "Proposed Team",
    categories: ["STAFF_CV"],
    query: "project manager developer engineer experience qualifications role skills",
    instruction: "Propose a team for the assignment with short evidence-based bios from staff CVs.",
    missingHint: "Upload staff CVs.",
  },
  {
    slug: "workplan",
    title: "Work Plan & Timeline",
    categories: ["PROPOSAL", "PROJECT_REPORT"],
    query: "timeline phases milestones weeks months delivery schedule plan",
    instruction: "Propose a phased work plan and indicative timeline consistent with how the company has structured past deliveries.",
  },
  {
    slug: "risk-management",
    title: "Risk Management",
    categories: ["PROPOSAL", "PROJECT_REPORT"],
    query: "risk mitigation quality assurance issues contingency",
    instruction: "Identify key delivery risks for this assignment and mitigation measures.",
  },
];
