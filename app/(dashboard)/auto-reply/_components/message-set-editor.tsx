"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2, ChevronDown, MessageSquare, Image, FileText, Sticker, Video, Info, Settings2, Zap, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { MessageCard } from "./message-card";
import { QuickReplySection } from "./quick-reply-section";
import { ChatPreview } from "@/components/chat-preview";
import type { MessageSetItem, PlatformMessages, PlatformKey, AutoReplyMessage } from "../_types";
import { PLATFORMS, emptyMessages, getPattern, setPattern } from "../_types";

const PLATFORM_ICONS: Record<string, typeof Globe> = {
  line: Globe,
  facebook: Globe,
  instagram: Globe,
};

const MSG_TYPES: { type: AutoReplyMessage["type"]; label: string; icon: typeof MessageSquare }[] = [
  { type: "text", label: "ข้อความ", icon: MessageSquare },
  { type: "image", label: "รูปภาพ", icon: Image },
  { type: "card", label: "การ์ด", icon: FileText },
  { type: "sticker", label: "สติกเกอร์", icon: Sticker },
  { type: "video", label: "วิดีโอ", icon: Video },
];

interface MessageSetEditorProps {
  set: MessageSetItem;
  onUpdate: (data: Partial<MessageSetItem>) => void;
  onDelete: () => void;
}

