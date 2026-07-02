import { db } from "@/lib/db";
import { Card, Badge } from "@/components/ui";
import { formatDate } from "@/lib/utils";

export default async function AdminErrorsPage() {
  const errors = await db.errorLog.findMany({ orderBy: { createdAt: "desc" }, take: 100 });
  const byCategory = await db.errorLog.groupBy({ by: ["category"], _count: true, orderBy: { _count: { category: "desc" } }, take: 8 });

  return (
    <>
      <h1 className="mb-1 text-xl font-semibold tracking-tight text-slate-900">Error monitoring</h1>
      <p className="mb-5 text-sm text-slate-500">
        Sanitized error reports. Users saw a calm branded message with the reference ID — stack traces exist only here.
      </p>

      <div className="mb-4 flex flex-wrap gap-2">
        {byCategory.map((c) => (
          <Badge key={c.category} tone="slate">{c.category}: {c._count}</Badge>
        ))}
      </div>

      <Card>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 text-left text-xs text-slate-400">
              <th className="px-5 py-3 font-medium">Reference</th>
              <th className="px-3 py-3 font-medium">Severity</th>
              <th className="px-3 py-3 font-medium">Category</th>
              <th className="px-3 py-3 font-medium">Message (sanitized)</th>
              <th className="px-3 py-3 font-medium">Route</th>
              <th className="px-5 py-3 font-medium">When</th>
            </tr>
          </thead>
          <tbody>
            {errors.length === 0 && (
              <tr><td colSpan={6} className="px-5 py-10 text-center text-sm text-slate-400">No errors logged.</td></tr>
            )}
            {errors.map((e) => (
              <tr key={e.id} className="border-b border-slate-50 align-top last:border-0">
                <td className="px-5 py-3 font-mono text-xs text-slate-500">{e.ref}</td>
                <td className="px-3 py-3"><Badge tone={e.severity === "CRITICAL" ? "red" : e.severity === "ERROR" ? "amber" : "slate"}>{e.severity}</Badge></td>
                <td className="px-3 py-3 text-xs text-slate-500">{e.category}</td>
                <td className="max-w-md px-3 py-3 text-[13px] leading-5 text-slate-700">{e.message}</td>
                <td className="px-3 py-3 text-xs text-slate-400">{e.method ?? ""} {e.route ?? "—"}</td>
                <td className="whitespace-nowrap px-5 py-3 text-xs text-slate-400">{formatDate(e.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </>
  );
}
