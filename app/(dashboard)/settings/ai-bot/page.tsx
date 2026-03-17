"use client";

import { useState, useEffect, useCallback } from "react";
import { Bot, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { AIBotConfigForm, type BotConfig } from "@/components/settings/ai-bot-config-form";
import { AIReplyLogTable, type ReplyLog } from "@/components/settings/ai-reply-log-table";

const PAGE_SIZE = 15;

export default function AIBotPage() {
  const { toast } = useToast();
  const [config, setConfig] = useState<BotConfig>({
    mode: "off",
    useBusinessHours: false,
    autoMode: "full_auto",
    manualMode: "confirm",
    persona: null,
    escalationMaxRounds: 5,
    escalationOnNegativeSentiment: true,
    escalationOnRefund: true,
    escalationOnLowConfidence: 0.5,
    greetingMessage: null,
    isActive: false,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [logs, setLogs] = useState<ReplyLog[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [logsPage, setLogsPage] = useState(1);
  const [totalLogs, setTotalLogs] = useState(0);
  const [statusFilter, setStatusFilter] = useState("");
  const [editingLog, setEditingLog] = useState<{ id: string; content: string } | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/ai-bot/config")
      .then((r) => r.json())
      .then((data: BotConfig) => setConfig(data))
      .finally(() => setLoading(false));
  }, []);

  const fetchLogs = useCallback(async () => {
    setLogsLoading(true);
    const params = new URLSearchParams({ page: String(logsPage), limit: String(PAGE_SIZE) });
    if (statusFilter) params.set("status", statusFilter);
    const res = await fetch(`/api/ai-bot/reply-log?${params}`);
    if (res.ok) {
      const data = await res.json() as { logs: ReplyLog[]; total: number };
      setLogs(data.logs);
      setTotalLogs(data.total);
    }
    setLogsLoading(false);
  }, [logsPage, statusFilter]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch("/api/ai-bot/config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });
      if (res.ok) {
        toast({ title: "บันทึกการตั้งค่า AI Bot แล้ว" });
      } else {
        const err = await res.json() as { error: string };
        toast({ title: "เกิดข้อผิดพลาด", description: err.error, variant: "destructive" });
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleApprove(logId: string) {
    setActionLoading(logId + "-approve");
    const res = await fetch(`/api/ai-bot/reply-log/${logId}/approve`, { method: "POST" });
    setActionLoading(null);
    if (res.ok) { toast({ title: "ส่งข้อความแล้ว" }); fetchLogs(); }
    else { toast({ title: "เกิดข้อผิดพลาด", variant: "destructive" }); }
  }

  async function handleReject(logId: string) {
    setActionLoading(logId + "-reject");
    const res = await fetch(`/api/ai-bot/reply-log/${logId}/reject`, { method: "POST" });
    setActionLoading(null);
    if (res.ok) { toast({ title: "ปฏิเสธแล้ว" }); fetchLogs(); }
    else { toast({ title: "เกิดข้อผิดพลาด", variant: "destructive" }); }
  }

  async function handleEditSend() {
    if (!editingLog) return;
    setActionLoading(editingLog.id + "-edit");
    const res = await fetch(`/api/ai-bot/reply-log/${editingLog.id}/edit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: editingLog.content }),
    });
    setActionLoading(null);
    if (res.ok) { toast({ title: "ส่งข้อความที่แก้ไขแล้ว" }); setEditingLog(null); fetchLogs(); }
    else { toast({ title: "เกิดข้อผิดพลาด", variant: "destructive" }); }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="overflow-auto h-full">
      <div className="max-w-2xl">
        <div className="mb-6">
          <h1 className="text-lg font-semibold flex items-center gap-2">
            <Bot className="h-5 w-5" />
            AI Bot
          </h1>
          <p className="text-sm text-muted-foreground">ตั้งค่า AI ตอบแชทอัตโนมัติขับเคลื่อนด้วย Gemini</p>
        </div>

        <AIBotConfigForm
          config={config}
          onChange={setConfig}
          onSave={handleSave}
          saving={saving}
        />

        <AIReplyLogTable
          logs={logs}
          loading={logsLoading}
          page={logsPage}
          totalLogs={totalLogs}
          statusFilter={statusFilter}
          editingLog={editingLog}
          actionLoading={actionLoading}
          onPageChange={setLogsPage}
          onStatusFilterChange={(v) => { setStatusFilter(v); setLogsPage(1); }}
          onRefresh={fetchLogs}
          onApprove={handleApprove}
          onReject={handleReject}
          onEditStart={(log) => setEditingLog({ id: log.id, content: log.draftContent })}
          onEditCancel={() => setEditingLog(null)}
          onEditContentChange={(content) => setEditingLog((prev) => prev ? { ...prev, content } : null)}
          onEditSend={handleEditSend}
        />
      </div>
    </div>
  );
}
