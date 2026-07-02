import { db } from "./db";
import { daysUntil } from "./utils";

export type HealthIssue = {
  severity: "HIGH" | "MEDIUM" | "LOW";
  category: string;
  message: string;
  link?: string;
};

export type HealthReport = {
  score: number;
  breakdown: { label: string; score: number }[];
  issues: HealthIssue[];
};

/**
 * Rule-based knowledge health check. Inspects the workspace for expired /
 * expiring documents, unreviewed AI content, missing summaries, stale files,
 * low-confidence wiki pages and weak evidence — then computes a 0-100 score.
 */
export async function runHealthCheck(workspaceId: string): Promise<HealthReport> {
  const [documents, wikiPages, evidence, proposals] = await Promise.all([
    db.document.findMany({ where: { workspaceId, status: { not: "ARCHIVED" } } }),
    db.wikiPage.findMany({ where: { workspaceId } }),
    db.evidenceItem.findMany({ where: { workspaceId } }),
    db.proposal.findMany({ where: { workspaceId }, include: { sections: true } }),
  ]);

  const issues: HealthIssue[] = [];
  const now = Date.now();

  // --- documents
  let docScore = 100;
  for (const d of documents) {
    if (d.expiryDate) {
      const days = daysUntil(d.expiryDate);
      if (days < 0) {
        issues.push({ severity: "HIGH", category: "Expired documents", message: `“${d.title}” expired ${-days} days ago.`, link: `/documents/${d.id}` });
        docScore -= 15;
      } else if (days < 60) {
        issues.push({ severity: "MEDIUM", category: "Expiring documents", message: `“${d.title}” expires in ${days} days.`, link: `/documents/${d.id}` });
        docScore -= 7;
      }
    }
    if (!d.summary) {
      issues.push({ severity: "LOW", category: "Missing summaries", message: `“${d.title}” has no AI summary — reprocess it.`, link: `/documents/${d.id}` });
      docScore -= 3;
    }
    if (d.status === "NEEDS_REVIEW") {
      issues.push({ severity: "MEDIUM", category: "Needs review", message: `“${d.title}” is awaiting human review.`, link: `/documents/${d.id}` });
      docScore -= 4;
    }
    const ageDays = (now - new Date(d.updatedAt).getTime()) / 86_400_000;
    if (ageDays > 365 && ["COMPANY_PROFILE", "FINANCIAL", "CERTIFICATE"].includes(d.category)) {
      issues.push({ severity: "MEDIUM", category: "Stale documents", message: `“${d.title}” has not been updated in over a year.`, link: `/documents/${d.id}` });
      docScore -= 5;
    }
  }
  if (documents.length === 0) {
    issues.push({ severity: "HIGH", category: "Coverage", message: "No documents uploaded yet — the knowledge base is empty.", link: "/documents" });
    docScore = 10;
  }

  // --- coverage of key categories
  let coverageScore = 100;
  const have = new Set(documents.map((d) => d.category));
  const wanted: [string, string][] = [
    ["COMPANY_PROFILE", "company profile"],
    ["PROJECT_REPORT", "project report / case study"],
    ["STAFF_CV", "staff CV"],
    ["CERTIFICATE", "certificate / compliance document"],
    ["PROPOSAL", "past proposal"],
  ];
  for (const [cat, label] of wanted) {
    if (!have.has(cat)) {
      issues.push({ severity: "MEDIUM", category: "Coverage gaps", message: `No ${label} in the library — proposals will be weaker without one.`, link: "/documents" });
      coverageScore -= 18;
    }
  }

  // --- wiki
  let wikiScore = 100;
  if (wikiPages.length === 0) {
    issues.push({ severity: "MEDIUM", category: "Wiki", message: "Knowledge base not compiled yet — run Compile from the Wiki page.", link: "/wiki" });
    wikiScore = 20;
  }
  for (const p of wikiPages) {
    if (p.confidence === "LOW") {
      issues.push({ severity: "MEDIUM", category: "Weak wiki pages", message: `Wiki page “${p.title}” has low confidence — it needs more source documents.`, link: `/wiki/${p.slug}` });
      wikiScore -= 10;
    }
    if (p.status === "AI_GENERATED") wikiScore -= 3; // unreviewed AI content
  }
  if (wikiPages.length > 0 && wikiPages.every((p) => p.status === "AI_GENERATED")) {
    issues.push({ severity: "LOW", category: "Review", message: "No wiki pages have been human-reviewed yet.", link: "/wiki" });
  }

  // --- evidence
  let evidenceScore = 100;
  for (const e of evidence) {
    if (e.expiresAt && daysUntil(e.expiresAt) < 0) {
      issues.push({ severity: "HIGH", category: "Expired evidence", message: `Evidence “${e.title}” has expired.`, link: "/evidence" });
      evidenceScore -= 12;
    }
    if (e.strength === "WEAK") evidenceScore -= 5;
    if (e.strength === "NEEDS_REVIEW") evidenceScore -= 3;
  }
  if (evidence.length === 0) {
    issues.push({ severity: "LOW", category: "Evidence", message: "Evidence library is empty — tag documents as evidence to strengthen proposals.", link: "/evidence" });
    evidenceScore = 40;
  }

  // --- proposals
  let proposalScore = 100;
  for (const p of proposals) {
    const low = p.sections.filter((s) => s.confidence === "LOW").length;
    if (low > 0) {
      issues.push({ severity: "MEDIUM", category: "Unsupported claims", message: `Proposal “${p.title}” has ${low} low-confidence section${low > 1 ? "s" : ""} needing evidence.`, link: `/proposals/${p.id}` });
      proposalScore -= low * 6;
    }
  }

  const clamp = (n: number) => Math.max(0, Math.min(100, Math.round(n)));
  const breakdown = [
    { label: "Document freshness", score: clamp(docScore) },
    { label: "Knowledge coverage", score: clamp(coverageScore) },
    { label: "Wiki quality", score: clamp(wikiScore) },
    { label: "Evidence strength", score: clamp(evidenceScore) },
    { label: "Proposal readiness", score: clamp(proposalScore) },
  ];
  const score = clamp(breakdown.reduce((a, b) => a + b.score, 0) / breakdown.length);

  const order = { HIGH: 0, MEDIUM: 1, LOW: 2 };
  issues.sort((a, b) => order[a.severity] - order[b.severity]);
  return { score, breakdown, issues };
}
