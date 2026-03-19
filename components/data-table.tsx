"use client";

import { Fragment, type ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
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
  expandableContent?: (row: T) => ReactNode;
  expandedRowKey?: string | null;
  onExpandedRowKeyChange?: (key: string | null) => void;
  className?: string;
}

export function DataTable<T extends object>({
  columns,
  data,
  loading,
  keyField = "id",
  emptyIcon,
  emptyMessage = "ไม่มีข้อมูล",
  emptyAction,
  onRowClick,
  rowClassName,
  expandableContent,
  expandedRowKey,
  onExpandedRowKeyChange,
  className,
}: DataTableProps<T>) {
  if (!loading && data.length === 0 && emptyIcon) {
    return <EmptyState icon={emptyIcon} message={emptyMessage} action={emptyAction} />;
  }

  if (!loading && data.length === 0) {
    return <p className="py-10 text-center text-sm text-muted-foreground">{emptyMessage}</p>;
  }

  const getRowKey = (row: T) => String((row as Record<string, unknown>)[keyField]);
  const isExpandable = Boolean(expandableContent);

  return (
    <div className={cn("rounded-2xl border overflow-hidden shadow-sm shadow-black/5", className)}>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-muted/30">
            {columns.map((col) => (
              <th
                key={col.key}
                className={cn("px-4 py-2.5 text-xs font-medium text-muted-foreground", col.headerClassName)}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <tr key={i} className="border-b last:border-b-0">
                {columns.map((col) => (
                  <td key={col.key} className="px-4 py-2.5">
                    <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
                  </td>
                ))}
              </tr>
            ))
          ) : data.map((row) => {
            const rowKey = getRowKey(row);
            const isExpanded = isExpandable && expandedRowKey === rowKey;
            const expandContent = isExpandable && expandableContent?.(row);

            const handleRowClick = () => {
              if (isExpandable && onExpandedRowKeyChange) {
                onExpandedRowKeyChange(isExpanded ? null : rowKey);
              } else {
                onRowClick?.(row);
              }
            };

            return (
              <Fragment key={rowKey}>
                <tr
                  className={cn(
                    "border-b last:border-b-0 hover:bg-muted/30 transition-colors",
                    (onRowClick || isExpandable) && "cursor-pointer",
                    rowClassName?.(row)
                  )}
                  onClick={handleRowClick}
                >
                  {columns.map((col) => (
                    <td key={col.key} className={cn("px-4 py-2.5", col.className)}>
                      {col.render(row)}
                    </td>
                  ))}
                </tr>
                {isExpanded && expandContent && (
                  <tr className="bg-muted border-b">
                    <td colSpan={columns.length} className="px-8 py-3">
                      {expandContent}
                    </td>
                  </tr>
                )}
              </Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
