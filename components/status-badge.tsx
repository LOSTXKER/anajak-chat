import { cn } from "@/lib/utils";

const STATUS_STYLES: Record<string, string> = {
  open: "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-400",
  pending: "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-400",
  resolved: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400",
  closed: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",
  delivered: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400",
  shipped: "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-400",
  confirmed: "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-400",
  cancelled: "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-400",
  success: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400",
  sent: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400",
  failed: "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-400",
  auto_sent: "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-400",
  approved: "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-400",
  pending_review: "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-400",
  edited: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",
  rejected: "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-400",
  escalated: "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-400",
  active: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400",
  inactive: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",
  retrying: "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-400",
};

interface StatusBadgeProps {
  status: string;
  label?: string;
  className?: string;
}

export function StatusBadge({ status, label, className }: StatusBadgeProps) {
  const style = STATUS_STYLES[status] ?? "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400";
  return (
    <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-medium", style, className)}>
      {label ?? status}
    </span>
  );
}
