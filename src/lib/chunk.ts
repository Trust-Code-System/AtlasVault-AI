/**
 * Split extracted document text into overlapping chunks suitable for
 * retrieval. Paragraph-aware: prefers to break on blank lines, falls back to
 * sentence boundaries for very long paragraphs.
 */
const TARGET = 1200; // characters per chunk
const OVERLAP = 150;

export function chunkText(text: string): string[] {
  const clean = text.replace(/\r\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
  if (!clean) return [];
  if (clean.length <= TARGET) return [clean];

  const paragraphs = clean.split(/\n\n+/);
  const chunks: string[] = [];
  let current = "";

  const push = () => {
    const trimmed = current.trim();
    if (trimmed.length > 40) chunks.push(trimmed);
    current = "";
  };

  for (const para of paragraphs) {
    if (para.length > TARGET * 1.5) {
      push();
      // split long paragraph on sentences
      const sentences = para.match(/[^.!?]+[.!?]+(\s|$)|[^.!?]+$/g) ?? [para];
      let buf = "";
      for (const s of sentences) {
        if (buf.length + s.length > TARGET) {
          if (buf.trim().length > 40) chunks.push(buf.trim());
          buf = buf.slice(-OVERLAP) + s;
        } else {
          buf += s;
        }
      }
      if (buf.trim().length > 40) chunks.push(buf.trim());
      continue;
    }
    if (current.length + para.length > TARGET) push();
    current += (current ? "\n\n" : "") + para;
  }
  push();
  return chunks;
}
