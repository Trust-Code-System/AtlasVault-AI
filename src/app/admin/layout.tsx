import Link from "next/link";
import { redirect } from "next/navigation";
import { requireSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { ShieldCheck, ArrowLeft } from "lucide-react";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await requireSession();
  const user = await db.user.findUnique({ where: { id: session.userId }, select: { isPlatformAdmin: true } });
  if (!user?.isPlatformAdmin) redirect("/dashboard");

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-slate-900 text-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
          <div className="flex items-center gap-2.5">
            <ShieldCheck size={18} className="text-emerald-400" />
            <div>
              <p className="text-sm font-semibold leading-tight">AtlasVault Platform Admin</p>
              <p className="text-[11px] leading-tight text-slate-400">Privacy-safe operations view — no customer document content is accessible here</p>
            </div>
          </div>
          <nav className="flex items-center gap-1 text-[13px]">
            <Link href="/admin" className="rounded-lg px-3 py-1.5 font-medium text-slate-200 hover:bg-slate-800">Overview</Link>
            <Link href="/admin/errors" className="rounded-lg px-3 py-1.5 font-medium text-slate-200 hover:bg-slate-800">Errors</Link>
            <Link href="/admin/organizations" className="rounded-lg px-3 py-1.5 font-medium text-slate-200 hover:bg-slate-800">Organizations</Link>
            <Link href="/dashboard" className="ml-3 inline-flex items-center gap-1.5 rounded-lg bg-slate-800 px-3 py-1.5 font-medium text-slate-300 hover:bg-slate-700">
              <ArrowLeft size={13} /> Back to app
            </Link>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-6 py-7">{children}</main>
    </div>
  );
}
