"use client";

import {
  Bot, Loader2, XCircle, RefreshCw,
  ChevronLeft, ChevronRight, Send, Pencil, ThumbsUp, ThumbsDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { th } from "date-fns/locale";

export interface ReplyLog {
  id: string;
  conversationId: string;
  mode: string;
  draftContent: string;
  finalContent: string | null;
  status: string;
  confidence: number;
  shouldEscalate: boolean;
  escalateReason: string | null;
  createdAt: string;
  conversation: {
    id: string;
    contact: { displayName: string | null; platform: string };
  };
}

const STATUS_LABELS: Record<string, { label: string; cls: string }> = {
  auto_sent: { label: "ส่งอัตโนมัติ", cls: "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400" },
  pending_review: { label: "รอ approve", cls: "bg-yellow-100 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-400" },
  approved: { label: "Approved", cls: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400" },
  edited: { label: "Edited", cls: "bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-400" },
  rejected: { label: "Rejected", cls: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400" },
  escalated: { label: "Escalated", cls: "bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-400" },
};

const PAGE_SIZE = 15;

export interface AIReplyLogTableProps {
  logs: ReplyLog[];
  loading: boolean;
  page: number;
  totalLogs: number;
  statusFilter: string;
  editingLog: { id: string; content: string } | null;
  actionLoading: string | null;
  onPageChange: (page: number) => void;
  onStatusFilterChange: (status: string) => void;
  onRefresh: () => void;
  onApprove: (logId: string) => void;
  onReject: (logId: string) => void;
  onEditStart: (log: ReplyLog) => void;
  onEditCancel: () => void;
  onEditContentChange: (content: string) => void;
  onEditSend: () => void;
}

export function AIReplyLogTable({
  logs,
  loading,
  page,
  totalLogs,
  statusFilter,
  editingLog,
  actionLoading,
  onPageChange,
  onStatusFilterChange,
  onRefresh,
  onApprove,
  onReject,
  onEditStart,
  onEditCancel,
  onEditContentChange,
  onEditSend,
}: AIReplyLogTableProps) {
  const totalPages = Math.ceil(totalLogs / PAGE_SIZE);

  return (
    <div>
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="text-lg font-semibold">AI Reply Log</h2>
        <div className="flex items-center gap-2">
          <select
            className="h-8 rounded-lg border bg-background px-2 text-xs"
            value={statusFilter}
            onChange={(e) => onStatusFilterChange(e.target.value)}
          >
            <option value="">ทุก Status</option>
            {Object.entries(STATUS_LABELS).map(([v, { label }]) => <option key={v} value={v}>{label}</option>)}
          </select>
          <Button variant="outline" size="sm" onClick={onRefresh} disabled={loading}>
            <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 py-6 text-muted-foreground text-sm">
          <Loader2 className="h-4 w-4 animate-spin" />
          กำลังโหลด...
        </div>
      ) : logs.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-10">
          <Bot className="h-8 w-8 text-muted-foreground/30" />
          <p className="mt-2 text-sm text-muted-foreground">ยังไม่มี AI replies</p>
        </div>
      ) : (
        <>
          <div className="rounded-xl border overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="px-3 py-2.5 text-left text-xs text-muted-foreground font-medium">ลูกค้า</th>
                  <th className="px-3 py-2.5 text-left text-xs text-muted-foreground font-medium">คำตอบ AI</th>
                  <th className="px-3 py-2.5 text-left text-xs text-muted-foreground font-medium">Status</th>
                  <th className="px-3 py-2.5 text-left text-xs text-muted-foreground font-medium">เวลา</th>
                  <th className="px-3 py-2.5 w-28"></th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id} className="border-b last:border-b-0 hover:bg-muted/30 transition-colors">
                    <td className="px-3 py-2.5 text-xs">
                      {log.conversation.contact.displayName ?? "ไม่ระบุ"}
                      <span className="ml-1 text-muted-foreground text-xs">({log.conversation.contact.platform})</span>
                    </td>
                    <td className="px-3 py-2.5 max-w-[200px]">
                      {editingLog?.id === log.id ? (
                        <Textarea
                          className="text-xs min-h-0 h-16"
                          value={editingLog.content}
                          onChange={(e) => onEditContentChange(e.target.value)}
                        />
                      ) : (
                        <p className="text-xs text-muted-foreground truncate" title={log.draftContent}>
                          {log.draftContent}
                        </p>
                      )}
                    </td>
                    <td className="px-3 py-2.5">
                      <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-medium", STATUS_LABELS[log.status]?.cls ?? "bg-gray-100")}>
                        {STATUS_LABELS[log.status]?.label ?? log.status}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(log.createdAt), { addSuffix: true, locale: th })}
                    </td>
                    <td className="px-3 py-2.5">
                      {log.status === "pending_review" && (
                        <div className="flex items-center gap-1 justify-end">
                          {editingLog?.id === log.id ? (
                            <>
                              <Button variant="default" size="icon" className="h-6 w-6" onClick={onEditSend} disabled={actionLoading === log.id + "-edit"}>
                                {actionLoading === log.id + "-edit" ? <Loader2 className="h-3 w-3 animate-spin" /> : <Send className="h-3 w-3" />}
                              </Button>
                              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onEditCancel}>
                                <XCircle className="h-3 w-3" />
                              </Button>
                            </>
                          ) : (
                            <>
                              <Button variant="ghost" size="icon" className="h-6 w-6 text-green-600" onClick={() => onApprove(log.id)} disabled={!!actionLoading}>
                                {actionLoading === log.id + "-approve" ? <Loader2 className="h-3 w-3 animate-spin" /> : <ThumbsUp className="h-3 w-3" />}
                              </Button>
                              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => onEditStart(log)}>
                                <Pencil className="h-3 w-3" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-6 w-6 text-red-500" onClick={() => onReject(log.id)} disabled={!!actionLoading}>
                                {actionLoading === log.id + "-reject" ? <Loader2 className="h-3 w-3 animate-spin" /> : <ThumbsDown className="h-3 w-3" />}
                              </Button>
                            </>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="mt-3 flex items-center justify-between text-sm">
              <span className="text-xs text-muted-foreground">{(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, totalLogs)} จาก {totalLogs}</span>
              <div className="flex items-center gap-1">
                <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => onPageChange(Math.max(page - 1, 1))} disabled={page === 1}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="px-2 text-xs">{page}/{totalPages}</span>
                <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => onPageChange(Math.min(page + 1, totalPages))} disabled={page === totalPages}>
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
