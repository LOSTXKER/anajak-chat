"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Plus,
  Trash2,
  Loader2,
  Power,
  PowerOff,
  ChevronUp,
  ChevronDown,
  MessageSquare,
  Image,
  FileText,
  Video,
  Smile,
  CreditCard,
  Pencil,
  X,
  GripVertical,
  Search,
  Copy,
  ChevronRight,
  Send,
  Check,
  Facebook,
  Instagram,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

// ─── Types ───────────────────────────────────────────────────────────────────

interface RichButton {
  label: string;
  action: "postback" | "url" | "message";
  value: string;
}

interface AutoReplyMessage {
  type: "text" | "image" | "card" | "sticker" | "file" | "video";
  text?: string;
  buttons?: RichButton[];
  imageUrl?: string;
  cardTitle?: string;
  cardText?: string;
  cardImageUrl?: string;
  cardButtons?: RichButton[];
  stickerPackageId?: string;
  stickerId?: string;
  fileUrl?: string;
  fileName?: string;
  videoUrl?: string;
  thumbnailUrl?: string;
}

interface QuickReplyItem {
  label: string;
  action: "message" | "postback";
  value: string;
}

interface AutoReplyPattern {
  messages: AutoReplyMessage[];
  quickReplies?: QuickReplyItem[];
  assignToHuman?: boolean;
}

interface FlowTrigger {
  type: "first_message" | "keyword" | "postback";
  keywords?: string[];
  data?: string;
}

interface ChatFlow {
  id: string;
  name: string;
  description: string | null;
  isActive: boolean;
  trigger: FlowTrigger;
  steps: AutoReplyPattern;
  priority: number;
  createdAt: string;
}

type PlatformTab = "line" | "facebook" | "instagram";

const MSG_TYPES = [
  { value: "text", label: "ข้อความ", icon: MessageSquare },
  { value: "image", label: "รูปภาพ", icon: Image },
  { value: "card", label: "การ์ดเมสเสจ", icon: CreditCard },
  { value: "sticker", label: "สติ๊กเกอร์", icon: Smile },
  { value: "file", label: "แนบไฟล์", icon: FileText },
  { value: "video", label: "วิดีโอ", icon: Video },
] as const;

const TRIGGER_LABELS: Record<string, string> = {
  first_message: "ข้อความแรก",
  keyword: "คีย์เวิร์ด",
  postback: "กดปุ่ม",
};

// ─── Component ───────────────────────────────────────────────────────────────

