"use client";

import {
  Bot, Loader2, XCircle, RefreshCw,
  ChevronLeft, ChevronRight, Send, Pencil, ThumbsUp, ThumbsDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { EmptyState } from "@/components/empty-state";
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
  auto_sent: { label: "ส่งอัตโนมัติ", cls: "bg-muted text-foreground" },
  pending_review: { label: "รอ approve", cls: "bg-muted text-foreground" },
  approved: { label: "Approved", cls: "bg-muted text-foreground" },
  edited: { label: "Edited", cls: "bg-muted text-foreground" },
  rejected: { label: "Rejected", cls: "bg-muted text-foreground" },
  escalated: { label: "Escalated", cls: "bg-muted text-foreground" },
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
      <div className="mb-4 flex items-center justify-between gap-2">
        <h2 className="heading-section">AI Reply Log</h2>
        <div className="flex items-center gap-2">
          <Select value={statusFilter || "__all__"} onValueChange={(v) => onStatusFilterChange(v === "__all__" ? "" : (v ?? ""))}>
            <SelectTrigger size="sm" className="w-auto">
              <SelectValue placeholder="ทุก Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">ทุก Status</SelectItem>
              {Object.entries(STATUS_LABELS).map(([v, { label }]) => <SelectItem key={v} value={v}>{label}</SelectItem>)}
            </SelectContent>
          </Select>
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
        <EmptyState
          icon={Bot}
          message="ยังไม่มี AI replies"
          description="เปิดใช้งาน AI Bot เพื่อเริ่มดูบันทึก"
        />
      ) : (
        <>
          <div className="rounded-xl border overflow-hidden shadow-sm">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/30">
                  <th className="px-4 py-3 text-left text-xs text-muted-foreground font-medium">ลูกค้า</th>
                  <th className="px-4 py-3 text-left text-xs text-muted-foreground font-medium">คำตอบ AI</th>
                  <th className="px-4 py-3 text-left text-xs text-muted-foreground font-medium">Status</th>
                  <th className="px-4 py-3 text-left text-xs text-muted-foreground font-medium">เวลา</th>
                  <th className="px-4 py-3 w-28"></th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                    <tr key={log.id} className="border-b last:border-b-0 hover:bg-muted/50 transition-colors">
                    <td className="px-4 py-3 text-xs">
                      {log.conversation.contact.displayName ?? "ไม่ระบุ"}
                      <span className="ml-1 text-muted-foreground text-xs">({log.conversation.contact.platform})</span>
                    </td>
                    <td className="px-4 py-3 max-w-[200px]">
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
                    <td className="px-4 py-3">
                      <span className={cn("rounded-xl px-2.5 py-1 text-xs font-semibold", STATUS_LABELS[log.status]?.cls ?? "bg-muted")}>
                        {STATUS_LABELS[log.status]?.label ?? log.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(log.createdAt), { addSuffix: true, locale: th })}
                    </td>
                    <td className="px-4 py-3">
                      {log.status === "pending_review" && (
                        <div className="flex items-center gap-1 justify-end">
                          {editingLog?.id === log.id ? (
                            <>
                              <Button variant="default" size="icon" className="h-6 w-6" onClick={onEditSend} disabled={actionLoading === log.id + "-edit"}>
                                {actionLoading === log.id + "-edit" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                              </Button>
                              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onEditCancel}>
                                <XCircle className="h-3.5 w-3.5" />
                              </Button>
                            </>
                          ) : (
                            <>
                              <Button variant="ghost" size="icon" className="h-6 w-6 text-primary" onClick={() => onApprove(log.id)} disabled={!!actionLoading}>
                                {actionLoading === log.id + "-approve" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ThumbsUp className="h-3.5 w-3.5" />}
                              </Button>
                              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => onEditStart(log)}>
                                <Pencil className="h-3.5 w-3.5" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => onReject(log.id)} disabled={!!actionLoading}>
                                {actionLoading === log.id + "-reject" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ThumbsDown className="h-3.5 w-3.5" />}
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
                <Button variant="outline" size="icon-sm" onClick={() => onPageChange(Math.max(page - 1, 1))} disabled={page === 1}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="px-2 text-xs">{page}/{totalPages}</span>
                <Button variant="outline" size="icon-sm" onClick={() => onPageChange(Math.min(page + 1, totalPages))} disabled={page === totalPages}>
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
