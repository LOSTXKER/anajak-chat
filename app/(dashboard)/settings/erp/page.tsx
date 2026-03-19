"use client";

import { useState, useEffect, useCallback } from "react";
import { Plug, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ErpConfigForm, type ErpConfig } from "@/components/settings/erp-config-form";
import { SyncLogTable, type SyncLogEntry } from "@/components/settings/sync-log-table";

const PAGE_SIZE = 15;

export default function ERPPage() {
  const { toast } = useToast();
  const [config, setConfig] = useState<ErpConfig>({
    erpBaseUrl: "",
    erpApiKey: "",
    erpWebhookSecret: "",
    erpEnabled: true,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; error?: string } | null>(null);
  const [webhookUrl, setWebhookUrl] = useState("");

  const [logs, setLogs] = useState<SyncLogEntry[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [logsPage, setLogsPage] = useState(1);
  const [totalLogs, setTotalLogs] = useState(0);
  const [typeFilter, setTypeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  useEffect(() => {
    setWebhookUrl(`${window.location.origin}/api/erp-webhooks/order-status`);
    fetch("/api/settings/erp")
      .then((r) => r.json())
      .then((data: ErpConfig) => setConfig(data))
      .finally(() => setLoading(false));
  }, []);

  const fetchLogs = useCallback(async () => {
    setLogsLoading(true);
    const params = new URLSearchParams({
      page: String(logsPage),
      limit: String(PAGE_SIZE),
    });
    if (typeFilter) params.set("type", typeFilter);
    if (statusFilter) params.set("status", statusFilter);
    const res = await fetch(`/api/erp/sync-log?${params}`);
    if (res.ok) {
      const data = await res.json() as { logs: SyncLogEntry[]; total: number };
      setLogs(data.logs);
      setTotalLogs(data.total);
    }
    setLogsLoading(false);
  }, [logsPage, typeFilter, statusFilter]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch("/api/settings/erp", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });
      if (res.ok) {
        toast({ title: "บันทึกการตั้งค่า ERP แล้ว" });
        setTestResult(null);
      } else {
        const err = await res.json() as { error: string };
        toast({ title: "เกิดข้อผิดพลาด", description: err.error, variant: "destructive" });
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleTest() {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await fetch("/api/settings/erp/test", { method: "POST" });
      const data = await res.json() as { success: boolean; error?: string };
      setTestResult(data);
    } finally {
      setTesting(false);
    }
  }

  function copyWebhookUrl(path: string) {
    const url = `${window.location.origin}/api/erp-webhooks/${path}`;
    navigator.clipboard.writeText(url);
    toast({ title: "คัดลอก URL แล้ว" });
  }

  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="mb-6">
        <h1 className="heading-page">ERP Integration</h1>
        <p className="text-sm text-muted-foreground mt-1">
          เชื่อมต่อระบบ ERP เพื่อ sync สินค้า, ลูกค้า, order
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
      <>
      <ErpConfigForm
        config={config}
        onChange={setConfig}
        onSave={handleSave}
        saving={saving}
        onTest={handleTest}
        testing={testing}
        testResult={testResult}
        webhookUrl={webhookUrl}
        onCopyWebhookUrl={copyWebhookUrl}
      />

      <SyncLogTable
        logs={logs}
        loading={logsLoading}
        page={logsPage}
        totalLogs={totalLogs}
        typeFilter={typeFilter}
        statusFilter={statusFilter}
        onPageChange={setLogsPage}
        onTypeFilterChange={(v) => { setTypeFilter(v); setLogsPage(1); }}
        onStatusFilterChange={(v) => { setStatusFilter(v); setLogsPage(1); }}
        onRefresh={fetchLogs}
      />
      </>
      )}
    </div>
  );
}
