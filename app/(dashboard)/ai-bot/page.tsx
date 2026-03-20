"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Plus, Trash2, Loader2, Bot,
  ChevronRight, ChevronUp, ChevronDown, X, Check, Hash,
  Zap, MessageSquare, Info,
} from "lucide-react";
import { ChatPreview } from "@/components/chat-preview";
import type { PreviewMessage, PreviewQuickReply } from "@/components/chat-preview";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { SearchInput } from "@/components/ui/search-input";
import { EmptyState } from "@/components/empty-state";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

// ─── Types ───────────────────────────────────────────────────────────────────

interface MessageSetRef { id: string; name: string }

interface IntentMessageSetLink {
  id: string;
  order: number;
  messageSet: MessageSetRef;
}

interface IntentItem {
  id: string; name: string; isActive: boolean;
  triggerType: string; keywords: string[]; postbackData: string | null;
  channelId: string | null; priority: number;
  assignToHuman: boolean; createdAt: string;
  messageSets: IntentMessageSetLink[];
  channel: { id: string; name: string; platform: string } | null;
  _count?: { sessions: number };
}

const TRIGGER_LABELS: Record<string, string> = {
  keyword: "คีย์เวิร์ด",
  first_message: "ข้อความแรก",
  postback: "Postback",
};

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function BotRulesPage() {
  const [intents, setIntents] = useState<IntentItem[]>([]);
  const [messageSets, setMessageSets] = useState<MessageSetRef[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);

  const fetchData = useCallback(async () => {
    const [intentsRes, setsRes] = await Promise.all([
      fetch("/api/bot-intents"),
      fetch("/api/message-sets"),
    ]);
    if (intentsRes.ok) {
      const data = await intentsRes.json();
      setIntents(data);
      if (data.length > 0 && !selectedId) setSelectedId(data[0].id);
    }
    if (setsRes.ok) setMessageSets(await setsRes.json());
    setLoading(false);
  }, [selectedId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleCreate = async (name: string, triggerType: string, messageSetIds: string[]) => {
    const res = await fetch("/api/bot-intents", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, triggerType, messageSetIds }),
    });
    if (res.ok) {
      const created = await res.json();
      setIntents((prev) => [created, ...prev]);
      setSelectedId(created.id);
      setCreateOpen(false);
      toast.success("สร้างกฎบอทสำเร็จ");
    }
  };

  const handleUpdate = async (id: string, data: Record<string, unknown>) => {
    const res = await fetch(`/api/bot-intents/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (res.ok) {
      const updated = await res.json();
      setIntents((prev) => prev.map((i) => (i.id === id ? { ...i, ...updated } : i)));
    }
  };

  const handleToggle = async (id: string) => {
    const res = await fetch(`/api/bot-intents/${id}/toggle`, { method: "PATCH" });
    if (res.ok) {
      const updated = await res.json();
      setIntents((prev) => prev.map((i) => (i.id === id ? { ...i, isActive: updated.isActive } : i)));
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("ลบกฎบอทนี้?")) return;
    const res = await fetch(`/api/bot-intents/${id}`, { method: "DELETE" });
    if (res.ok) {
      setIntents((prev) => prev.filter((i) => i.id !== id));
      if (selectedId === id) setSelectedId(intents.find((i) => i.id !== id)?.id ?? null);
      toast.success("ลบกฎบอทสำเร็จ");
    }
  };

  const filtered = intents.filter((i) => i.name.toLowerCase().includes(search.toLowerCase()));
  const selected = intents.find((i) => i.id === selectedId) ?? null;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex h-full">
      {/* Left — Rule list */}
      <div className="flex w-[320px] shrink-0 flex-col border-r">
        <div className="space-y-3 border-b p-4">
          <div>
            <h1 className="heading-page">บอทตอบกลับ</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              ตั้งกฎเงื่อนไข บอทจะตอบกลับอัตโนมัติ · {intents.length} กฎ
            </p>
          </div>
          <Button className="w-full" onClick={() => setCreateOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />สร้างกฎบอท
          </Button>
          <SearchInput value={search} onChange={setSearch} placeholder="ค้นหากฎบอท..." />
        </div>

        <div className="flex-1 overflow-y-auto p-2">
          {filtered.length === 0 ? (
            <EmptyState
              icon={Bot}
              message={search ? "ไม่พบกฎบอท" : "ยังไม่มีกฎบอท"}
              description={search ? "ลองค้นหาด้วยคำอื่น" : "สร้างกฎบอทแรกเพื่อให้บอทตอบกลับอัตโนมัติ"}
              action={!search ? (
                <Button size="sm" onClick={() => setCreateOpen(true)}>
                  <Plus className="mr-1.5 h-3.5 w-3.5" />สร้างกฎบอท
                </Button>
              ) : undefined}
              className="py-12 border-0"
            />
          ) : (
            <div className="space-y-1">
              {filtered.map((intent) => {
                const isSelected = selectedId === intent.id;
                const TriggerIcon = intent.triggerType === "keyword" ? Hash : intent.triggerType === "postback" ? Zap : MessageSquare;
                const sessions = intent._count?.sessions ?? 0;
                const setCount = intent.messageSets?.length ?? 0;
                const firstName = intent.messageSets?.[0]?.messageSet?.name;

                return (
                  <button
                    key={intent.id}
                    onClick={() => setSelectedId(intent.id)}
                    className={cn(
                      "flex w-full items-start gap-3 rounded-xl px-3 py-3 text-left transition-all",
                      isSelected
                        ? "bg-primary/8 ring-1 ring-primary/20"
                        : "hover:bg-muted/50"
                    )}
                  >
                    <div className={cn(
                      "mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-colors",
                      isSelected ? "bg-primary/15" : "bg-muted"
                    )}>
                      <Bot className={cn("h-4 w-4", isSelected ? "text-primary" : "text-muted-foreground")} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="truncate text-sm font-medium">{intent.name}</span>
                        <span className={cn(
                          "h-2 w-2 shrink-0 rounded-full",
                          intent.isActive ? "bg-emerald-500" : "bg-muted-foreground/30"
                        )} />
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-1.5">
                        <span className="inline-flex items-center gap-1 rounded-md bg-muted px-1.5 py-0.5 text-[11px] font-medium text-muted-foreground">
                          <TriggerIcon className="h-3 w-3" />
                          {TRIGGER_LABELS[intent.triggerType] ?? intent.triggerType}
                        </span>
                        {intent.triggerType === "keyword" && intent.keywords.length > 0 && (
                          <span className="rounded-md bg-muted px-1.5 py-0.5 text-[11px] font-medium text-muted-foreground">
                            {intent.keywords.length} คำ
                          </span>
                        )}
                        {sessions > 0 && (
                          <span className="rounded-md bg-primary/10 px-1.5 py-0.5 text-[11px] font-medium text-primary">
                            {sessions} ครั้ง
                          </span>
                        )}
                      </div>
                      <div className="mt-1 text-[11px] text-muted-foreground/60">
                        {setCount === 0 ? "—" : setCount === 1 ? firstName : `${firstName} +${setCount - 1}`}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Right — Editor */}
      <div className="flex-1 overflow-y-auto bg-background">
        {selected ? (
          <RuleEditor
            intent={selected}
            messageSets={messageSets}
            onUpdate={(data) => handleUpdate(selected.id, data)}
            onToggle={() => handleToggle(selected.id)}
            onDelete={() => handleDelete(selected.id)}
          />
        ) : (
          <EmptyState
            icon={Bot}
            message="เลือกกฎบอท"
            description="เลือกกฎบอทจากรายการด้านซ้ายเพื่อแก้ไข"
            className="h-full border-0"
          />
        )}
      </div>

      <CreateRuleDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        messageSets={messageSets}
        onCreate={handleCreate}
      />
    </div>
  );
}

// ─── Rule Editor ─────────────────────────────────────────────────────────────

function RuleEditor({ intent, messageSets, onUpdate, onToggle, onDelete }: {
  intent: IntentItem;
  messageSets: MessageSetRef[];
  onUpdate: (data: Record<string, unknown>) => void;
  onToggle: () => void;
  onDelete: () => void;
}) {
  const [name, setName] = useState(intent.name);
  const [triggerType, setTriggerType] = useState(intent.triggerType);
  const [keywords, setKeywords] = useState<string[]>(intent.keywords);
  const [postbackData, setPostbackData] = useState(intent.postbackData ?? "");
  const [messageSetIds, setMessageSetIds] = useState<string[]>(
    intent.messageSets?.map((ms) => ms.messageSet.id) ?? []
  );
  const [kwInput, setKwInput] = useState("");
  const [dirty, setDirty] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);

  const [setBubbleCounts, setSetBubbleCounts] = useState<Record<string, number>>({});
  const [previewMessages, setPreviewMessages] = useState<PreviewMessage[]>([]);
  const [previewQuickReplies, setPreviewQuickReplies] = useState<PreviewQuickReply[]>([]);

  useEffect(() => {
    setName(intent.name);
    setTriggerType(intent.triggerType);
    setKeywords(intent.keywords);
    setPostbackData(intent.postbackData ?? "");
    setMessageSetIds(intent.messageSets?.map((ms) => ms.messageSet.id) ?? []);
    setDirty(false);
    setKwInput("");
  }, [intent.id, intent.name, intent.triggerType, intent.keywords, intent.postbackData, intent.messageSets]);

  useEffect(() => {
    if (messageSetIds.length === 0) {
      setPreviewMessages([]);
      setPreviewQuickReplies([]);
      setSetBubbleCounts({});
      return;
    }
    Promise.all(
      messageSetIds.map((id) =>
        fetch(`/api/message-sets/${id}`).then((r) => r.ok ? r.json() : null)
      )
    ).then((results) => {
      const allMsgs: PreviewMessage[] = [];
      let lastQr: PreviewQuickReply[] = [];
      const counts: Record<string, number> = {};
      for (let i = 0; i < results.length; i++) {
        const p = results[i]?.messages?._default;
        const msgs = p?.messages ?? [];
        counts[messageSetIds[i]] = msgs.length;
        allMsgs.push(...msgs);
        if (p?.quickReplies?.length) lastQr = p.quickReplies;
      }
      setPreviewMessages(allMsgs);
      setPreviewQuickReplies(lastQr);
      setSetBubbleCounts(counts);
    });
  }, [messageSetIds]);

  const totalBubbles = Object.values(setBubbleCounts).reduce((a, b) => a + b, 0);

  const save = () => {
    onUpdate({ name, triggerType, keywords, postbackData: postbackData || null, messageSetIds });
    setDirty(false);
    toast.success("บันทึกสำเร็จ");
  };

  const addKeyword = () => {
    const kw = kwInput.trim();
    if (!kw || keywords.includes(kw)) return;
    setKeywords([...keywords, kw]);
    setKwInput("");
    setDirty(true);
  };

  const removeKeyword = (kw: string) => {
    setKeywords(keywords.filter((k) => k !== kw));
    setDirty(true);
  };

  const addSet = (id: string) => {
    if (messageSetIds.includes(id)) return;
    setMessageSetIds([...messageSetIds, id]);
    setDirty(true);
  };

  const removeSet = (id: string) => {
    setMessageSetIds(messageSetIds.filter((s) => s !== id));
    setDirty(true);
  };

  const moveSet = (idx: number, dir: -1 | 1) => {
    const target = idx + dir;
    if (target < 0 || target >= messageSetIds.length) return;
    const next = [...messageSetIds];
    [next[idx], next[target]] = [next[target], next[idx]];
    setMessageSetIds(next);
    setDirty(true);
  };

  const msNameMap = new Map(messageSets.map((ms) => [ms.id, ms.name]));

  const userBubbleText = triggerType === "keyword" && keywords.length > 0
    ? keywords[0]
    : triggerType === "first_message" ? "สวัสดีครับ"
    : triggerType === "postback" && postbackData ? `[postback: ${postbackData}]`
    : undefined;

  return (
    <div className="flex h-full">
    <div className="min-w-0 flex-1 overflow-y-auto p-6 space-y-6">

      {/* Header Card */}
      <div className="rounded-2xl border bg-card p-5">
        <div className="flex items-center gap-4">
          <div className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
            intent.isActive ? "bg-primary/10" : "bg-muted"
          )}>
            <Bot className={cn("h-5 w-5", intent.isActive ? "text-primary" : "text-muted-foreground")} />
          </div>
          <Input
            className="min-w-0 flex-1 text-lg font-semibold"
            value={name}
            onChange={(e) => { setName(e.target.value); setDirty(true); }}
            placeholder="ชื่อกฎบอท"
          />
          <div className="flex shrink-0 items-center gap-2 cursor-pointer" onClick={onToggle}>
            <Switch checked={intent.isActive} />
            <span className={cn(
              "text-sm font-medium whitespace-nowrap",
              intent.isActive ? "text-primary" : "text-muted-foreground"
            )}>
              {intent.isActive ? "เปิด" : "ปิด"}
            </span>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Button onClick={save} disabled={!dirty}>บันทึก</Button>
            <Button variant="outline" size="icon" onClick={onDelete} className="text-destructive hover:text-destructive">
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Trigger Card */}
      <div className="rounded-2xl border bg-card p-5 space-y-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted">
            <Zap className="h-4 w-4 text-muted-foreground" />
          </div>
          <div>
            <h3 className="heading-section">เงื่อนไขการตอบกลับ</h3>
            <p className="text-xs text-muted-foreground">กำหนดเงื่อนไขที่บอทจะตอบกลับอัตโนมัติ</p>
          </div>
        </div>

        <div className="inline-flex rounded-xl bg-muted p-1">
          {[
            { value: "keyword", label: "คีย์เวิร์ด" },
            { value: "first_message", label: "ข้อความแรก" },
            { value: "postback", label: "Postback" },
          ].map((opt) => (
            <button
              key={opt.value}
              onClick={() => { setTriggerType(opt.value); setDirty(true); }}
              className={cn(
                "rounded-lg px-4 py-2 text-sm font-medium transition-all",
                triggerType === opt.value
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {triggerType === "keyword" && (
          <div className="space-y-3">
            {keywords.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {keywords.map((kw) => (
                  <span key={kw} className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 py-1.5 pl-3 pr-2 text-sm font-medium text-primary">
                    {kw}
                    <button
                      onClick={() => removeKeyword(kw)}
                      className="rounded-full p-0.5 transition-colors hover:bg-primary/20"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
            <div className="flex gap-2">
              <Input
                className="flex-1"
                placeholder="พิมพ์คีย์เวิร์ดแล้ว Enter"
                value={kwInput}
                onChange={(e) => setKwInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addKeyword()}
              />
              <Button onClick={addKeyword} disabled={!kwInput.trim()} size="icon" className="shrink-0">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {keywords.length === 0 && (
              <p className="text-sm text-muted-foreground">ยังไม่มีคีย์เวิร์ด — พิมพ์คำแล้วกด Enter เพื่อเพิ่ม</p>
            )}
          </div>
        )}

        {triggerType === "postback" && (
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-1.5 block">ข้อมูล Postback</label>
            <Input
              placeholder="postback data ที่จะ match"
              value={postbackData}
              onChange={(e) => { setPostbackData(e.target.value); setDirty(true); }}
            />
          </div>
        )}

        {triggerType === "first_message" && (
          <div className="flex items-center gap-2 rounded-xl bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
            <Info className="h-4 w-4 shrink-0" />
            บอทจะตอบกลับทุกครั้งเมื่อผู้ใช้ส่งข้อความเข้ามาครั้งแรก
          </div>
        )}
      </div>

      {/* Message Sets Card */}
      <div className="rounded-2xl border bg-card p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted">
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </div>
            <div>
              <h3 className="heading-section">ชุดข้อความตอบกลับ</h3>
              <p className="text-xs text-muted-foreground">เลือกชุดข้อความที่บอทจะส่งตามลำดับ</p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={() => setPickerOpen(true)}>
            <Plus className="h-3.5 w-3.5 mr-1" />เพิ่มชุดข้อความ
          </Button>
        </div>

        {/* Bubble count + limit warning */}
        {messageSetIds.length > 0 && (
          <div className="flex items-center gap-2">
            <span className={cn(
              "rounded-full px-2.5 py-0.5 text-xs font-medium",
              totalBubbles > 5
                ? "bg-red-500/10 text-red-600"
                : totalBubbles === 5
                ? "bg-amber-500/10 text-amber-600"
                : "bg-muted text-muted-foreground"
            )}>
              รวม {totalBubbles}/5 บับเบิ้ล
            </span>
            {totalBubbles > 5 && (
              <span className="text-xs text-red-500">
                เกินลิมิต LINE — ข้อความบางส่วนอาจไม่ถูกส่ง
              </span>
            )}
          </div>
        )}

        {/* Selected sets list */}
        {messageSetIds.length > 0 ? (
          <div className="space-y-2">
            {messageSetIds.map((msId, idx) => (
              <div key={msId} className="flex items-center gap-3 rounded-xl bg-muted/30 px-4 py-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                  {idx + 1}
                </span>
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                  <MessageSquare className="h-3.5 w-3.5 text-primary" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">{msNameMap.get(msId) ?? "—"}</p>
                  <p className="text-xs text-muted-foreground">{setBubbleCounts[msId] ?? 0} ข้อความ</p>
                </div>
                <div className="flex items-center gap-0.5">
                  <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => moveSet(idx, -1)} disabled={idx === 0}>
                    <ChevronUp className="h-3.5 w-3.5" />
                  </Button>
                  <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => moveSet(idx, 1)} disabled={idx === messageSetIds.length - 1}>
                    <ChevronDown className="h-3.5 w-3.5" />
                  </Button>
                  <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => removeSet(msId)}>
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3 rounded-xl border-2 border-dashed py-8 text-center">
            <MessageSquare className="h-8 w-8 text-muted-foreground/30" />
            <p className="text-sm text-muted-foreground">ยังไม่ได้เลือกชุดข้อความ</p>
            <Button variant="outline" size="sm" onClick={() => setPickerOpen(true)}>เลือกชุดข้อความ</Button>
          </div>
        )}

        {messageSetIds.length > 0 && (
          <a href="/auto-reply" className="inline-flex items-center gap-0.5 text-xs font-medium text-primary hover:underline">
            จัดการชุดข้อความ <ChevronRight className="h-3 w-3" />
          </a>
        )}
      </div>

    </div>

    {/* Preview Panel */}
    <div className="hidden w-[40%] shrink-0 border-l lg:flex lg:flex-col">
      <ChatPreview
        messages={previewMessages}
        quickReplies={previewQuickReplies}
        userMessage={userBubbleText}
        botName={name || "Bot"}
      />
    </div>

    {/* Message Set Picker */}
    <Dialog open={pickerOpen} onOpenChange={setPickerOpen}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>เลือกชุดข้อความ</DialogTitle></DialogHeader>
        <div className="space-y-1.5 max-h-72 overflow-y-auto">
          {messageSets.map((ms) => {
            const isLinked = messageSetIds.includes(ms.id);
            return (
              <button
                key={ms.id}
                onClick={() => {
                  if (isLinked) removeSet(ms.id);
                  else addSet(ms.id);
                }}
                className={cn(
                  "flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left transition-colors",
                  isLinked
                    ? "bg-primary/8 ring-1 ring-primary/20"
                    : "hover:bg-muted/50"
                )}
              >
                <MessageSquare className={cn("h-4 w-4", isLinked ? "text-primary" : "text-muted-foreground")} />
                <span className="text-sm font-medium">{ms.name}</span>
                {isLinked && <Check className="ml-auto h-4 w-4 text-primary" />}
              </button>
            );
          })}
          {messageSets.length === 0 && (
            <p className="py-4 text-center text-sm text-muted-foreground">ยังไม่มีชุดข้อความ</p>
          )}
        </div>
        <DialogFooter>
          <Button onClick={() => setPickerOpen(false)}>เสร็จสิ้น</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    </div>
  );
}

// ─── Create Rule Dialog ──────────────────────────────────────────────────────

function CreateRuleDialog({ open, onOpenChange, messageSets, onCreate }: {
  open: boolean; onOpenChange: (open: boolean) => void;
  messageSets: MessageSetRef[];
  onCreate: (name: string, triggerType: string, messageSetIds: string[]) => void;
}) {
  const [name, setName] = useState("");
  const [triggerType, setTriggerType] = useState("keyword");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  useEffect(() => {
    if (open) {
      setName("");
      setTriggerType("keyword");
      setSelectedIds(messageSets[0] ? [messageSets[0].id] : []);
    }
  }, [open, messageSets]);

  const toggle = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

  const valid = name.trim() && selectedIds.length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>สร้างกฎบอทใหม่</DialogTitle></DialogHeader>
        <div className="space-y-4 py-2">
          <div>
            <label className="text-sm font-medium mb-1.5 block">ชื่อกฎบอท</label>
            <Input placeholder="เช่น คำถามที่พบบ่อย" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <label className="text-sm font-medium mb-1.5 block">เงื่อนไข</label>
            <Select value={triggerType} onValueChange={(v) => setTriggerType(v ?? "keyword")}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="keyword">คีย์เวิร์ด</SelectItem>
                <SelectItem value="first_message">ข้อความแรก</SelectItem>
                <SelectItem value="postback">Postback</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-sm font-medium mb-1.5 block">ชุดข้อความ (เลือกได้หลายชุด)</label>
            {messageSets.length === 0 ? (
              <p className="text-sm text-muted-foreground">ยังไม่มีชุดข้อความ กรุณาสร้างที่หน้า &ldquo;ชุดข้อความ&rdquo; ก่อน</p>
            ) : (
              <div className="space-y-1.5 max-h-48 overflow-y-auto rounded-xl border p-2">
                {messageSets.map((ms) => {
                  const checked = selectedIds.includes(ms.id);
                  return (
                    <button
                      key={ms.id}
                      onClick={() => toggle(ms.id)}
                      className={cn(
                        "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors",
                        checked ? "bg-primary/8" : "hover:bg-muted/50"
                      )}
                    >
                      <div className={cn(
                        "flex h-4 w-4 items-center justify-center rounded border transition-colors",
                        checked ? "border-primary bg-primary" : "border-muted-foreground/30"
                      )}>
                        {checked && <Check className="h-3 w-3 text-primary-foreground" />}
                      </div>
                      <span className="text-sm">{ms.name}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>ยกเลิก</Button>
          <Button onClick={() => valid && onCreate(name.trim(), triggerType, selectedIds)} disabled={!valid}>สร้าง</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
