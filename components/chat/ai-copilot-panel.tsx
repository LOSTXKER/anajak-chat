"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  Sparkles,
  RefreshCw,
  Loader2,
  Send,
  Copy,
  ArrowDownToLine,
  TrendingDown,
  Heart,
  Target,
  Users,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import type { Conversation } from "@/app/(dashboard)/inbox/types";

interface AiCopilotPanelProps {
  conversation: Conversation;
  onInsertReply: (text: string) => void;
}

interface SuggestedReply {
  reply: string;
  confidence: number;
}

interface CopilotMessage {
  role: "user" | "assistant";
  content: string;
  isError?: boolean;
}

interface ChurnData {
  reason: string;
  confidence: number;
  suggestion: string;
}

export function AiCopilotPanel({ conversation, onInsertReply }: AiCopilotPanelProps) {
  const { toast } = useToast();
  const [suggestions, setSuggestions] = useState<SuggestedReply[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [expandedReply, setExpandedReply] = useState<number | null>(null);

  const [chatMessages, setChatMessages] = useState<CopilotMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const [churnData, setChurnData] = useState<ChurnData | null>(null);
  const [loadingChurn, setLoadingChurn] = useState(false);

  const [refreshingSummary, setRefreshingSummary] = useState(false);
  const [summaryText, setSummaryText] = useState(conversation.aiSummary);
  const [sentiment, setSentiment] = useState(conversation.aiSentiment);

  useEffect(() => {
    setSummaryText(conversation.aiSummary);
    setSentiment(conversation.aiSentiment);
    setChurnData(null);
    setSuggestions([]);
    setChatMessages([]);
  }, [conversation.id, conversation.aiSummary, conversation.aiSentiment]);

  const fetchSuggestions = useCallback(async () => {
    setLoadingSuggestions(true);
    try {
      const res = await fetch("/api/ai/suggest-reply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversationId: conversation.id, count: 3 }),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error((errData as { error?: string }).error || `Error ${res.status}`);
      }
      const data = (await res.json()) as {
        suggestions?: SuggestedReply[];
        reply: string;
        confidence: number;
      };
      if (data.suggestions?.length) {
        setSuggestions(data.suggestions);
      } else {
        setSuggestions([{ reply: data.reply, confidence: data.confidence }]);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "ไม่สามารถขอคำแนะนำได้";
      toast({ title: "AI แนะนำล้มเหลว", description: msg, variant: "destructive" });
    } finally {
      setLoadingSuggestions(false);
    }
  }, [conversation.id, toast]);

  async function refreshSuggestions() {
    setSuggestions([]);
    await fetchSuggestions();
  }

  async function fetchChurn() {
    setLoadingChurn(true);
    try {
      const res = await fetch("/api/ai/analyze-churn", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversationId: conversation.id }),
      });
      if (!res.ok) throw new Error(`Error ${res.status}`);
      const data = (await res.json()) as ChurnData;
      setChurnData(data);
    } catch {
      toast({ title: "วิเคราะห์ความเสี่ยงล้มเหลว", description: "ลองอีกครั้งภายหลัง", variant: "destructive" });
    } finally {
      setLoadingChurn(false);
    }
  }

  async function refreshSummary() {
    setRefreshingSummary(true);
    try {
      const res = await fetch(`/api/ai/summarize/${conversation.id}`, { method: "POST" });
      if (!res.ok) throw new Error(`Error ${res.status}`);
      const data = (await res.json()) as { summary: string; sentiment: string; intent: string };
      setSummaryText(data.summary);
      setSentiment(data.sentiment);
      toast({ title: "สรุปเสร็จแล้ว" });
    } catch {
      toast({ title: "สรุปบทสนทนาล้มเหลว", description: "ลองอีกครั้งภายหลัง", variant: "destructive" });
    } finally {
      setRefreshingSummary(false);
    }
  }

  async function sendCopilotMessage() {
    const q = chatInput.trim();
    if (!q || chatLoading) return;

    const newMessages: CopilotMessage[] = [...chatMessages, { role: "user", content: q }];
    setChatMessages(newMessages);
    setChatInput("");
    setChatLoading(true);

    try {
      const res = await fetch("/api/ai/copilot-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId: conversation.id,
          question: q,
          history: newMessages.filter((m) => !m.isError).slice(-10).map((m) => ({ role: m.role, content: m.content })),
        }),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error((errData as { error?: string }).error || `Error ${res.status}`);
      }
      const data = (await res.json()) as { answer: string };
      setChatMessages((prev) => [...prev, { role: "assistant", content: data.answer }]);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "AI ตอบไม่ได้ในตอนนี้";
      setChatMessages((prev) => [...prev, { role: "assistant", content: `เกิดข้อผิดพลาด: ${msg}`, isError: true }]);
    } finally {
      setChatLoading(false);
    }
  }

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  const sentimentConfig = {
    positive: { label: "เชิงบวก", color: "border-border text-muted-foreground bg-muted" },
    negative: { label: "เชิงลบ", color: "border-border text-muted-foreground bg-muted" },
    neutral: { label: "กลางๆ", color: "border-border text-muted-foreground bg-muted" },
  };

  const intentLabels: Record<string, string> = {
    purchase: "ต้องการซื้อ",
    inquiry: "สอบถาม",
    complaint: "ร้องเรียน",
    support: "ขอช่วยเหลือ",
    other: "อื่นๆ",
  };

  const s = sentiment ? sentimentConfig[sentiment as keyof typeof sentimentConfig] : null;

  return (
    <TooltipProvider>
    <div className="flex flex-col h-full">
      {/* Section A: Quick Insights */}
      <div className="p-4 space-y-3 border-b">
        <div className="grid grid-cols-2 gap-2">
          <Tooltip>
            <TooltipTrigger render={<div className="rounded-xl border p-2.5 space-y-1 cursor-help hover:shadow-sm transition-shadow" />}>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Heart className="h-3.5 w-3.5" />
                ความรู้สึก
              </div>
              {s ? (
                <Badge variant="outline" className={cn("text-xs", s.color)}>{s.label}</Badge>
              ) : (
                <button onClick={refreshSummary} className="text-xs text-primary hover:underline">
                  วิเคราะห์
                </button>
              )}
            </TooltipTrigger>
            <TooltipContent>AI วิเคราะห์อารมณ์ลูกค้าจากบทสนทนา (บวก / กลาง / ลบ)</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger render={<div className="rounded-xl border p-2.5 space-y-1 cursor-help hover:shadow-sm transition-shadow" />}>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Target className="h-3.5 w-3.5" />
                เจตนา
              </div>
              <span className="text-xs font-medium">
                {conversation.aiIntent
                  ? intentLabels[conversation.aiIntent] ?? conversation.aiIntent
                  : "—"}
              </span>
            </TooltipTrigger>
            <TooltipContent>AI ระบุว่าลูกค้าต้องการอะไร เช่น ซื้อ / สอบถาม / ร้องเรียน</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger render={<div className="rounded-xl border p-2.5 space-y-1 cursor-help hover:shadow-sm transition-shadow" />}>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Users className="h-3.5 w-3.5" />
                กลุ่มลูกค้า
              </div>
              <span className="text-xs font-medium">
                {conversation.contact.segment ?? "—"}
              </span>
            </TooltipTrigger>
            <TooltipContent>กลุ่มลูกค้าที่ AI จัดให้ เช่น VIP / Regular / New</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger render={<div className="rounded-xl border p-2.5 space-y-1 cursor-help hover:shadow-sm transition-shadow" />}>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <TrendingDown className="h-3.5 w-3.5" />
                ความเสี่ยง
              </div>
              {churnData ? (
                <span className="text-xs font-medium">{churnData.reason}</span>
              ) : loadingChurn ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <button onClick={fetchChurn} className="text-xs text-primary hover:underline">
                  วิเคราะห์
                </button>
              )}
            </TooltipTrigger>
            <TooltipContent>
              {churnData
                ? `คำแนะนำ: ${churnData.suggestion} (ความมั่นใจ ${Math.round(churnData.confidence * 100)}%)`
                : "กดวิเคราะห์เพื่อดูสาเหตุที่ลูกค้าอาจหายไป"}
            </TooltipContent>
          </Tooltip>
        </div>

        {/* Summary */}
        <div className="rounded-xl border p-3 bg-muted/20">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-medium text-muted-foreground flex items-center gap-1">
              <Sparkles className="h-3.5 w-3.5" />
              สรุปบทสนทนา
            </span>
            <Tooltip>
              <TooltipTrigger
                render={
                  <Button variant="ghost" size="icon" className="h-5 w-5" onClick={refreshSummary} disabled={refreshingSummary} />
                }
              >
                {refreshingSummary ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
              </TooltipTrigger>
              <TooltipContent>ให้ AI สรุปบทสนทนาใหม่ พร้อมวิเคราะห์ความรู้สึกและเจตนา</TooltipContent>
            </Tooltip>
          </div>
          <p className="text-xs leading-relaxed text-muted-foreground">
            {summaryText ?? "ยังไม่มีสรุป — กด refresh เพื่อสร้าง"}
          </p>
        </div>
      </div>

      {/* Section B: Suggested Replies */}
      <div className="p-4 space-y-2.5 border-b">
        <div className="flex items-center justify-between">
          <Tooltip>
            <TooltipTrigger render={<span className="text-xs font-medium text-muted-foreground cursor-help" />}>
              คำตอบแนะนำ
            </TooltipTrigger>
            <TooltipContent>AI ร่างคำตอบ 3 ตัวเลือก กด &quot;ใช้&quot; เพื่อใส่ลงช่องแชท</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger
              render={
                <Button variant="ghost" size="icon" className="h-5 w-5" onClick={refreshSuggestions} disabled={loadingSuggestions} />
              }
            >
              {loadingSuggestions ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
            </TooltipTrigger>
            <TooltipContent>ขอคำตอบแนะนำ 3 ตัวเลือกจาก AI</TooltipContent>
          </Tooltip>
        </div>

        {suggestions.length === 0 && !loadingSuggestions && (
          <p className="text-xs text-muted-foreground italic text-center py-2">กดปุ่ม refresh เพื่อขอคำแนะนำ</p>
        )}

        {suggestions.map((sug, i) => (
          <div key={i} className="rounded-xl border p-3 space-y-2 hover:shadow-sm transition-shadow">
            <div className="flex items-start gap-2">
              <Tooltip>
                <TooltipTrigger
                  render={
                    <span className={cn(
                      "mt-1 h-2 w-2 shrink-0 rounded-full cursor-help",
                      sug.confidence >= 0.7 ? "bg-foreground" : sug.confidence >= 0.4 ? "bg-muted-foreground" : "bg-muted-foreground/50"
                    )} />
                  }
                />
                <TooltipContent>
                  ความมั่นใจ: {Math.round(sug.confidence * 100)}%
                  {sug.confidence >= 0.7 ? " (สูง)" : sug.confidence >= 0.4 ? " (ปานกลาง)" : " (ต่ำ)"}
                </TooltipContent>
              </Tooltip>
              <p
                className={cn("text-xs leading-relaxed flex-1 cursor-pointer", expandedReply !== i && "line-clamp-2")}
                onClick={() => setExpandedReply(expandedReply === i ? null : i)}
              >
                {sug.reply}
              </p>
            </div>
            <div className="flex items-center gap-1 justify-end">
              <Tooltip>
                <TooltipTrigger
                  render={
                    <Button variant="ghost" size="xs"
                      onClick={() => { navigator.clipboard.writeText(sug.reply); toast({ title: "คัดลอกแล้ว" }); }}
                    />
                  }
                >
                  <Copy className="h-3.5 w-3.5" />
                </TooltipTrigger>
                <TooltipContent>คัดลอกข้อความ</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger
                  render={
                    <Button variant="outline" size="xs" onClick={() => onInsertReply(sug.reply)} />
                  }
                >
                  <ArrowDownToLine className="h-3.5 w-3.5" />
                  ใช้
                </TooltipTrigger>
                <TooltipContent>ใส่ข้อความนี้ลงช่องแชท (แก้ไขได้ก่อนส่ง)</TooltipContent>
              </Tooltip>
            </div>
          </div>
        ))}
      </div>

      {/* Section C: Ask AI */}
      <div className="flex-1 flex flex-col min-h-0">
        <div className="px-3 pt-2 pb-1">
          <Tooltip>
            <TooltipTrigger render={<span className="text-xs font-medium text-muted-foreground cursor-help" />}>
              ถาม AI
            </TooltipTrigger>
            <TooltipContent side="bottom">ถามอะไร AI ก็ได้ เช่น &quot;ช่วยร่างคำตอบเรื่องคืนสินค้า&quot;</TooltipContent>
          </Tooltip>
        </div>

        <div className="flex-1 overflow-y-auto px-3 space-y-2">
          {chatMessages.map((msg, i) => (
            <div key={i} className={cn("flex", msg.role === "user" ? "justify-end" : "justify-start")}>
              <div className={cn(
                "max-w-[90%] rounded-xl px-3 py-1.5 text-xs",
                msg.role === "user"
                  ? "bg-accent text-accent-foreground rounded-br-sm"
                  : msg.isError
                    ? "bg-destructive/10 text-destructive border border-destructive/20 rounded-bl-sm"
                    : "bg-muted rounded-bl-sm"
              )}>
                {msg.isError && <AlertCircle className="h-3.5 w-3.5 inline mr-1" />}
                <p className="whitespace-pre-wrap break-words inline">{msg.content}</p>
                {msg.role === "assistant" && !msg.isError && (
                  <Tooltip>
                    <TooltipTrigger
                      render={
                        <Button variant="ghost" size="xs" className="mt-1 text-muted-foreground" onClick={() => onInsertReply(msg.content)} />
                      }
                    >
                      <ArrowDownToLine className="h-2.5 w-2.5" />
                      ใช้เป็นคำตอบ
                    </TooltipTrigger>
                    <TooltipContent>ใส่คำตอบนี้ลงช่องแชท</TooltipContent>
                  </Tooltip>
                )}
              </div>
            </div>
          ))}
          {chatLoading && (
            <div className="flex justify-start">
              <div className="bg-muted rounded-xl px-3 py-2">
                <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        <div className="p-3 border-t">
          <div className="flex items-end gap-2">
            <Textarea
              placeholder="ถามอะไร AI ก็ได้..."
              className="min-h-[36px] max-h-[72px] resize-none rounded-lg text-xs"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  sendCopilotMessage();
                }
              }}
            />
            <Tooltip>
              <TooltipTrigger
                render={
                  <Button size="icon-sm" className="shrink-0" onClick={sendCopilotMessage} disabled={chatLoading || !chatInput.trim()} />
                }
              >
                <Send className="h-3.5 w-3.5" />
              </TooltipTrigger>
              <TooltipContent>ส่งคำถามให้ AI (Enter)</TooltipContent>
            </Tooltip>
          </div>
        </div>
      </div>
    </div>
    </TooltipProvider>
  );
}
