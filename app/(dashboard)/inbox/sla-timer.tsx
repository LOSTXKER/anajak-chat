"use client";

import { useState, useEffect } from "react";
import { Timer, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Conversation } from "./types";

interface SlaTimerProps {
  conversation: Conversation;
}

function formatCountdown(ms: number): string {
  if (ms <= 0) return "0:00";
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

export function SlaTimer({ conversation }: SlaTimerProps) {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  const conv = conversation as Conversation & {
    slaFirstResponseDeadline?: string | null;
    slaResolutionDeadline?: string | null;
    slaBreachedAt?: string | null;
    firstResponseAt?: string | null;
  };

  const relevantDeadline = conv.firstResponseAt
    ? conv.slaResolutionDeadline
    : (conv.slaFirstResponseDeadline ?? conv.slaResolutionDeadline);

  if (!relevantDeadline) return null;

  const deadlineMs = new Date(relevantDeadline).getTime();
  const remaining = deadlineMs - now;
  const total = deadlineMs - new Date(conversation.createdAt).getTime();
  const percentRemaining = total > 0 ? (remaining / total) * 100 : 0;

  const isBreached = remaining <= 0 || !!conv.slaBreachedAt;
  const isWarning = !isBreached && percentRemaining <= 20;

  if (isBreached) {
    return (
      <div
        className="flex items-center gap-1 rounded-full bg-red-100/80 px-2 py-0.5 text-xs font-medium text-red-600 dark:bg-red-950/50 dark:text-red-400"
        title="เกินเวลา SLA"
      >
        <AlertTriangle className="h-3 w-3" />
        <span>เกิน SLA</span>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
        isWarning
          ? "bg-amber-100/80 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400"
          : "text-muted-foreground"
      )}
      title={`SLA deadline: ${new Date(relevantDeadline).toLocaleString("th-TH")}`}
    >
      <Timer className="h-3 w-3" />
      <span>{formatCountdown(remaining)}</span>
    </div>
  );
}
