"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Plus, Trash2, Loader2, Clock, Bot,
  AlertTriangle, ChevronRight, Settings2,
  Zap, Hash, MessageSquare, Info, Activity,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { SearchInput } from "@/components/ui/search-input";
import { EmptyState } from "@/components/empty-state";
import { ChatPreview } from "@/components/chat-preview";
import type { PreviewMessage, PreviewQuickReply } from "@/components/chat-preview";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

// ─── Types ───────────────────────────────────────────────────────────────────

interface MessageSetRef { id: string; name: string }
interface ChannelRef { id: string; name: string; platform: string }

interface IntentItem {
  id: string; name: string; isActive: boolean;
  triggerType: string; keywords: string[]; postbackData: string | null;
  messageSetId: string; channelId: string | null; priority: number;
  assignToHuman: boolean; createdAt: string;
  messageSet: MessageSetRef;
  channel: ChannelRef | null;
  _count?: { sessions: number };
}

interface ActivityEntry {
  id: string; status: string; sentCount: number; totalMessages: number;
  errors: string[]; startedAt: string; completedAt: string | null;
  conversation: {
    id: string;
    contact: { displayName: string | null; platform: string };
    channel: { name: string };
  };
}

const TRIGGER_LABELS: Record<string, string> = {
  keyword: "คีย์เวิร์ด",
  first_message: "ข้อความแรก",
  postback: "Postback",
};

