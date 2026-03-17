"use client";

import { useState, useEffect } from "react";
import { Loader2, Save, Timer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface SlaConfig {
  firstResponseMinutes: number;
  resolutionMinutes: number;
  isActive: boolean;
}

export default function SLAPage() {
  const { toast } = useToast();
  const [config, setConfig] = useState<SlaConfig>({
    firstResponseMinutes: 15,
    resolutionMinutes: 240,
    isActive: true,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/settings/sla")
      .then((r) => r.json())
      .then((data: Array<{ priority: string; firstResponseMinutes: number; resolutionMinutes: number; isActive: boolean }>) => {
        const medium = data.find((d) => d.priority === "medium");
        if (medium) {
          setConfig({
            firstResponseMinutes: medium.firstResponseMinutes,
            resolutionMinutes: medium.resolutionMinutes,
            isActive: medium.isActive,
          });
        }
      })
      .finally(() => setLoading(false));
  }, []);

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch("/api/settings/sla", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify([
          {
            priority: "medium",
            firstResponseMinutes: config.firstResponseMinutes,
            resolutionMinutes: config.resolutionMinutes,
            isActive: config.isActive,
          },
        ]),
      });
      if (res.ok) {
        toast({ title: "บันทึก SLA แล้ว" });
      } else {
        const err = (await res.json()) as { error: string };
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

  function formatDuration(minutes: number) {
    if (minutes >= 1440) return `${Math.floor(minutes / 1440)} วัน`;
    if (minutes >= 60) return `${Math.floor(minutes / 60)} ชม. ${minutes % 60 > 0 ? `${minutes % 60} นาที` : ""}`.trim();
    return `${minutes} นาที`;
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold flex items-center gap-2">
            <Timer className="h-5 w-5" />
            ตั้งค่า SLA
          </h1>
          <p className="text-sm text-muted-foreground">
            กำหนดเวลาตอบกลับและแก้ไขสำหรับทุกการสนทนา
          </p>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}
          บันทึก
        </Button>
      </div>

      <div
        className={cn(
          "rounded-xl border bg-card p-6",
          !config.isActive && "border-muted opacity-60"
        )}
      >
        <div className="flex items-center gap-3 mb-6">
          <Switch
            checked={config.isActive}
            onCheckedChange={(v) => setConfig((prev) => ({ ...prev, isActive: v }))}
          />
          <span className="text-sm font-medium">
            {config.isActive ? "เปิดใช้งาน SLA" : "ปิดใช้งาน SLA"}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-medium">เวลาตอบกลับครั้งแรก</label>
            <p className="text-xs text-muted-foreground">ระยะเวลาที่ต้องตอบกลับลูกค้า</p>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                min={1}
                className="h-10 w-24 text-sm rounded-lg"
                value={config.firstResponseMinutes}
                onChange={(e) =>
                  setConfig((prev) => ({ ...prev, firstResponseMinutes: parseInt(e.target.value) || 1 }))
                }
                disabled={!config.isActive}
              />
              <span className="text-sm text-muted-foreground">นาที</span>
            </div>
            {config.isActive && (
              <p className="text-xs text-muted-foreground">
                = {formatDuration(config.firstResponseMinutes)}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">เวลาแก้ไขปัญหา</label>
            <p className="text-xs text-muted-foreground">ระยะเวลาที่ต้องแก้ไขเสร็จสิ้น</p>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                min={1}
                className="h-10 w-24 text-sm rounded-lg"
                value={config.resolutionMinutes}
                onChange={(e) =>
                  setConfig((prev) => ({ ...prev, resolutionMinutes: parseInt(e.target.value) || 1 }))
                }
                disabled={!config.isActive}
              />
              <span className="text-sm text-muted-foreground">นาที</span>
            </div>
            {config.isActive && (
              <p className="text-xs text-muted-foreground">
                = {formatDuration(config.resolutionMinutes)}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="mt-6 rounded-xl border bg-muted/30 p-4 text-sm text-muted-foreground space-y-1">
        <p className="font-medium text-foreground">วิธีการทำงานของ SLA</p>
        <p>• เมื่อมีข้อความใหม่เข้ามา ระบบจะเริ่มนับเวลา SLA</p>
        <p>• เมื่อเหลือเวลาน้อยกว่า 20% → แสดงสีเหลืองใน Inbox</p>
        <p>• เมื่อเกินกำหนดตอบกลับ → แสดงสีแดง + ติดป้าย "ไม่ได้รับ" อัตโนมัติ</p>
        <p>• เมื่อเกินกำหนดแก้ไข → ส่ง notification แจ้งเตือน</p>
        <p>• ระบบตรวจสอบ SLA ทุก 5 นาที</p>
      </div>
    </div>
  );
}
