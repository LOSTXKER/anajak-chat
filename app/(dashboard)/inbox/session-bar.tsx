"use client";

import { useState, useEffect, useCallback } from "react";
import {
  CheckCircle2,
  Clock,
  Plus,
  RotateCcw,
  BookmarkPlus,
  Lock,
  ShieldAlert,
  Ban,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Conversation } from "./types";

interface SessionBarProps {
  conversation: Conversation;
  currentUserId: string | null;
  onStartChat: () => void;
  onResolve: () => void;
  onExtend: (minutes: number) => void;
  onReopen: () => void;
  onFollowUp: () => void;
  onExpire: () => void;
  onSpam: () => void;
  onBlock: () => void;
  starting: boolean;
}

function formatTime(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function SessionBar({
  conversation,
  currentUserId,
  onStartChat,
  onResolve,
  onExtend,
  onReopen,
  onFollowUp,
  onExpire,
  onSpam,
  onBlock,
  starting,
}: SessionBarProps) {
  const [remaining, setRemaining] = useState<number | null>(null);
  const [showMore, setShowMore] = useState(false);

  const isLockedByOther =
    conversation.assignedUser !== null &&
    conversation.assignedUser.id !== currentUserId;

  const calcRemaining = useCallback(() => {
    if (!conversation.sessionDeadline) return null;
    const deadline = new Date(conversation.sessionDeadline).getTime();
    return Math.max(0, Math.floor((deadline - Date.now()) / 1000));
  }, [conversation.sessionDeadline]);

  useEffect(() => {
    if (conversation.status !== "open" || !conversation.sessionDeadline) {
      setRemaining(null);
      return;
    }

    setRemaining(calcRemaining());
    const interval = setInterval(() => {
      const r = calcRemaining();
      setRemaining(r);
      if (r !== null && r <= 0) {
        onExpire();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [conversation.status, conversation.sessionDeadline, calcRemaining, onExpire]);

  // Startable states: pending, expired, follow_up, missed
  const startable = ["pending", "expired", "follow_up", "missed"];
  if (startable.includes(conversation.status)) {
    const statusLabels: Record<string, string> = {
      pending: "รอรับ",
      expired: "หมดอายุ",
      follow_up: "รอติดตาม",
      missed: "ไม่ได้รับ",
    };

    return (
      <div className="border-t bg-muted/30 px-4 py-4">
        <p className="mb-2 text-center text-xs text-muted-foreground">
          สถานะ: {statusLabels[conversation.status] ?? conversation.status}
        </p>
        <Button
          className="w-full h-11 text-base font-semibold"
          onClick={onStartChat}
          disabled={starting}
        >
          {starting ? "กำลังเริ่ม..." : conversation.status === "pending" ? "เริ่มแชท" : "เริ่มแชทใหม่"}
        </Button>
      </div>
    );
  }

  if (conversation.status === "resolved" || conversation.status === "closed") {
    return (
      <div className="flex items-center justify-between border-t bg-muted/30 px-4 py-3">
        <span className="text-sm text-muted-foreground">
          แชทนี้เสร็จสิ้นแล้ว
        </span>
        <Button variant="outline" size="sm" onClick={onReopen}>
          <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
          เปิดอีกครั้ง
        </Button>
      </div>
    );
  }

  if (conversation.status === "spam" || conversation.status === "blocked") {
    return (
      <div className="flex items-center justify-between border-t bg-muted/30 px-4 py-3">
        <span className="text-sm text-muted-foreground flex items-center gap-1.5">
          <Ban className="h-3.5 w-3.5" />
          {conversation.status === "spam" ? "สแปม" : "บล็อก"}
        </span>
        <Button variant="outline" size="sm" onClick={onReopen}>
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

    const expired = remaining !== null && remaining <= 0;
    const warning = remaining !== null && remaining > 0 && remaining <= 300;

    return (
      <div className="border-t bg-muted/30">
        <div className="flex items-center gap-2 px-4 py-2">
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

          <div className="flex items-center gap-1.5 mx-auto">
            <Clock
              className={cn(
                "h-4 w-4",
                expired
                  ? "text-red-500"
                  : warning
                    ? "text-yellow-500"
                    : "text-muted-foreground"
              )}
            />
            <span
              className={cn(
                "text-sm font-mono font-medium tabular-nums",
                expired
                  ? "text-red-500"
                  : warning
                    ? "text-yellow-500"
                    : "text-foreground"
              )}
            >
              {expired ? "หมดเวลา!" : remaining !== null ? formatTime(remaining) : "--:--"}
            </span>
          </div>

          <div className="flex items-center gap-1">
            {[15, 30].map((min) => (
              <Button
                key={min}
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs"
                onClick={() => onExtend(min)}
              >
                <Plus className="mr-0.5 h-3 w-3" />
                {min} น.
              </Button>
            ))}
          </div>

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
                  className="rounded px-3 py-1.5 text-left text-xs hover:bg-muted transition-colors"
                >
                  สแปม
                </button>
                <button
                  onClick={() => { onBlock(); setShowMore(false); }}
                  className="rounded px-3 py-1.5 text-left text-xs text-red-600 hover:bg-red-50 dark:hover:bg-red-950 transition-colors"
                >
                  บล็อก
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return null;
}
