"use client";

import {
  Plug, Loader2, RefreshCw, ChevronLeft, ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { th } from "date-fns/locale";

export interface SyncLogEntry {
  id: string;
  type: string;
  direction: string;
  status: "success" | "failed";
  entityId: string | null;
  errorMessage: string | null;
  createdAt: string;
}

const TYPE_LABELS: Record<string, string> = {
  product_sync: "Product Sync",
  customer_sync: "Customer Sync",
  order_push: "Order Push",
  webhook_order_status: "Order Status",
  webhook_stock_update: "Stock Update",
  webhook_customer_update: "Customer Update",
};

const PAGE_SIZE = 15;

export interface SyncLogTableProps {
  logs: SyncLogEntry[];
  loading: boolean;
  page: number;
  totalLogs: number;
  typeFilter: string;
  statusFilter: string;
  onPageChange: (page: number) => void;
  onTypeFilterChange: (type: string) => void;
  onStatusFilterChange: (status: string) => void;
  onRefresh: () => void;
}

export function SyncLogTable({
  logs,
  loading,
  page,
  totalLogs,
  typeFilter,
  statusFilter,
  onPageChange,
  onTypeFilterChange,
  onStatusFilterChange,
  onRefresh,
}: SyncLogTableProps) {
  const totalPages = Math.ceil(totalLogs / PAGE_SIZE);

  return (
    <div>
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">Sync Log</h2>
        <div className="flex items-center gap-2">
          <select
            className="h-8 rounded-lg border bg-background px-2 text-xs"
            value={typeFilter}
            onChange={(e) => onTypeFilterChange(e.target.value)}
          >
            <option value="">ทุกประเภท</option>
            {Object.entries(TYPE_LABELS).map(([v, l]) => (
              <option key={v} value={v}>{l}</option>
            ))}
          </select>
          <select
            className="h-8 rounded-lg border bg-background px-2 text-xs"
            value={statusFilter}
            onChange={(e) => onStatusFilterChange(e.target.value)}
          >
            <option value="">ทุก Status</option>
            <option value="success">Success</option>
            <option value="failed">Failed</option>
          </select>
          <Button variant="outline" size="sm" onClick={onRefresh} disabled={loading}>
            <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 py-6 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          กำลังโหลด...
        </div>
      ) : logs.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-10">
          <Plug className="h-8 w-8 text-muted-foreground/30" />
          <p className="mt-2 text-sm text-muted-foreground">ยังไม่มีประวัติ sync</p>
        </div>
      ) : (
        <>
          <div className="rounded-xl border overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="px-3 py-2.5 text-left text-xs text-muted-foreground font-medium">Type</th>
                  <th className="px-3 py-2.5 text-left text-xs text-muted-foreground font-medium">Dir</th>
                  <th className="px-3 py-2.5 text-left text-xs text-muted-foreground font-medium">Status</th>
                  <th className="px-3 py-2.5 text-left text-xs text-muted-foreground font-medium">Entity</th>
                  <th className="px-3 py-2.5 text-left text-xs text-muted-foreground font-medium">เวลา</th>
                  <th className="px-3 py-2.5 text-left text-xs text-muted-foreground font-medium">Error</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id} className="border-b last:border-b-0 hover:bg-muted/30 transition-colors">
                    <td className="px-3 py-2.5 text-xs font-medium">
                      {TYPE_LABELS[log.type] ?? log.type}
                    </td>
                    <td className="px-3 py-2.5">
                      <span className="rounded-full px-2 py-0.5 text-[10px] font-medium bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
                        {log.direction === "inbound" ? "← in" : "→ out"}
                      </span>
                    </td>
                    <td className="px-3 py-2.5">
                      <span className={cn(
                        "rounded-full px-2 py-0.5 text-[10px] font-medium",
                        log.status === "success"
                          ? "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400"
                          : "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400"
                      )}>
                        {log.status}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-xs text-muted-foreground font-mono">
                      {log.entityId ? log.entityId.slice(0, 16) + "..." : "—"}
                    </td>
                    <td className="px-3 py-2.5 text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(log.createdAt), { addSuffix: true, locale: th })}
                    </td>
                    <td className="px-3 py-2.5 text-xs text-red-600 max-w-[120px] truncate" title={log.errorMessage ?? undefined}>
                      {log.errorMessage ?? "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="mt-3 flex items-center justify-between text-sm">
              <span className="text-xs text-muted-foreground">
                {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, totalLogs)} จาก {totalLogs}
              </span>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline" size="icon" className="h-7 w-7"
                  onClick={() => onPageChange(Math.max(page - 1, 1))}
                  disabled={page === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="px-2 text-xs">{page} / {totalPages}</span>
                <Button
                  variant="outline" size="icon" className="h-7 w-7"
                  onClick={() => onPageChange(Math.min(page + 1, totalPages))}
                  disabled={page === totalPages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
