import Link from "next/link";
import { Vault } from "lucide-react";

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4 text-center">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-brand-600 text-white shadow-card">
        <Vault size={24} />
      </div>
      <p className="text-xs font-semibold uppercase tracking-widest text-brand-600">404</p>
      <h1 className="mt-2 text-xl font-semibold text-slate-900">This page doesn't exist</h1>
      <p className="mt-2 max-w-sm text-sm leading-6 text-slate-500">
        The page may have been moved, or the link may be out of date. Your documents and workspace are unaffected.
      </p>
      <div className="mt-6 flex gap-3">
        <Link href="/dashboard" className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700">
          Go to dashboard
        </Link>
        <Link href="/" className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50">
          Home
        </Link>
      </div>
    </main>
  );
}
