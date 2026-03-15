"use client";

import { useState, useEffect, useRef, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Send, Loader2, MessageCircle } from "lucide-react";

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
    // Check if already chatted
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
      <div className="h-screen flex items-center justify-center text-sm text-gray-500">
        Invalid widget configuration
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-white font-sans text-sm">
      {/* Header */}
      <div className="bg-indigo-600 text-white px-4 py-3 flex items-center gap-3 shrink-0">
        <div className="h-8 w-8 rounded-full bg-white/20 flex items-center justify-center">
          <MessageCircle className="h-4 w-4" />
        </div>
        <div>
          <p className="font-semibold text-sm">แชทกับเรา</p>
          <p className="text-xs text-white/80">ทีมงานพร้อมช่วยเหลือ</p>
        </div>
      </div>

      {!nameSet ? (
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="w-full max-w-xs">
            <h2 className="text-base font-semibold mb-1">สวัสดีครับ! 👋</h2>
            <p className="text-xs text-gray-500 mb-4">กรุณาระบุชื่อก่อนเริ่มแชท</p>
            <input
              type="text"
              placeholder="ชื่อของคุณ"
              value={visitorName}
              onChange={(e) => setVisitorName(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleStartChat(); }}
              className="w-full border rounded-lg px-3 py-2 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <button
              onClick={handleStartChat}
              disabled={!visitorName.trim()}
              className="w-full rounded-lg bg-indigo-600 text-white py-2 text-sm font-medium hover:bg-indigo-700 disabled:opacity-50"
            >
              เริ่มแชท
            </button>
          </div>
        </div>
      ) : loading ? (
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
        </div>
      ) : (
        <>
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.length === 0 && (
              <div className="text-center text-xs text-gray-400 pt-8">
                <MessageCircle className="h-8 w-8 mx-auto mb-2 opacity-30" />
                ส่งข้อความเพื่อเริ่มการสนทนา
              </div>
            )}
            {messages.map((msg) => {
              const isMe = msg.senderType === "contact";
              return (
                <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                  {!isMe && (
                    <div className="h-6 w-6 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs font-bold mr-2 shrink-0 mt-1">
                      A
                    </div>
                  )}
                  <div className={`max-w-[75%] rounded-2xl px-3 py-2 text-sm ${
                    isMe
                      ? "bg-indigo-600 text-white rounded-br-sm"
                      : "bg-gray-100 text-gray-800 rounded-bl-sm"
                  }`}>
                    {msg.content}
                  </div>
                </div>
              );
            })}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="p-3 border-t shrink-0">
            <div className="flex gap-2 items-end">
              <textarea
                rows={1}
                placeholder="พิมพ์ข้อความ..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                className="flex-1 resize-none rounded-xl border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 max-h-32"
                style={{ lineHeight: "1.4" }}
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || sending}
                className="h-9 w-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center hover:bg-indigo-700 disabled:opacity-50 shrink-0"
              >
                {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </button>
            </div>
            <p className="text-center text-[10px] text-gray-400 mt-1.5">Powered by Anajak Chat</p>
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
