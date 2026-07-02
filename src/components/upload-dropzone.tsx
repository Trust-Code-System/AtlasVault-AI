"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { UploadCloud, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function UploadDropzone({
  endpoint = "/api/documents",
  hint = "PDF, DOCX, TXT, MD, CSV or HTML — AtlasVault will extract, summarize and classify each file.",
  onDone,
}: {
  endpoint?: string;
  hint?: string;
  onDone?: (result: unknown) => void;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function uploadFiles(files: FileList | File[]) {
    setError("");
    for (const file of Array.from(files)) {
      setBusy(`Processing ${file.name}…`);
      const fd = new FormData();
      fd.append("file", file);
      try {
        const res = await fetch(endpoint, { method: "POST", body: fd });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          setError(data.error ?? `Upload failed for ${file.name}`);
          continue;
        }
        onDone?.(data);
      } catch {
        setError(`Upload failed for ${file.name}`);
      }
    }
    setBusy(null);
    router.refresh();
  }

  return (
    <div>
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => { e.preventDefault(); setDragging(false); if (e.dataTransfer.files.length) uploadFiles(e.dataTransfer.files); }}
        className={cn(
          "flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-10 text-center transition",
          dragging ? "border-brand-400 bg-brand-50" : "border-slate-200 bg-white hover:border-brand-300 hover:bg-brand-50/40"
        )}
      >
        {busy ? (
          <>
            <Loader2 size={22} className="mb-2 animate-spin text-brand-500" />
            <p className="text-sm font-medium text-slate-700">{busy}</p>
            <p className="mt-1 text-xs text-slate-400">Extracting text, generating summary, classifying…</p>
          </>
        ) : (
          <>
            <UploadCloud size={22} className="mb-2 text-brand-500" />
            <p className="text-sm font-medium text-slate-700">Drop company documents here, or click to browse</p>
            <p className="mt-1 max-w-md text-xs text-slate-400">{hint}</p>
          </>
        )}
        <input
          ref={inputRef} type="file" multiple hidden
          accept=".pdf,.docx,.txt,.md,.csv,.html"
          onChange={(e) => e.target.files?.length && uploadFiles(e.target.files)}
        />
      </div>
      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
    </div>
  );
}
