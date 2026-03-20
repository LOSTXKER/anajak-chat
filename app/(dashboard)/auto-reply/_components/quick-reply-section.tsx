"use client";

import { Plus, X, Reply } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import type { QuickReplyItem } from "../_types";

interface QuickReplySectionProps {
  items: QuickReplyItem[];
  onChange: (items: QuickReplyItem[]) => void;
}

export function QuickReplySection({ items, onChange }: QuickReplySectionProps) {
  const add = () => onChange([...items, { label: "", action: "message", value: "" }]);
  const remove = (idx: number) => onChange(items.filter((_, i) => i !== idx));
  const update = (idx: number, patch: Partial<QuickReplyItem>) => {
    const next = [...items];
    next[idx] = { ...next[idx], ...patch };
    onChange(next);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Reply className="h-4 w-4 text-muted-foreground" />
          <h3 className="heading-section">คำตอบด่วน</h3>
          <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">{items.length}/13</span>
        </div>
        <Button size="sm" variant="ghost" onClick={add} disabled={items.length >= 13} className="text-primary">
          <Plus className="h-4 w-4 mr-1" />เพิ่ม
        </Button>
      </div>
      {items.length === 0 ? (
        <p className="py-4 text-center text-sm text-muted-foreground">ยังไม่มีคำตอบด่วน — กดปุ่ม &ldquo;+ เพิ่ม&rdquo; เพื่อสร้าง</p>
      ) : (
        <div className="space-y-2">
          {items.map((item, idx) => (
            <div key={idx} className="flex items-center gap-2 rounded-xl border bg-muted/20 p-2.5">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[11px] font-bold text-primary">{idx + 1}</span>
              <Input className="flex-1" placeholder="ข้อความบนปุ่ม" value={item.label} onChange={(e) => update(idx, { label: e.target.value })} />
              <Select value={item.action} onValueChange={(v) => update(idx, { action: v as "message" | "postback" })}>
                <SelectTrigger className="w-[120px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="message">ข้อความ</SelectItem>
                  <SelectItem value="postback">Postback</SelectItem>
                </SelectContent>
              </Select>
              <Input className="flex-1" placeholder="ค่าที่ส่ง" value={item.value} onChange={(e) => update(idx, { value: e.target.value })} />
              <Button size="icon" variant="ghost" className="h-8 w-8 shrink-0 text-destructive" onClick={() => remove(idx)}>
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
