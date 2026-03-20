"use client";

import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import type { RichButton } from "../_types";

interface ButtonsEditorProps {
  buttons: RichButton[];
  onChange: (buttons: RichButton[]) => void;
}

export function ButtonsEditor({ buttons, onChange }: ButtonsEditorProps) {
  const add = () => onChange([...buttons, { label: "", action: "message", value: "" }]);
  const remove = (idx: number) => onChange(buttons.filter((_, i) => i !== idx));
  const update = (idx: number, patch: Partial<RichButton>) => {
    const next = [...buttons];
    next[idx] = { ...next[idx], ...patch };
    onChange(next);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-muted-foreground">ปุ่ม ({buttons.length})</span>
        <Button size="sm" variant="ghost" onClick={add} className="text-primary h-7 text-xs">
          <Plus className="h-3 w-3 mr-1" />เพิ่มปุ่ม
        </Button>
      </div>
      {buttons.map((btn, idx) => (
        <div key={idx} className="flex items-center gap-2">
          <Input className="flex-1" placeholder="ข้อความบนปุ่ม" value={btn.label} onChange={(e) => update(idx, { label: e.target.value })} />
          <Select value={btn.action} onValueChange={(v) => update(idx, { action: v as RichButton["action"] })}>
            <SelectTrigger className="w-[120px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="message">ข้อความ</SelectItem>
              <SelectItem value="postback">Postback</SelectItem>
              <SelectItem value="url">URL</SelectItem>
            </SelectContent>
          </Select>
          <Input className="flex-1" placeholder="ค่าที่ส่ง" value={btn.value} onChange={(e) => update(idx, { value: e.target.value })} />
          <Button size="icon" variant="ghost" className="h-8 w-8 shrink-0 text-destructive" onClick={() => remove(idx)}>
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      ))}
    </div>
  );
}
