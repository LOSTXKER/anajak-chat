"use client";

import {
  BarChart3, Loader2, RefreshCw, CheckCircle, XCircle,
  RotateCcw, AlertCircle, ChevronLeft, ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
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
  sent: "bg-primary/10 text-primary",
  pending: "bg-warning/10 text-warning",
  failed: "bg-destructive/10 text-destructive",
  retrying: "bg-muted text-muted-foreground",
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
        <h2 className="heading-section">Event Log</h2>
        <div className="flex items-center gap-2">
          <Select value={eventFilter || "__all__"} onValueChange={(v) => onEventFilterChange(v === "__all__" ? "" : (v ?? ""))}>
            <SelectTrigger size="sm" className="w-auto">
              <SelectValue placeholder="ทุก Event" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">ทุก Event</SelectItem>
              {["Purchase", "LeadSubmitted", "OrderCreated", "OrderShipped", "OrderDelivered", "OrderCanceled"].map((n) => (
                <SelectItem key={n} value={n}>{n}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={statusFilter || "__all__"} onValueChange={(v) => onStatusFilterChange(v === "__all__" ? "" : (v ?? ""))}>
            <SelectTrigger size="sm" className="w-auto">
              <SelectValue placeholder="ทุก Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">ทุก Status</SelectItem>
              {["sent", "pending", "failed", "retrying"].map((s) => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
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
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-10">
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
                      <span className={cn("rounded-xl px-2 py-0.5 text-xs font-medium", STATUS_STYLES[event.status])}>
                        <span className="flex items-center gap-1">
                          {event.status === "sent" && <CheckCircle className="h-3.5 w-3.5" />}
                          {event.status === "failed" && <XCircle className="h-3.5 w-3.5" />}
                          {event.status === "pending" && <AlertCircle className="h-3.5 w-3.5" />}
                          {event.status === "retrying" && <RotateCcw className="h-3.5 w-3.5" />}
                          {event.status}
                        </span>
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(event.createdAt), { addSuffix: true, locale: th })}
                    </td>
                    <td className="px-4 py-2.5 text-xs text-destructive max-w-[160px] truncate" title={event.errorMessage ?? undefined}>
                      {event.errorMessage ?? "—"}
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      {event.status === "failed" && (
                        <Button
                          variant="ghost"
                          size="icon-sm"
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
                  size="icon-sm"
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
                  size="icon-sm"
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
