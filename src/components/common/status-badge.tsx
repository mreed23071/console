import { AlertTriangle, CheckCircle2, CircleAlert, XCircle } from "lucide-react";

import { cn } from "@/lib/utils";

export type StatusLevel = "good" | "warning" | "serious" | "critical";

const STYLES: Record<StatusLevel, { wrap: string; dot: string; Icon: typeof CheckCircle2 }> = {
  good: {
    wrap: "bg-[#0CA30C]/12 text-[#076B07] dark:text-[#5FD35F] border-[#0CA30C]/30",
    dot: "text-[#0CA30C]",
    Icon: CheckCircle2,
  },
  warning: {
    wrap: "bg-[#FAB219]/20 text-[#8A5F00] dark:text-[#F5C965] border-[#FAB219]/40",
    dot: "text-[#FAB219]",
    Icon: AlertTriangle,
  },
  serious: {
    wrap: "bg-[#EC835A]/20 text-[#8C3F1B] dark:text-[#F2A683] border-[#EC835A]/40",
    dot: "text-[#EC835A]",
    Icon: CircleAlert,
  },
  critical: {
    wrap: "bg-[#D03B3B]/15 text-[#8A1F1F] dark:text-[#F08A8A] border-[#D03B3B]/40",
    dot: "text-[#D03B3B]",
    Icon: XCircle,
  },
};

export function StatusBadge({
  level,
  label,
  className,
}: {
  level: StatusLevel;
  label: string;
  className?: string;
}) {
  const { wrap, Icon } = STYLES[level];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium whitespace-nowrap",
        wrap,
        className,
      )}
    >
      <Icon className="size-3.5 shrink-0" aria-hidden />
      {label}
    </span>
  );
}

export function StatusPill({
  level,
  title,
  detail,
}: {
  level: StatusLevel;
  title: string;
  detail: string;
}) {
  const { Icon, dot } = STYLES[level];
  return (
    <div className="flex items-center gap-3 rounded-lg border bg-card px-4 py-3">
      <Icon className={cn("size-5 shrink-0", dot)} aria-hidden />
      <div className="min-w-0">
        <p className="text-sm font-medium text-card-foreground">{title}</p>
        <p className="truncate text-xs text-muted-foreground">{detail}</p>
      </div>
    </div>
  );
}
