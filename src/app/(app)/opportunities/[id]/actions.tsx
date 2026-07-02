"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, RefreshCcw, Sparkles } from "lucide-react";

export function OpportunityActions({ id, hasProposal, status }: { id: string; hasProposal: boolean; status: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function reanalyze() {
    setBusy("Re-analyzing…");
    setError("");
    const res = await fetch(`/api/opportunities/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "reanalyze" }),
    });
    if (!res.ok) setError((await res.json().catch(() => ({}))).error ?? "Failed");
    setBusy(null);
    router.refresh();
  }

  async function generateProposal() {
    setBusy("Generating proposal — drafting sections from your evidence…");
    setError("");
    const res = await fetch("/api/proposals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ opportunityId: id }),
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok) {
      router.push(`/proposals/${data.id}`);
    } else {
      setError(data.error ?? "Generation failed");
      setBusy(null);
    }
    router.refresh();
  }

  async function setStatus(status: string) {
    setBusy("Updating status…");
    await fetch(`/api/opportunities/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "set_status", status }),
    });
    setBusy(null);
    router.refresh();
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex items-center gap-2">
        <select
          value={status}
          disabled={!!busy}
          onChange={(e) => setStatus(e.target.value)}
          title="Track the outcome — win/loss feeds your analytics"
          className="rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-xs font-medium text-slate-600 outline-none hover:bg-slate-50"
        >
          <option value="NEW">New</option>
          <option value="IN_PROGRESS">In progress</option>
          <option value="READY_FOR_REVIEW">Ready for review</option>
          <option value="SUBMITTED">Submitted</option>
          <option value="WON">Won 🎉</option>
          <option value="LOST">Lost</option>
          <option value="ARCHIVED">Archived</option>
        </select>
        <button
          onClick={reanalyze}
          disabled={!!busy}
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
        >
          <RefreshCcw size={13} /> Re-analyze
        </button>
        <button
          onClick={generateProposal}
          disabled={!!busy}
          className="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-brand-700 disabled:opacity-60"
        >
          {busy ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
          {hasProposal ? "Generate new draft" : "Generate proposal"}
        </button>
      </div>
      {busy && <p className="text-xs text-slate-500">{busy}</p>}
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
