/**
 * PDF design engine. Converts markdown business content into a designed
 * pdfmake document: branded cover page, running header/footer with page
 * numbers, typographic hierarchy, tables, callouts and a sources section.
 * Uses PDF standard fonts (Helvetica family) — no font files needed.
 */
import pdfmake from "pdfmake";

pdfmake.addFonts({
  Helvetica: {
    normal: "Helvetica",
    bold: "Helvetica-Bold",
    italics: "Helvetica-Oblique",
    bolditalics: "Helvetica-BoldOblique",
  },
});

type PdfContent = Record<string, unknown> | string | Array<Record<string, unknown> | string>;

export type PdfSection = { title: string; content: string };

export type PdfDocumentSpec = {
  title: string;
  subtitle?: string;
  companyName: string;
  preparedFor?: string;
  brandColor?: string | null;
  sections: PdfSection[];
  sources?: string[];
  confidentialNotice?: boolean;
};

const SLATE = "#334155";
const MUTED = "#64748b";
const LIGHT = "#e2e8f0";

function safeColor(hex: string | null | undefined, fallback = "#2a4fe2"): string {
  if (hex && /^#[0-9a-fA-F]{6}$/.test(hex.trim())) return hex.trim();
  return fallback;
}

// ---------------------------------------------------- markdown → pdfmake

/** Parse inline markdown (bold/italic) into pdfmake text runs. */
function inline(text: string): PdfContent {
  const cleaned = text.replace(/`([^`]*)`/g, "$1");
  const parts = cleaned.split(/(\*\*[^*]+\*\*|\*[^*]+\*|_[^_]+_)/g).filter(Boolean);
  if (parts.length === 1 && !/^(\*\*|\*|_)/.test(parts[0])) return parts[0];
  return parts.map((p) => {
    if (p.startsWith("**") && p.endsWith("**")) return { text: p.slice(2, -2), bold: true };
    if ((p.startsWith("*") && p.endsWith("*")) || (p.startsWith("_") && p.endsWith("_")))
      return { text: p.slice(1, -1), italics: true };
    return { text: p };
  });
}

function isTableSeparator(line: string): boolean {
  return /^\s*\|?[\s:-]+\|[\s|:-]*$/.test(line) && line.includes("-");
}

function parseTableRow(line: string): string[] {
  return line.replace(/^\s*\|/, "").replace(/\|\s*$/, "").split("|").map((c) => c.trim());
}

/** Convert markdown body text into pdfmake content nodes. */
export function markdownToPdfContent(markdown: string, brandColor: string): Array<Record<string, unknown>> {
  const nodes: Array<Record<string, unknown>> = [];
  const lines = markdown.replace(/\r\n/g, "\n").split("\n");
  let i = 0;
  let bullets: string[] = [];
  let numbers: string[] = [];

  const flushLists = () => {
    if (bullets.length) {
      nodes.push({ ul: bullets.map(inline), margin: [0, 2, 0, 8], lineHeight: 1.35 });
      bullets = [];
    }
    if (numbers.length) {
      nodes.push({ ol: numbers.map(inline), margin: [0, 2, 0, 8], lineHeight: 1.35 });
      numbers = [];
    }
  };

  while (i < lines.length) {
    const raw = lines[i];
    const line = raw.trim();

    if (!line) { flushLists(); i++; continue; }

    // table
    if (line.startsWith("|") && i + 1 < lines.length && isTableSeparator(lines[i + 1])) {
      flushLists();
      const header = parseTableRow(line);
      i += 2;
      const rows: string[][] = [];
      while (i < lines.length && lines[i].trim().startsWith("|")) {
        rows.push(parseTableRow(lines[i]));
        i++;
      }
      nodes.push({
        table: {
          headerRows: 1,
          widths: header.map(() => "*"),
          body: [
            header.map((h) => ({ text: h.replace(/\*\*/g, ""), bold: true, color: "#ffffff", fillColor: brandColor, fontSize: 9.5 })),
            ...rows.map((r, ri) =>
              header.map((_, ci) => ({
                text: inline(r[ci] ?? ""),
                fontSize: 9.5,
                fillColor: ri % 2 === 1 ? "#f8fafc" : undefined,
              }))
            ),
          ],
        },
        layout: {
          hLineColor: () => LIGHT, vLineColor: () => LIGHT,
          hLineWidth: () => 0.5, vLineWidth: () => 0.5,
          paddingTop: () => 5, paddingBottom: () => 5, paddingLeft: () => 7, paddingRight: () => 7,
        },
        margin: [0, 4, 0, 10],
      });
      continue;
    }

    // headings
    const h = line.match(/^(#{1,4})\s+(.*)$/);
    if (h) {
      flushLists();
      const level = h[1].length;
      const text = h[2].replace(/\*\*/g, "");
      if (level === 1) nodes.push({ text, fontSize: 15, bold: true, color: SLATE, margin: [0, 14, 0, 6] });
      else if (level === 2) nodes.push({ text, fontSize: 12.5, bold: true, color: SLATE, margin: [0, 12, 0, 5] });
      else nodes.push({ text, fontSize: 11, bold: true, color: MUTED, margin: [0, 10, 0, 4] });
      i++;
      continue;
    }

    // callout (blockquote)
    if (line.startsWith(">")) {
      flushLists();
      const quoteLines: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith(">")) {
        quoteLines.push(lines[i].trim().replace(/^>\s?/, ""));
        i++;
      }
      nodes.push({
        table: { widths: [3, "*"], body: [[{ text: "", fillColor: brandColor }, { text: inline(quoteLines.join(" ")), italics: true, color: SLATE, fontSize: 10 }]] },
        layout: { hLineWidth: () => 0, vLineWidth: () => 0, paddingLeft: () => 8, paddingTop: () => 6, paddingBottom: () => 6 },
        margin: [0, 4, 0, 8],
      });
      continue;
    }

    // lists
    const bullet = line.match(/^[-*]\s+(.*)$/);
    if (bullet) { bullets.push(bullet[1]); i++; continue; }
    const num = line.match(/^\d+[.)]\s+(.*)$/);
    if (num) { numbers.push(num[1]); i++; continue; }

    // horizontal rule
    if (/^(-{3,}|\*{3,})$/.test(line)) {
      flushLists();
      nodes.push({ canvas: [{ type: "line", x1: 0, y1: 0, x2: 455, y2: 0, lineWidth: 0.5, lineColor: LIGHT }], margin: [0, 8, 0, 8] });
      i++;
      continue;
    }

    // paragraph (merge soft-wrapped lines)
    flushLists();
    const para: string[] = [line];
    i++;
    while (i < lines.length && lines[i].trim() && !/^(#|[-*]\s|\d+[.)]\s|\||>)/.test(lines[i].trim())) {
      para.push(lines[i].trim());
      i++;
    }
    nodes.push({ text: inline(para.join(" ")), fontSize: 10, lineHeight: 1.45, color: SLATE, margin: [0, 0, 0, 8] });
  }
  flushLists();
  return nodes;
}

// ---------------------------------------------------------- document build

export async function buildPdf(spec: PdfDocumentSpec): Promise<Buffer> {
  const brand = safeColor(spec.brandColor);
  const today = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

  const content: Array<Record<string, unknown>> = [
    // ---- cover page
    { canvas: [{ type: "rect", x: 0, y: 0, w: 515, h: 6, color: brand }], margin: [0, 0, 0, 140] },
    { text: spec.companyName.toUpperCase(), fontSize: 11, bold: true, color: brand, characterSpacing: 1, margin: [0, 0, 0, 18] },
    { text: spec.title, fontSize: 26, bold: true, color: "#0f172a", lineHeight: 1.15, margin: [0, 0, 0, 10] },
    ...(spec.subtitle ? [{ text: spec.subtitle, fontSize: 12, color: MUTED, lineHeight: 1.4, margin: [0, 0, 0, 26] as number[] }] : []),
    {
      columns: [
        { width: "auto", stack: [
          { text: "PREPARED BY", fontSize: 7.5, bold: true, color: MUTED, characterSpacing: 0.8, margin: [0, 0, 0, 2] },
          { text: spec.companyName, fontSize: 10, color: SLATE },
        ], margin: [0, 0, 40, 0] },
        ...(spec.preparedFor ? [{ width: "auto" as const, stack: [
          { text: "PREPARED FOR", fontSize: 7.5, bold: true, color: MUTED, characterSpacing: 0.8, margin: [0, 0, 0, 2] as number[] },
          { text: spec.preparedFor, fontSize: 10, color: SLATE },
        ], margin: [0, 0, 40, 0] as number[] }] : []),
        { width: "auto", stack: [
          { text: "DATE", fontSize: 7.5, bold: true, color: MUTED, characterSpacing: 0.8, margin: [0, 0, 0, 2] },
          { text: today, fontSize: 10, color: SLATE },
        ] },
      ],
      margin: [0, 30, 0, 0],
    },
    ...(spec.confidentialNotice
      ? [{ text: "This document contains company information intended for the named recipient. Review before external distribution.", fontSize: 8, italics: true, color: MUTED, margin: [0, 60, 0, 0] as number[] }]
      : []),
    { text: "", pageBreak: "after" },
  ];

  // ---- table of contents (only for multi-section documents)
  if (spec.sections.length > 2) {
    content.push({ text: "Contents", fontSize: 15, bold: true, color: SLATE, margin: [0, 0, 0, 10] });
    spec.sections.forEach((s, idx) => {
      content.push({
        columns: [
          { width: 22, text: `${idx + 1}.`, fontSize: 10, color: brand, bold: true },
          { width: "*", text: s.title, fontSize: 10, color: SLATE },
        ],
        margin: [0, 0, 0, 6],
      });
    });
    content.push({ text: "", pageBreak: "after" });
  }

  // ---- sections
  spec.sections.forEach((s, idx) => {
    content.push({
      columns: [
        { width: "auto", text: `${idx + 1}`, fontSize: 16, bold: true, color: brand, margin: [0, 0, 10, 0] },
        { width: "*", text: s.title, fontSize: 16, bold: true, color: "#0f172a" },
      ],
      margin: [0, idx === 0 ? 0 : 18, 0, 4],
    });
    content.push({ canvas: [{ type: "line", x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 1, lineColor: brand }], margin: [0, 0, 0, 10] });
    content.push(...markdownToPdfContent(s.content, brand));
  });

  // ---- sources appendix
  if (spec.sources && spec.sources.length > 0) {
    content.push({ text: "Source Documents", fontSize: 13, bold: true, color: SLATE, margin: [0, 22, 0, 6] });
    content.push({ canvas: [{ type: "line", x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 0.5, lineColor: LIGHT }], margin: [0, 0, 0, 8] });
    content.push({ ul: spec.sources.map((s) => ({ text: s, fontSize: 9, color: MUTED })), lineHeight: 1.4 });
    content.push({ text: "Generated with AtlasVault AI from verified company documents.", fontSize: 8, italics: true, color: MUTED, margin: [0, 16, 0, 0] });
  }

  const docDefinition = {
    info: { title: spec.title, author: spec.companyName, creator: "AtlasVault AI" },
    pageSize: "A4",
    pageMargins: [40, 56, 40, 52] as [number, number, number, number],
    defaultStyle: { font: "Helvetica", fontSize: 10, color: SLATE },
    header: (currentPage: number) =>
      currentPage === 1
        ? undefined
        : {
            columns: [
              { text: spec.companyName, fontSize: 8, color: MUTED },
              { text: spec.title, fontSize: 8, color: MUTED, alignment: "right" },
            ],
            margin: [40, 24, 40, 0],
          },
    footer: (currentPage: number, pageCount: number) =>
      currentPage === 1
        ? undefined
        : {
            columns: [
              { text: today, fontSize: 8, color: MUTED },
              { text: `Page ${currentPage} of ${pageCount}`, fontSize: 8, color: MUTED, alignment: "right" },
            ],
            margin: [40, 20, 40, 0],
          },
    content,
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const doc = pdfmake.createPdf(docDefinition as any);
  return doc.getBuffer();
}
