"use client";

import { useState, useEffect, useCallback } from "react";
import { CheckCircle2, Clock, Plus, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Conversation } from "./types";

interface SessionBarProps {
  conversation: Conversation;
  onStartChat: () => void;
  onResolve: () => void;
  onExtend: (minutes: number) => void;
  onReopen: () => void;
  starting: boolean;
}

function formatTime(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function SessionBar({
  conversation,
  onStartChat,
  onResolve,
  onExtend,
  onReopen,
  starting,
}: SessionBarProps) {
  const [remaining, setRemaining] = useState<number | null>(null);

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
      setRemaining(calcRemaining());
    }, 1000);

    return () => clearInterval(interval);
  }, [conversation.status, conversation.sessionDeadline, calcRemaining]);

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
          แชทนี้เสร็จสิ้นแล้ว
        </span>
        <Button variant="outline" size="sm" onClick={onReopen}>
          <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
          เปิดอีกครั้ง
        </Button>
      </div>
    );
  }

  if (conversation.status === "open") {
    const expired = remaining !== null && remaining <= 0;
    const warning = remaining !== null && remaining > 0 && remaining <= 300;

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
      </div>
    );
  }

  return null;
}
