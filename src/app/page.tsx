import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import {
  Vault, FileText, Target, ShieldCheck, BookOpen, Sparkles, Check,
  Lock, Eye, ClipboardCheck, ArrowRight, HeartPulse, Layers,
} from "lucide-react";

export default async function LandingPage() {
  const session = await getSession();
  if (session) redirect("/dashboard");

  return (
    <main className="bg-white text-slate-900">
      {/* nav */}
      <header className="sticky top-0 z-40 border-b border-slate-100 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3.5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-white"><Vault size={17} /></div>
            <span className="text-sm font-semibold">AtlasVault AI</span>
          </div>
          <nav className="hidden items-center gap-6 text-[13px] font-medium text-slate-600 md:flex">
            <a href="#how" className="hover:text-slate-900">How it works</a>
            <a href="#features" className="hover:text-slate-900">Features</a>
            <a href="#security" className="hover:text-slate-900">Security</a>
            <a href="#pricing" className="hover:text-slate-900">Pricing</a>
          </nav>
          <div className="flex items-center gap-2">
            <Link href="/login" className="rounded-lg px-3.5 py-2 text-[13px] font-medium text-slate-600 hover:bg-slate-50">Sign in</Link>
            <Link href="/signup" className="rounded-lg bg-brand-600 px-3.5 py-2 text-[13px] font-semibold text-white hover:bg-brand-700">Start free</Link>
          </div>
        </div>
      </header>

      {/* hero */}
      <section className="mx-auto max-w-6xl px-6 pb-20 pt-20 text-center">
        <div className="mx-auto mb-5 inline-flex items-center gap-2 rounded-full border border-brand-100 bg-brand-50 px-3.5 py-1.5 text-xs font-medium text-brand-700">
          <Sparkles size={13} /> The AI proposal & tender operating system
        </div>
        <h1 className="mx-auto max-w-3xl text-4xl font-semibold leading-[1.15] tracking-tight md:text-5xl">
          Upload your company documents once.
          <span className="text-brand-600"> Win contracts with them forever.</span>
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-slate-500">
          AtlasVault compiles your scattered documents into a living knowledge base, then generates proposals,
          compliance matrices, and missing-document checklists — with a verified citation behind every claim.
        </p>
        <div className="mt-8 flex items-center justify-center gap-3">
          <Link href="/signup" className="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-5 py-3 text-sm font-semibold text-white shadow-card transition hover:bg-brand-700">
            Create your workspace <ArrowRight size={15} />
          </Link>
          <Link href="/login" className="rounded-lg border border-slate-200 bg-white px-5 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50">
            Try the live demo
          </Link>
        </div>
        <p className="mt-4 text-xs text-slate-400">No credit card required · Demo workspace included · Your documents stay in your workspace</p>

        {/* proof strip */}
        <div className="mx-auto mt-14 grid max-w-4xl grid-cols-2 gap-4 md:grid-cols-4">
          {[
            ["Days → minutes", "First proposal draft"],
            ["Every claim cited", "From your own files"],
            ["Disqualification risks", "Caught before submission"],
            ["Expired certificates", "Flagged automatically"],
          ].map(([big, small]) => (
            <div key={big} className="rounded-xl border border-slate-100 bg-slate-50/60 px-4 py-4">
              <p className="text-sm font-semibold text-slate-900">{big}</p>
              <p className="mt-0.5 text-xs text-slate-500">{small}</p>
            </div>
          ))}
        </div>
      </section>

      {/* how it works */}
      <section id="how" className="border-t border-slate-100 bg-slate-50/50 py-20">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="text-center text-2xl font-semibold tracking-tight">The magic moment, in four steps</h2>
          <p className="mx-auto mt-2 max-w-xl text-center text-sm text-slate-500">
            Teams using legacy RFP tools spend $20,000+ per year and still chase requirements across attachments. AtlasVault does the whole loop.
          </p>
          <div className="mt-12 grid gap-5 md:grid-cols-4">
            {[
              { icon: <FileText size={18} />, title: "1 · Upload documents", body: "Profiles, past proposals, project reports, CVs, certificates. Each file is extracted, summarized and classified." },
              { icon: <BookOpen size={18} />, title: "2 · Compile knowledge", body: "AtlasVault builds a living wiki — overview, services, projects, team, compliance — every page cited to its sources." },
              { icon: <Target size={18} />, title: "3 · Drop in a tender", body: "Requirements are extracted and matched against your evidence. Readiness scored, missing documents listed, risks flagged." },
              { icon: <Sparkles size={18} />, title: "4 · Generate & export", body: "A full proposal draft with citations and confidence per section. Human approval required before branded PDF/DOCX export." },
            ].map((s) => (
              <div key={s.title} className="rounded-xl border border-slate-200 bg-white p-5 shadow-card">
                <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-brand-50 text-brand-600">{s.icon}</div>
                <h3 className="text-sm font-semibold">{s.title}</h3>
                <p className="mt-1.5 text-[13px] leading-5 text-slate-500">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* features */}
      <section id="features" className="py-20">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="text-center text-2xl font-semibold tracking-tight">Built for teams that bid to win</h2>
          <div className="mt-12 grid gap-5 md:grid-cols-3">
            {[
              { icon: <ClipboardCheck size={17} />, title: "Compliance matrix, automatically", body: "Every requirement extracted from the RFP and matched to your evidence — met, partial or missing, with the source document linked. Expired certificates can never satisfy a requirement." },
              { icon: <Layers size={17} />, title: "Evidence library", body: "Project proofs, testimonials, certificates and CVs — tagged by strength, expiry-tracked, and gated for external use. The generator prefers approved evidence." },
              { icon: <Eye size={17} />, title: "Citations on everything", body: "Wiki pages, answers, proposal sections and compliance rows all trace back to real documents. When evidence is missing, the AI says so instead of inventing it." },
              { icon: <HeartPulse size={17} />, title: "Knowledge health score", body: "Continuous checks for expired documents, coverage gaps, weak evidence and unreviewed AI content — so you're tender-ready before the tender arrives." },
              { icon: <ShieldCheck size={17} />, title: "Approval before export", body: "Drafts stay internal until a reviewer approves them. Every generation, approval and export is audit-logged." },
              { icon: <Lock size={17} />, title: "Private by default", body: "Strict workspace isolation. The AI only retrieves documents the current user is allowed to access — never another company's data." },
            ].map((f) => (
              <div key={f.title} className="rounded-xl border border-slate-100 p-5 transition hover:border-brand-200 hover:shadow-card">
                <div className="mb-2.5 flex h-8 w-8 items-center justify-center rounded-lg bg-brand-50 text-brand-600">{f.icon}</div>
                <h3 className="text-sm font-semibold">{f.title}</h3>
                <p className="mt-1.5 text-[13px] leading-5 text-slate-500">{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* security */}
      <section id="security" className="border-t border-slate-100 bg-slate-900 py-20 text-white">
        <div className="mx-auto max-w-6xl px-6">
          <div className="grid items-center gap-10 md:grid-cols-2">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight">Trustworthy enough for your most sensitive documents</h2>
              <p className="mt-3 text-sm leading-6 text-slate-300">
                Companies upload contracts, financials and staff records. That's why trust is engineered in, not promised in a policy page.
              </p>
              <ul className="mt-6 space-y-2.5">
                {[
                  "Workspace isolation on every query — no cross-company retrieval, ever",
                  "Role-based access: Owner, Admin, Member, Viewer",
                  "Confidential documents excluded from restricted-role retrieval",
                  "Human approval required before external export",
                  "Sensitive-data warnings on export",
                  "Complete audit trail: uploads, generations, approvals, exports",
                  "Sanitized error logs — no document content, ever",
                  "Workspace-scoped learning only; no cross-customer training",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2.5 text-[13px] leading-5 text-slate-200">
                    <Check size={15} className="mt-0.5 shrink-0 text-emerald-400" /> {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-2xl border border-slate-700 bg-slate-800/60 p-6">
              <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">The AtlasVault rule</p>
              <p className="mt-3 text-lg font-medium leading-7 text-white">
                "If the user can't open a document, the AI can't use it. If the evidence isn't there, the AI says so."
              </p>
              <p className="mt-4 text-[13px] leading-5 text-slate-400">
                Every answer shows its sources. Every proposal claim maps to a file. Every export needs a human yes.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* pricing */}
      <section id="pricing" className="py-20">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="text-center text-2xl font-semibold tracking-tight">Transparent pricing — no "call sales" wall</h2>
          <p className="mx-auto mt-2 max-w-xl text-center text-sm text-slate-500">
            Legacy RFP platforms start around $20,000/year. AtlasVault starts where growing teams actually are.
          </p>
          <div className="mt-12 grid gap-5 md:grid-cols-4">
            {[
              { name: "Starter", price: "$49", per: "/month", body: "For small teams proving the workflow.", items: ["3 users", "200 documents", "10 AI proposals /mo", "Knowledge base + Ask AI", "PDF & DOCX export"] },
              { name: "Team", price: "$199", per: "/month", body: "For teams bidding every month.", items: ["10 users", "2,000 documents", "50 AI proposals /mo", "Evidence library + health checks", "Approval workflow + audit log"], featured: true },
              { name: "Business", price: "$599", per: "/month", body: "For serious proposal operations.", items: ["25 users", "10,000 documents", "Unlimited proposals", "Output studio + analytics", "Priority support"] },
              { name: "Enterprise", price: "Custom", per: "", body: "For large or regulated organizations.", items: ["Unlimited users", "SSO & custom security review", "Private deployment options", "Custom integrations", "Dedicated support"] },
            ].map((p) => (
              <div key={p.name} className={`rounded-2xl border p-6 ${p.featured ? "border-brand-600 shadow-lg ring-1 ring-brand-600" : "border-slate-200 shadow-card"}`}>
                {p.featured && <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-brand-600">Most popular</p>}
                <h3 className="text-sm font-semibold">{p.name}</h3>
                <p className="mt-2 text-3xl font-semibold tracking-tight">{p.price}<span className="text-sm font-normal text-slate-400">{p.per}</span></p>
                <p className="mt-1.5 text-xs text-slate-500">{p.body}</p>
                <ul className="mt-4 space-y-2">
                  {p.items.map((i) => (
                    <li key={i} className="flex items-start gap-2 text-[13px] text-slate-600">
                      <Check size={14} className="mt-0.5 shrink-0 text-brand-600" /> {i}
                    </li>
                  ))}
                </ul>
                <Link href="/signup" className={`mt-6 block rounded-lg py-2.5 text-center text-sm font-semibold ${p.featured ? "bg-brand-600 text-white hover:bg-brand-700" : "border border-slate-200 text-slate-700 hover:bg-slate-50"}`}>
                  {p.name === "Enterprise" ? "Contact us" : "Start free"}
                </Link>
              </div>
            ))}
          </div>
          <p className="mt-6 text-center text-xs text-slate-400">Billing integration ships with GA — plans shown reflect launch pricing. Local pricing for African SMEs available at launch.</p>
        </div>
      </section>

      {/* final CTA */}
      <section className="border-t border-slate-100 bg-brand-600 py-16 text-center text-white">
        <div className="mx-auto max-w-2xl px-6">
          <h2 className="text-2xl font-semibold tracking-tight">Your company already has the evidence. Put it to work.</h2>
          <p className="mt-3 text-sm text-brand-100">Set up a workspace, upload ten documents, and generate your first cited proposal today.</p>
          <Link href="/signup" className="mt-7 inline-flex items-center gap-1.5 rounded-lg bg-white px-6 py-3 text-sm font-semibold text-brand-700 hover:bg-brand-50">
            Start free <ArrowRight size={15} />
          </Link>
        </div>
      </section>

      <footer className="border-t border-slate-100 py-10">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-6 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-brand-600 text-white"><Vault size={12} /></div>
            <span>AtlasVault AI — company knowledge, compiled.</span>
          </div>
          <div className="flex gap-5">
            <a href="#security" className="hover:text-slate-600">Security</a>
            <a href="#pricing" className="hover:text-slate-600">Pricing</a>
            <Link href="/login" className="hover:text-slate-600">Sign in</Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
