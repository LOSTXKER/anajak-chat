import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface KpiCardProps {
  icon: LucideIcon;
  label: string;
  value: string;
  sub?: string;
  className?: string;
}

export function KpiCard({ icon: Icon, label, value, sub, className }: KpiCardProps) {
  return (
    <div className={cn("group rounded-xl border bg-card p-5 hover:shadow-md hover:shadow-primary/5 transition-all duration-300", className)}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</span>
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted transition-colors duration-300 group-hover:bg-primary/15">
          <Icon className="h-4.5 w-4.5 text-muted-foreground" />
        </div>
      </div>
      <p className="text-3xl font-bold tabular-nums tracking-tight">{value}</p>
      {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
    </div>
  );
}
