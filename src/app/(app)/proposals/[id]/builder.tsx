"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import ReactMarkdown from "react-markdown";
import {
  CheckCircle2, Download, FileText, Loader2, PencilLine, RefreshCcw, Send, ShieldAlert, X, XCircle,
} from "lucide-react";
import { StatusBadge, ConfidenceBadge, Card } from "@/components/ui";

// ---------------------------------------------------------------- toolbar

export function ProposalToolbar({
  id, status, pendingApproval, canApprove, canExport,
}: {
  id: string; status: string; pendingApproval: boolean; canApprove: boolean; canExport: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  async function approval(action: "request" | "approve" | "reject") {
    setBusy(true);
    setMsg("");
    const res = await fetch(`/api/proposals/${id}/approval`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    if (!res.ok) setMsg((await res.json().catch(() => ({}))).error ?? "Failed");
    setBusy(false);
    router.refresh();
  }

  async function exportFile(format: "pdf" | "docx" | "md") {
    setBusy(true);
    setMsg("");
    const res = await fetch(`/api/proposals/${id}/export?format=${format}`);
    if (!res.ok) {
      setMsg((await res.json().catch(() => ({}))).error ?? "Export blocked");
      setBusy(false);
      return;
    }
    const blob = await res.blob();
    const cd = res.headers.get("Content-Disposition") ?? "";
    const name = cd.match(/filename="([^"]+)"/)?.[1] ?? `proposal.${format}`;
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = name;
    a.click();
    URL.revokeObjectURL(a.href);
    setBusy(false);
    router.refresh();
  }

  const btn = "inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium transition disabled:opacity-50";
  const approved = status === "APPROVED" || status === "EXPORTED";

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex flex-wrap items-center gap-2">
        {!approved && !pendingApproval && (
          <button disabled={busy} onClick={() => approval("request")} className={`${btn} border-slate-200 bg-white text-slate-600 hover:bg-slate-50`}>
            <Send size={13} /> Request approval
          </button>
        )}
        {pendingApproval && !canApprove && <span className="text-xs text-amber-600">Awaiting reviewer approval…</span>}
        {pendingApproval && canApprove && (
          <>
            <button disabled={busy} onClick={() => approval("approve")} className={`${btn} border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100`}>
              <CheckCircle2 size={13} /> Approve
            </button>
            <button disabled={busy} onClick={() => approval("reject")} className={`${btn} border-red-200 bg-white text-red-600 hover:bg-red-50`}>
              <XCircle size={13} /> Reject
            </button>
          </>
        )}
        {canExport && (
          <>
            <button disabled={busy || !approved} title={approved ? "Branded PDF with cover page" : "Approval required before export"} onClick={() => exportFile("pdf")} className={`${btn} ${approved ? "border-brand-600 bg-brand-600 text-white hover:bg-brand-700" : "border-slate-200 bg-slate-100 text-slate-400"}`}>
              {busy ? <Loader2 size={13} className="animate-spin" /> : <Download size={13} />} Branded PDF
            </button>
            <button disabled={busy || !approved} title={approved ? "" : "Approval required before export"} onClick={() => exportFile("docx")} className={`${btn} ${approved ? "border-slate-200 bg-white text-slate-600 hover:bg-slate-50" : "border-slate-200 bg-slate-100 text-slate-400"}`}>
              <Download size={13} /> DOCX
            </button>
            <button disabled={busy || !approved} onClick={() => exportFile("md")} className={`${btn} ${approved ? "border-slate-200 bg-white text-slate-600 hover:bg-slate-50" : "border-slate-200 bg-slate-100 text-slate-400"}`}>
              <Download size={13} /> Markdown
            </button>
          </>
        )}
      </div>
      {msg && <p className="max-w-md text-right text-xs text-red-600">{msg}</p>}
    </div>
  );
}

// ---------------------------------------------------------------- section

type Section = { id: string; title: string; content: string; status: string; confidence: string; missing: string | null };
type Source = { documentId: string; title: string; snippet: string };