export default function AutoReplyPage() {
  const { toast } = useToast();
  const [flows, setFlows] = useState<ChatFlow[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [platformTab, setPlatformTab] = useState<PlatformTab>("line");

  const [showTypeSelector, setShowTypeSelector] = useState(false);
  const [editingMsgIdx, setEditingMsgIdx] = useState<number | null>(null);
  const [editingMsg, setEditingMsg] = useState<AutoReplyMessage | null>(null);
  const [showNewDialog, setShowNewDialog] = useState(false);
  const [newName, setNewName] = useState("");

  const fetchFlows = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/chat-flows");
      if (res.ok) {
        const data = (await res.json()) as ChatFlow[];
        setFlows(data.map((f) => ({
          ...f,
          steps: (f.steps && typeof f.steps === "object" && "messages" in (f.steps as object))
            ? f.steps
            : { messages: [], quickReplies: [], assignToHuman: false },
        })));
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchFlows(); }, [fetchFlows]);

  const selected = flows.find((f) => f.id === selectedId) ?? null;
  const pattern: AutoReplyPattern = (selected?.steps as AutoReplyPattern) ?? { messages: [], quickReplies: [], assignToHuman: false };

  function updateSelected(patch: Partial<ChatFlow>) {
    if (!selectedId) return;
    setFlows((prev) => prev.map((f) => (f.id === selectedId ? { ...f, ...patch } : f)));
  }

  function updatePattern(patch: Partial<AutoReplyPattern>) {
    if (!selected) return;
    updateSelected({ steps: { ...pattern, ...patch } });
  }

  async function saveSelected() {
    if (!selected) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/chat-flows/${selected.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: selected.name,
          description: selected.description,
          trigger: selected.trigger,
          steps: selected.steps,
        }),
      });
      if (res.ok) toast({ title: "บันทึกแล้ว" });
      else toast({ title: "บันทึกไม่สำเร็จ", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  async function handleCreatePattern() {
    if (!newName.trim()) return;
    const res = await fetch("/api/chat-flows", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: newName,
        trigger: { type: "keyword", keywords: [newName] },
        steps: { messages: [], quickReplies: [], assignToHuman: false },
      }),
    });
    if (res.ok) {
      const flow = (await res.json()) as ChatFlow;
      setFlows((prev) => [{ ...flow, steps: { messages: [], quickReplies: [], assignToHuman: false } }, ...prev]);
      setSelectedId(flow.id);
      setShowNewDialog(false);
      setNewName("");
    }
  }

  async function handleDeletePattern(id: string) {
    if (!confirm("ลบรูปแบบนี้?")) return;
    const res = await fetch(`/api/chat-flows/${id}`, { method: "DELETE" });
    if (res.ok) {
      setFlows((prev) => prev.filter((f) => f.id !== id));
      if (selectedId === id) setSelectedId(null);
    }
  }

  async function handleToggle(id: string) {
    const res = await fetch(`/api/chat-flows/${id}/toggle`, { method: "POST" });
    if (res.ok) {
      const data = (await res.json()) as { isActive: boolean };
      setFlows((prev) => prev.map((f) => (f.id === id ? { ...f, isActive: data.isActive } : f)));
    }
  }

  function addMessage(type: AutoReplyMessage["type"]) {
    const msg: AutoReplyMessage = { type };
    if (type === "text") msg.text = "";
    if (type === "image") msg.imageUrl = "";
    if (type === "card") { msg.cardTitle = ""; msg.cardText = ""; }
    updatePattern({ messages: [...pattern.messages, msg] });
    setShowTypeSelector(false);
    setEditingMsgIdx(pattern.messages.length);
    setEditingMsg(msg);
  }

  function removeMessage(idx: number) {
    updatePattern({ messages: pattern.messages.filter((_, i) => i !== idx) });
  }

  function moveMessage(idx: number, dir: -1 | 1) {
    const msgs = [...pattern.messages];
    const target = idx + dir;
    if (target < 0 || target >= msgs.length) return;
    [msgs[idx], msgs[target]] = [msgs[target], msgs[idx]];
    updatePattern({ messages: msgs });
  }

  function openEditMsg(idx: number) {
    setEditingMsgIdx(idx);
    setEditingMsg({ ...pattern.messages[idx] });
  }

  function saveEditMsg() {
    if (editingMsgIdx === null || !editingMsg) return;
    const msgs = [...pattern.messages];
    msgs[editingMsgIdx] = editingMsg;
    updatePattern({ messages: msgs });
    setEditingMsgIdx(null);
    setEditingMsg(null);
  }

  function addQuickReply() {
    updatePattern({ quickReplies: [...(pattern.quickReplies ?? []), { label: "", action: "message", value: "" }] });
  }

  function removeQuickReply(idx: number) {
    updatePattern({ quickReplies: (pattern.quickReplies ?? []).filter((_, i) => i !== idx) });
  }

  function updateQuickReply(idx: number, patch: Partial<QuickReplyItem>) {
    const qrs = [...(pattern.quickReplies ?? [])];
    qrs[idx] = { ...qrs[idx], ...patch };
    updatePattern({ quickReplies: qrs });
  }

  function addMsgButton() {
    if (!editingMsg) return;
    const field = editingMsg.type === "card" ? "cardButtons" : "buttons";
    setEditingMsg({ ...editingMsg, [field]: [...((editingMsg[field] as RichButton[]) ?? []), { label: "", action: "message" as const, value: "" }] });
  }

  function removeMsgButton(idx: number) {
    if (!editingMsg) return;
    const field = editingMsg.type === "card" ? "cardButtons" : "buttons";
    setEditingMsg({ ...editingMsg, [field]: ((editingMsg[field] as RichButton[]) ?? []).filter((_: unknown, i: number) => i !== idx) });
  }

  function updateMsgButton(idx: number, patch: Partial<RichButton>) {
    if (!editingMsg) return;
    const field = editingMsg.type === "card" ? "cardButtons" : "buttons";
    const btns = [...((editingMsg[field] as RichButton[]) ?? [])];
    btns[idx] = { ...btns[idx], ...patch };
    setEditingMsg({ ...editingMsg, [field]: btns });
  }

  const msgTypeLabel = (type: string) => MSG_TYPES.find((t) => t.value === type)?.label ?? type;

  const filteredFlows = searchQuery
    ? flows.filter((f) => f.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : flows;

  return (
    <div className="flex h-full overflow-hidden">
      {/* ─── Left: Pattern List ─── */}
      <div className="w-72 shrink-0 border-r flex flex-col bg-card">
        <div className="p-3 border-b space-y-2">
          <div className="flex items-center justify-between">
            <h1 className="text-base font-bold">รูปแบบการตอบกลับอัตโนมัติ</h1>
          </div>
          <Button className="w-full" size="sm" onClick={() => { setNewName(""); setShowNewDialog(true); }}>
            <Plus className="h-4 w-4 mr-1.5" />
            สร้างรูปแบบตอบกลับ
          </Button>
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input className="h-8 pl-8 text-xs" placeholder="Search" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
          ) : filteredFlows.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-8">ยังไม่มีรูปแบบ</p>
          ) : (
            <div className="p-1.5 space-y-0.5">
              {filteredFlows.map((flow) => {
                const fp = (flow.steps as AutoReplyPattern);
                const msgCount = fp?.messages?.length ?? 0;
                return (
                  <div
                    key={flow.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => setSelectedId(flow.id)}
                    onKeyDown={(e) => { if (e.key === "Enter") setSelectedId(flow.id); }}
                    className={cn(
                      "w-full text-left rounded-lg px-3 py-2 text-sm transition-colors group cursor-pointer",
                      selectedId === flow.id ? "bg-accent/10 border-l-2 border-accent" : "hover:bg-muted/50 border-l-2 border-transparent"
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        {flow.isActive ? (
                          <span className="h-2 w-2 rounded-full bg-green-500 shrink-0" />
                        ) : (
                          <span className="h-2 w-2 rounded-full bg-zinc-300 dark:bg-zinc-600 shrink-0" />
                        )}
                        <span className={cn("truncate font-medium text-xs", !flow.isActive && "text-muted-foreground")}>{flow.name}</span>
                      </div>
                      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                        <Tooltip>
                          <TooltipTrigger render={<button onClick={(e) => { e.stopPropagation(); handleToggle(flow.id); }} className="p-0.5" />}>
                            {flow.isActive ? <Power className="h-3 w-3 text-green-600" /> : <PowerOff className="h-3 w-3 text-muted-foreground" />}
                          </TooltipTrigger>
                          <TooltipContent>{flow.isActive ? "ปิดใช้งาน" : "เปิดใช้งาน"}</TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger render={<button onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(flow.id); toast({ title: "คัดลอก ID แล้ว" }); }} className="p-0.5" />}>
                            <Copy className="h-3 w-3 text-muted-foreground" />
                          </TooltipTrigger>
                          <TooltipContent>คัดลอก ID</TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger render={<button onClick={(e) => { e.stopPropagation(); handleDeletePattern(flow.id); }} className="p-0.5" />}>
                            <Trash2 className="h-3 w-3 text-destructive" />
                          </TooltipTrigger>
                          <TooltipContent>ลบ</TooltipContent>
                        </Tooltip>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 mt-0.5 pl-4">
                      <span className="text-[10px] text-muted-foreground">{msgCount} ข้อความ</span>
                      <span className="text-[10px] text-muted-foreground/50">|</span>
                      <span className="text-[10px] text-muted-foreground">{TRIGGER_LABELS[flow.trigger.type]}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ─── Right: Message Editor ─── */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {!selected ? (
          <div className="flex flex-col items-center justify-center h-full gap-4">
            <MessageSquare className="h-12 w-12 text-muted-foreground/30" />
            <p className="text-muted-foreground text-sm">เลือกรูปแบบทางซ้ายเพื่อแก้ไข</p>
          </div>
        ) : (
          <>
            {/* ── Row 1: Title + Settings ── */}
            <div className="border-b px-6 py-4 shrink-0 space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-base font-semibold">แก้ไขข้อความตอบกลับ</h2>
                  <p className="text-[10px] text-muted-foreground font-mono mt-0.5">Message ID : {selected.id}</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5">
                    <Switch checked={selected.isActive} onCheckedChange={() => handleToggle(selected.id)} />
                    <span className="text-xs text-muted-foreground">{selected.isActive ? "เปิด" : "ปิด"}</span>
                  </div>
                  <Button size="sm" onClick={saveSelected} disabled={saving}>
                    {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> : <Check className="h-3.5 w-3.5 mr-1.5" />}
                    บันทึก
                  </Button>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 flex-1 max-w-md">
                  <Label className="text-xs text-muted-foreground shrink-0 w-20">ชื่อรูปแบบ *</Label>
                  <Input value={selected.name} onChange={(e) => updateSelected({ name: e.target.value })} className="h-9" />
                </div>
                <div className="flex items-center gap-2">
                  <Label className="text-xs text-muted-foreground shrink-0">Trigger</Label>
                  <Select value={selected.trigger.type} onValueChange={(v) => updateSelected({ trigger: { ...selected.trigger, type: (v ?? "keyword") as FlowTrigger["type"] } })}>
                    <SelectTrigger className="h-9 text-xs w-32"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="first_message">ข้อความแรก</SelectItem>
                      <SelectItem value="keyword">คีย์เวิร์ด</SelectItem>
                      <SelectItem value="postback">กดปุ่ม</SelectItem>
                    </SelectContent>
                  </Select>
                  {selected.trigger.type === "keyword" && (
                    <Input className="h-9 text-xs w-44" value={selected.trigger.keywords?.join(", ") ?? ""} onChange={(e) => updateSelected({ trigger: { ...selected.trigger, keywords: e.target.value.split(",").map((k) => k.trim()).filter(Boolean) } })} placeholder="คีย์เวิร์ดคั่นด้วย ," />
                  )}
                  {selected.trigger.type === "postback" && (
                    <Input className="h-9 text-xs w-44" value={selected.trigger.data ?? ""} onChange={(e) => updateSelected({ trigger: { ...selected.trigger, data: e.target.value } })} placeholder="Postback data" />
                  )}
                </div>
              </div>

              <div className="flex items-center gap-4">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input type="checkbox" checked={pattern.assignToHuman ?? false} onChange={(e) => updatePattern({ assignToHuman: e.target.checked })} className="h-3.5 w-3.5 rounded accent-accent" />
                  <span className="text-xs text-muted-foreground">ส่งต่อให้แอดมินดูแลต่อ</span>
                </label>
              </div>
            </div>

            {/* ── Row 2: Platform tabs ── */}
            <div className="flex items-center border-b shrink-0 px-6">
              {([
                { key: "line" as const, label: "Line", dotColor: "bg-green-500" },
                { key: "facebook" as const, label: "Facebook", icon: Facebook },
                { key: "instagram" as const, label: "Instagram", icon: Instagram },
              ]).map((tab) => (
                <button key={tab.key} onClick={() => setPlatformTab(tab.key)} className={cn("flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors", platformTab === tab.key ? "border-accent text-foreground" : "border-transparent text-muted-foreground hover:text-foreground")}>
                  {tab.dotColor ? <span className={cn("h-2.5 w-2.5 rounded-full", tab.dotColor, platformTab !== tab.key && "opacity-40")} /> : null}
                  {tab.icon ? <tab.icon className="h-4 w-4" /> : null}
                  {tab.label}
                </button>
              ))}
              <div className="ml-auto py-1.5">
                <Button variant="outline" size="sm" className="text-xs" onClick={() => setShowTypeSelector(true)}>
                  <Plus className="h-3.5 w-3.5 mr-1.5" />
                  เพิ่มประเภทข้อความ
                </Button>
              </div>
            </div>

            {/* Chat preview area */}
            <div className="flex-1 overflow-y-auto bg-[#f5f5f5] dark:bg-[#0c0c0f]">
              <div className="max-w-xl mx-auto py-5 px-6">
                <p className="text-xs text-muted-foreground mb-4">ข้อความ ({pattern.messages.length}/{pattern.messages.length} ข้อมูล)</p>

                {pattern.messages.length === 0 ? (
                  <div className="flex flex-col items-center py-16 text-center rounded-2xl bg-card border">
                    <MessageSquare className="h-10 w-10 text-muted-foreground/20 mb-3" />
                    <p className="text-sm text-muted-foreground mb-3">ยังไม่มีข้อความ</p>
                    <Button variant="outline" onClick={() => setShowTypeSelector(true)}>
                      <Plus className="h-4 w-4 mr-1.5" />
                      เพิ่มประเภทข้อความ
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {pattern.messages.map((msg, idx) => (
                      <div key={idx} className="group relative flex gap-2.5">
                        {/* Bot avatar */}
                        <div className="h-8 w-8 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center shrink-0 mt-0.5">
                          <MessageSquare className="h-4 w-4 text-green-600 dark:text-green-400" />
                        </div>

                        {/* Bubble */}
                        <div className="flex-1 min-w-0">
                          <div className="cursor-pointer transition-all hover:scale-[1.01]" onClick={() => openEditMsg(idx)}>
                            {msg.type === "text" && (
                              <div className="rounded-2xl rounded-tl-sm bg-white dark:bg-zinc-800 p-4 max-w-md shadow-sm border border-zinc-200 dark:border-zinc-700">
                                <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.text || <span className="text-muted-foreground italic">คลิกเพื่อเพิ่มข้อความ...</span>}</p>
                                {msg.buttons && msg.buttons.length > 0 && (
                                  <div className="mt-3 space-y-1.5 border-t border-zinc-100 dark:border-zinc-700 pt-3">
                                    {msg.buttons.map((btn, bi) => (
                                      <div key={bi} className="w-full rounded-xl bg-green-500 text-white text-center text-sm font-medium py-2.5 px-4 hover:bg-green-600 transition-colors">{btn.label || "ปุ่ม"}</div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            )}
                            {msg.type === "image" && (
                              msg.imageUrl ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={msg.imageUrl} alt="" className="max-w-sm rounded-2xl rounded-tl-sm shadow-sm object-cover border border-zinc-200 dark:border-zinc-700" />
                              ) : (
                                <div className="rounded-2xl rounded-tl-sm bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 p-10 flex flex-col items-center justify-center max-w-[240px] shadow-sm">
                                  <Image className="h-10 w-10 text-zinc-300 dark:text-zinc-600 mb-2" />
                                  <span className="text-xs text-muted-foreground">คลิกเพื่อเพิ่มรูปภาพ</span>
                                </div>
                              )
                            )}
                            {msg.type === "card" && (
                              <div className="rounded-2xl rounded-tl-sm border border-zinc-200 dark:border-zinc-700 max-w-sm overflow-hidden shadow-sm bg-white dark:bg-zinc-800">
                                {msg.cardImageUrl ? (
                                  // eslint-disable-next-line @next/next/no-img-element
                                  <img src={msg.cardImageUrl} alt="" className="w-full h-40 object-cover" />
                                ) : (
                                  <div className="w-full h-32 bg-zinc-100 dark:bg-zinc-700 flex items-center justify-center"><Image className="h-10 w-10 text-zinc-300 dark:text-zinc-600" /></div>
                                )}
                                <div className="p-4 space-y-1.5">
                                  <p className="font-semibold">{msg.cardTitle || "หัวข้อการ์ด"}</p>
                                  {msg.cardText && <p className="text-sm text-muted-foreground leading-relaxed">{msg.cardText}</p>}
                                  {msg.cardButtons && msg.cardButtons.length > 0 && (
                                    <div className="pt-2 space-y-1.5">
                                      {msg.cardButtons.map((btn, bi) => (
                                        <div key={bi} className="w-full rounded-xl bg-green-500 text-white text-center text-sm font-medium py-2.5">{btn.label || "ปุ่ม"}</div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                            {msg.type === "sticker" && (
                              <div className="max-w-[100px]">
                                <Smile className="h-16 w-16 text-yellow-400" />
                              </div>
                            )}
                            {msg.type === "file" && (
                              <div className="rounded-2xl rounded-tl-sm bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 p-4 max-w-xs shadow-sm flex items-center gap-3">
                                <div className="h-10 w-10 rounded-lg bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center shrink-0"><FileText className="h-5 w-5 text-blue-500" /></div>
                                <div>
                                  <p className="text-sm font-medium">{msg.fileName || "ไฟล์แนบ"}</p>
                                  <p className="text-xs text-muted-foreground truncate">{msg.fileUrl || "คลิกเพื่อตั้งค่า"}</p>
                                </div>
                              </div>
                            )}
                            {msg.type === "video" && (
                              <div className="rounded-2xl rounded-tl-sm bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 p-4 max-w-xs shadow-sm flex items-center gap-3">
                                <div className="h-10 w-10 rounded-lg bg-purple-50 dark:bg-purple-900/30 flex items-center justify-center shrink-0"><Video className="h-5 w-5 text-purple-500" /></div>
                                <div>
                                  <p className="text-sm font-medium">วิดีโอ</p>
                                  <p className="text-xs text-muted-foreground truncate">{msg.videoUrl || "คลิกเพื่อตั้งค่า"}</p>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Hover actions */}
                        <div className="flex flex-col gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 pt-1">
                          <button className="h-6 w-6 rounded-full bg-white dark:bg-zinc-800 border shadow-sm flex items-center justify-center hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-colors" onClick={() => openEditMsg(idx)}><Pencil className="h-3 w-3 text-muted-foreground" /></button>
                          <button className="h-6 w-6 rounded-full bg-white dark:bg-zinc-800 border shadow-sm flex items-center justify-center hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-colors" onClick={() => moveMessage(idx, -1)} disabled={idx === 0}><ChevronUp className="h-3 w-3 text-muted-foreground" /></button>
                          <button className="h-6 w-6 rounded-full bg-white dark:bg-zinc-800 border shadow-sm flex items-center justify-center hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-colors" onClick={() => moveMessage(idx, 1)} disabled={idx === pattern.messages.length - 1}><ChevronDown className="h-3 w-3 text-muted-foreground" /></button>
                          <button className="h-6 w-6 rounded-full bg-white dark:bg-zinc-800 border shadow-sm flex items-center justify-center hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors" onClick={() => removeMessage(idx)}><Trash2 className="h-3 w-3 text-red-500" /></button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Quick Reply */}
                <div className="mt-6 pt-4 border-t border-zinc-200 dark:border-zinc-700">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-medium text-muted-foreground">Quick Reply ({(pattern.quickReplies ?? []).length}/13 ข้อมูล)</span>
                    <Button variant="ghost" size="sm" className="text-xs text-green-600 dark:text-green-400 hover:text-green-700" onClick={addQuickReply}>
                      <Plus className="h-3 w-3 mr-1" />
                      เพิ่ม Quick reply
                    </Button>
                  </div>
                  {(pattern.quickReplies ?? []).length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {(pattern.quickReplies ?? []).map((qr, idx) => (
                        <div key={idx} className="flex items-center gap-1.5 rounded-full bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 px-4 py-2 shadow-sm group/qr hover:border-green-300 dark:hover:border-green-700 transition-colors">
                          <Input className="h-5 w-20 border-0 p-0 text-xs font-medium focus-visible:ring-0 bg-transparent" value={qr.label} onChange={(e) => updateQuickReply(idx, { label: e.target.value, value: e.target.value })} placeholder="ชื่อปุ่ม" />
                          <button onClick={() => removeQuickReply(idx)} className="opacity-0 group-hover/qr:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"><X className="h-3 w-3" /></button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* ─── Dialogs ─── */}

      {/* Type Selector */}
      <Dialog open={showTypeSelector} onOpenChange={setShowTypeSelector}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>เพิ่มประเภทข้อความ</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3 py-2">
            {MSG_TYPES.map((t) => {
              const Icon = t.icon;
              return (
                <button key={t.value} onClick={() => addMessage(t.value)} className="flex items-center gap-3 rounded-xl border p-3 hover:bg-muted/50 transition-colors text-left">
                  <Icon className="h-5 w-5 text-muted-foreground shrink-0" />
                  <span className="text-sm font-medium">{t.label}</span>
                </button>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>

      {/* Message Editor */}
      <Dialog open={editingMsgIdx !== null} onOpenChange={(open) => { if (!open) { setEditingMsgIdx(null); setEditingMsg(null); } }}>
        <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>แก้ไขข้อความตอบกลับ — {editingMsg ? msgTypeLabel(editingMsg.type) : ""}</DialogTitle>
          </DialogHeader>
          {editingMsg && (
            <div className="space-y-4 py-2">
              {editingMsg.type === "text" && (
                <>
                  <div className="space-y-1.5">
                    <Label>ข้อความ</Label>
                    <Textarea className="min-h-[100px]" value={editingMsg.text ?? ""} onChange={(e) => setEditingMsg({ ...editingMsg, text: e.target.value })} placeholder="พิมพ์ข้อความ..." />
                  </div>
                  <ButtonEditor buttons={editingMsg.buttons ?? []} onAdd={addMsgButton} onRemove={removeMsgButton} onUpdate={updateMsgButton} />
                </>
              )}
              {editingMsg.type === "image" && (
                <div className="space-y-1.5">
                  <Label>URL รูปภาพ</Label>
                  <Input value={editingMsg.imageUrl ?? ""} onChange={(e) => setEditingMsg({ ...editingMsg, imageUrl: e.target.value })} placeholder="https://..." />
                </div>
              )}
              {editingMsg.type === "card" && (
                <>
                  <div className="space-y-1.5"><Label>รูปภาพ (URL)</Label><Input value={editingMsg.cardImageUrl ?? ""} onChange={(e) => setEditingMsg({ ...editingMsg, cardImageUrl: e.target.value })} placeholder="https://..." /></div>
                  <div className="space-y-1.5"><Label>หัวข้อ</Label><Input value={editingMsg.cardTitle ?? ""} onChange={(e) => setEditingMsg({ ...editingMsg, cardTitle: e.target.value })} /></div>
                  <div className="space-y-1.5"><Label>รายละเอียด</Label><Textarea value={editingMsg.cardText ?? ""} onChange={(e) => setEditingMsg({ ...editingMsg, cardText: e.target.value })} /></div>
                  <ButtonEditor buttons={editingMsg.cardButtons ?? []} onAdd={addMsgButton} onRemove={removeMsgButton} onUpdate={updateMsgButton} />
                </>
              )}
              {editingMsg.type === "sticker" && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5"><Label>Package ID</Label><Input value={editingMsg.stickerPackageId ?? ""} onChange={(e) => setEditingMsg({ ...editingMsg, stickerPackageId: e.target.value })} /></div>
                  <div className="space-y-1.5"><Label>Sticker ID</Label><Input value={editingMsg.stickerId ?? ""} onChange={(e) => setEditingMsg({ ...editingMsg, stickerId: e.target.value })} /></div>
                </div>
              )}
              {editingMsg.type === "file" && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5"><Label>URL ไฟล์</Label><Input value={editingMsg.fileUrl ?? ""} onChange={(e) => setEditingMsg({ ...editingMsg, fileUrl: e.target.value })} placeholder="https://..." /></div>
                  <div className="space-y-1.5"><Label>ชื่อไฟล์</Label><Input value={editingMsg.fileName ?? ""} onChange={(e) => setEditingMsg({ ...editingMsg, fileName: e.target.value })} /></div>
                </div>
              )}
              {editingMsg.type === "video" && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5"><Label>URL วิดีโอ</Label><Input value={editingMsg.videoUrl ?? ""} onChange={(e) => setEditingMsg({ ...editingMsg, videoUrl: e.target.value })} placeholder="https://..." /></div>
                  <div className="space-y-1.5"><Label>Thumbnail URL</Label><Input value={editingMsg.thumbnailUrl ?? ""} onChange={(e) => setEditingMsg({ ...editingMsg, thumbnailUrl: e.target.value })} /></div>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => { setEditingMsgIdx(null); setEditingMsg(null); }}>ยกเลิก</Button>
            <Button onClick={saveEditMsg}>บันทึก</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* New Pattern */}
      <Dialog open={showNewDialog} onOpenChange={setShowNewDialog}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle>สร้างรูปแบบตอบกลับใหม่</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <Label>ชื่อรูปแบบ</Label>
            <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="เช่น ทักทายลูกค้า" autoFocus onKeyDown={(e) => { if (e.key === "Enter") handleCreatePattern(); }} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewDialog(false)}>ยกเลิก</Button>
            <Button onClick={handleCreatePattern} disabled={!newName.trim()}>สร้าง</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Button Editor ───────────────────────────────────────────────────────────

function ButtonEditor({ buttons, onAdd, onRemove, onUpdate }: {
  buttons: RichButton[];
  onAdd: () => void;
  onRemove: (idx: number) => void;
  onUpdate: (idx: number, patch: Partial<RichButton>) => void;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className="text-xs">ปุ่ม</Label>
        <Button variant="outline" size="sm" className="h-6 text-xs" onClick={onAdd} disabled={buttons.length >= 3}>
          <Plus className="h-3 w-3 mr-1" />เพิ่มปุ่ม
        </Button>
      </div>
      {buttons.map((btn, i) => (
        <div key={i} className="flex gap-1.5 items-center">
          <Input className="h-8 text-xs flex-1" placeholder="ชื่อปุ่ม" value={btn.label} onChange={(e) => onUpdate(i, { label: e.target.value })} />
          <Select value={btn.action} onValueChange={(v) => onUpdate(i, { action: (v ?? "message") as RichButton["action"] })}>
            <SelectTrigger className="h-8 text-xs w-24"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="message">ข้อความ</SelectItem>
              <SelectItem value="postback">Postback</SelectItem>
              <SelectItem value="url">URL</SelectItem>
            </SelectContent>
          </Select>
          <Input className="h-8 text-xs flex-1" placeholder="ค่า" value={btn.value} onChange={(e) => onUpdate(i, { value: e.target.value })} />
          <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={() => onRemove(i)}><Trash2 className="h-3 w-3" /></Button>
        </div>
      ))}
    </div>
  );
}
