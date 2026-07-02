"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Download, Loader2, PencilLine, X } from "lucide-react";

export function OutputActions({ id, status, canApprove, canEdit, content }: { id: string; status: string; canApprove: boolean; canEdit: boolean; content: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState("");
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(content);

  async function patch(data: Record<string, unknown>) {
    setBusy("save");
    await fetch(`/api/outputs/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    setBusy(null);
    setEditing(false);
    router.refresh();
  }

  async function exportFile(format: "pdf" | "docx" | "md") {
    setBusy(format);
    setMsg("");
    const res = await fetch(`/api/outputs/${id}/export?format=${format}`);
    if (!res.ok) {
      setMsg((await res.json().catch(() => ({}))).error ?? "Export blocked");
      setBusy(null);
      return;
    }
    const blob = await res.blob();
    const cd = res.headers.get("Content-Disposition") ?? "";
    const name = cd.match(/filename="([^"]+)"/)?.[1] ?? `output.${format}`;
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = name;
    a.click();
    URL.revokeObjectURL(a.href);
    setBusy(null);
  }

  const btn = "inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium transition disabled:opacity-50";

  if (editing) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-6">
        <div className="flex h-[80vh] w-full max-w-3xl flex-col rounded-xl bg-white shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3">
            <h3 className="text-sm font-semibold text-slate-900">Edit output (markdown)</h3>
            <button onClick={() => setEditing(false)} className="rounded p-1 text-slate-400 hover:bg-slate-100"><X size={16} /></button>
          </div>
          <textarea value={draft} onChange={(e) => setDraft(e.target.value)} className="flex-1 resize-none px-5 py-4 font-mono text-[13px] leading-6 text-slate-700 outline-none" />
          <div className="flex justify-end gap-2 border-t border-slate-100 px-5 py-3">
            <button onClick={() => setEditing(false)} className={`${btn} border-slate-200 bg-white text-slate-600`}>Cancel</button>
            <button disabled={!!busy} onClick={() => patch({ content: draft })} className={`${btn} border-brand-600 bg-brand-600 text-white hover:bg-brand-700`}>Save changes</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex flex-wrap items-center gap-2">
        {canEdit && (
          <button disabled={!!busy} onClick={() => setEditing(true)} className={`${btn} border-slate-200 bg-white text-slate-600 hover:bg-slate-50`}>
            <PencilLine size={13} /> Edit
          </button>
        )}
        {canApprove && status !== "APPROVED" && (
          <button disabled={!!busy} onClick={() => patch({ status: "APPROVED" })} className={`${btn} border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100`}>
            <CheckCircle2 size={13} /> Approve
          </button>
        )}
        <button disabled={!!busy} onClick={() => exportFile("pdf")} className={`${btn} border-brand-600 bg-brand-600 text-white hover:bg-brand-700`}>
          {busy === "pdf" ? <Loader2 size={13} className="animate-spin" /> : <Download size={13} />} Branded PDF
        </button>
        <button disabled={!!busy} onClick={() => exportFile("docx")} className={`${btn} border-slate-200 bg-white text-slate-600 hover:bg-slate-50`}>
          {busy === "docx" ? <Loader2 size={13} className="animate-spin" /> : <Download size={13} />} DOCX
        </button>
      </div>
      {msg && <p className="max-w-md text-right text-xs text-red-600">{msg}</p>}
    </div>
  );
}
