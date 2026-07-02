import { NextResponse } from "next/server";
import { Document as DocxDocument, HeadingLevel, Packer, Paragraph, TextRun } from "docx";
import { db } from "@/lib/db";
import { requireApiRole } from "@/lib/api-auth";
import { can } from "@/lib/rbac";
import { withApi } from "@/lib/errors";
import { buildPdf } from "@/lib/pdf";
import { getWorkspaceSettings } from "@/lib/settings";
import { logAudit, logUsage } from "@/lib/audit";

export const maxDuration = 60;

/** Export a generated output as PDF, DOCX or Markdown (approval-gated when enabled). */
export const GET = withApi(async (req: Request, { params }: { params: Promise<{ id: string }> }) => {
  const auth = await requireApiRole("export", "Your role cannot export");
  if (auth.response) return auth.response;
  const { session } = auth;
  const { id } = await params;

  const url = new URL(req.url);
  const format = (url.searchParams.get("format") ?? "pdf") as "pdf" | "docx" | "md";

  const output = await db.generatedOutput.findFirst({
    where: { id, workspaceId: session.workspaceId },
    include: { workspace: { include: { organization: true } } },
  });
  if (!output) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const settings = await getWorkspaceSettings(session.workspaceId);
  if (settings.exportApprovalRequired && output.status !== "APPROVED" && !can(session.role, "approve")) {
    return NextResponse.json({ error: "This output has not been approved for export. Ask an admin to approve it first." }, { status: 403 });
  }

  const citations = await db.citation.findMany({
    where: { targetType: "OUTPUT", targetId: output.id },
    include: { document: { select: { title: true, fileName: true } } },
  });
  const sources = Array.from(new Map(citations.map((c) => [c.document.fileName, `${c.document.title} (${c.document.fileName})`])).values());

  const org = output.workspace.organization;
  const fileBase = output.title.replace(/[^a-zA-Z0-9 _-]/g, "").replace(/\s+/g, "_").slice(0, 80);

  await logAudit({ workspaceId: session.workspaceId, userId: session.userId, action: "output.exported", targetType: "OUTPUT", targetId: id, detail: `Exported “${output.title}” as ${format.toUpperCase()}` });
  await logUsage({ workspaceId: session.workspaceId, userId: session.userId, kind: "EXPORT", detail: `output:${format}` });

  // split the markdown into sections on ## headings
  const sections = output.content
    .split(/\n(?=## )/)
    .map((block) => {
      const m = block.match(/^##\s+(.+)\n?([\s\S]*)$/);
      return m ? { title: m[1].trim(), content: m[2].trim() } : { title: output.title, content: block.trim() };
    })
    .filter((s) => s.content);

  if (format === "md") {
    const md = `# ${output.title}\n*${org.name} · ${new Date().toISOString().slice(0, 10)}*\n\n${output.content}\n\n---\n## Sources\n${sources.map((s) => `- ${s}`).join("\n")}`;
    return new NextResponse(md, {
      headers: { "Content-Type": "text/markdown; charset=utf-8", "Content-Disposition": `attachment; filename="${fileBase}.md"` },
    });
  }

  if (format === "docx") {
    const children: Paragraph[] = [
      new Paragraph({ text: output.title, heading: HeadingLevel.TITLE }),
      new Paragraph({ children: [new TextRun({ text: `${org.name} — ${new Date().toDateString()}`, italics: true, size: 20 })] }),
    ];
    for (const s of sections) {
      children.push(new Paragraph({ text: s.title, heading: HeadingLevel.HEADING_1 }));
      for (const line of s.content.split("\n")) {
        const t = line.trim();
        if (!t) continue;
        if (t.startsWith("#")) { children.push(new Paragraph({ text: t.replace(/^#+\s*/, ""), heading: HeadingLevel.HEADING_2 })); continue; }
        const isBullet = /^[-*]\s+/.test(t);
        children.push(new Paragraph({ text: t.replace(/^[-*]\s+/, "").replace(/[*_`>]/g, ""), bullet: isBullet ? { level: 0 } : undefined, spacing: { after: 100 } }));
      }
    }
    children.push(new Paragraph({ text: "Sources", heading: HeadingLevel.HEADING_1 }));
    for (const s of sources) children.push(new Paragraph({ text: s, bullet: { level: 0 } }));
    const doc = new DocxDocument({ sections: [{ children }] });
    const buffer = await Packer.toBuffer(doc);
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename="${fileBase}.docx"`,
      },
    });
  }

  // PDF (default)
  const buffer = await buildPdf({
    title: output.title,
    subtitle: `Compiled from ${sources.length} verified company document${sources.length === 1 ? "" : "s"}`,
    companyName: org.name,
    brandColor: org.brandColor,
    sections,
    sources,
    confidentialNotice: true,
  });
  return new NextResponse(new Uint8Array(buffer), {
    headers: { "Content-Type": "application/pdf", "Content-Disposition": `attachment; filename="${fileBase}.pdf"` },
  });
}, "OUTPUT_EXPORT");
