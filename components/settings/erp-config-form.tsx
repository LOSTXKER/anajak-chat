"use client";

import { Save, Loader2, CheckCircle2, XCircle, TestTube, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

export interface ErpConfig {
  erpBaseUrl: string;
  erpApiKey: string;
  erpWebhookSecret: string;
  erpEnabled: boolean;
}

export interface ErpConfigFormProps {
  config: ErpConfig;
  onChange: (updater: (prev: ErpConfig) => ErpConfig) => void;
  onSave: () => void;
  saving: boolean;
  onTest: () => void;
  testing: boolean;
  testResult: { success: boolean; error?: string } | null;
  webhookUrl: string;
  onCopyWebhookUrl: (path: string) => void;
}

export function ErpConfigForm({
  config,
  onChange,
  onSave,
  saving,
  onTest,
  testing,
  testResult,
  webhookUrl,
  onCopyWebhookUrl,
}: ErpConfigFormProps) {
  return (
    <>
      {/* Header actions */}
      <div className="mb-6 flex items-center justify-end gap-2">
        <Button variant="outline" onClick={onTest} disabled={testing || !config.erpBaseUrl}>
          {testing ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <TestTube className="mr-2 h-4 w-4" />
          )}
          Test Connection
        </Button>
        <Button onClick={onSave} disabled={saving} className="rounded-lg">
          {saving ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}
          บันทึก
        </Button>
      </div>

      {/* Test result */}
      {testResult && (
        <div
          className={cn(
            "mb-4 flex items-center gap-2 rounded-xl border p-3 text-sm",
            testResult.success
              ? "border-primary/30 bg-primary/10 text-primary"
              : "border-destructive/30 bg-destructive/10 text-destructive"
          )}
        >
          {testResult.success ? (
            <CheckCircle2 className="h-4 w-4 shrink-0" />
          ) : (
            <XCircle className="h-4 w-4 shrink-0" />
          )}
          {testResult.success
            ? "เชื่อมต่อสำเร็จ!"
            : `เชื่อมต่อไม่สำเร็จ: ${testResult.error}`}
        </div>
      )}

      {/* Config form */}
      <div className="mb-8 space-y-4 rounded-xl border bg-card p-6">
        <div className="flex items-center justify-between">
          <h2 className="heading-section">การตั้งค่าการเชื่อมต่อ</h2>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">เปิดใช้งาน</span>
            <Switch
              checked={config.erpEnabled}
              onCheckedChange={(v) => onChange((prev) => ({ ...prev, erpEnabled: v }))}
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label>ERP Base URL</Label>
          <Input
            className="rounded-lg"
            placeholder="https://erp.example.com/api/v1"
            value={config.erpBaseUrl}
            onChange={(e) => onChange((prev) => ({ ...prev, erpBaseUrl: e.target.value }))}
          />
        </div>

        <div className="space-y-1.5">
          <Label>API Key</Label>
          <Input
            className="rounded-lg"
            type="password"
            placeholder="sk-..."
            value={config.erpApiKey}
            onChange={(e) => onChange((prev) => ({ ...prev, erpApiKey: e.target.value }))}
          />
        </div>

        <div className="space-y-1.5">
          <Label>Webhook Secret (HMAC-SHA256)</Label>
          <Input
            className="rounded-lg"
            type="password"
            placeholder="webhook secret สำหรับ verify signature"
            value={config.erpWebhookSecret}
            onChange={(e) =>
              onChange((prev) => ({ ...prev, erpWebhookSecret: e.target.value }))
            }
          />
          <p className="text-xs text-muted-foreground">
            ERP ต้องส่ง header <code className="font-mono">X-ERP-Signature: sha256=...</code> ทุก webhook request
          </p>
        </div>
      </div>

      {/* Webhook URLs */}
      <div className="mb-8 rounded-xl border bg-card p-6">
        <h2 className="mb-3 heading-section">Webhook URLs สำหรับตั้งค่าใน ERP</h2>
        <div className="space-y-2">
          {[
            { label: "Order Status", path: "order-status" },
            { label: "Stock Update", path: "stock-update" },
            { label: "Customer Update", path: "customer-update" },
          ].map(({ label, path }) => (
            <div key={path} className="flex items-center gap-2">
              <span className="w-36 text-xs font-medium text-muted-foreground">{label}</span>
              <code className="flex-1 rounded bg-muted px-2 py-1 text-xs font-mono truncate">
                {`${webhookUrl.replace("order-status", path)}`}
              </code>
              <Button
                variant="ghost"
                size="icon-sm"
                className="shrink-0"
                onClick={() => onCopyWebhookUrl(path)}
              >
                <Copy className="h-3.5 w-3.5" />
              </Button>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
