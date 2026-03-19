"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface TabOption<T extends string = string> {
  value: T;
  label: string;
  count?: number;
  alert?: boolean;
}

interface TabBarProps<T extends string = string> {
  tabs: TabOption<T>[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
  role?: string;
}

/** Standardized underline tabs with consistent border-primary active style */
export function TabBar<T extends string = string>({
  tabs,
  value,
  onChange,
  className,
  role = "tablist",
}: TabBarProps<T>) {
  return (
    <div
      className={cn("flex gap-1 border-b", className)}
      role={role}
    >
      {tabs.map((tab) => {
        const isActive = value === tab.value;
        return (
          <button
            key={tab.value}
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(tab.value)}
            className={cn(
              "relative flex flex-1 items-center justify-center gap-1 whitespace-nowrap py-2.5 text-[13px] font-medium border-b-2 -mb-px transition-colors",
              isActive
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            {tab.label}
            {tab.count !== undefined && tab.count > 0 && (
              <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-xs font-bold text-primary-foreground">
                {tab.count}
              </span>
            )}
            {tab.alert && (
              <span className="absolute right-1 top-2 h-2 w-2 rounded-full bg-destructive animate-pulse" />
            )}
          </button>
        );
      })}
    </div>
  );
}
