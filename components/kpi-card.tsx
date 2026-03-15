import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface KpiCardProps {
  icon: LucideIcon;
  label: string;
  value: string;
  sub?: string;
  color?: string;
}

export function KpiCard({ icon: Icon, label, value, sub, color }: KpiCardProps) {
  return (
    <div className="rounded-xl border bg-card p-5">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-muted-foreground font-medium tracking-wide">{label}</span>
        <Icon className={cn("h-4 w-4", color ?? "text-muted-foreground")} />
      </div>
      <p className="text-3xl font-light">{value}</p>
      {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
    </div>
  );
}
