"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";

interface CollapsibleSectionProps {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  defaultOpen?: boolean;
  action?: React.ReactNode;
  children: React.ReactNode;
}

export function CollapsibleSection({
  title,
  icon: Icon,
  defaultOpen = true,
  action,
  children,
}: CollapsibleSectionProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div>
      <div className="flex w-full items-center gap-1.5 py-1">
        <div
          role="button"
          tabIndex={0}
          aria-expanded={open}
          onClick={() => setOpen(!open)}
          onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") setOpen(!open); }}
          className="flex flex-1 items-center gap-1.5 cursor-pointer"
        >
          {open ? (
            <ChevronDown className="h-3 w-3 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-3 w-3 text-muted-foreground" />
          )}
          <Icon className="h-3 w-3 text-muted-foreground" />
          <span className="text-xs uppercase tracking-wider text-muted-foreground font-semibold flex-1 text-left">
            {title}
          </span>
        </div>
        {action}
      </div>
      {open && <div className="mt-1">{children}</div>}
    </div>
  );
}
