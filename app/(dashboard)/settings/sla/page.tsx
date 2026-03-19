"use client";

import { useState, useEffect } from "react";
import { Loader2, Save, Timer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface SlaConfig {
  firstResponseMinutes: number;
  isActive: boolean;
}

export default function SLAPage() {
  const [config, setConfig] = useState<SlaConfig>({
    firstResponseMinutes: 15,
    isActive: true,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/settings/sla")
      .then((r) => r.json())
      .then((data: Array<{ priority: string; firstResponseMinutes: number; isActive: boolean }>) => {
        const medium = data.find((d) => d.priority === "medium");
        if (medium) {
          setConfig({
            firstResponseMinutes: medium.firstResponseMinutes,
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
            isActive: config.isActive,
          },
        ]),
      });
      if (res.ok) {
        const data = await res.json();
        const msg = data.appliedCount > 0
          ? `บันทึก SLA แล้ว (ตั้งเวลาให้แชท ${data.appliedCount} รายการที่เปิดอยู่)`
          : "บันทึก SLA แล้ว";
        toast.success(msg);
      } else {
        const err = (await res.json()) as { error: string };
        toast.error("เกิดข้อผิดพลาด", { description: err.error });
      }
    } finally {
      setSaving(false);
    }
  }

  function formatDuration(minutes: number) {
    if (minutes >= 1440) return `${Math.floor(minutes / 1440)} วัน`;
    if (minutes >= 60) return `${Math.floor(minutes / 60)} ชม. ${minutes % 60 > 0 ? `${minutes % 60} นาที` : ""}`.trim();
    return `${minutes} นาที`;
  }

  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="heading-page">ตั้งค่า SLA</h1>
          <p className="text-sm text-muted-foreground mt-1">
            กำหนดเวลาตอบกลับลูกค้าสำหรับทุกการสนทนา
          </p>
        </div>
        <Button onClick={handleSave} disabled={saving || loading}>
          {saving ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}
          บันทึก
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
      <>
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

          <div className="space-y-2">
            <label className="text-sm font-medium">เวลาตอบกลับ</label>
            <p className="text-xs text-muted-foreground">
              ระยะเวลาสูงสุดที่ต้องตอบกลับลูกค้าแต่ละข้อความ
            </p>
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
        </div>

        <div className="mt-8 rounded-xl border bg-muted/30 p-6 text-sm text-muted-foreground space-y-1">
          <p className="font-medium text-foreground">วิธีการทำงานของ SLA</p>
          <p>• เมื่อลูกค้าส่งข้อความมา ระบบจะเริ่มนับเวลา SLA ถอยหลัง</p>
          <p>• เมื่อ Agent ตอบกลับ SLA จะหยุดนับ (จนกว่าลูกค้าจะส่งข้อความใหม่)</p>
          <p>• เมื่อเหลือเวลาน้อยกว่า 20% → แสดงสีเหลืองใน Inbox</p>
          <p>• เมื่อเกินกำหนด → แสดงสีแดง + ติดป้าย &quot;ไม่ได้รับ&quot; + แจ้งเตือนอัตโนมัติ</p>
          <p>• ระบบตรวจสอบ SLA ทุก 5 นาที</p>
        </div>
      </>
      )}
    </div>
  );
}
