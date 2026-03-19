"use client";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ImageUpload } from "@/components/image-upload";
import { ButtonsEditor } from "./buttons-editor";
import type { AutoReplyMessage } from "../_types";

interface MessageEditorProps {
  msg: AutoReplyMessage;
  onChange: (msg: AutoReplyMessage) => void;
}

export function MessageEditor({ msg, onChange }: MessageEditorProps) {
  const update = (patch: Partial<AutoReplyMessage>) => onChange({ ...msg, ...patch });

  switch (msg.type) {
    case "text":
      return (
        <div className="space-y-3">
          <Textarea rows={3} placeholder="ข้อความ..." value={msg.text ?? ""} onChange={(e) => update({ text: e.target.value })} />
          <ButtonsEditor buttons={msg.buttons ?? []} onChange={(buttons) => update({ buttons })} />
        </div>
      );
    case "image":
      return (
        <ImageUpload
          value={msg.imageUrl ?? ""}
          onChange={(url) => update({ imageUrl: url })}
          placeholder="อัปโหลดรูปภาพ"
        />
      );
    case "card":
      return (
        <div className="space-y-3">
          <Input placeholder="หัวข้อการ์ด" value={msg.cardTitle ?? ""} onChange={(e) => update({ cardTitle: e.target.value })} />
          <Textarea rows={2} placeholder="รายละเอียดการ์ด" value={msg.cardText ?? ""} onChange={(e) => update({ cardText: e.target.value })} />
          <ImageUpload
            value={msg.cardImageUrl ?? ""}
            onChange={(url) => update({ cardImageUrl: url })}
            placeholder="อัปโหลดรูปภาพการ์ด (ไม่บังคับ)"
          />
          <ButtonsEditor buttons={msg.cardButtons ?? []} onChange={(cardButtons) => update({ cardButtons })} />
        </div>
      );
    case "sticker":
      return (
        <div className="flex gap-3">
          <Input placeholder="Package ID" value={msg.stickerPackageId ?? ""} onChange={(e) => update({ stickerPackageId: e.target.value })} />
          <Input placeholder="Sticker ID" value={msg.stickerId ?? ""} onChange={(e) => update({ stickerId: e.target.value })} />
        </div>
      );
    case "video":
      return (
        <div className="space-y-3">
          <Input placeholder="URL วิดีโอ" value={msg.videoUrl ?? ""} onChange={(e) => update({ videoUrl: e.target.value })} />
          <ImageUpload
            value={msg.thumbnailUrl ?? ""}
            onChange={(url) => update({ thumbnailUrl: url })}
            placeholder="อัปโหลดรูปปก (ไม่บังคับ)"
          />
        </div>
      );
    default:
      return null;
  }
}
