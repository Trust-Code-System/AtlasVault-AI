"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Sparkles } from "lucide-react";

export function GenerateOutputButton({ templateKey, templateName }: { templateKey: string; templateName: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function generate() {
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/outputs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ template: templateKey }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        router.push(`/outputs/${data.id}`);
      } else {
        setError(data.error ?? "Generation failed");
        setBusy(false);
      }
    } catch {
      setError("Network error — please try again.");
      setBusy(false);
    }
    router.refresh();
  }

  return (
    <div>
      <button
        onClick={generate}
        disabled={busy}
        className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-brand-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-brand-700 disabled:opacity-60"
      >
        {busy ? <Loader2 size={13} className="animate-spin" /> : <Sparkles size={13} />}
        {busy ? `Compiling ${templateName}…` : `Generate ${templateName}`}
      </button>
      {error && <p className="mt-1.5 text-[11px] text-red-600">{error}</p>}
    </div>
  );
}
