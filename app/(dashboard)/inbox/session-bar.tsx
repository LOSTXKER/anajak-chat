"use client";

import { useState } from "react";
import {
  CheckCircle2,
  RotateCcw,
  BookmarkPlus,
  Lock,
  ShieldAlert,
  Ban,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Conversation } from "./types";

interface SessionBarProps {
  conversation: Conversation;
  currentUserId: string | null;
  onStartChat: () => void;
  onResolve: () => void;
  onReopen: () => void;
  onFollowUp: () => void;
  onSpam: () => void;
  onBlock: () => void;
  starting: boolean;
}

export function SessionBar({
  conversation,
  currentUserId,
  onStartChat,
  onResolve,
  onReopen,
  onFollowUp,
  onSpam,
  onBlock,
  starting,
}: SessionBarProps) {
  const [showMore, setShowMore] = useState(false);

  const isLockedByOther =
    conversation.assignedUser !== null &&
    conversation.assignedUser.id !== currentUserId;

  if (conversation.status === "pending") {
    return (
      <div className="border-t bg-muted/30 px-4 py-4">
        <Button
          className="w-full h-11 text-base font-semibold"
          onClick={onStartChat}
          disabled={starting}
        >
          {starting ? "กำลังเริ่ม..." : "เริ่มแชท"}
        </Button>
      </div>
    );
  }

  if (conversation.status === "resolved" || conversation.status === "closed") {
    return (
      <div className="flex items-center justify-between border-t bg-muted/30 px-4 py-3">
        <span className="text-sm text-muted-foreground">
          {conversation.status === "closed" ? "แชทนี้ถูกปิดแล้ว" : "แชทนี้เสร็จสิ้นแล้ว"}
        </span>
        <Button variant="outline" size="sm" onClick={onReopen} disabled={starting}>
          <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
          เปิดอีกครั้ง
        </Button>
      </div>
    );
  }

  if (conversation.status === "open") {
    if (isLockedByOther) {
      return (
        <div className="flex items-center gap-2 border-t bg-yellow-50 dark:bg-yellow-950/30 px-4 py-3">
          <Lock className="h-4 w-4 text-yellow-600 dark:text-yellow-400 shrink-0" />
          <span className="text-sm text-yellow-700 dark:text-yellow-300">
            ดูแลโดย {conversation.assignedUser?.name}
          </span>
        </div>
      );
    }

    return (
      <div className="flex items-center gap-2 border-t bg-muted/30 px-4 py-2">
        <Button
          variant="outline"
          size="sm"
          className="text-green-600 border-green-200 hover:bg-green-50 hover:text-green-700 dark:border-green-800 dark:hover:bg-green-950"
          onClick={onResolve}
        >
          <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
          เสร็จสิ้น
        </Button>

        <Button
          variant="outline"
          size="sm"
          className="text-blue-600 border-blue-200 hover:bg-blue-50 hover:text-blue-700 dark:border-blue-800 dark:hover:bg-blue-950"
          onClick={onFollowUp}
        >
          <BookmarkPlus className="mr-1.5 h-3.5 w-3.5" />
          ติดตาม
        </Button>

        <div className="flex-1" />

        <div className="relative">
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-1.5 text-muted-foreground"
            onClick={() => setShowMore(!showMore)}
          >
            <ShieldAlert className="h-3.5 w-3.5" />
          </Button>
          {showMore && (
            <div className="absolute bottom-full right-0 mb-1 flex flex-col gap-1 rounded-lg border bg-popover p-1 shadow-md z-10 min-w-28">
              <button
                onClick={() => { onSpam(); setShowMore(false); }}
                className="flex items-center gap-2 rounded px-3 py-1.5 text-left text-xs hover:bg-muted transition-colors"
              >
                <Ban className="h-3 w-3" />
                สแปม
              </button>
              <button
                onClick={() => { onBlock(); setShowMore(false); }}
                className="flex items-center gap-2 rounded px-3 py-1.5 text-left text-xs text-red-600 hover:bg-red-50 dark:hover:bg-red-950 transition-colors"
              >
                <Ban className="h-3 w-3" />
                บล็อก
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return null;
}
