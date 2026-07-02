"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  BarChart3,
  Bell,
  BookOpen,
  FileOutput,
  FileSignature,
  FileText,
  HeartPulse,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageSquareText,
  Plus,
  Search,
  Settings,
  Shield,
  ShieldCheck,
  Target,
  X,
} from "lucide-react";
import { BrandLogo } from "@/components/brand-logo";
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

const PRIMARY_NAV = NAV.slice(0, 8);
const SECONDARY_NAV = NAV.slice(8);

export function Sidebar({
  workspaceName,
  userName,
  role,
  isPlatformAdmin,
}: {
  workspaceName: string;
  userName: string;
  role: string;
  isPlatformAdmin?: boolean;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  function isActive(href: string) {
    return pathname === href || pathname.startsWith(href + "/");
  }

  const drawerNav = (
    <div className="flex h-full flex-col">
      <div className="px-5 pb-5 pt-5">
        <BrandLogo />
        <p className="mt-3 text-xs text-cyan-100/[0.55]">{workspaceName}</p>
      </div>
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 pb-4">
        {[...NAV, ...(isPlatformAdmin ? [{ href: "/admin", label: "Platform Admin", icon: Shield }] : [])].map(({ href, label, icon: Icon }) => {
          const active = isActive(href);
          return (
            <Link
              key={href}
              href={href}
              onClick={() => setOpen(false)}
              className={cn(
                "flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium transition",
                active ? "bg-cyan-300/[0.16] text-cyan-100 ring-1 ring-cyan-300/20" : "text-slate-300 hover:bg-white/[0.07] hover:text-white"
              )}
            >
              <Icon size={18} className={active ? "text-cyan-200" : "text-slate-500"} />
              {label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-white/10 px-5 py-4">
        <p className="truncate text-sm font-semibold text-white">{userName}</p>
        <p className="text-xs text-slate-500">{role.charAt(0) + role.slice(1).toLowerCase()}</p>
      </div>
    </div>
  );

  return (
    <>
      <header className="fixed left-4 right-4 top-4 z-40 hidden items-center justify-between rounded-full border border-white/10 bg-[#151518]/[0.72] px-4 py-2.5 shadow-[0_18px_60px_rgba(0,0,0,0.34)] backdrop-blur-2xl lg:left-36 lg:right-8 lg:flex">
        <BrandLogo className="min-w-[210px]" />
        <div className="relative mx-6 hidden max-w-md flex-1 xl:block">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-cyan-100/[0.45]" />
          <input
            className="h-10 w-full rounded-full border border-white/10 bg-black/[0.24] pl-9 pr-4 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-300/[0.45] focus:bg-black/[0.34]"
            placeholder="Search documents, proposals, evidence..."
            type="search"
          />
        </div>
        <div className="flex items-center gap-2">
          <Link className="rounded-full px-3 py-2 text-xs font-semibold text-cyan-200 ring-1 ring-cyan-300/20" href="/dashboard">
            Overview
          </Link>
          <Link className="rounded-full px-3 py-2 text-xs font-semibold text-slate-400 transition hover:bg-white/[0.07] hover:text-white" href="/documents">
            Recent
          </Link>
          <Link className="rounded-full px-3 py-2 text-xs font-semibold text-slate-400 transition hover:bg-white/[0.07] hover:text-white" href="/evidence">
            Evidence
          </Link>
          <button className="grid h-10 w-10 place-items-center rounded-full text-slate-400 transition hover:bg-white/[0.07] hover:text-white" title="Notifications">
            <Bell size={17} />
          </button>
          <button onClick={logout} className="grid h-10 w-10 place-items-center rounded-full text-slate-400 transition hover:bg-white/[0.07] hover:text-white" title="Sign out">
            <LogOut size={17} />
          </button>
          <Link
            href="/opportunities"
            className="ml-1 inline-flex h-10 items-center gap-2 rounded-full bg-cyan-300 px-4 text-xs font-bold text-[#002f39] shadow-[0_0_24px_rgba(0,180,216,0.32)] transition hover:bg-cyan-200"
          >
            <Plus size={15} />
            New analysis
          </Link>
        </div>
      </header>

      <aside className="fixed left-6 top-1/2 z-40 hidden w-20 -translate-y-1/2 flex-col items-center rounded-full border border-white/10 bg-[#131315]/[0.68] px-3 py-6 shadow-[0_0_44px_rgba(0,180,216,0.08)] backdrop-blur-2xl lg:flex">
        <nav className="flex flex-1 flex-col items-center gap-3">
          {PRIMARY_NAV.map(({ href, label, icon: Icon }) => {
            const active = isActive(href);
            return (
              <Link
                key={href}
                href={href}
                aria-label={label}
                title={label}
                className={cn(
                  "grid h-11 w-11 place-items-center rounded-full transition",
                  active
                    ? "scale-105 bg-cyan-300/[0.18] text-cyan-200 shadow-[0_0_18px_rgba(0,180,216,0.28)] ring-1 ring-cyan-300/30"
                    : "text-slate-500 hover:bg-white/[0.07] hover:text-cyan-100"
                )}
              >
                <Icon size={19} />
              </Link>
            );
          })}
        </nav>
        <div className="mt-5 flex flex-col items-center gap-3 border-t border-white/10 pt-5">
          {SECONDARY_NAV.map(({ href, label, icon: Icon }) => {
            const active = isActive(href);
            return (
              <Link
                key={href}
                href={href}
                aria-label={label}
                title={label}
                className={cn(
                  "grid h-11 w-11 place-items-center rounded-full transition",
                  active ? "bg-cyan-300/[0.18] text-cyan-200 ring-1 ring-cyan-300/30" : "text-slate-500 hover:bg-white/[0.07] hover:text-cyan-100"
                )}
              >
                <Icon size={19} />
              </Link>
            );
          })}
          {isPlatformAdmin && (
            <Link
              href="/admin"
              aria-label="Platform Admin"
              title="Platform Admin"
              className={cn(
                "grid h-11 w-11 place-items-center rounded-full transition",
                isActive("/admin") ? "bg-cyan-300/[0.18] text-cyan-200 ring-1 ring-cyan-300/30" : "text-slate-500 hover:bg-white/[0.07] hover:text-cyan-100"
              )}
            >
              <Shield size={19} />
            </Link>
          )}
        </div>
      </aside>

      <div className="fixed inset-x-0 top-0 z-40 flex items-center justify-between border-b border-white/10 bg-[#131315]/[0.86] px-4 py-3 backdrop-blur-2xl lg:hidden">
        <BrandLogo compact />
        <div className="flex items-center gap-2">
          <Link href="/opportunities" className="grid h-10 w-10 place-items-center rounded-full bg-cyan-300 text-[#002f39]" title="New analysis">
            <Plus size={17} />
          </Link>
          <button onClick={() => setOpen((v) => !v)} className="grid h-10 w-10 place-items-center rounded-full border border-white/10 text-slate-300" aria-label="Toggle menu">
            {open ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>

      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <aside className="absolute inset-y-0 left-0 flex w-80 max-w-[86vw] flex-col border-r border-white/10 bg-[#111113] shadow-2xl">{drawerNav}</aside>
        </div>
      )}
    </>
  );
}
