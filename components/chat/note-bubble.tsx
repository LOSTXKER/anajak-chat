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
      <div className="rounded-lg border border-yellow-200 bg-yellow-50 px-3 py-2">
        <div className="mb-1 flex items-center gap-1.5">
          <StickyNote className="h-3 w-3 text-yellow-600" />
          <span className="text-xs font-medium text-yellow-700">Internal Note</span>
          <span className="ml-auto text-[10px] text-yellow-600">
            {formatDistanceToNow(new Date(note.createdAt), { addSuffix: true, locale: th })}
          </span>
        </div>
        <p className="whitespace-pre-wrap text-sm text-yellow-900">{note.content}</p>
      </div>
    </div>
  );
}