export function SectionCard({
  proposalId, section, sources, canEdit, canApprove,
}: {
  proposalId: string; section: Section; sources: Source[]; canEdit: boolean; canApprove: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(section.content);
  const [showSources, setShowSources] = useState(false);

  async function patch(body: Record<string, unknown>, label: string) {
    setBusy(label);
    await fetch(`/api/proposals/${proposalId}/sections/${section.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setBusy(null);
    setEditing(false);
    router.refresh();
  }

  const iconBtn = "inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium text-slate-500 hover:bg-slate-100 hover:text-slate-800 disabled:opacity-50";

  return (
    <Card>
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 px-5 py-3">
        <div className="flex items-center gap-2.5">
          <h3 className="text-sm font-semibold text-slate-900">{section.title}</h3>
          <StatusBadge status={section.status} />
          <ConfidenceBadge level={section.confidence} />
        </div>
        <div className="flex items-center gap-1">
          <button className={iconBtn} onClick={() => setShowSources((v) => !v)}>
            <FileText size={12} /> {sources.length} source{sources.length === 1 ? "" : "s"}
          </button>
          {canEdit && (
            <button className={iconBtn} disabled={!!busy} onClick={() => setEditing(true)}>
              <PencilLine size={12} /> Edit
            </button>
          )}
          {canEdit && (
            <button className={iconBtn} disabled={!!busy} onClick={() => patch({ action: "regenerate" }, "regen")}>
              {busy === "regen" ? <Loader2 size={12} className="animate-spin" /> : <RefreshCcw size={12} />} Regenerate
            </button>
          )}
          {canApprove && section.status !== "APPROVED" && (
            <button className={iconBtn} disabled={!!busy} onClick={() => patch({ action: "approve" }, "approve")}>
              <CheckCircle2 size={12} /> Approve
            </button>
          )}
        </div>
      </div>

      {section.missing && (
        <div className="mx-5 mt-3 flex items-start gap-2 rounded-lg bg-amber-50 px-3 py-2 text-xs leading-5 text-amber-800 ring-1 ring-inset ring-amber-200">
          <ShieldAlert size={13} className="mt-0.5 shrink-0" />
          <span><span className="font-semibold">Missing evidence:</span> {section.missing}</span>
        </div>
      )}

      {editing ? (
        <div className="px-5 py-4">
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            rows={12}
            className="w-full resize-y rounded-lg border border-slate-200 px-3.5 py-3 font-mono text-[13px] leading-6 text-slate-700 outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
          />
          <div className="mt-2 flex justify-end gap-2">
            <button onClick={() => { setEditing(false); setDraft(section.content); }} className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600">
              <X size={12} className="mr-1 inline" />Cancel
            </button>
            <button disabled={!!busy} onClick={() => patch({ action: "edit", content: draft }, "save")} className="rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-700">
              Save section
            </button>
          </div>
        </div>
      ) : (
        <div className="md-body px-5 py-4 text-sm">
          <ReactMarkdown>{section.content}</ReactMarkdown>
        </div>
      )}

      {showSources && (
        <div className="border-t border-slate-100 bg-slate-50/60 px-5 py-3">
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-400">Evidence behind this section</p>
          {sources.length === 0 && <p className="text-xs text-slate-400">No citations recorded — treat all claims in this section as unverified.</p>}
          <div className="space-y-1.5">
            {sources.map((s, i) => (
              <Link key={i} href={`/documents/${s.documentId}`} className="flex items-start gap-2 rounded-lg bg-white px-3 py-2 ring-1 ring-inset ring-slate-100 hover:ring-brand-200">
                <FileText size={13} className="mt-0.5 shrink-0 text-slate-400" />
                <div className="min-w-0">
                  <p className="truncate text-xs font-medium text-slate-700">{s.title}</p>
                  <p className="line-clamp-1 text-[11px] text-slate-400">“{s.snippet}”</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}
