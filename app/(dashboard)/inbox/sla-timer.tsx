"use client";

import { useState, useEffect } from "react";
import { Timer, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Conversation } from "./types";

interface SlaTimerProps {
  conversation: Conversation;
  variant?: "compact" | "bar";
}

function formatCountdown(ms: number): string {
  if (ms <= 0) return "00:00:00";
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
}

function formatDuration(minutes: number): string {
  if (minutes >= 1440) {
    const days = Math.floor(minutes / 1440);
    const hrs = Math.floor((minutes % 1440) / 60);
    return hrs > 0 ? `${days} วัน ${hrs} ชม.` : `${days} วัน`;
  }
  if (minutes >= 60) {
    const hrs = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hrs} ชม. ${mins} นาที` : `${hrs} ชม.`;
  }
  return `${minutes} นาที`;
}

/**
 * SLA Timer — shows countdown only when status is "pending".
 * Stops when agent clicks "เริ่มแชท" (status → open).
 */
export function SlaTimer({ conversation, variant = "compact" }: SlaTimerProps) {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  if (conversation.status !== "pending") return null;

  const baseTime = conversation.lastMessageAt ?? conversation.createdAt;
  if (!baseTime) return null;

  const slaMinutes = conversation.slaResponseMinutes ?? 15;
  const totalMs = slaMinutes * 60 * 1000;
  const deadlineMs = new Date(baseTime).getTime() + totalMs;
  const remaining = deadlineMs - now;
  const percentElapsed = totalMs > 0 ? ((now - new Date(baseTime).getTime()) / totalMs) * 100 : 0;

  const isBreached = remaining <= 0 || !!conversation.slaBreachedAt;
  const isWarning = !isBreached && percentElapsed >= 80;

  if (variant === "bar") {
    if (isBreached) {
      return (
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-red-600 dark:text-red-400">
            <AlertTriangle className="h-3.5 w-3.5" />
            <span className="text-xs font-medium">เกินเวลา SLA</span>
          </div>
          <div className="flex items-center gap-1 text-muted-foreground">
            <Timer className="h-3.5 w-3.5" />
            <span className="text-xs">{formatDuration(slaMinutes)}</span>
          </div>
        </div>
      );
    }

    return (
      <div className="flex items-center gap-3">
        <div className={cn(
          "flex items-center gap-1.5",
          isWarning ? "text-amber-600 dark:text-amber-400" : "text-muted-foreground"
        )}>
          <span className="text-xs">รับเรื่องภายใน</span>
          <span className={cn(
            "font-mono text-xs font-semibold tabular-nums",
            isWarning ? "text-amber-600 dark:text-amber-400" : "text-foreground"
          )}>
            {formatCountdown(remaining)}
          </span>
        </div>
        <div className="flex items-center gap-1 text-muted-foreground">
          <Timer className="h-3.5 w-3.5" />
          <span className="text-xs">{formatDuration(slaMinutes)}</span>
        </div>
      </div>
    );
  }

  if (isBreached) {
    return (
      <span className="flex items-center gap-1 text-xs font-medium text-red-600 dark:text-red-400" title="เกินเวลา SLA">
        <AlertTriangle className="h-3 w-3" />
        เกิน SLA
      </span>
    );
  }

  return (
    <span
      className={cn(
        "flex items-center gap-1 text-xs font-medium tabular-nums",
        isWarning ? "text-amber-600 dark:text-amber-400" : "text-muted-foreground"
      )}
      title={`SLA: ${formatDuration(slaMinutes)}`}
    >
      <Timer className="h-3 w-3" />
      {formatCountdown(remaining)}
    </span>
  );
}
