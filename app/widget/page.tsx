"use client";

import { useState, useEffect, useRef, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Send, Loader2, MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  senderType: string;
  content: string;
  contentType: string;
  createdAt: string;
}

function generateSessionId(): string {
  const key = "anajak_session";
  let id = localStorage.getItem(key);
  if (!id) {
    id = Math.random().toString(36).slice(2) + Date.now().toString(36);
    localStorage.setItem(key, id);
  }
  return id;
}

function ChatWidget() {
  const searchParams = useSearchParams();
  const orgId = searchParams.get("orgId") ?? "";
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [visitorName, setVisitorName] = useState("");
  const [nameSet, setNameSet] = useState(false);
  const [loading, setLoading] = useState(true);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [lastMessageAt, setLastMessageAt] = useState<string | null>(null);
  const sessionId = useRef<string>("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    sessionId.current = generateSessionId();
    const existingName = localStorage.getItem("anajak_name");
    if (existingName) { setVisitorName(existingName); setNameSet(true); }
    else { setLoading(false); }
  }, []);

  const fetchMessages = useCallback(async () => {
    if (!orgId || !sessionId.current) return;
    const params = new URLSearchParams({ orgId, sessionId: sessionId.current });
    if (lastMessageAt) params.set("since", lastMessageAt);
    const res = await fetch(`/api/widget/messages?${params}`);
    if (res.ok) {
      const data = await res.json() as { messages: Message[]; conversationId: string };
      if (data.messages.length > 0) {
        setMessages((prev) => {
          const ids = new Set(prev.map((m) => m.id));
          const newMsgs = data.messages.filter((m) => !ids.has(m.id));
          if (newMsgs.length === 0) return prev;
          setLastMessageAt(newMsgs[newMsgs.length - 1].createdAt);
          return [...prev, ...newMsgs];
        });
      }
      if (data.conversationId) setConversationId(data.conversationId);
    }
    setLoading(false);
  }, [orgId, lastMessageAt]);

  useEffect(() => {
    if (nameSet) {
      fetchMessages();
      pollRef.current = setInterval(fetchMessages, 3000);
    }
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [nameSet, fetchMessages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleStartChat() {
    if (!visitorName.trim()) return;
    localStorage.setItem("anajak_name", visitorName.trim());
    setNameSet(true);
    setLoading(true);
  }

  async function handleSend() {
    if (!input.trim() || sending) return;
    const content = input.trim();
    setInput("");
    setSending(true);

    const tempMsg: Message = {
      id: "temp-" + Date.now(),
      senderType: "contact",
      content,
      contentType: "text",
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempMsg]);

    try {
      await fetch("/api/widget/message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orgId, sessionId: sessionId.current, visitorName, content }),
      });
      fetchMessages();
    } finally {
      setSending(false);
    }
  }

  if (!orgId) {
    return (
      <div className="h-screen flex items-center justify-center text-sm text-muted-foreground">
        Invalid widget configuration
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-background font-sans text-sm rounded-2xl overflow-hidden shadow-lg border border-border/40">
      {/* Header */}
      <div className="bg-primary text-primary-foreground px-5 py-4 flex items-center gap-3 shrink-0">
        <div className="h-9 w-9 flex items-center justify-center rounded-xl bg-primary-foreground/15">
          <MessageCircle className="h-4 w-4" />
        </div>
        <div>
          <p className="font-semibold text-sm">แชทกับเรา</p>
          <p className="text-xs text-primary-foreground/85 mt-0.5">ทีมงานพร้อมช่วยเหลือ</p>
        </div>
      </div>

      {!nameSet ? (
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="w-full max-w-xs space-y-5">
            <div className="space-y-2">
              <h2 className="text-base font-semibold">สวัสดีครับ!</h2>
              <p className="text-sm text-muted-foreground">กรุณาระบุชื่อก่อนเริ่มแชท</p>
            </div>
            <input
              type="text"
              placeholder="ชื่อของคุณ"
              value={visitorName}
              onChange={(e) => setVisitorName(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleStartChat(); }}
              className="w-full border border-border/80 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/30"
            />
            <button
              onClick={handleStartChat}
              disabled={!visitorName.trim()}
              className="w-full rounded-xl bg-primary text-primary-foreground py-3 text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors"
            >
              เริ่มแชท
            </button>
          </div>
        </div>
      ) : loading ? (
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-5 py-6 space-y-4">
            {messages.length === 0 && (
              <div className="text-center text-sm text-muted-foreground pt-12 px-4">
                <MessageCircle className="h-9 w-9 mx-auto mb-3 opacity-25" />
                ส่งข้อความเพื่อเริ่มการสนทนา
              </div>
            )}
            {messages.map((msg) => {
              const isMe = msg.senderType === "contact";
              return (
                <div
                  key={msg.id}
                  className={cn("flex gap-2.5", isMe ? "justify-end" : "justify-start")}
                >
                  {!isMe && (
                    <div className="h-7 w-7 flex items-center justify-center rounded-xl text-[10px] font-semibold shrink-0 mt-0.5 bg-muted text-muted-foreground">
                      A
                    </div>
                  )}
                  <div
                    className={cn(
                      "max-w-[78%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
                      isMe
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-foreground"
                    )}
                  >
                    {msg.content}
                  </div>
                </div>
              );
            })}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="p-4 pt-3 border-t border-border/60 shrink-0 bg-background">
            <div className="flex gap-3 items-end">
              <textarea
                rows={1}
                placeholder="พิมพ์ข้อความ..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                className="flex-1 resize-none rounded-xl border border-border/80 px-4 py-2.5 text-sm leading-[1.45] focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/25 max-h-32"
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || sending}
                className="h-10 w-10 rounded-xl flex items-center justify-center disabled:opacity-50 shrink-0 bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </button>
            </div>
            <p className="text-center text-[11px] text-muted-foreground/90 mt-3">Powered by Anajak Chat</p>
          </div>
        </>
      )}
    </div>
  );
}

export default function WidgetPage() {
  return (
    <Suspense fallback={<div className="h-screen flex items-center justify-center"><Loader2 className="h-5 w-5 animate-spin" /></div>}>
      <ChatWidget />
    </Suspense>
  );
}
