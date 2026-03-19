import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface KpiCardProps {
  icon: LucideIcon;
  label: string;
  value: string;
  sub?: string;
  className?: string;
  /** Minimal: no icon chip, light ring, muted hover (e.g. analytics). */
  variant?: "default" | "minimal";
}

export function KpiCard({
  icon: Icon,
  label,
  value,
  sub,
  className,
  variant = "default",
}: KpiCardProps) {
  if (variant === "minimal") {
    return (
      <div
        className={cn(
          "rounded-2xl bg-card p-5 ring-1 ring-border/40 transition-colors hover:bg-muted/50",
          className
        )}
      >
        <div className="mb-3 flex items-center gap-2">
          <Icon className="h-4 w-4 shrink-0 text-primary/80" aria-hidden />
          <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {label}
          </span>
        </div>
        <p className="text-3xl font-bold tabular-nums tracking-tight">{value}</p>
        {sub && <p className="mt-1 text-xs text-muted-foreground">{sub}</p>}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "group rounded-xl border bg-card p-5 transition-all duration-300 hover:shadow-md hover:shadow-primary/5",
        className
      )}
    >
      <div className="mb-3 flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {label}
        </span>
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted transition-colors duration-300 group-hover:bg-primary/15">
          <Icon className="h-4.5 w-4.5 text-muted-foreground" />
        </div>
      </div>
      <p className="text-3xl font-bold tabular-nums tracking-tight">{value}</p>
      {sub && <p className="mt-1 text-xs text-muted-foreground">{sub}</p>}
    </div>
  );
}
