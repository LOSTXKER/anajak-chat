"use client";

import { useEffect, useRef, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";

interface Props {
  orgId: string;
}

const BASE_TITLE = "Anajak Chat";

function playNotificationSound() {
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.frequency.setValueAtTime(830, ctx.currentTime);
    osc.frequency.setValueAtTime(1000, ctx.currentTime + 0.1);
    osc.type = "sine";

    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);

    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.4);

    setTimeout(() => ctx.close(), 500);
  } catch {
    // Audio not available
  }
}

function showBrowserNotification(content: string | null) {
  if (typeof window === "undefined" || Notification.permission !== "granted") return;

  new Notification("Anajak Chat – ข้อความใหม่", {
    body: content || "คุณได้รับข้อความใหม่",
    icon: "/favicon.ico",
    tag: "new-message",
  } as NotificationOptions);
}

export function NewMessageNotifier({ orgId }: Props) {
  const hasRequestedPermission = useRef(false);
  const unreadRef = useRef(0);

  const resetTitle = useCallback(() => {
    unreadRef.current = 0;
    document.title = BASE_TITLE;
  }, []);

  useEffect(() => {
    if (hasRequestedPermission.current) return;
    hasRequestedPermission.current = true;

    if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  useEffect(() => {
    const handleFocus = () => resetTitle();
    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, [resetTitle]);

  useEffect(() => {
    const supabase = createClient();

    const channel = supabase
      .channel(`new-msg-notifier-${orgId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
        },
        (payload) => {
          const row = payload.new as Record<string, unknown>;
          const senderType = row.sender_type as string;

          if (senderType !== "contact") return;

          playNotificationSound();

          const content = row.content as string | null;

          if (document.hidden) {
            showBrowserNotification(content);
            unreadRef.current += 1;
            document.title = `(${unreadRef.current}) ${BASE_TITLE}`;
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [orgId]);

  return null;
}