export function MessageSetEditor({ set, onUpdate, onDelete }: MessageSetEditorProps) {
  const [name, setName] = useState(set.name);
  const [messages, setMessages] = useState<PlatformMessages>(set.messages ?? emptyMessages());
  const [platform, setPlatform] = useState<PlatformKey>("_default");
  const [editingIdx, setEditingIdx] = useState<number | null>(null);
  const [addTypeOpen, setAddTypeOpen] = useState(false);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    setName(set.name);
    setMessages(set.messages ?? emptyMessages());
    setPlatform("_default");
    setEditingIdx(null);
    setDirty(false);
  }, [set.id, set.messages, set.name]);

  const pattern = getPattern(messages, platform);
  const msgList = pattern.messages ?? [];
  const bubbleCount = msgList.length;
  const maxBubbles = 5;

  const save = () => {
    onUpdate({ name, messages });
    setDirty(false);
    toast.success("บันทึกสำเร็จ");
  };

  const updateMessages = (newMsgs: AutoReplyMessage[]) => {
    setMessages(setPattern(messages, platform, { ...pattern, messages: newMsgs }));
    setDirty(true);
  };

  const addMessage = (type: AutoReplyMessage["type"]) => {
    const msg: AutoReplyMessage = { type };
    if (type === "text") msg.text = "";
    if (type === "card") { msg.cardTitle = ""; msg.cardText = ""; }
    updateMessages([...msgList, msg]);
    setEditingIdx(msgList.length);
    setAddTypeOpen(false);
  };

  return (
    <div className="flex h-full">
      {/* Editor Column */}
      <div className="min-w-0 flex-1 overflow-y-auto p-6 space-y-6">
        {/* Header Card */}
        <div className="rounded-2xl border bg-card p-5">
          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
              <Settings2 className="h-5 w-5 text-primary" />
            </div>
            <div className="min-w-0 flex-1 space-y-3">
              <div>
                <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">ชื่อชุดข้อความ</label>
                <Input
                  className="mt-1 text-lg font-semibold"
                  value={name}
                  onChange={(e) => { setName(e.target.value); setDirty(true); }}
                  placeholder="ชื่อชุดข้อความ"
                />
              </div>
              {set._count?.intentLinks ? (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="rounded-md bg-primary/10 px-2 py-0.5 text-primary">{set._count.intentLinks} บอทที่ใช้</span>
                </div>
              ) : null}
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <Button onClick={save} disabled={!dirty}>บันทึก</Button>
              <Button variant="outline" size="icon" onClick={onDelete} className="text-destructive hover:text-destructive">
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Platform Tabs Card */}
        <div className="rounded-2xl border bg-card">
          <div className="flex items-center gap-1 overflow-x-auto border-b px-4">
            <button
              onClick={() => setPlatform("_default")}
              className={cn(
                "flex shrink-0 items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-colors",
                platform === "_default"
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              <Globe className="h-4 w-4" />
              ค่าเริ่มต้น
            </button>
            {PLATFORMS.map((p) => {
              const PIcon = PLATFORM_ICONS[p.key] ?? Globe;
              const hasOverride = !!messages[p.key]?.messages?.length;
              return (
                <button
                  key={p.key}
                  onClick={() => setPlatform(p.key)}
                  className={cn(
                    "flex shrink-0 items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-colors",
                    platform === p.key
                      ? "border-primary text-primary"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  )}
                >
                  <PIcon className="h-4 w-4" />
                  {p.label}
                  {hasOverride && (
                    <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                  )}
                </button>
              );
            })}
          </div>

          {platform !== "_default" && !messages[platform]?.messages?.length && (
            <div className="mx-4 mt-4 flex items-start gap-2.5 rounded-xl bg-muted/50 px-4 py-3 text-sm text-muted-foreground">
              <Info className="mt-0.5 h-4 w-4 shrink-0" />
              <span>ยังไม่ได้ตั้งค่าข้อความสำหรับ {PLATFORMS.find(p => p.key === platform)?.label} — ระบบจะใช้ &ldquo;ค่าเริ่มต้น&rdquo; แทน</span>
            </div>
          )}

          {/* Messages Section */}
          <div className="space-y-3 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h3 className="heading-section">ข้อความ</h3>
                <span className={cn(
                  "rounded-full px-2.5 py-0.5 text-xs font-medium",
                  bubbleCount >= maxBubbles
                    ? "bg-amber-500/10 text-amber-600"
                    : "bg-muted text-muted-foreground"
                )}>
                  {bubbleCount}/{maxBubbles}
                </span>
              </div>
              <div className="relative">
                <Button size="sm" variant="ghost" onClick={() => setAddTypeOpen(!addTypeOpen)} disabled={bubbleCount >= maxBubbles} className="text-primary">
                  <Plus className="mr-1 h-4 w-4" />เพิ่มข้อความ
                  <ChevronDown className="ml-1 h-3 w-3" />
                </Button>
                {addTypeOpen && (
                  <div className="absolute right-0 top-full z-50 mt-1 min-w-[180px] rounded-xl border bg-popover p-1.5 shadow-lg">
                    {MSG_TYPES.map((t) => (
                      <button
                        key={t.type}
                        onClick={() => addMessage(t.type)}
                        className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-sm transition-colors hover:bg-muted"
                      >
                        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-muted">
                          <t.icon className="h-3.5 w-3.5" />
                        </div>
                        {t.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {bubbleCount >= maxBubbles && (
              <div className="flex items-center gap-2 rounded-xl bg-amber-500/10 px-4 py-2.5 text-sm text-amber-700 dark:text-amber-400">
                <Info className="h-4 w-4 shrink-0" />
                ถึงจำนวนบับเบิ้ลสูงสุดแล้ว (5 บับเบิ้ล) — ลบข้อความเดิมก่อนเพิ่มใหม่
              </div>
            )}

            {msgList.length === 0 ? (
              <div className="flex flex-col items-center gap-3 rounded-2xl border-2 border-dashed py-10 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-muted/60">
                  <Zap className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="font-medium">ยังไม่มีข้อความ</p>
                  <p className="mt-1 text-sm text-muted-foreground">กด &ldquo;+ เพิ่มข้อความ&rdquo; เพื่อเริ่มสร้างบับเบิ้ล</p>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                {msgList.map((msg, idx) => (
                  <MessageCard
                    key={idx}
                    msg={msg}
                    num={idx + 1}
                    isEditing={editingIdx === idx}
                    onEdit={() => setEditingIdx(editingIdx === idx ? null : idx)}
                    onChange={(m) => { const n = [...msgList]; n[idx] = m; updateMessages(n); }}
                    onDelete={() => { updateMessages(msgList.filter((_, i) => i !== idx)); if (editingIdx === idx) setEditingIdx(null); }}
                    onDuplicate={() => { const n = [...msgList]; n.splice(idx + 1, 0, JSON.parse(JSON.stringify(msgList[idx]))); updateMessages(n); }}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Quick Reply Card */}
        <div className="rounded-2xl border bg-card p-4">
          <QuickReplySection
            items={pattern.quickReplies ?? []}
            onChange={(qr) => {
              setMessages(setPattern(messages, platform, { ...pattern, quickReplies: qr }));
              setDirty(true);
            }}
          />
        </div>
      </div>

      {/* Preview Panel — 40% */}
      <div className="hidden w-[40%] shrink-0 border-l lg:flex lg:flex-col">
        <ChatPreview
          messages={msgList}
          quickReplies={pattern.quickReplies}
          platform={platform}
          botName={name || "Bot"}
        />
      </div>
    </div>
  );
}
