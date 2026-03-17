"use client";

import { useState } from "react";
import {
  CheckCircle2,
  RotateCcw,
  BookmarkPlus,
  Lock,
  MoreHorizontal,
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
      <div className="border-t px-4 py-3">
        <Button
          className="w-full h-10"
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
      <div className="flex items-center justify-between border-t px-4 py-2.5">
        <span className="text-xs text-muted-foreground">
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
        <div className="flex items-center gap-2 border-t px-4 py-2.5">
          <Lock className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          <span className="text-xs text-muted-foreground">
            ดูแลโดย {conversation.assignedUser?.name}
          </span>
        </div>
      );
    }

    return (
      <div className="flex items-center gap-1.5 border-t px-4 py-2">
        <Button
          variant="ghost"
          size="sm"
          className="h-8 text-xs text-green-600 hover:text-green-700 hover:bg-green-50 dark:text-green-400 dark:hover:text-green-300 dark:hover:bg-green-950/50"
          onClick={onResolve}
        >
          <CheckCircle2 className="mr-1 h-3.5 w-3.5" />
          เสร็จสิ้น
        </Button>

        <Button
          variant="ghost"
          size="sm"
          className="h-8 text-xs text-muted-foreground hover:text-foreground"
          onClick={onFollowUp}
        >
          <BookmarkPlus className="mr-1 h-3.5 w-3.5" />
          ติดตาม
        </Button>

        <div className="flex-1" />

        <div className="relative">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-muted-foreground"
            onClick={() => setShowMore(!showMore)}
            aria-label="เพิ่มเติม"
            aria-expanded={showMore}
            aria-haspopup="menu"
          >
            <MoreHorizontal className="h-4 w-4" />
          </Button>
          {showMore && (
            <div className="absolute bottom-full right-0 mb-1 flex flex-col gap-0.5 rounded-lg border bg-popover p-1 shadow-lg z-10 min-w-28 animate-in fade-in zoom-in-95 duration-100" role="menu">
              <button
                role="menuitem"
                onClick={() => { onSpam(); setShowMore(false); }}
                className="flex items-center gap-2 rounded-md px-3 py-1.5 text-left text-xs hover:bg-muted transition-colors"
              >
                <Ban className="h-3 w-3" />
                สแปม
              </button>
              <button
                role="menuitem"
                onClick={() => { onBlock(); setShowMore(false); }}
                className="flex items-center gap-2 rounded-md px-3 py-1.5 text-left text-xs text-destructive hover:bg-destructive/10 transition-colors"
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
