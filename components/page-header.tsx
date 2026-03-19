import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  className?: string;
}

/** Legacy: full header with title. Prefer PageActions when Navbar shows title. */
export function PageHeader({ title, subtitle, actions, className }: PageHeaderProps) {
  return (
    <div className={cn("flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between", className)}>
      <div>
        <h1 className="heading-page">{title}</h1>
        {subtitle && <p className="text-[15px] text-muted-foreground mt-1">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}

interface PageActionsProps {
  subtitle?: string;
  actions?: ReactNode;
  className?: string;
}

/** Subtitle + actions row only (Navbar handles page title) */
export function PageActions({ subtitle, actions, className }: PageActionsProps) {
  return (
    <div className={cn("flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between", className)}>
      {subtitle && <p className="text-[15px] text-muted-foreground">{subtitle}</p>}
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}
