import { Vault } from "lucide-react";
import { cn } from "@/lib/utils";

export function BrandLogo({
  compact = false,
  className,
}: {
  compact?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div className="relative grid h-11 w-11 place-items-center overflow-hidden rounded-2xl border border-cyan-300/30 bg-[#08181f] shadow-[0_0_28px_rgba(0,180,216,0.28)]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_28%_20%,rgba(195,245,255,0.42),transparent_32%),linear-gradient(135deg,rgba(0,180,216,0.95),rgba(0,104,237,0.84)_48%,rgba(88,86,214,0.74))]" />
        <div className="absolute inset-[5px] rounded-[14px] border border-white/30 bg-black/[0.16]" />
        <svg
          className="relative h-7 w-7 text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.45)]"
          fill="none"
          viewBox="0 0 32 32"
          aria-hidden="true"
        >
          <path d="M16 4.4 25.2 8v7.7c0 5.1-3.3 9.6-9.2 12-5.9-2.4-9.2-6.9-9.2-12V8L16 4.4Z" stroke="currentColor" strokeWidth="2" />
          <path d="M10 17.1h12M16 10.8v12.4M11.4 12.4l9.2 9.2M20.6 12.4l-9.2 9.2" stroke="currentColor" strokeLinecap="round" strokeWidth="1.65" />
          <circle cx="16" cy="16.9" r="2.8" fill="currentColor" />
        </svg>
        <Vault className="absolute -bottom-4 -right-4 h-10 w-10 text-white/10" />
      </div>
      {!compact && (
        <div className="min-w-0">
          <p className="truncate text-[15px] font-bold leading-tight text-white">AtlasVault AI</p>
          <p className="truncate text-[11px] font-medium leading-tight text-cyan-100/[0.55]">Intelligence vault</p>
        </div>
      )}
    </div>
  );
}
