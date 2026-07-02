/**
 * Output Studio: business-document templates generated from the knowledge
 * base. Each template is a set of section specs (same contract as proposal
 * sections), so generation is grounded, cited, and works in both AI modes.
 */
import { db } from "./db";
import { searchChunks } from "./search";
import { generateProposalSection, type SectionSpec } from "./ai/tasks";

export type OutputTemplate = {
  key: string;
  name: string;
  description: string;
  audience: string;
  sections: SectionSpec[];
};

export const OUTPUT_TEMPLATES: OutputTemplate[] = [
  {
    key: "company-profile",
    name: "Company Profile",
    description: "A polished corporate profile: who you are, services, track record, certifications and why clients choose you.",
    audience: "Clients, procurement teams, partners",
    sections: [
      { slug: "about", title: "About the Company", categories: ["COMPANY_PROFILE", "LEGAL"], query: "company overview registered founded mission team offices", instruction: "Write a factual company introduction: registration, history, size, locations, mission." },
      { slug: "services", title: "Our Services", categories: ["COMPANY_PROFILE", "PROPOSAL", "TECHNICAL"], query: "services offerings solutions capabilities", instruction: "Describe the company's services, grouped clearly." },
      { slug: "track-record", title: "Track Record", categories: ["PROJECT_REPORT", "PROPOSAL"], query: "project client delivered outcome results", instruction: "Summarize the strongest past projects with client, scope and measurable outcomes." },
      { slug: "certifications", title: "Certifications & Compliance", categories: ["CERTIFICATE", "LEGAL"], query: "certificate registration tax license compliance", instruction: "List certifications and compliance credentials with validity where stated." },
      { slug: "why-us", title: "Why Choose Us", query: "differentiators quality support experience results", instruction: "Present evidence-based differentiators. No unsupported superlatives.", missingHint: "Needs a company profile and project outcomes." },
    ],
  },
  {
    key: "case-study",
    name: "Case Study",
    description: "Turn a completed project into a reusable case study: challenge, solution, outcomes, and proof.",
    audience: "Proposals, sales, website",
    sections: [
      { slug: "overview", title: "Project Overview", categories: ["PROJECT_REPORT", "PROPOSAL"], query: "project client scope period delivered", instruction: "Introduce the strongest documented project: client, context, scope, timeframe." },
      { slug: "challenge", title: "The Challenge", categories: ["PROJECT_REPORT", "PROPOSAL"], query: "problem requirements needs manual errors delays", instruction: "Describe the client's problem as documented." },
      { slug: "solution", title: "Our Solution", categories: ["PROJECT_REPORT", "PROPOSAL", "TECHNICAL"], query: "solution platform system built implemented approach", instruction: "Describe what was delivered and how, grounded in the report." },
      { slug: "results", title: "Results & Impact", categories: ["PROJECT_REPORT", "OTHER"], query: "outcomes results improvement percentage reduced increased", instruction: "Present measurable outcomes with exact figures from the documents. Include client statements if documented." },
    ],
  },
  {
    key: "capability-statement",
    name: "Capability Statement",
    description: "A concise one-pager for tender pre-qualification: core competencies, differentiators, past performance, company data.",
    audience: "Government buyers, prime contractors",
    sections: [
      { slug: "competencies", title: "Core Competencies", categories: ["COMPANY_PROFILE", "PROPOSAL"], query: "services capabilities expertise specialization", instruction: "List core competencies as short evidence-backed statements." },
      { slug: "past-performance", title: "Past Performance", categories: ["PROJECT_REPORT", "PROPOSAL"], query: "project client delivered outcome completed", instruction: "Summarize 2–4 past performances: client, scope, outcome, dates." },
      { slug: "differentiators", title: "Differentiators", query: "quality certifications support security compliance training", instruction: "Evidence-based differentiators only." },
      { slug: "company-data", title: "Company Data", categories: ["COMPANY_PROFILE", "CERTIFICATE", "LEGAL"], query: "registered registration certificate tax insurance contact address", instruction: "Company registration data, certifications, insurance, and contact details in a compact table." },
    ],
  },
  {
    key: "cv-pack",
    name: "Staff CV Pack",
    description: "Standardized team bios compiled from staff CVs — ready to drop into a tender's key-personnel section.",
    audience: "Tender submissions",
    sections: [
      { slug: "team-summary", title: "Team Summary", categories: ["STAFF_CV", "COMPANY_PROFILE"], query: "team staff experience roles qualifications", instruction: "Summarize the team's collective expertise and composition." },
      { slug: "profiles", title: "Key Personnel Profiles", categories: ["STAFF_CV"], query: "experience role skills education certifications projects years", instruction: "One profile per documented staff member: role, years of experience, certifications, selected projects. Use a subsection per person." },
    ],
  },
  {
    key: "executive-brief",
    name: "Executive Brief",
    description: "A board-ready brief on the company's current capability, evidence position and readiness.",
    audience: "Board, investors, leadership",
    sections: [
      { slug: "position", title: "Company Position", categories: ["COMPANY_PROFILE", "PROJECT_REPORT"], query: "company services track record clients sectors", instruction: "State what the company does and where its documented strengths are." },
      { slug: "proof", title: "Evidence of Delivery", categories: ["PROJECT_REPORT", "OTHER"], query: "results outcomes delivered improvement testimonial", instruction: "Present the strongest documented delivery evidence with figures." },
      { slug: "gaps", title: "Gaps & Risks", categories: ["CERTIFICATE", "COMPANY_PROFILE"], query: "expired missing certificate insurance compliance", instruction: "Honestly state documented gaps (expired certificates, missing evidence) that weaken bids.", missingHint: "Health-check data may reveal more gaps than documents alone." },
    ],
  },
];

