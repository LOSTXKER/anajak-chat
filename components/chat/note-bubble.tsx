"use client";

import { formatDistanceToNow } from "date-fns";
import { th } from "date-fns/locale";
import { StickyNote } from "lucide-react";
import type { Note } from "@/app/(dashboard)/inbox/types";

export interface NoteBubbleProps {
  note: Note;
}

export function NoteBubble({ note }: NoteBubbleProps) {
  return (
    <div className="mx-auto max-w-[80%]">
      <div className="rounded-xl border border-border bg-muted px-3 py-2">
        <div className="mb-1 flex items-center gap-1.5">
          <StickyNote className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-xs font-medium text-foreground">โน้ตภายใน</span>
          <span className="ml-auto text-xs text-muted-foreground">
            {formatDistanceToNow(new Date(note.createdAt), { addSuffix: true, locale: th })}
          </span>
        </div>
        <p className="whitespace-pre-wrap text-sm text-foreground">{note.content}</p>
      </div>
    </div>
  );
}
