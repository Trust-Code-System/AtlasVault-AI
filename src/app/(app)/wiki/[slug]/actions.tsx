"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, PencilLine, X } from "lucide-react";

export function WikiActions({ id, status, canApprove, canEdit, content }: { id: string; status: string; canApprove: boolean; canEdit: boolean; content: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(content);

  async function patch(data: Record<string, unknown>) {
    setBusy(true);
    await fetch(`/api/wiki/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    setBusy(false);
    setEditing(false);
    router.refresh();
  }

  const btn = "inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition disabled:opacity-50";

  if (editing) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-6">
        <div className="flex h-[80vh] w-full max-w-3xl flex-col rounded-xl bg-white shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3">
            <h3 className="text-sm font-semibold text-slate-900">Edit page (markdown)</h3>
            <button onClick={() => setEditing(false)} className="rounded p-1 text-slate-400 hover:bg-slate-100"><X size={16} /></button>
          </div>
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            className="flex-1 resize-none px-5 py-4 font-mono text-[13px] leading-6 text-slate-700 outline-none"
          />
          <div className="flex justify-end gap-2 border-t border-slate-100 px-5 py-3">
            <button onClick={() => setEditing(false)} className={`${btn} border-slate-200 bg-white text-slate-600`}>Cancel</button>
            <button disabled={busy} onClick={() => patch({ content: draft, status: "NEEDS_REVIEW" })} className={`${btn} border-brand-600 bg-brand-600 text-white hover:bg-brand-700`}>
              Save changes
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      {canEdit && (
        <button disabled={busy} onClick={() => setEditing(true)} className={`${btn} border-slate-200 bg-white text-slate-600 hover:bg-slate-50`}>
          <PencilLine size={13} /> Edit
        </button>
      )}
      {canApprove && status !== "APPROVED" && (
        <button disabled={busy} onClick={() => patch({ status: "APPROVED" })} className={`${btn} border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100`}>
          <CheckCircle2 size={13} /> Approve page
        </button>
      )}
    </div>
  );
}
