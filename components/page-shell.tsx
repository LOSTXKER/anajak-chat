"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface PageShellProps {
  children: ReactNode;
  className?: string;
}

/** Standard scrollable page wrapper with consistent padding and spacing */
export function PageShell({ children, className }: PageShellProps) {
  return (
    <div
      className={cn(
        "h-full overflow-y-auto p-6 space-y-6",
        className
      )}
    >
      {children}
    </div>
  );
}

interface SplitLayoutProps {
  /** Left (master) panel content */
  master: ReactNode;
  /** Right (detail) panel content */
  detail: ReactNode;
  /** Width of master panel (default 340) */
  masterWidth?: number | string;
  /** When true, master is hidden on mobile (e.g. when detail is selected) */
  hideMasterOnMobile?: boolean;
  /** Additional class for master panel */
  masterClassName?: string;
  /** Additional class for detail panel */
  detailClassName?: string;
  /** Additional class for container */
  className?: string;
}

/** Master-detail split layout with responsive collapse on mobile */
export function SplitLayout({
  master,
  detail,
  masterWidth = 340,
  hideMasterOnMobile = false,
  masterClassName,
  detailClassName,
  className,
}: SplitLayoutProps) {
  const width = typeof masterWidth === "number" ? `${masterWidth}px` : masterWidth;

  return (
    <div
      className={cn(
        "flex h-full overflow-hidden",
        className
      )}
    >
      <aside
        className={cn(
          "shrink-0 flex flex-col overflow-hidden border-r bg-background",
          hideMasterOnMobile && "hidden md:flex",
          masterClassName
        )}
        style={{ width }}
      >
        {master}
      </aside>
      <main className={cn("flex-1 flex flex-col overflow-hidden min-w-0", detailClassName)}>
        {detail}
      </main>
    </div>
  );
}

interface PageToolbarProps {
  children: ReactNode;
  className?: string;
}

/** Standardized toolbar row for filters, search, actions */
export function PageToolbar({ children, className }: PageToolbarProps) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-center justify-end gap-2",
        className
      )}
    >
      {children}
    </div>
  );
}
