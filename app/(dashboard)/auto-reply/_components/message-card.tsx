"use client";

import { Copy, Pencil, Trash2, GripVertical, MessageSquare, Image, FileText, Sticker, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MessageEditor } from "./message-editor";
import type { AutoReplyMessage } from "../_types";

const MSG_TYPES: { type: AutoReplyMessage["type"]; label: string; icon: typeof MessageSquare }[] = [
  { type: "text", label: "ข้อความ", icon: MessageSquare },
  { type: "image", label: "รูปภาพ", icon: Image },
  { type: "card", label: "การ์ด", icon: FileText },
  { type: "sticker", label: "สติกเกอร์", icon: Sticker },
  { type: "video", label: "วิดีโอ", icon: Video },
];

interface MessageCardProps {
  msg: AutoReplyMessage;
  num: number;
  isEditing: boolean;
  onEdit: () => void;
  onChange: (msg: AutoReplyMessage) => void;
  onDelete: () => void;
  onDuplicate: () => void;
}

export function MessageCard({ msg, num, isEditing, onEdit, onChange, onDelete, onDuplicate }: MessageCardProps) {
  const TypeIcon = MSG_TYPES.find((t) => t.type === msg.type)?.icon ?? MessageSquare;
  const typeName = MSG_TYPES.find((t) => t.type === msg.type)?.label ?? msg.type;

  const preview = msg.type === "text"
    ? (msg.text?.trim() || "(ว่าง)")
    : msg.type === "card"
    ? (msg.cardTitle?.trim() || "(ยังไม่มีหัวข้อ)")
    : msg.type === "image"
    ? (msg.imageUrl ? "รูปภาพที่อัปโหลด" : "(ยังไม่มีรูป)")
    : msg.type === "sticker"
    ? (msg.stickerPackageId ? `สติกเกอร์ ${msg.stickerPackageId}` : "(ยังไม่มีสติกเกอร์)")
    : msg.type === "video"
    ? (msg.videoUrl ? "วิดีโอที่แนบ" : "(ยังไม่มีวิดีโอ)")
    : "";

  return (
    <div className="overflow-hidden rounded-2xl border bg-card">
      <div className="flex cursor-pointer items-center gap-3 px-4 py-3 transition-colors hover:bg-muted/50" onClick={onEdit}>
        <GripVertical className="h-4 w-4 shrink-0 text-muted-foreground/40" />
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">{num}</span>
        <TypeIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
        <div className="min-w-0 flex-1">
          <span className="text-sm font-medium">{typeName}</span>
          {preview && <span className="ml-2 truncate text-sm text-muted-foreground">— {typeof preview === "string" ? preview.slice(0, 60) : ""}</span>}
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); onDuplicate(); }}><Copy className="h-3.5 w-3.5" /></Button>
          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); onEdit(); }}><Pencil className="h-3.5 w-3.5" /></Button>
          <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={(e) => { e.stopPropagation(); onDelete(); }}><Trash2 className="h-3.5 w-3.5" /></Button>
        </div>
      </div>
      {isEditing && (
        <div className="space-y-3 border-t px-4 pb-4 pt-2">
          <MessageEditor msg={msg} onChange={onChange} />
        </div>
      )}
    </div>
  );
}

export { MSG_TYPES };