export function getTemplate(key: string): OutputTemplate | undefined {
  return OUTPUT_TEMPLATES.find((t) => t.key === key);
}

export async function generateOutput(workspaceId: string, templateKey: string, userId: string) {
  const template = getTemplate(templateKey);
  if (!template) throw new Error("Unknown template");

  const workspace = await db.workspace.findUnique({
    where: { id: workspaceId },
    include: { organization: { select: { brandVoice: true } } },
  });
  const brandVoice = workspace?.organization.brandVoice
    ? ` Company brand voice (follow this): ${workspace.organization.brandVoice}`
    : "";

  const parts: string[] = [];
  const allCitations: { documentId: string; chunkId: string | null; snippet: string }[] = [];
  let lowConfidence = 0;

  for (const spec of template.sections) {
    const chunks = await searchChunks(workspaceId, spec.query, { topK: 6, categories: spec.categories });
    const result = await generateProposalSection(spec, `Document type: ${template.name}. Audience: ${template.audience}.${brandVoice}`, chunks);
    parts.push(`## ${spec.title}\n\n${result.content}`);
    if (result.confidence === "LOW") lowConfidence++;
    allCitations.push(...result.citations);
  }

  const output = await db.generatedOutput.create({
    data: {
      workspaceId,
      createdById: userId,
      type: template.key,
      title: template.name,
      content: parts.join("\n\n"),
      confidence: lowConfidence === 0 ? "HIGH" : lowConfidence <= 1 ? "MEDIUM" : "LOW",
      status: "AI_GENERATED",
    },
  });

  const seen = new Set<string>();
  for (const c of allCitations) {
    const key = `${c.documentId}:${c.snippet.slice(0, 40)}`;
    if (seen.has(key) || !c.documentId) continue;
    seen.add(key);
    await db.citation.create({
      data: {
        workspaceId,
        documentId: c.documentId,
        chunkId: c.chunkId,
        snippet: c.snippet,
        targetType: "OUTPUT",
        targetId: output.id,
      },
    });
  }

  return output;
}
