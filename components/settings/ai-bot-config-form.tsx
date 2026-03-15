"use client";

import { Save, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export interface BotConfig {
  mode: "off" | "confirm" | "full_auto";
  useBusinessHours: boolean;
  autoMode: "off" | "confirm" | "full_auto";
  manualMode: "off" | "confirm" | "full_auto";
  persona: string | null;
  escalationMaxRounds: number;
  escalationOnNegativeSentiment: boolean;
  escalationOnRefund: boolean;
  escalationOnLowConfidence: number;
  greetingMessage: string | null;
  isActive: boolean;
}

const MODE_LABELS: Record<string, string> = {
  off: "ปิด",
  confirm: "Confirm Mode (AI ร่าง → แอดมิน approve)",
  full_auto: "Full Auto (AI ตอบทันที)",
};

export interface AIBotConfigFormProps {
  config: BotConfig;
  onChange: (updater: (prev: BotConfig) => BotConfig) => void;
  onSave: () => void;
  saving: boolean;
}

export function AIBotConfigForm({ config, onChange, onSave, saving }: AIBotConfigFormProps) {
  return (
    <>
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground">เปิดใช้งาน</span>
          <Switch checked={config.isActive} onCheckedChange={(v) => onChange((p) => ({ ...p, isActive: v }))} />
        </div>
        <Button onClick={onSave} disabled={saving} className="bg-foreground text-background hover:bg-foreground/90">
          {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          บันทึก
        </Button>
      </div>

      <div className="mb-8 space-y-5 rounded-xl border bg-card p-6">
        <div className="space-y-1.5">
          <Label>โหมดการทำงาน</Label>
          <div className="grid grid-cols-3 gap-2">
            {(["off", "confirm", "full_auto"] as const).map((m) => (
              <button
                key={m}
                onClick={() => onChange((p) => ({ ...p, mode: m }))}
                className={cn(
                  "rounded-lg border p-3 text-left text-xs transition-colors",
                  config.mode === m ? "border-foreground bg-muted/30" : "hover:bg-muted/50"
                )}
              >
                <div className={cn("mb-1 h-2 w-2 rounded-full", m === "off" ? "bg-gray-400" : m === "confirm" ? "bg-yellow-500" : "bg-green-500")} />
                {MODE_LABELS[m]}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Switch
            checked={config.useBusinessHours}
            onCheckedChange={(v) => onChange((p) => ({ ...p, useBusinessHours: v }))}
          />
          <div>
            <Label>Auto-switch ตาม Business Hours</Label>
            <p className="text-xs text-muted-foreground">ในเวลาทำการ: {MODE_LABELS[config.manualMode]} / นอกเวลา: {MODE_LABELS[config.autoMode]}</p>
          </div>
        </div>

        {config.useBusinessHours && (
          <div className="grid grid-cols-2 gap-3 pl-8">
            <div className="space-y-1">
              <Label className="text-xs">โหมดในเวลาทำการ</Label>
              <select
                className="w-full h-8 rounded-lg border bg-background px-2 text-xs"
                value={config.manualMode}
                onChange={(e) => onChange((p) => ({ ...p, manualMode: e.target.value as "off" | "confirm" | "full_auto" }))}
              >
                {["off", "confirm", "full_auto"].map((m) => <option key={m} value={m}>{MODE_LABELS[m]}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">โหมดนอกเวลาทำการ</Label>
              <select
                className="w-full h-8 rounded-lg border bg-background px-2 text-xs"
                value={config.autoMode}
                onChange={(e) => onChange((p) => ({ ...p, autoMode: e.target.value as "off" | "confirm" | "full_auto" }))}
              >
                {["off", "confirm", "full_auto"].map((m) => <option key={m} value={m}>{MODE_LABELS[m]}</option>)}
              </select>
            </div>
          </div>
        )}

        <div className="space-y-1.5">
          <Label>Persona (ข้อความแนะนำ AI)</Label>
          <Textarea
            rows={3}
            placeholder="เช่น คุณเป็นผู้ช่วยตอบแชทของร้าน XYZ ตอบสุภาพ เป็นมิตร..."
            value={config.persona ?? ""}
            onChange={(e) => onChange((p) => ({ ...p, persona: e.target.value || null }))}
          />
        </div>

        <div className="space-y-1.5">
          <Label>ข้อความทักทาย (ทักลูกค้าครั้งแรก)</Label>
          <Input
            placeholder="สวัสดีค่ะ มีอะไรให้ช่วยมั้ยคะ?"
            value={config.greetingMessage ?? ""}
            onChange={(e) => onChange((p) => ({ ...p, greetingMessage: e.target.value || null }))}
          />
        </div>

        <div className="rounded-xl bg-muted/30 p-4 space-y-3">
          <p className="text-xs font-medium">Escalation Rules (ส่งต่อแอดมิน)</p>
          <div className="flex items-center gap-2">
            <Switch
              checked={config.escalationOnNegativeSentiment}
              onCheckedChange={(v) => onChange((p) => ({ ...p, escalationOnNegativeSentiment: v }))}
            />
            <Label className="text-sm">เมื่อ Sentiment เป็นลบ (ลูกค้าโกรธ)</Label>
          </div>
          <div className="flex items-center gap-2">
            <Switch
              checked={config.escalationOnRefund}
              onCheckedChange={(v) => onChange((p) => ({ ...p, escalationOnRefund: v }))}
            />
            <Label className="text-sm">เมื่อถามเรื่องคืนสินค้า / ร้องเรียน</Label>
          </div>
          <div className="flex items-center gap-4">
            <Label className="text-sm w-48">จำนวนรอบสูงสุด</Label>
            <Input
              type="number"
              min={1}
              max={20}
              className="w-20 h-8 rounded-lg"
              value={config.escalationMaxRounds}
              onChange={(e) => onChange((p) => ({ ...p, escalationMaxRounds: parseInt(e.target.value) || 5 }))}
            />
            <span className="text-xs text-muted-foreground">รอบ</span>
          </div>
          <div className="flex items-center gap-4">
            <Label className="text-sm w-48">Confidence threshold</Label>
            <Input
              type="number"
              min={0}
              max={1}
              step={0.05}
              className="w-20 h-8 rounded-lg"
              value={config.escalationOnLowConfidence}
              onChange={(e) => onChange((p) => ({ ...p, escalationOnLowConfidence: parseFloat(e.target.value) || 0.5 }))}
            />
            <span className="text-xs text-muted-foreground">escalate ถ้า AI confidence &lt; ค่านี้</span>
          </div>
        </div>
      </div>
    </>
  );
}
