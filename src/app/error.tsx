"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { RefreshCcw, Vault } from "lucide-react";

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const [ref] = useState(() => `ERR-${new Date().getFullYear()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`);

  useEffect(() => {
    // report a sanitized error record; never blocks the user
    fetch("/api/errors", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ref,
        message: error.message?.slice(0, 300) ?? "Client error",
        digest: error.digest,
        route: typeof window !== "undefined" ? window.location.pathname : undefined,
      }),
    }).catch(() => {});
  }, [error, ref]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4 text-center">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-brand-600 text-white shadow-card">
        <Vault size={24} />
      </div>
      <h1 className="text-xl font-semibold text-slate-900">Something didn't go as planned</h1>
      <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
        We couldn't complete this action right now. Please try again — if it continues, share this reference with support:
        <span className="ml-1 font-mono font-semibold text-slate-700">{ref}</span>
      </p>
      <div className="mt-6 flex gap-3">
        <button onClick={reset} className="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700">
          <RefreshCcw size={14} /> Try again
        </button>
        <Link href="/dashboard" className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50">
          Back to dashboard
        </Link>
      </div>
      <p className="mt-8 max-w-sm text-xs text-slate-400">Your documents and data are safe. This report contains no document content.</p>
    </main>
  );
}
