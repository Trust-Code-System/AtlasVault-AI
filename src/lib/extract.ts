/**
 * Text extraction from uploaded files. PDF via pdf-parse, DOCX via mammoth,
 * plaintext/markdown/csv read directly. OCR for scanned documents is a
 * documented later phase (the Document model already carries what it needs).
 */
export async function extractText(buffer: Buffer, fileName: string, mimeType: string): Promise<string> {
  const ext = fileName.toLowerCase().split(".").pop() ?? "";

  try {
    if (ext === "pdf" || mimeType === "application/pdf") {
      // import the implementation directly to avoid pdf-parse's debug harness
      const pdfParse = (await import("pdf-parse/lib/pdf-parse.js")).default as (b: Buffer) => Promise<{ text: string }>;
      const result = await pdfParse(buffer);
      return result.text ?? "";
    }
    if (ext === "docx" || mimeType.includes("wordprocessingml")) {
      const mammoth = await import("mammoth");
      const result = await mammoth.extractRawText({ buffer });
      return result.value ?? "";
    }
    if (["txt", "md", "markdown", "csv", "html", "htm", "json"].includes(ext) || mimeType.startsWith("text/")) {
      let text = buffer.toString("utf-8");
      if (ext === "html" || ext === "htm") {
        text = text.replace(/<script[\s\S]*?<\/script>/gi, "").replace(/<style[\s\S]*?<\/style>/gi, "").replace(/<[^>]+>/g, " ");
      }
      return text;
    }
  } catch (e) {
    console.error(`extraction failed for ${fileName}`, e);
    return "";
  }
  return "";
}

export const SUPPORTED_EXTENSIONS = ["pdf", "docx", "txt", "md", "csv", "html"];

export function isSupported(fileName: string): boolean {
  const ext = fileName.toLowerCase().split(".").pop() ?? "";
  return SUPPORTED_EXTENSIONS.includes(ext);
}

/** Heuristic detection of sensitive data worth warning about before export. */
export function detectSensitiveData(text: string): string[] {
  const warnings: string[] = [];
  if (/\b\d{10,16}\b/.test(text.replace(/[\s-]/g, ""))) warnings.push("Possible account or ID numbers detected");
  if (/salar(y|ies)|remuneration/i.test(text)) warnings.push("Mentions of salary/remuneration");
  if (/password|api[_\s]?key|secret[_\s]?key/i.test(text)) warnings.push("Possible credentials mentioned");
  if (/confidential|do not distribute|internal only/i.test(text)) warnings.push("Marked confidential");
  return warnings;
}
