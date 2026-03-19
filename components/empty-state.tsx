import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon: LucideIcon;
  message: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({ icon: Icon, message, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center py-16", className)}>
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted/60">
        <Icon className="h-6 w-6 text-muted-foreground" />
      </div>
      <p className="mt-4 heading-section">{message}</p>
      {description && <p className="mt-1 text-sm text-muted-foreground max-w-xs text-center">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
