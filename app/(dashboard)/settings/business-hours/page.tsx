"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, Loader2, Clock, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import type { BusinessHoursConfig, DaySchedule } from "@/lib/business-hours";
import { DEFAULT_BUSINESS_HOURS } from "@/lib/business-hours";

const DAY_LABELS: Record<string, string> = {
  monday: "วันจันทร์",
  tuesday: "วันอังคาร",
  wednesday: "วันพุธ",
  thursday: "วันพฤหัสบดี",
  friday: "วันศุกร์",
  saturday: "วันเสาร์",
  sunday: "วันอาทิตย์",
};

const DAY_ORDER = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];

export default function BusinessHoursPage() {
  const { toast } = useToast();
  const [config, setConfig] = useState<BusinessHoursConfig>(DEFAULT_BUSINESS_HOURS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newHolidayDate, setNewHolidayDate] = useState("");
  const [newHolidayName, setNewHolidayName] = useState("");
  const [isOpen, setIsOpen] = useState<boolean | null>(null);

  useEffect(() => {
    fetch("/api/settings/business-hours")
      .then((r) => r.json())
      .then((data: BusinessHoursConfig) => setConfig(data))
      .finally(() => setLoading(false));

    fetch("/api/settings/business-hours/status")
      .then((r) => r.json())
      .then((data: { isOpen: boolean }) => setIsOpen(data.isOpen));
  }, []);

  function updateDay(day: string, field: keyof DaySchedule, value: string | boolean) {
    setConfig((prev) => ({
      ...prev,
      schedule: {
        ...prev.schedule,
        [day]: { ...prev.schedule[day as keyof typeof prev.schedule], [field]: value },
      },
    }));
  }

  function addHoliday() {
    if (!newHolidayDate || !newHolidayName) return;
    setConfig((prev) => ({
      ...prev,
      holidays: [...prev.holidays, { date: newHolidayDate, name: newHolidayName }].sort((a, b) =>
        a.date.localeCompare(b.date)
      ),
    }));
    setNewHolidayDate("");
    setNewHolidayName("");
  }

  function removeHoliday(date: string) {
    setConfig((prev) => ({
      ...prev,
      holidays: prev.holidays.filter((h) => h.date !== date),
    }));
  }

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch("/api/settings/business-hours", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });
      if (res.ok) {
        toast({ title: "บันทึกเวลาทำการแล้ว" });
        // Refresh status
        const statusRes = await fetch("/api/settings/business-hours/status");
        if (statusRes.ok) {
          const s = await statusRes.json() as { isOpen: boolean };
          setIsOpen(s.isOpen);
        }
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
    <div className="max-w-2xl">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold flex items-center gap-2">
            <Clock className="h-5 w-5" />
            เวลาทำการ
          </h1>
          <p className="text-sm text-muted-foreground">
            ตั้งเวลาทำการและข้อความตอบกลับอัตโนมัตินอกเวลา
          </p>
        </div>
        <div className="flex items-center gap-3">
          {isOpen !== null && (
            <span
              className={`text-sm font-medium ${isOpen ? "text-green-600" : "text-red-600"}`}
            >
              {isOpen ? "● กำลังเปิดทำการ" : "○ ปิดทำการ"}
            </span>
          )}
          <Button onClick={handleSave} disabled={saving} className="bg-foreground text-background hover:bg-foreground/90">
            {saving ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            บันทึก
          </Button>
        </div>
      </div>

      {/* Timezone */}
      <div className="mb-6 rounded-xl border bg-card p-6 space-y-1.5">
        <Label>Timezone</Label>
        <Input
          className="rounded-lg"
          value={config.timezone}
          onChange={(e) => setConfig((prev) => ({ ...prev, timezone: e.target.value }))}
          placeholder="Asia/Bangkok"
        />
      </div>

      {/* Weekly schedule */}
      <div className="mb-6 rounded-xl border bg-card p-6">
        <h2 className="mb-3 text-lg font-semibold">ตารางรายสัปดาห์</h2>
        <div className="space-y-2">
          {DAY_ORDER.map((day) => {
            const schedule = config.schedule[day as keyof typeof config.schedule];
            return (
              <div
                key={day}
                className="flex items-center gap-4 rounded-lg border bg-card px-4 py-3"
              >
                <Switch
                  checked={schedule.enabled}
                  onCheckedChange={(v) => updateDay(day, "enabled", v)}
                />
                <span className="w-28 text-sm font-medium">{DAY_LABELS[day]}</span>
                {schedule.enabled ? (
                  <>
                    <Input
                      type="time"
                      className="h-8 w-28 text-sm rounded-lg"
                      value={schedule.openTime}
                      onChange={(e) => updateDay(day, "openTime", e.target.value)}
                    />
                    <span className="text-muted-foreground">—</span>
                    <Input
                      type="time"
                      className="h-8 w-28 text-sm rounded-lg"
                      value={schedule.closeTime}
                      onChange={(e) => updateDay(day, "closeTime", e.target.value)}
                    />
                  </>
                ) : (
                  <span className="text-sm text-muted-foreground">ปิดทำการ</span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Holidays */}
      <div className="mb-6 rounded-xl border bg-card p-6">
        <h2 className="mb-3 text-lg font-semibold">วันหยุดพิเศษ</h2>
        <div className="space-y-2 mb-3">
          {config.holidays.length === 0 ? (
            <p className="text-sm text-muted-foreground">ยังไม่มีวันหยุดพิเศษ</p>
          ) : (
            config.holidays.map((h) => (
              <div key={h.date} className="flex items-center gap-3 rounded-lg border px-4 py-2">
                <span className="text-sm font-mono">{h.date}</span>
                <span className="flex-1 text-sm">{h.name}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10"
                  onClick={() => removeHoliday(h.date)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))
          )}
        </div>
        <div className="flex gap-2">
          <Input
            type="date"
            className="w-40"
            value={newHolidayDate}
            onChange={(e) => setNewHolidayDate(e.target.value)}
          />
          <Input
            placeholder="ชื่อวันหยุด เช่น วันสงกรานต์"
            value={newHolidayName}
            onChange={(e) => setNewHolidayName(e.target.value)}
            className="flex-1"
          />
          <Button
            variant="outline"
            onClick={addHoliday}
            disabled={!newHolidayDate || !newHolidayName}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Auto-reply message */}
      <div className="mb-6 rounded-xl border bg-card p-6 space-y-1.5">
        <Label>ข้อความตอบกลับอัตโนมัตินอกเวลา</Label>
        <Textarea
          className="min-h-[80px] resize-none rounded-lg"
          value={config.autoReplyMessage}
          onChange={(e) => setConfig((prev) => ({ ...prev, autoReplyMessage: e.target.value }))}
          placeholder="ขอบคุณที่ทักมา ตอนนี้อยู่นอกเวลาทำการ..."
        />
      </div>

      {/* After-hours behavior */}
      <div className="rounded-xl border bg-card p-6 space-y-2">
        <Label>พฤติกรรมนอกเวลาทำการ</Label>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() =>
              setConfig((prev) => ({ ...prev, afterHoursBehavior: "auto_reply_only" }))
            }
            className={`rounded-lg border p-3 text-left text-sm transition-colors ${
              config.afterHoursBehavior === "auto_reply_only"
                ? "border-foreground bg-muted/30"
                : "hover:bg-muted"
            }`}
          >
            <p className="font-medium">Auto-reply เท่านั้น</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              ส่งข้อความอัตโนมัติ รอแอดมินตอบ
            </p>
          </button>
          <button
            onClick={() => setConfig((prev) => ({ ...prev, afterHoursBehavior: "ai_bot" }))}
            className={`rounded-lg border p-3 text-left text-sm transition-colors opacity-50 cursor-not-allowed`}
            disabled
            title="ต้องเปิดใช้งาน AI Bot ก่อน (Phase 5)"
          >
            <p className="font-medium">AI Bot ตอบแทน</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              AI ตอบแชทอัตโนมัติ (ต้องการ Phase 5)
            </p>
          </button>
        </div>
      </div>
    </div>
  );
}
