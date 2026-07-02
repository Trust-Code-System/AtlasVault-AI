"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Vault } from "lucide-react";

const INDUSTRIES = [
  "Software & IT Services", "Construction & Engineering", "Consulting", "Healthcare Services",
  "Education & Training", "Logistics", "NGO / Non-profit", "Legal & Accounting", "Other",
];

export default function SignupPage() {
  const router = useRouter();
  const [inviteToken] = useState(() =>
    typeof window === "undefined" ? "" : new URLSearchParams(window.location.search).get("invite") ?? ""
  );
  const [form, setForm] = useState({ name: "", email: "", password: "", company: "", industry: INDUSTRIES[0], country: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function set<K extends keyof typeof form>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, inviteToken: inviteToken || undefined }),
    });
    if (res.ok) {
      router.push("/dashboard");
      router.refresh();
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Signup failed");
      setLoading(false);
    }
  }

  const inputCls =
    "mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100";

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center">
          <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-brand-600 text-white shadow-card">
            <Vault size={22} />
          </div>
          <h1 className="text-lg font-semibold text-slate-900">{inviteToken ? "Join your company workspace" : "Create your company workspace"}</h1>
          <p className="mt-1 text-center text-sm text-slate-500">
            {inviteToken ? "Create your account to accept this workspace invitation." : "Upload your documents once. Use them to win every opportunity."}
          </p>
        </div>

        <form onSubmit={submit} className="rounded-xl border border-slate-200 bg-white p-6 shadow-card">
          <div className="grid grid-cols-2 gap-4">
            {!inviteToken && (
              <>
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-slate-600">Company name</label>
                  <input value={form.company} onChange={(e) => set("company", e.target.value)} required className={inputCls} placeholder="Acme Engineering Ltd" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600">Industry</label>
                  <select value={form.industry} onChange={(e) => set("industry", e.target.value)} className={inputCls}>
                    {INDUSTRIES.map((i) => <option key={i}>{i}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600">Country</label>
                  <input value={form.country} onChange={(e) => set("country", e.target.value)} className={inputCls} placeholder="Nigeria" />
                </div>
              </>
            )}
            <div className="col-span-2">
              <label className="block text-xs font-medium text-slate-600">Your name</label>
              <input value={form.name} onChange={(e) => set("name", e.target.value)} required className={inputCls} />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-medium text-slate-600">Work email</label>
              <input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} required className={inputCls} />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-medium text-slate-600">Password</label>
              <input type="password" value={form.password} onChange={(e) => set("password", e.target.value)} required minLength={8} className={inputCls} placeholder="At least 8 characters" />
            </div>
          </div>
          {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
          <button type="submit" disabled={loading} className="mt-5 w-full rounded-lg bg-brand-600 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:opacity-60">
            {loading ? (inviteToken ? "Joining workspace..." : "Creating workspace...") : inviteToken ? "Accept invite" : "Create workspace"}
          </button>
          <p className="mt-4 text-center text-xs text-slate-500">
            Already have an account? <Link href="/login" className="font-medium text-brand-600 hover:underline">Sign in</Link>
          </p>
        </form>
      </div>
    </main>
  );
}
