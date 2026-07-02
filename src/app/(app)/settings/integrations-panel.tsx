"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { HardDrive, Mail, MessageSquare, BookOpen, Briefcase, Calculator, FileSignature, Github, Globe } from "lucide-react";

type CatalogItem = {
  key: string;
  name: string;
  category: string;
  scopes: string;
  live: boolean; // false = declared, connector ships Phase 2
  icon: React.ReactNode;
};

const CATALOG: CatalogItem[] = [
  { key: "google-drive", name: "Google Drive", category: "Storage", scopes: "Read selected folders you choose", live: false, icon: <HardDrive size={16} /> },
  { key: "dropbox", name: "Dropbox", category: "Storage", scopes: "Read selected folders you choose", live: false, icon: <HardDrive size={16} /> },
  { key: "onedrive", name: "OneDrive / SharePoint", category: "Storage", scopes: "Read selected folders you choose", live: false, icon: <HardDrive size={16} /> },
  { key: "gmail", name: "Gmail", category: "Communication", scopes: "Read emails you forward to your intake address", live: false, icon: <Mail size={16} /> },
  { key: "outlook", name: "Outlook", category: "Communication", scopes: "Read emails you forward to your intake address", live: false, icon: <Mail size={16} /> },
  { key: "slack", name: "Slack", category: "Communication", scopes: "Send notifications to a channel you pick", live: false, icon: <MessageSquare size={16} /> },
  { key: "teams", name: "Microsoft Teams", category: "Communication", scopes: "Send notifications to a channel you pick", live: false, icon: <MessageSquare size={16} /> },
  { key: "notion", name: "Notion", category: "Productivity", scopes: "Read pages you explicitly share", live: false, icon: <BookOpen size={16} /> },
  { key: "hubspot", name: "HubSpot", category: "CRM", scopes: "Read companies & deals; write activity notes", live: false, icon: <Briefcase size={16} /> },
  { key: "quickbooks", name: "QuickBooks", category: "Finance", scopes: "Read invoices for evidence library", live: false, icon: <Calculator size={16} /> },
  { key: "docusign", name: "DocuSign", category: "Documents", scopes: "Send approved exports for signature", live: false, icon: <FileSignature size={16} /> },
  { key: "github", name: "GitHub", category: "Developer", scopes: "Read repos you select (README, docs)", live: false, icon: <Github size={16} /> },
  { key: "web-research", name: "Public web research", category: "Research", scopes: "Clearly-labeled public web lookups only", live: false, icon: <Globe size={16} /> },
];

export function IntegrationsPanel({ connected, canManage }: { connected: Record<string, string>; canManage: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState("");

  async function act(key: string, action: "enable" | "disable") {
    setBusy(key);
    setMsg("");
    const res = await fetch("/api/integrations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key, action }),
    });
    if (!res.ok) setMsg((await res.json().catch(() => ({}))).error ?? "Failed");
    setBusy(null);
    router.refresh();
  }

  const categories = Array.from(new Set(CATALOG.map((c) => c.category)));

  return (
    <div className="px-5 py-4">
      <p className="mb-4 rounded-lg bg-slate-50 px-3.5 py-2.5 text-xs leading-5 text-slate-500 ring-1 ring-inset ring-slate-100">
        Integrations are <span className="font-semibold text-slate-700">admin-approved, workspace-scoped, audit-logged and revocable</span>.
        Each one declares exactly what it can access. Pre-approve them now; live OAuth connectors ship in Phase 2 and will honor these settings.
      </p>
      {categories.map((cat) => (
        <div key={cat} className="mb-4">
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-400">{cat}</p>
          <div className="grid gap-2 sm:grid-cols-2">
            {CATALOG.filter((c) => c.category === cat).map((item) => {
              const status = connected[item.key];
              const isEnabled = status === "CONNECTED";
              return (
                <div key={item.key} className="flex items-start justify-between gap-3 rounded-lg border border-slate-100 px-3.5 py-3">
                  <div className="flex items-start gap-2.5">
                    <span className="mt-0.5 text-slate-400">{item.icon}</span>
                    <div>
                      <p className="text-[13px] font-medium text-slate-800">
                        {item.name}
                        {isEnabled && <span className="ml-2 rounded-full bg-emerald-50 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-200">Pre-approved</span>}
                      </p>
                      <p className="text-[11px] leading-4 text-slate-400">{item.scopes}</p>
                    </div>
                  </div>
                  {canManage && (
                    <button
                      disabled={busy === item.key}
                      onClick={() => act(item.key, isEnabled ? "disable" : "enable")}
                      className={`shrink-0 rounded-md border px-2.5 py-1 text-[11px] font-medium transition disabled:opacity-50 ${
                        isEnabled ? "border-red-200 text-red-600 hover:bg-red-50" : "border-slate-200 text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      {isEnabled ? "Revoke" : "Pre-approve"}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}
      {msg && <p className="text-xs text-red-600">{msg}</p>}
    </div>
  );
}
