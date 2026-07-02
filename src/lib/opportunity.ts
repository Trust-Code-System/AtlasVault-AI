import { db } from "./db";
import { searchChunks } from "./search";
import { extractOpportunity } from "./ai/tasks";

/**
 * Analyze an opportunity brief: extract requirements, match each one against
 * the company knowledge base, store the compliance matrix, and compute a
 * readiness score. Idempotent — re-running replaces prior requirements.
 */
export async function analyzeOpportunity(opportunityId: string, workspaceId: string, briefText: string) {
  const analysis = await extractOpportunity(briefText);

  await db.requirement.deleteMany({ where: { opportunityId } });

  let met = 0;
  let partial = 0;

  for (const r of analysis.requirements) {
    // Match against company documents (never against other tenders)
    const matches = await searchChunks(workspaceId, r.text, {
      topK: 3,
      categories: ["COMPANY_PROFILE", "PROPOSAL", "PROJECT_REPORT", "STAFF_CV", "CERTIFICATE", "LEGAL", "FINANCIAL", "TECHNICAL", "OTHER"],
    });

    let status: "MET" | "PARTIAL" | "MISSING" = "MISSING";
    let note: string | undefined;
    const best = matches[0];

    if (best && best.score >= 2.2) {
      status = "MET";
    } else if (best && best.score >= 1.0) {
      status = "PARTIAL";
      note = "Some related evidence found, but it may not fully satisfy this requirement — verify manually.";
    } else {
      note = "No supporting document found in the library. Upload evidence or mark as not applicable.";
    }

    // Expired evidence can never satisfy a requirement
    if (best && status !== "MISSING") {
      const doc = await db.document.findUnique({ where: { id: best.documentId } });
      if (doc?.expiryDate && new Date(doc.expiryDate) < new Date()) {
        status = "MISSING";
        note = `The matching document “${doc.title}” has EXPIRED (${doc.expiryDate.toISOString().slice(0, 10)}). Renew it before submission.`;
      }
    }

    if (status === "MET") met++;
    if (status === "PARTIAL") partial++;

    const risk = status === "MISSING" && r.mandatory ? "HIGH" : status === "PARTIAL" ? "MEDIUM" : "LOW";

    const req = await db.requirement.create({
      data: {
        opportunityId,
        text: r.text,
        category: r.category,
        mandatory: r.mandatory,
        status,
        risk,
        note,
        evidenceDocumentId: status !== "MISSING" && best ? best.documentId : null,
        evidenceSnippet: status !== "MISSING" && best ? best.content.slice(0, 200) : null,
      },
    });
    if (status !== "MISSING" && best) {
      await db.citation.create({
        data: {
          workspaceId,
          documentId: best.documentId,
          chunkId: best.chunkId,
          snippet: best.content.slice(0, 180),
          targetType: "REQUIREMENT",
          targetId: req.id,
        },
      });
    }
  }

  const total = analysis.requirements.length;
  const readinessScore = total === 0 ? null : Math.round(((met + partial * 0.5) / total) * 100);

  await db.opportunity.update({
    where: { id: opportunityId },
    data: {
      client: analysis.client ?? undefined,
      deadline: analysis.deadline ? new Date(analysis.deadline) : undefined,
      value: analysis.value ?? undefined,
      summary: analysis.summary,
      readinessScore,
      status: "IN_PROGRESS",
    },
  });

  return { requirementCount: total, met, partial, missing: total - met - partial, readinessScore };
}
