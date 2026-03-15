"use client";

import { useState, useEffect } from "react";
import { Loader2, Save, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface SlaRow {
  priority: "urgent" | "high" | "medium" | "low";
  firstResponseMinutes: number;
  resolutionMinutes: number;
  isActive: boolean;
  escalateTo: string | null;
}

const PRIORITY_META = {
  urgent: { label: "Urgent", color: "text-red-600", bg: "bg-red-50", border: "border-red-200" },
  high: { label: "High", color: "text-orange-600", bg: "bg-orange-50", border: "border-orange-200" },
  medium: { label: "Medium", color: "text-yellow-600", bg: "bg-yellow-50", border: "border-yellow-200" },
  low: { label: "Low", color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-200" },
};

const PRIORITY_ORDER: SlaRow["priority"][] = ["urgent", "high", "medium", "low"];

export default function SLAPage() {
  const { toast } = useToast();
  const [rows, setRows] = useState<SlaRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/settings/sla")
      .then((r) => r.json())
      .then((data: SlaRow[]) => {
        // Ensure all 4 priorities exist
        const map = new Map(data.map((r) => [r.priority, r]));
        setRows(
          PRIORITY_ORDER.map(
            (p) =>
              map.get(p) ?? {
                priority: p,
                firstResponseMinutes: 15,
                resolutionMinutes: 240,
                isActive: true,
                escalateTo: null,
              }
          )
        );
      })
      .finally(() => setLoading(false));
  }, []);

  function updateRow(priority: string, field: keyof SlaRow, value: unknown) {
    setRows((prev) =>
      prev.map((r) => (r.priority === priority ? { ...r, [field]: value } : r))
    );
  }

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch("/api/settings/sla", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(rows),
      });
      if (res.ok) {
        toast({ title: "บันทึก SLA แล้ว" });
      } else {
        const err = await res.json() as { error: string };
        toast({ title: "Error", description: err.error, variant: "destructive" });
      }
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold flex items-center gap-2">
            <ShieldAlert className="h-5 w-5" />
            ตั้งค่า SLA
          </h1>
          <p className="text-sm text-muted-foreground">
            ตั้งเป้าหมายเวลาตอบกลับสำหรับแต่ละระดับความเร่งด่วน
          </p>
        </div>
        <Button onClick={handleSave} disabled={saving} className="bg-foreground text-background hover:bg-foreground/90">
          {saving ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}
          บันทึก
        </Button>
      </div>

      <div className="space-y-3">
        {rows.map((row) => {
          const meta = PRIORITY_META[row.priority];
          return (
            <div
              key={row.priority}
              className={cn(
                "rounded-xl border bg-card p-4",
                !row.isActive && "border-muted opacity-60"
              )}
            >
              <div className="flex items-center gap-4">
                {/* Priority badge + toggle */}
                <div className="flex items-center gap-3 w-28 shrink-0">
                  <Switch
                    checked={row.isActive}
                    onCheckedChange={(v) => updateRow(row.priority, "isActive", v)}
                  />
                  <span
                    className={cn(
                      "rounded-full px-2.5 py-0.5 text-xs font-semibold",
                      meta.bg,
                      meta.color
                    )}
                  >
                    {meta.label}
                  </span>
                </div>

                {/* First response */}
                <div className="flex-1 space-y-1">
                  <p className="text-xs text-muted-foreground">First Response</p>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      min={1}
                      className="h-8 w-20 text-sm rounded-lg"
                      value={row.firstResponseMinutes}
                      onChange={(e) =>
                        updateRow(row.priority, "firstResponseMinutes", parseInt(e.target.value) || 1)
                      }
                      disabled={!row.isActive}
                    />
                    <span className="text-sm text-muted-foreground">นาที</span>
                  </div>
                </div>

                {/* Resolution */}
                <div className="flex-1 space-y-1">
                  <p className="text-xs text-muted-foreground">Resolution</p>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      min={1}
                      className="h-8 w-24 text-sm rounded-lg"
                      value={row.resolutionMinutes}
                      onChange={(e) =>
                        updateRow(row.priority, "resolutionMinutes", parseInt(e.target.value) || 1)
                      }
                      disabled={!row.isActive}
                    />
                    <span className="text-sm text-muted-foreground">นาที</span>
                  </div>
                </div>

                {/* Summary */}
                {row.isActive && (
                  <div className="text-right text-xs text-muted-foreground hidden sm:block w-32">
                    <p>ตอบภายใน {row.firstResponseMinutes} นาที</p>
                    <p>
                      แก้ภายใน{" "}
                      {row.resolutionMinutes >= 60
                        ? `${Math.floor(row.resolutionMinutes / 60)}ชม.`
                        : `${row.resolutionMinutes} นาที`}
                    </p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-6 rounded-xl border bg-muted/30 p-4 text-sm text-muted-foreground space-y-1">
        <p className="font-medium text-foreground">วิธีการทำงานของ SLA</p>
        <p>• เมื่อเหลือเวลาน้อยกว่า 20% → แสดงสีเหลืองใน Inbox</p>
        <p>• เมื่อเกินกำหนด → แสดงสีแดง + ส่ง notification ไปยัง supervisor</p>
        <p>• ระบบตรวจสอบ SLA ทุก 5 นาที</p>
      </div>
    </div>
  );
}
