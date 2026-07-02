import { cn } from "@/lib/utils";

export function Card({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div
      className={cn(
        "rounded-3xl border border-white/10 bg-[#151518]/[0.68] shadow-[0_18px_54px_rgba(0,0,0,0.28)] backdrop-blur-2xl",
        className
      )}
    >
      {children}
    </div>
  );
}

export function CardHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-white/10 px-5 py-4">
      <div>
        <h3 className="text-sm font-semibold text-white">{title}</h3>
        {subtitle && <p className="mt-0.5 text-xs text-slate-400">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function PageHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: React.ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white">{title}</h1>
        {subtitle && <p className="mt-2 max-w-2xl text-sm text-slate-400">{subtitle}</p>}
      </div>
      {action && <div className="flex items-center gap-2">{action}</div>}
    </div>
  );
}

type BadgeTone = "slate" | "green" | "amber" | "red" | "blue" | "violet";
const badgeTones: Record<BadgeTone, string> = {
  slate: "bg-white/[0.07] text-slate-300 ring-white/10",
  green: "bg-emerald-400/[0.12] text-emerald-200 ring-emerald-300/25",
  amber: "bg-amber-400/[0.12] text-amber-200 ring-amber-300/25",
  red: "bg-rose-400/[0.12] text-rose-200 ring-rose-300/25",
  blue: "bg-cyan-300/[0.14] text-cyan-100 ring-cyan-300/25",
  violet: "bg-violet-400/[0.14] text-violet-100 ring-violet-300/25",
};

export function Badge({ tone = "slate", children, className }: { tone?: BadgeTone; children: React.ReactNode; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ring-inset", badgeTones[tone], className)}>
      {children}
    </span>
  );
}

const statusTone: Record<string, BadgeTone> = {
  // documents
  PROCESSING: "amber", PROCESSED: "green", NEEDS_REVIEW: "amber", APPROVED: "green",
  EXPIRED: "red", ARCHIVED: "slate", NEW: "blue",
  // requirements
  MET: "green", PARTIAL: "amber", MISSING: "red", UNKNOWN: "slate",
  // proposals / wiki
  DRAFT: "slate", AI_GENERATED: "violet", EDITED: "blue", EXPORTED: "green",
  REJECTED: "red", PENDING: "amber",
  // opportunities
  ANALYZING: "amber", IN_PROGRESS: "blue", READY_FOR_REVIEW: "violet",
  SUBMITTED: "blue", WON: "green", LOST: "red",
  // confidence
  HIGH: "green", MEDIUM: "amber", LOW: "red",
  // evidence strength
  STRONG: "green", WEAK: "amber",
};

export function StatusBadge({ status, prefix }: { status: string; prefix?: string }) {
  return (
    <Badge tone={statusTone[status] ?? "slate"}>
      {prefix ? `${prefix} ` : ""}
      {status.replace(/_/g, " ").toLowerCase().replace(/^\w/, (c) => c.toUpperCase())}
    </Badge>
  );
}

export function ConfidenceBadge({ level }: { level: string }) {
  return <StatusBadge status={level} prefix="Confidence:" />;
}

export function EmptyState({ icon, title, body, action }: { icon?: React.ReactNode; title: string; body?: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-white/15 bg-white/[0.04] px-6 py-14 text-center">
      {icon && <div className="mb-3 text-slate-500">{icon}</div>}
      <h3 className="text-sm font-semibold text-white">{title}</h3>
      {body && <p className="mt-1 max-w-md text-sm text-slate-400">{body}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function Stat({ label, value, hint, tone }: { label: string; value: React.ReactNode; hint?: string; tone?: "default" | "warn" | "danger" | "good" }) {
  const valueColor =
    tone === "danger" ? "text-rose-300" : tone === "warn" ? "text-amber-300" : tone === "good" ? "text-emerald-300" : "text-white";
  return (
    <Card className="px-5 py-4">
      <p className="text-xs font-semibold uppercase tracking-[0.08em] text-cyan-100/[0.55]">{label}</p>
      <p className={cn("mt-1 text-2xl font-semibold tracking-tight", valueColor)}>{value}</p>
      {hint && <p className="mt-1 text-xs text-slate-400">{hint}</p>}
    </Card>
  );
}

export function ScoreRing({ score, size = 96 }: { score: number; size?: number }) {
  const r = (size - 10) / 2;
  const c = 2 * Math.PI * r;
  const color = score >= 80 ? "#34d399" : score >= 60 ? "#fbbf24" : "#fb7185";
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="shrink-0">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="8" />
      <circle
        cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth="8"
        strokeLinecap="round" strokeDasharray={`${(score / 100) * c} ${c}`}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
      <text x="50%" y="50%" dominantBaseline="central" textAnchor="middle" className="fill-white" fontSize={size / 4.2} fontWeight={700}>
        {score}
      </text>
    </svg>
  );
}