const TRIGGER_ICONS: Record<string, typeof Hash> = {
  keyword: Hash,
  first_message: MessageSquare,
  postback: Zap,
};

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function IntentsPage() {
  const [intents, setIntents] = useState<IntentItem[]>([]);
  const [messageSets, setMessageSets] = useState<MessageSetRef[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);

  const selected = intents.find((i) => i.id === selectedId) ?? null;

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

  const handleCreate = async (name: string, triggerType: string, messageSetId: string) => {
    const res = await fetch("/api/bot-intents", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, triggerType, messageSetId }),
    });
    if (res.ok) {
      const created = await res.json();
      setIntents((prev) => [created, ...prev]);
      setSelectedId(created.id);
      setCreateOpen(false);
      toast.success("สร้างอินเทนต์สำเร็จ");
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
    if (!confirm("ลบอินเทนต์นี้?")) return;
    const res = await fetch(`/api/bot-intents/${id}`, { method: "DELETE" });
    if (res.ok) {
      setIntents((prev) => prev.filter((i) => i.id !== id));
      if (selectedId === id) setSelectedId(intents.find((i) => i.id !== id)?.id ?? null);
      toast.success("ลบสำเร็จ");
    }
  };

  const filtered = intents.filter((i) => i.name.toLowerCase().includes(search.toLowerCase()));
  const activeCount = intents.filter((i) => i.isActive).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex h-full">
      {/* Left Panel */}
      <div className="flex w-[320px] shrink-0 flex-col border-r">
        <div className="space-y-3 border-b p-4">
          <div>
            <h1 className="heading-page">อินเทนต์</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {intents.length} อินเทนต์ · {activeCount} เปิดใช้งาน
            </p>
          </div>
          <Button className="w-full" onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />สร้างอินเทนต์
          </Button>
          <SearchInput value={search} onChange={setSearch} />
        </div>
        <div className="flex-1 overflow-y-auto p-2">
          {filtered.length === 0 ? (
            <EmptyState
              icon={Bot}
              message="ยังไม่มีอินเทนต์"
              description="สร้างอินเทนต์แรกเพื่อให้บอทตอบกลับอัตโนมัติ"
              action={
                <Button size="sm" onClick={() => setCreateOpen(true)}>
                  <Plus className="mr-1.5 h-3.5 w-3.5" />สร้างอินเทนต์
                </Button>
              }
              className="py-12 border-0"
            />
          ) : (
            <div className="space-y-1">
              {filtered.map((intent) => {
                const isSelected = selectedId === intent.id;
                const TriggerIcon = TRIGGER_ICONS[intent.triggerType] ?? Zap;
                const sessions = intent._count?.sessions ?? 0;

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
                        {intent.keywords.length > 0 && (
                          <span className="rounded-md bg-muted px-1.5 py-0.5 text-[11px] font-medium text-muted-foreground">
                            {intent.keywords.length} คีย์เวิร์ด
                          </span>
                        )}
                        {sessions > 0 && (
                          <span className="rounded-md bg-primary/10 px-1.5 py-0.5 text-[11px] font-medium text-primary">
                            {sessions} ครั้ง
                          </span>
                        )}
                      </div>
                      {!intent.isActive && (
                        <div className="mt-1 flex items-center gap-1 text-[11px] text-amber-500">
                          <AlertTriangle className="h-3 w-3" /> ปิดใช้งาน
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Right Panel */}
      <div className="flex-1 overflow-y-auto">
        {selected ? (
          <IntentEditor
            intent={selected}
            messageSets={messageSets}
            onUpdate={(data) => handleUpdate(selected.id, data)}
            onToggle={() => handleToggle(selected.id)}
            onDelete={() => handleDelete(selected.id)}
          />
        ) : (
          <EmptyState
            icon={Bot}
            message="เลือกอินเทนต์"
            description="เลือกอินเทนต์จากรายการด้านซ้ายเพื่อแก้ไข หรือสร้างอินเทนต์ใหม่"
            className="h-full border-0"
          />
        )}
      </div>

      {/* Create Dialog */}
      <CreateIntentDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        messageSets={messageSets}
        onCreate={handleCreate}
      />
    </div>
  );
}

// ─── Intent Editor ──────────────────────────────────────────────────────────

function IntentEditor({ intent, messageSets, onUpdate, onToggle, onDelete }: {
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
  const [messageSetId, setMessageSetId] = useState(intent.messageSetId);
  const [kwInput, setKwInput] = useState("");
  const [activity, setActivity] = useState<ActivityEntry[]>([]);
  const [dirty, setDirty] = useState(false);
  const [previewMessages, setPreviewMessages] = useState<PreviewMessage[]>([]);
  const [previewQuickReplies, setPreviewQuickReplies] = useState<PreviewQuickReply[]>([]);

  useEffect(() => {
    setName(intent.name);
    setTriggerType(intent.triggerType);
    setKeywords(intent.keywords);
    setPostbackData(intent.postbackData ?? "");
    setMessageSetId(intent.messageSetId);
    setDirty(false);
    fetch(`/api/bot-intents/${intent.id}/activity`).then((r) => r.ok ? r.json() : []).then(setActivity);
  }, [intent.id, intent.name, intent.triggerType, intent.keywords, intent.postbackData, intent.messageSetId]);

  useEffect(() => {
    if (!messageSetId) {
      setPreviewMessages([]);
      setPreviewQuickReplies([]);
      return;
    }
    fetch(`/api/message-sets/${messageSetId}`)
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (!data?.messages?._default) {
          setPreviewMessages([]);
          setPreviewQuickReplies([]);
          return;
        }
        const pattern = data.messages._default;
        setPreviewMessages(pattern.messages ?? []);
        setPreviewQuickReplies(pattern.quickReplies ?? []);
      });
  }, [messageSetId]);

  const save = () => {
    onUpdate({ name, triggerType, keywords, postbackData: postbackData || null, messageSetId });
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

  const userBubbleText = triggerType === "keyword" && keywords.length > 0
    ? keywords[0]
    : triggerType === "first_message"
    ? "สวัสดีครับ"
    : triggerType === "postback" && postbackData
    ? `[postback: ${postbackData}]`
    : undefined;

  return (
    <div className="flex gap-6 p-6">
      <div className="min-w-0 flex-1 space-y-6">
      {/* Header Card */}
      <div className="rounded-2xl border bg-card p-5">
        <div className="flex items-start gap-4">
          <div className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
            intent.isActive ? "bg-primary/10" : "bg-muted"
          )}>
            <Settings2 className={cn("h-5 w-5", intent.isActive ? "text-primary" : "text-muted-foreground")} />
          </div>
          <div className="min-w-0 flex-1 space-y-3">
            <div>
              <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">ชื่ออินเทนต์</label>
              <Input
                className="mt-1 text-lg font-semibold h-11"
                value={name}
                onChange={(e) => { setName(e.target.value); setDirty(true); }}
              />
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-3">
            <div className="flex items-center gap-2 cursor-pointer" onClick={onToggle}>
              <Switch checked={intent.isActive} />
              <span className={cn(
                "text-sm font-medium",
                intent.isActive ? "text-primary" : "text-muted-foreground"
              )}>
                {intent.isActive ? "เปิด" : "ปิด"}
              </span>
            </div>
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
            <h3 className="heading-section">เทรนบอท</h3>
            <p className="text-xs text-muted-foreground">เมื่อผู้ใช้ส่งข้อความที่ตรงกับเงื่อนไข บอทจะตอบกลับอัตโนมัติ</p>
          </div>
        </div>

        <div>
          <label className="text-sm font-medium text-muted-foreground mb-1.5 block">ประเภท Trigger</label>
          <Select value={triggerType} onValueChange={(v) => { setTriggerType(v ?? "keyword"); setDirty(true); }}>
            <SelectTrigger className="w-full max-w-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="keyword">คีย์เวิร์ด</SelectItem>
              <SelectItem value="first_message">ข้อความแรก</SelectItem>
              <SelectItem value="postback">Postback</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {triggerType === "keyword" && (
          <div className="space-y-3">
            <div className="flex gap-2">
              <Input
                className="flex-1"
                placeholder="พิมพ์คีย์เวิร์ดแล้ว Enter"
                value={kwInput}
                onChange={(e) => setKwInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addKeyword()}
              />
              <Button onClick={addKeyword} disabled={!kwInput.trim()}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            {keywords.length > 0 ? (
              <div className="overflow-hidden rounded-xl ring-1 ring-border/30">
                <div className="flex justify-between bg-muted/40 px-4 py-2 text-xs text-muted-foreground">
                  <span>{keywords.length} คีย์เวิร์ด</span>
                </div>
                <div className="divide-y divide-border/30">
                  {keywords.map((kw) => (
                    <div key={kw} className="flex items-center justify-between px-4 py-2.5">
                      <div className="flex items-center gap-2">
                        <Hash className="h-3.5 w-3.5 text-muted-foreground/50" />
                        <span className="text-sm font-medium">{kw}</span>
                      </div>
                      <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive hover:bg-muted/50" onClick={() => removeKeyword(kw)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 rounded-xl bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
                <Info className="h-4 w-4 shrink-0" />
                ยังไม่ได้เพิ่มคีย์เวิร์ด — พิมพ์คำแล้วกด Enter
              </div>
            )}
          </div>
        )}

        {triggerType === "postback" && (
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-1.5 block">Postback Data</label>
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

      {/* Message Set Card */}
      <div className="rounded-2xl border bg-card p-5 space-y-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted">
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </div>
          <div>
            <h3 className="heading-section">ข้อความตอบกลับ</h3>
            <p className="text-xs text-muted-foreground">เลือกชุดข้อความที่บอทจะส่งไปยังผู้ใช้</p>
          </div>
        </div>

        <Select value={messageSetId} onValueChange={(v) => { setMessageSetId(v ?? ""); setDirty(true); }}>
          <SelectTrigger className="w-full"><SelectValue placeholder="เลือกชุดข้อความ" /></SelectTrigger>
          <SelectContent>
            {messageSets.map((ms) => (
              <SelectItem key={ms.id} value={ms.id}>{ms.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {messageSetId && (
          <div className="flex items-center justify-between rounded-xl bg-muted/30 px-4 py-3">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                <MessageSquare className="h-3.5 w-3.5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium">
                  {messageSets.find((ms) => ms.id === messageSetId)?.name ?? "—"}
                </p>
                <p className="text-xs text-muted-foreground">ชุดข้อความตอบกลับ</p>
              </div>
            </div>
            <a href="/auto-reply" className="text-primary text-sm hover:underline inline-flex items-center gap-1">
              แก้ไข <ChevronRight className="h-3 w-3" />
            </a>
          </div>
        )}
      </div>

      {/* Save / Delete */}
      <div className="flex items-center gap-3">
        <Button onClick={save} disabled={!dirty}>บันทึก</Button>
        <Button variant="outline" className="text-destructive" onClick={onDelete}>
          <Trash2 className="h-4 w-4 mr-2" />ลบอินเทนต์
        </Button>
      </div>

      {/* Activity Log */}
      {activity.length > 0 && (
        <div className="rounded-2xl border bg-card p-5 space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted">
              <Activity className="h-4 w-4 text-muted-foreground" />
            </div>
            <div>
              <h3 className="heading-section">กิจกรรมล่าสุด</h3>
              <p className="text-xs text-muted-foreground">{activity.length} รายการ</p>
            </div>
          </div>

          <div className="relative space-y-0">
            {activity.map((entry, idx) => (
              <div key={entry.id} className="relative flex gap-3 pb-4 last:pb-0">
                {idx < activity.length - 1 && (
                  <div className="absolute left-[11px] top-6 h-[calc(100%-12px)] w-px bg-border/50" />
                )}
                <div className={cn(
                  "mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full",
                  entry.status === "completed" ? "bg-primary/10" : entry.status === "failed" ? "bg-destructive/10" : "bg-muted"
                )}>
                  <Clock className={cn(
                    "h-3 w-3",
                    entry.status === "completed" ? "text-primary" : entry.status === "failed" ? "text-destructive" : "text-muted-foreground"
                  )} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium truncate">
                      {entry.conversation.contact.displayName || "ลูกค้า"}
                    </span>
                    <span className={cn(
                      "shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium",
                      entry.status === "completed" ? "bg-primary/10 text-primary"
                      : entry.status === "failed" ? "bg-destructive/10 text-destructive"
                      : "bg-muted text-muted-foreground"
                    )}>
                      {entry.status === "completed" ? "สำเร็จ" : entry.status === "failed" ? "ล้มเหลว" : entry.status}
                    </span>
                  </div>
                  <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{entry.conversation.channel.name}</span>
                    <span>·</span>
                    <span>{entry.sentCount}/{entry.totalMessages} ข้อความ</span>
                    <span>·</span>
                    <span>{formatRelativeTime(entry.startedAt)}</span>
                  </div>
                  {entry.errors.length > 0 && (
                    <div className="mt-1 text-xs text-destructive">{entry.errors.join(", ")}</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      </div>

      {/* Flow Preview Column */}
      <div className="hidden w-[340px] shrink-0 xl:block">
        <div className="sticky top-6">
          <p className="mb-3 text-center text-xs font-medium uppercase tracking-wider text-muted-foreground">จำลองการสนทนา</p>
          <ChatPreview
            messages={previewMessages}
            quickReplies={previewQuickReplies}
            userMessage={userBubbleText}
            botName={intent.name || "Bot"}
          />
        </div>
      </div>
    </div>
  );
}

// ─── Create Intent Dialog ────────────────────────────────────────────────────

function CreateIntentDialog({ open, onOpenChange, messageSets, onCreate }: {
  open: boolean; onOpenChange: (open: boolean) => void;
  messageSets: MessageSetRef[];
  onCreate: (name: string, triggerType: string, messageSetId: string) => void;
}) {
  const [name, setName] = useState("");
  const [triggerType, setTriggerType] = useState("keyword");
  const [messageSetId, setMessageSetId] = useState("");

  useEffect(() => {
    if (open) { setName(""); setTriggerType("keyword"); setMessageSetId(messageSets[0]?.id ?? ""); }
  }, [open, messageSets]);

  const valid = name.trim() && messageSetId;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>สร้างอินเทนต์ใหม่</DialogTitle></DialogHeader>
        <div className="space-y-4 py-2">
          <div>
            <label className="text-sm font-medium mb-1.5 block">ชื่ออินเทนต์</label>
            <Input placeholder="เช่น คำถามที่พบบ่อย" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <label className="text-sm font-medium mb-1.5 block">ประเภท Trigger</label>
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
            <label className="text-sm font-medium mb-1.5 block">ชุดข้อความตอบกลับ</label>
            {messageSets.length === 0 ? (
              <p className="text-sm text-muted-foreground">ยังไม่มีชุดข้อความ กรุณาสร้างที่หน้า &ldquo;ชุดข้อความตอบกลับ&rdquo; ก่อน</p>
            ) : (
              <Select value={messageSetId} onValueChange={(v) => setMessageSetId(v ?? "")}>
                <SelectTrigger><SelectValue placeholder="เลือกชุดข้อความ" /></SelectTrigger>
                <SelectContent>
                  {messageSets.map((ms) => (
                    <SelectItem key={ms.id} value={ms.id}>{ms.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>ยกเลิก</Button>
          <Button onClick={() => valid && onCreate(name.trim(), triggerType, messageSetId)} disabled={!valid}>สร้าง</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatRelativeTime(dateStr: string): string {
  const now = Date.now();
  const diff = now - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "เมื่อสักครู่";
  if (mins < 60) return `${mins} นาทีที่แล้ว`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} ชม.ที่แล้ว`;
  const days = Math.floor(hrs / 24);
  return `${days} วันที่แล้ว`;
}
