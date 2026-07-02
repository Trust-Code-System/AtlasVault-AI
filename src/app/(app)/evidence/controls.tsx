"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function EvidenceControls({ id, strength, approvedForExternal, canApprove }: { id: string; strength: string; approvedForExternal: boolean; canApprove: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function patch(data: Record<string, unknown>) {
    setBusy(true);
    await fetch("/api/evidence", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, ...data }),
    });
    setBusy(false);
    router.refresh();
  }

  return (
    <div className="flex items-center gap-1.5">
      <select
        disabled={busy}
        value={strength}
        onChange={(e) => patch({ strength: e.target.value })}
        className="rounded-md border border-slate-200 bg-white px-2 py-1 text-[11px] text-slate-600 outline-none"
      >
        <option value="STRONG">Strong</option>
        <option value="WEAK">Weak</option>
        <option value="NEEDS_REVIEW">Needs review</option>
        <option value="EXPIRED">Expired</option>
      </select>
      {canApprove && (
        <button
          disabled={busy}
          onClick={() => patch({ approvedForExternal: !approvedForExternal })}
          className="rounded-md border border-slate-200 bg-white px-2 py-1 text-[11px] font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50"
        >
          {approvedForExternal ? "Revoke external use" : "Approve external use"}
        </button>
      )}
    </div>
  );
}
