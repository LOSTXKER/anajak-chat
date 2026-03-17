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

  // If conversation already has a first response, use resolution deadline
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
        className="flex items-center gap-1 rounded-md bg-red-100 px-2 py-1 text-xs font-medium text-red-700 dark:bg-red-950 dark:text-red-400"
        title="SLA breach!"
      >
        <AlertTriangle className="h-3 w-3" />
        <span>เกิน SLA</span>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium",
        isWarning
          ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-400"
          : "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400"
      )}
      title={`SLA deadline: ${new Date(relevantDeadline).toLocaleString("th-TH")}`}
    >
      <Timer className="h-3 w-3" />
      <span>{formatCountdown(remaining)}</span>
    </div>
  );
}
