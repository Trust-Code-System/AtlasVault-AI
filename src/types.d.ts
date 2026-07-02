declare module "pdf-parse/lib/pdf-parse.js" {
  const pdfParse: (buffer: Buffer) => Promise<{ text: string; numpages: number; info: unknown }>;
  export default pdfParse;
}

declare module "pdfmake" {
  interface PdfmakeOutputDocument {
    getBuffer(): Promise<Buffer>;
    getBase64(): Promise<string>;
  }
  interface PdfmakeServer {
    addFonts(fonts: Record<string, Record<string, string>>): void;
    createPdf(docDefinition: Record<string, unknown>): PdfmakeOutputDocument;
  }
  const pdfmake: PdfmakeServer;
  export default pdfmake;
}
