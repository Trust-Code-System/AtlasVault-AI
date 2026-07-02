import { NextResponse } from "next/server";
import { Document, HeadingLevel, Packer, Paragraph, TextRun } from "docx";
import { db } from "@/lib/db";
import { requireApiRole } from "@/lib/api-auth";
import { can } from "@/lib/rbac";
import { logAudit, logUsage } from "@/lib/audit";
import { detectSensitiveData } from "@/lib/extract";
import { withApi } from "@/lib/errors";
import { buildPdf } from "@/lib/pdf";

export const maxDuration = 60;

/**
 * Export a proposal as PDF, DOCX or Markdown.
 * Trust gate: proposals must be APPROVED before export (human review
 * workflow). Admins/owners may override with ?force=1, which is audit-logged.
 */
export const GET = withApi(async (req: Request, { params }: { params: Promise<{ id: string }> }) => {
  const auth = await requireApiRole("export", "Your role cannot export");
  if (auth.response) return auth.response;
  const { session } = auth;
  const { id } = await params;

  const url = new URL(req.url);
  const requested = url.searchParams.get("format");
  const format = requested === "md" ? "md" : requested === "pdf" ? "pdf" : "docx";
  const force = url.searchParams.get("force") === "1";

  const proposal = await db.proposal.findFirst({
    where: { id, workspaceId: session.workspaceId },
    include: {
      sections: { orderBy: { index: "asc" } },
      opportunity: true,
      workspace: { include: { organization: true } },
    },
  });
  if (!proposal) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const exportableProposal = proposal;

  if (exportableProposal.status !== "APPROVED" && exportableProposal.status !== "EXPORTED") {
    if (!force || !can(session.role, "approve")) {
      return NextResponse.json(
        { error: "This proposal has not been approved for export. Request approval from an admin first — external outputs require human review." },
        { status: 403 }
      );
    }
    await logAudit({ workspaceId: session.workspaceId, userId: session.userId, action: "export.forced_unapproved", targetType: "PROPOSAL", targetId: id, detail: `Admin override: exported unapproved “${exportableProposal.title}”` });
  }

  const allText = exportableProposal.sections.map((s) => s.content).join("\n");
  const sensitiveWarnings = detectSensitiveData(allText);

  const citations = await db.citation.findMany({
    where: { targetType: "PROPOSAL_SECTION", targetId: { in: exportableProposal.sections.map((s) => s.id) } },
    include: { document: { select: { title: true, fileName: true } } },
  });
  const sourceList = Array.from(new Map(citations.map((c) => [c.document.fileName, c.document])).values());

  const fileBase = exportableProposal.title.replace(/[^a-zA-Z0-9 _-]/g, "").replace(/\s+/g, "_").slice(0, 80);

  if (format === "pdf") {
    const buffer = await buildPdf({
      title: exportableProposal.title,
      subtitle: exportableProposal.opportunity?.summary?.slice(0, 220),
      companyName: exportableProposal.workspace.organization.name,
      preparedFor: exportableProposal.opportunity?.client ?? undefined,
      brandColor: exportableProposal.workspace.organization.brandColor,
      sections: exportableProposal.sections.map((s) => ({ title: s.title, content: s.content })),
      sources: sourceList.map((d) => `${d.title} (${d.fileName})`),
      confidentialNotice: true,
    });
    await recordSuccessfulExport();
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${fileBase}.pdf"`,
        ...(sensitiveWarnings.length ? { "X-Sensitive-Warnings": encodeURIComponent(sensitiveWarnings.join("; ")) } : {}),
      },
    });
  }

  if (format === "md") {
    const md = [
      `# ${exportableProposal.title}`,
      `*Prepared by ${exportableProposal.workspace.organization.name} · ${new Date().toISOString().slice(0, 10)}*`,
      "",
      ...exportableProposal.sections.flatMap((s) => [`## ${s.title}`, "", s.content, ""]),
      "---",
      "## Source documents",
      ...sourceList.map((d) => `- ${d.title} (${d.fileName})`),
    ].join("\n");
    await recordSuccessfulExport();
    return new NextResponse(md, {
      headers: {
        "Content-Type": "text/markdown; charset=utf-8",
        "Content-Disposition": `attachment; filename="${fileBase}.md"`,
      },
    });
  }

  // DOCX: convert light markdown to runs (bold via **, strip other markers)
  const children: Paragraph[] = [
    new Paragraph({ text: exportableProposal.title, heading: HeadingLevel.TITLE }),
    new Paragraph({
      children: [new TextRun({ text: `Prepared by ${exportableProposal.workspace.organization.name} — ${new Date().toDateString()}`, italics: true, size: 20 })],
    }),
    new Paragraph({ text: "" }),
  ];

  for (const s of exportableProposal.sections) {
    children.push(new Paragraph({ text: s.title, heading: HeadingLevel.HEADING_1 }));
    for (const rawLine of s.content.split("\n")) {
      const line = rawLine.trim();
      if (!line) continue;
      if (line.startsWith("#")) {
        children.push(new Paragraph({ text: line.replace(/^#+\s*/, ""), heading: HeadingLevel.HEADING_2 }));
        continue;
      }
      const isBullet = /^[-*]\s+/.test(line);
      const text = line.replace(/^[-*]\s+/, "").replace(/^>\s*/, "");
      const runs: TextRun[] = [];
      const parts = text.split(/(\*\*[^*]+\*\*)/g);
      for (const part of parts) {
        if (!part) continue;
        if (part.startsWith("**") && part.endsWith("**")) runs.push(new TextRun({ text: part.slice(2, -2), bold: true }));
        else runs.push(new TextRun({ text: part.replace(/[*_`]/g, "") }));
      }
      children.push(new Paragraph({ children: runs, bullet: isBullet ? { level: 0 } : undefined, spacing: { after: 120 } }));
    }
  }

  children.push(new Paragraph({ text: "Source Documents", heading: HeadingLevel.HEADING_1 }));
  for (const d of sourceList) {
    children.push(new Paragraph({ text: `${d.title} (${d.fileName})`, bullet: { level: 0 } }));
  }

  const doc = new Document({ sections: [{ children }] });
  const buffer = await Packer.toBuffer(doc);

  await recordSuccessfulExport();
  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "Content-Disposition": `attachment; filename="${fileBase}.docx"`,
      ...(sensitiveWarnings.length ? { "X-Sensitive-Warnings": encodeURIComponent(sensitiveWarnings.join("; ")) } : {}),
    },
  });

  async function recordSuccessfulExport() {
    await db.proposal.update({ where: { id }, data: { status: "EXPORTED" } });
    await logAudit({ workspaceId: session.workspaceId, userId: session.userId, action: "proposal.exported", targetType: "PROPOSAL", targetId: id, detail: `Exported “${exportableProposal.title}” as ${format.toUpperCase()}${sensitiveWarnings.length ? ` (sensitive-data warnings: ${sensitiveWarnings.join("; ")})` : ""}` });
    await logUsage({ workspaceId: session.workspaceId, userId: session.userId, kind: "EXPORT", detail: format });
  }
}, "PROPOSAL_EXPORT");
