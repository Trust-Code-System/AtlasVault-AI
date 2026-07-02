"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Palette } from "lucide-react";
import type { WorkspaceSettings } from "@/lib/settings";

const SWATCHES = ["#2a4fe2", "#0f766e", "#7c3aed", "#b91c1c", "#c2410c", "#15803d", "#0f172a", "#9d174d"];

export function BrandKit({ brandColor, brandVoice, canManage }: { brandColor: string | null; brandVoice: string | null; canManage: boolean }) {
  const router = useRouter();
  const [color, setColor] = useState(brandColor ?? "#2a4fe2");
  const [voice, setVoice] = useState(brandVoice ?? "");
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);

  async function save() {
    setBusy(true);
    setSaved(false);
    await fetch("/api/workspace", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ brandColor: color, brandVoice: voice || null }),
    });
    setBusy(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    router.refresh();
  }

  return (
    <div className="px-5 py-4">
      <p className="mb-2 text-xs font-medium text-slate-600">Brand color <span className="text-slate-400">— applied to PDF cover pages, headings and tables</span></p>
      <div className="flex flex-wrap items-center gap-2">
        {SWATCHES.map((s) => (
          <button
            key={s}
            disabled={!canManage}
            onClick={() => setColor(s)}
            className={`h-7 w-7 rounded-lg transition ${color === s ? "ring-2 ring-slate-900 ring-offset-2" : "hover:scale-110"}`}
            style={{ background: s }}
            title={s}
          />
        ))}
        <input
          type="color"
          value={color}
          disabled={!canManage}
          onChange={(e) => setColor(e.target.value)}
          className="h-7 w-9 cursor-pointer rounded border border-slate-200"
          title="Custom color"
        />
        <span className="font-mono text-xs text-slate-400">{color}</span>
      </div>

      <p className="mb-1.5 mt-4 text-xs font-medium text-slate-600">Brand voice <span className="text-slate-400">— guides generated writing (tone, phrases to prefer or avoid)</span></p>
      <textarea
        value={voice}
        disabled={!canManage}
        onChange={(e) => setVoice(e.target.value)}
        rows={3}
        placeholder="e.g. Formal but plain-spoken. Prefer 'we deliver' over 'we aim to'. Never overclaim. British English."
        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-[13px] leading-5 outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100 disabled:bg-slate-50"
      />
      {canManage && (
        <div className="mt-2 flex items-center gap-2">
          <button onClick={save} disabled={busy} className="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-700 disabled:opacity-50">
            {busy ? <Loader2 size={12} className="animate-spin" /> : <Palette size={12} />} Save brand kit
          </button>
          {saved && <span className="text-xs font-medium text-emerald-600">Saved ✓</span>}
        </div>
      )}
    </div>
  );
}

const TOGGLES: { key: keyof WorkspaceSettings; label: string; description: string }[] = [
  { key: "learningEnabled", label: "Workspace learning", description: "Approved answers become workspace memory and improve future answers. Never shared across companies." },
  { key: "exportApprovalRequired", label: "Approval before export", description: "Generated documents must be approved by an admin before they can be exported." },
  { key: "sensitiveWarnings", label: "Sensitive-data warnings", description: "Scan exports for account numbers, salaries, credentials and confidentiality markers." },
  { key: "webResearchEnabled", label: "Public web research", description: "Allow clearly-labeled public web lookups (ships in Phase 2 — this preference is saved now)." },
];

export function AiSettings({ settings, canManage }: { settings: WorkspaceSettings; canManage: boolean }) {
  const router = useRouter();
  const [state, setState] = useState(settings);
  const [busy, setBusy] = useState<string | null>(null);

  async function toggle(key: keyof WorkspaceSettings) {
    if (!canManage) return;
    const next = !state[key];
    setState((s) => ({ ...s, [key]: next }));
    setBusy(key);
    await fetch("/api/workspace", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ settings: { [key]: next } }),
    });
    setBusy(null);
    router.refresh();
  }

  return (
    <div className="divide-y divide-slate-50 px-5">
      {TOGGLES.map((t) => (
        <div key={t.key} className="flex items-start justify-between gap-4 py-3.5">
          <div>
            <p className="text-[13px] font-medium text-slate-800">{t.label}</p>
            <p className="mt-0.5 text-xs leading-5 text-slate-500">{t.description}</p>
          </div>
          <button
            onClick={() => toggle(t.key)}
            disabled={!canManage || busy === t.key}
            className={`relative mt-1 h-5 w-9 shrink-0 rounded-full transition-colors ${state[t.key] ? "bg-brand-600" : "bg-slate-200"} ${!canManage ? "opacity-50" : ""}`}
            aria-checked={state[t.key]}
            role="switch"
          >
            <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all ${state[t.key] ? "left-[18px]" : "left-0.5"}`} />
          </button>
        </div>
      ))}
    </div>
  );
}
