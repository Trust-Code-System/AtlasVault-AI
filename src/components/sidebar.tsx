"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard, FileText, BookOpen, MessageSquareText, Target, FileSignature,
  ShieldCheck, HeartPulse, Settings, LogOut, Vault, FileOutput, BarChart3, Menu, X, Shield,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/documents", label: "Documents", icon: FileText },
  { href: "/wiki", label: "Knowledge Base", icon: BookOpen },
  { href: "/ask", label: "Ask AI", icon: MessageSquareText },
  { href: "/opportunities", label: "Opportunities", icon: Target },
  { href: "/proposals", label: "Proposals", icon: FileSignature },
  { href: "/outputs", label: "Output Studio", icon: FileOutput },
  { href: "/evidence", label: "Evidence Library", icon: ShieldCheck },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/health", label: "Health Check", icon: HeartPulse },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function Sidebar({
  workspaceName, userName, role, isPlatformAdmin,
}: {
  workspaceName: string; userName: string; role: string; isPlatformAdmin?: boolean;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  const nav = (
    <>
      <div className="flex items-center gap-2.5 px-5 pb-4 pt-5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-white">
          <Vault size={17} />
        </div>
        <div>
          <p className="text-sm font-semibold leading-tight text-slate-900">AtlasVault AI</p>
          <p className="text-[11px] leading-tight text-slate-400">{workspaceName}</p>
        </div>
      </div>

      <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-2">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              onClick={() => setOpen(false)}
              className={cn(
                "flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] font-medium transition-colors",
                active ? "bg-brand-50 text-brand-700" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              )}
            >
              <Icon size={16} className={active ? "text-brand-600" : "text-slate-400"} />
              {label}
            </Link>
          );
        })}
        {isPlatformAdmin && (
          <Link
            href="/admin"
            onClick={() => setOpen(false)}
            className="mt-2 flex items-center gap-2.5 rounded-lg border border-dashed border-slate-200 px-2.5 py-2 text-[13px] font-medium text-slate-500 transition-colors hover:bg-slate-50"
          >
            <Shield size={16} className="text-slate-400" />
            Platform Admin
          </Link>
        )}
      </nav>

      <div className="border-t border-slate-100 px-4 py-3">
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate text-[13px] font-medium text-slate-800">{userName}</p>
            <p className="text-[11px] text-slate-400">{role.charAt(0) + role.slice(1).toLowerCase()}</p>
          </div>
          <button onClick={logout} title="Sign out" className="rounded-lg p-2 text-slate-400 hover:bg-slate-50 hover:text-slate-700">
            <LogOut size={15} />
          </button>
        </div>
      </div>
    </>
  );

  return (
    <>
      {/* mobile top bar */}
      <div className="fixed inset-x-0 top-0 z-40 flex items-center justify-between border-b border-slate-200 bg-white/90 px-4 py-2.5 backdrop-blur lg:hidden">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-600 text-white"><Vault size={14} /></div>
          <span className="text-sm font-semibold text-slate-900">AtlasVault</span>
        </div>
        <button onClick={() => setOpen((v) => !v)} className="rounded-lg p-2 text-slate-500 hover:bg-slate-50" aria-label="Toggle menu">
          {open ? <X size={18} /> : <Menu size={18} />}
        </button>
      </div>

      {/* mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-slate-900/30" onClick={() => setOpen(false)} />
          <aside className="absolute inset-y-0 left-0 flex w-64 flex-col bg-white pt-12 shadow-xl">{nav}</aside>
        </div>
      )}

      {/* desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col border-r border-slate-200 bg-white lg:flex">{nav}</aside>
    </>
  );
}
