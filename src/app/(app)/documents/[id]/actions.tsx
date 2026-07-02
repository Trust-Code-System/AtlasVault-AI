"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Lock, LockOpen, Trash2 } from "lucide-react";

export function DocumentActions({ id, status, confidential }: { id: string; status: string; confidential: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function patch(data: Record<string, unknown>) {
    setBusy(true);
    await fetch(`/api/documents/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    setBusy(false);
    router.refresh();
  }

  async function remove() {
    if (!confirm("Delete this document and all of its chunks and citations? This cannot be undone.")) return;
    setBusy(true);
    const res = await fetch(`/api/documents/${id}`, { method: "DELETE" });
    if (res.ok) router.push("/documents");
    else setBusy(false);
    router.refresh();
  }

  const btn = "inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition disabled:opacity-50";

  return (
    <div className="flex items-center gap-2">
      {status !== "APPROVED" && (
        <button disabled={busy} onClick={() => patch({ status: "APPROVED" })} className={`${btn} border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100`}>
          <CheckCircle2 size={13} /> Mark reviewed
        </button>
      )}
      <button disabled={busy} onClick={() => patch({ confidential: !confidential })} className={`${btn} border-slate-200 bg-white text-slate-600 hover:bg-slate-50`}>
        {confidential ? <LockOpen size={13} /> : <Lock size={13} />} {confidential ? "Remove confidential flag" : "Mark confidential"}
      </button>
      <button disabled={busy} onClick={remove} className={`${btn} border-red-200 bg-white text-red-600 hover:bg-red-50`}>
        <Trash2 size={13} /> Delete
      </button>
    </div>
  );
}
