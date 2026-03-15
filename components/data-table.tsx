"use client";

import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { Loader2 } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { cn } from "@/lib/utils";

export interface Column<T> {
  key: string;
  header: string;
  className?: string;
  headerClassName?: string;
  render: (row: T) => ReactNode;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  loading?: boolean;
  keyField?: string;
  emptyIcon?: LucideIcon;
  emptyMessage?: string;
  emptyAction?: ReactNode;
  onRowClick?: (row: T) => void;
  rowClassName?: (row: T) => string;
}

export function DataTable<T extends Record<string, unknown>>({
  columns,
  data,
  loading,
  keyField = "id",
  emptyIcon,
  emptyMessage = "ไม่มีข้อมูล",
  emptyAction,
  onRowClick,
  rowClassName,
}: DataTableProps<T>) {
  if (loading) {
    return (
      <div className="flex items-center gap-2 py-10 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
        กำลังโหลด...
      </div>
    );
  }

  if (data.length === 0 && emptyIcon) {
    return <EmptyState icon={emptyIcon} message={emptyMessage} action={emptyAction} />;
  }

  if (data.length === 0) {
    return <p className="py-10 text-center text-sm text-muted-foreground">{emptyMessage}</p>;
  }

  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b">
          {columns.map((col) => (
            <th
              key={col.key}
              className={cn("px-3 py-2.5 text-left text-xs text-muted-foreground font-medium", col.headerClassName)}
            >
              {col.header}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {data.map((row) => (
          <tr
            key={String(row[keyField])}
            className={cn(
              "border-b last:border-b-0 hover:bg-muted/30 transition-colors",
              onRowClick && "cursor-pointer",
              rowClassName?.(row)
            )}
            onClick={() => onRowClick?.(row)}
          >
              {columns.map((col) => (
                <td key={col.key} className={cn("px-3 py-2.5", col.className)}>
                  {col.render(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
  );
}
