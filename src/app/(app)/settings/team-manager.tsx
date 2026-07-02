"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { UserPlus } from "lucide-react";

type Member = { id: string; name: string; email: string; role: string };

export function TeamManager({ members, canManage }: { members: Member[]; canManage: boolean }) {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", email: "", role: "MEMBER" });
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  async function invite(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg("");
    const res = await fetch("/api/team", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok) {
      setMsg(data.inviteUrl ? `Invite created. Share this one-time link securely: ${data.inviteUrl}` : "Invite created.");
      setForm({ name: "", email: "", role: "MEMBER" });
    } else {
      setMsg(data.error ?? "Invite failed");
    }
    setBusy(false);
    router.refresh();
  }

  async function changeRole(membershipId: string, role: string) {
    await fetch("/api/team", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ membershipId, role }),
    });
    router.refresh();
  }

  async function remove(membershipId: string) {
    if (!confirm("Remove this member from the workspace?")) return;
    await fetch("/api/team", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ membershipId, remove: true }),
    });
    router.refresh();
  }

  return (
    <div className="px-5 py-4">
      <table className="w-full text-sm">
        <tbody>
          {members.map((m) => (
            <tr key={m.id} className="border-b border-slate-50 last:border-0">
              <td className="py-2.5">
                <p className="font-medium text-slate-800">{m.name}</p>
                <p className="text-xs text-slate-400">{m.email}</p>
              </td>
              <td className="py-2.5 text-right">
                {canManage && m.role !== "OWNER" ? (
                  <div className="flex items-center justify-end gap-2">
                    <select
                      value={m.role}
                      onChange={(e) => changeRole(m.id, e.target.value)}
                      className="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs text-slate-600 outline-none"
                    >
                      <option value="ADMIN">Admin</option>
                      <option value="MEMBER">Member</option>
                      <option value="VIEWER">Viewer</option>
                    </select>
                    <button onClick={() => remove(m.id)} className="text-xs text-red-500 hover:underline">Remove</button>
                  </div>
                ) : (
                  <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                    {m.role.charAt(0) + m.role.slice(1).toLowerCase()}
                  </span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {canManage && (
        <form onSubmit={invite} className="mt-4 flex flex-wrap items-end gap-2 rounded-lg bg-slate-50 p-3">
          <div className="flex-1 min-w-[140px]">
            <label className="text-[11px] font-medium text-slate-500">Name</label>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required className="mt-0.5 w-full rounded-md border border-slate-200 px-2.5 py-1.5 text-xs outline-none focus:border-brand-400" />
          </div>
          <div className="flex-1 min-w-[180px]">
            <label className="text-[11px] font-medium text-slate-500">Email</label>
            <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required className="mt-0.5 w-full rounded-md border border-slate-200 px-2.5 py-1.5 text-xs outline-none focus:border-brand-400" />
          </div>
          <div>
            <label className="text-[11px] font-medium text-slate-500">Role</label>
            <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} className="mt-0.5 rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs outline-none">
              <option value="ADMIN">Admin</option>
              <option value="MEMBER">Member</option>
              <option value="VIEWER">Viewer</option>
            </select>
          </div>
          <button type="submit" disabled={busy} className="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-700 disabled:opacity-50">
            <UserPlus size={13} /> Invite
          </button>
          {msg && <p className="w-full text-xs text-slate-600">{msg}</p>}
        </form>
      )}
    </div>
  );
}
