"use client";

import {
  BarChart3, Loader2, RefreshCw, CheckCircle, XCircle,
  RotateCcw, AlertCircle, ChevronLeft, ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { th } from "date-fns/locale";

export interface CapiEvent {
  id: string;
  eventName: string;
  status: "pending" | "sent" | "failed" | "retrying";
  messagingChannel: string;
  retryCount: number;
  errorMessage: string | null;
  sentAt: string | null;
  createdAt: string;
  conversationId: string | null;
  dataset: { datasetId: string; platform: string };
}

const STATUS_STYLES: Record<string, string> = {
  sent: "bg-green-100 text-green-700",
  pending: "bg-yellow-100 text-yellow-700",
  failed: "bg-red-100 text-red-700",
  retrying: "bg-blue-100 text-blue-700",
};

const PAGE_SIZE = 15;

export interface CapiEventLogProps {
  events: CapiEvent[];
  loading: boolean;
  page: number;
  totalEvents: number;
  eventFilter: string;
  statusFilter: string;
  onPageChange: (page: number) => void;
  onEventFilterChange: (filter: string) => void;
  onStatusFilterChange: (status: string) => void;
  onRefresh: () => void;
  onRetry: (id: string) => void;
}

export function CapiEventLog({
  events,
  loading,
  page,
  totalEvents,
  eventFilter,
  statusFilter,
  onPageChange,
  onEventFilterChange,
  onStatusFilterChange,
  onRefresh,
  onRetry,
}: CapiEventLogProps) {
  const totalPages = Math.ceil(totalEvents / PAGE_SIZE);

  return (
    <section>
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">Event Log</h2>
        <div className="flex items-center gap-2">
          <select
            className="h-8 rounded-lg border bg-background px-2 text-xs"
            value={eventFilter}
            onChange={(e) => onEventFilterChange(e.target.value)}
          >
            <option value="">ทุก Event</option>
            {["Purchase", "LeadSubmitted", "OrderCreated", "OrderShipped", "OrderDelivered", "OrderCanceled"].map((n) => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
          <select
            className="h-8 rounded-lg border bg-background px-2 text-xs"
            value={statusFilter}
            onChange={(e) => onStatusFilterChange(e.target.value)}
          >
            <option value="">ทุก Status</option>
            {["sent", "pending", "failed", "retrying"].map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
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
      ) : events.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-10">
          <BarChart3 className="h-8 w-8 text-muted-foreground/30" />
          <p className="mt-2 text-sm text-muted-foreground">ยังไม่มี events</p>
        </div>
      ) : (
        <>
          <div className="rounded-xl border overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="px-4 py-2.5 text-left text-xs text-muted-foreground font-medium">Event</th>
                  <th className="px-4 py-2.5 text-left text-xs text-muted-foreground font-medium">Platform</th>
                  <th className="px-4 py-2.5 text-left text-xs text-muted-foreground font-medium">Status</th>
                  <th className="px-4 py-2.5 text-left text-xs text-muted-foreground font-medium">เวลา</th>
                  <th className="px-4 py-2.5 text-left text-xs text-muted-foreground font-medium">Error</th>
                  <th className="px-4 py-2.5 text-right text-xs text-muted-foreground font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {events.map((event) => (
                  <tr key={event.id} className="border-b last:border-b-0 hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-2.5">
                      <span className="font-medium">{event.eventName}</span>
                      <span className="ml-2 text-xs text-muted-foreground">
                        {event.retryCount > 0 && `(retry ${event.retryCount}x)`}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 capitalize text-xs text-muted-foreground">
                      {event.messagingChannel}
                    </td>
                    <td className="px-4 py-2.5">
                      <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-medium", STATUS_STYLES[event.status])}>
                        <span className="flex items-center gap-1">
                          {event.status === "sent" && <CheckCircle className="h-3 w-3" />}
                          {event.status === "failed" && <XCircle className="h-3 w-3" />}
                          {event.status === "pending" && <AlertCircle className="h-3 w-3" />}
                          {event.status === "retrying" && <RotateCcw className="h-3 w-3" />}
                          {event.status}
                        </span>
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(event.createdAt), { addSuffix: true, locale: th })}
                    </td>
                    <td className="px-4 py-2.5 text-xs text-red-600 max-w-[160px] truncate" title={event.errorMessage ?? undefined}>
                      {event.errorMessage ?? "—"}
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      {event.status === "failed" && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => onRetry(event.id)}
                          title="Retry"
                        >
                          <RotateCcw className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="mt-3 flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                แสดง {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, totalEvents)} จาก {totalEvents}
              </span>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => onPageChange(Math.max(page - 1, 1))}
                  disabled={page === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="px-2 text-xs">
                  {page} / {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-7 w-7"
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
    </section>
  );
}
