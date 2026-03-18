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
  _count?: { sessions: number };
}

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

export default function ChatFlowsPage() {
  const { toast } = useToast();
  const [flows, setFlows] = useState<ChatFlow[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Type selector dialog
  const [showTypeSelector, setShowTypeSelector] = useState(false);

  // Message editor dialog
  const [editingMsgIdx, setEditingMsgIdx] = useState<number | null>(null);
  const [editingMsg, setEditingMsg] = useState<AutoReplyMessage | null>(null);

  // New pattern dialog
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
  const pattern = selected?.steps ?? { messages: [], quickReplies: [], assignToHuman: false };

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

  // Button helpers for editingMsg
  function addMsgButton() {
    if (!editingMsg) return;
    const field = editingMsg.type === "card" ? "cardButtons" : "buttons";
    setEditingMsg({ ...editingMsg, [field]: [...(editingMsg[field] ?? []), { label: "", action: "message" as const, value: "" }] });
  }

  function removeMsgButton(idx: number) {
    if (!editingMsg) return;
    const field = editingMsg.type === "card" ? "cardButtons" : "buttons";
    setEditingMsg({ ...editingMsg, [field]: (editingMsg[field] ?? []).filter((_: unknown, i: number) => i !== idx) });
  }

  function updateMsgButton(idx: number, patch: Partial<RichButton>) {
    if (!editingMsg) return;
    const field = editingMsg.type === "card" ? "cardButtons" : "buttons";
    const btns = [...(editingMsg[field] ?? [])];
    btns[idx] = { ...btns[idx], ...patch };
    setEditingMsg({ ...editingMsg, [field]: btns });
  }

  const msgTypeIcon = (type: string) => {
    const found = MSG_TYPES.find((t) => t.value === type);
    return found ? found.icon : MessageSquare;
  };

  const msgTypeLabel = (type: string) => MSG_TYPES.find((t) => t.value === type)?.label ?? type;

  return (
    <div className="flex h-[calc(100vh-8rem)] -m-4 md:-m-6">
      {/* Left: Pattern List */}
      <div className="w-64 shrink-0 border-r flex flex-col bg-card">
        <div className="p-3 border-b">
          <Button className="w-full" size="sm" onClick={() => { setNewName(""); setShowNewDialog(true); }}>
            <Plus className="h-4 w-4 mr-1.5" />
            สร้างรูปแบบตอบกลับ
          </Button>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
          {loading ? (
            <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
          ) : flows.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-8">ยังไม่มีรูปแบบ</p>
          ) : (
            flows.map((flow) => (
              <button
                key={flow.id}
                onClick={() => setSelectedId(flow.id)}
                className={cn(
                  "w-full text-left rounded-lg px-3 py-2 text-sm transition-colors group",
                  selectedId === flow.id ? "bg-accent/10 border-l-2 border-accent" : "hover:bg-muted/50 border-l-2 border-transparent"
                )}
              >
                <div className="flex items-center justify-between">
                  <span className={cn("truncate font-medium", !flow.isActive && "text-muted-foreground")}>{flow.name}</span>
                  <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={(e) => { e.stopPropagation(); handleToggle(flow.id); }} className="p-0.5">
                      {flow.isActive ? <Power className="h-3 w-3 text-green-600" /> : <PowerOff className="h-3 w-3 text-muted-foreground" />}
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); handleDeletePattern(flow.id); }} className="p-0.5">
                      <Trash2 className="h-3 w-3 text-destructive" />
                    </button>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <Badge variant="outline" className="text-[10px] px-1 py-0">{TRIGGER_LABELS[flow.trigger.type] ?? flow.trigger.type}</Badge>
                  <span className="text-[10px] text-muted-foreground">{pattern.messages?.length ?? 0} ข้อความ</span>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Center: Message Editor */}
      <div className="flex-1 overflow-y-auto">
        {!selected ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-muted-foreground text-sm">เลือกรูปแบบทางซ้ายเพื่อแก้ไข</p>
          </div>
        ) : (
          <div className="p-4 md:p-6 space-y-4 max-w-3xl">
            {/* Header: Name + Trigger + Active */}
            <div className="flex items-start gap-4">
              <div className="flex-1 space-y-3">
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">ชื่อรูปแบบ</Label>
                  <Input
                    value={selected.name}
                    onChange={(e) => updateSelected({ name: e.target.value })}
                    className="text-base font-semibold h-10"
                  />
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex-1 space-y-1">
                    <Label className="text-xs text-muted-foreground">Trigger</Label>
                    <Select
                      value={selected.trigger.type}
                      onValueChange={(v) => updateSelected({ trigger: { ...selected.trigger, type: (v ?? "keyword") as FlowTrigger["type"] } })}
                    >
                      <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="first_message">ข้อความแรก</SelectItem>
                        <SelectItem value="keyword">คีย์เวิร์ด</SelectItem>
                        <SelectItem value="postback">กดปุ่ม (Postback)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {selected.trigger.type === "keyword" && (
                    <div className="flex-1 space-y-1">
                      <Label className="text-xs text-muted-foreground">คีย์เวิร์ด (คั่นด้วย ,)</Label>
                      <Input
                        className="h-8 text-xs"
                        value={selected.trigger.keywords?.join(", ") ?? ""}
                        onChange={(e) => updateSelected({ trigger: { ...selected.trigger, keywords: e.target.value.split(",").map((k) => k.trim()).filter(Boolean) } })}
                      />
                    </div>
                  )}
                  {selected.trigger.type === "postback" && (
                    <div className="flex-1 space-y-1">
                      <Label className="text-xs text-muted-foreground">Postback data</Label>
                      <Input
                        className="h-8 text-xs"
                        value={selected.trigger.data ?? ""}
                        onChange={(e) => updateSelected({ trigger: { ...selected.trigger, data: e.target.value } })}
                      />
                    </div>
                  )}
                </div>
              </div>
              <div className="flex flex-col items-center gap-1 pt-4">
                <Switch
                  checked={selected.isActive}
                  onCheckedChange={() => handleToggle(selected.id)}
                />
                <span className="text-[10px] text-muted-foreground">{selected.isActive ? "เปิด" : "ปิด"}</span>
              </div>
            </div>

            {/* Messages */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold">ข้อความตอบกลับ ({pattern.messages.length})</h3>
              </div>

              {pattern.messages.map((msg, idx) => {
                const Icon = msgTypeIcon(msg.type);
                return (
                  <div key={idx} className="rounded-xl border bg-card p-3 space-y-2 group hover:border-accent/30 transition-colors">
                    <div className="flex items-center gap-2">
                      <GripVertical className="h-4 w-4 text-muted-foreground/40 shrink-0" />
                      <div className="flex items-center gap-1.5 flex-1">
                        <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
                        <span className="text-xs font-medium text-muted-foreground">{msgTypeLabel(msg.type)}</span>
                        <span className="text-xs text-muted-foreground/50">({idx + 1}/{pattern.messages.length})</span>
                      </div>
                      <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => moveMessage(idx, -1)} disabled={idx === 0}><ChevronUp className="h-3 w-3" /></Button>
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => moveMessage(idx, 1)} disabled={idx === pattern.messages.length - 1}><ChevronDown className="h-3 w-3" /></Button>
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => openEditMsg(idx)}><Pencil className="h-3 w-3" /></Button>
                        <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => removeMessage(idx)}><Trash2 className="h-3 w-3" /></Button>
                      </div>
                    </div>

                    {/* Preview */}
                    <div className="pl-6">
                      {msg.type === "text" && (
                        <div className="rounded-lg bg-muted p-2.5 text-sm max-w-md">
                          <p className="whitespace-pre-wrap">{msg.text || <span className="text-muted-foreground italic">ยังไม่มีข้อความ</span>}</p>
                          {msg.buttons?.map((btn, bi) => (
                            <div key={bi} className="mt-1.5">
                              <span className="inline-block rounded-full bg-accent text-accent-foreground text-xs px-3 py-1">{btn.label || "ปุ่ม"}</span>
                            </div>
                          ))}
                        </div>
                      )}
                      {msg.type === "image" && (
                        msg.imageUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={msg.imageUrl} alt="" className="max-w-[200px] rounded-lg border" />
                        ) : (
                          <div className="rounded-lg bg-muted p-4 flex items-center justify-center max-w-[200px]">
                            <Image className="h-8 w-8 text-muted-foreground/40" />
                          </div>
                        )
                      )}
                      {msg.type === "card" && (
                        <div className="rounded-lg border max-w-xs overflow-hidden">
                          {msg.cardImageUrl && (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={msg.cardImageUrl} alt="" className="w-full h-28 object-cover" />
                          )}
                          <div className="p-3 space-y-1">
                            <p className="text-sm font-semibold">{msg.cardTitle || "หัวข้อ"}</p>
                            {msg.cardText && <p className="text-xs text-muted-foreground">{msg.cardText}</p>}
                            {msg.cardButtons?.map((btn, bi) => (
                              <div key={bi} className="mt-1">
                                <span className="inline-block rounded-full bg-accent text-accent-foreground text-xs px-3 py-1">{btn.label || "ปุ่ม"}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      {msg.type === "sticker" && (
                        <p className="text-xs text-muted-foreground">Sticker: {msg.stickerPackageId}/{msg.stickerId}</p>
                      )}
                      {msg.type === "file" && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1"><FileText className="h-3.5 w-3.5" />{msg.fileName || msg.fileUrl || "ไฟล์"}</p>
                      )}
                      {msg.type === "video" && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1"><Video className="h-3.5 w-3.5" />{msg.videoUrl || "วิดีโอ"}</p>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* Add message type button */}
              <Button
                variant="outline"
                className="w-full border-dashed h-12"
                onClick={() => setShowTypeSelector(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                เพิ่มประเภทข้อความ
              </Button>
            </div>

            {/* Quick Replies */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold">Quick Reply</h3>
                <Button variant="outline" size="sm" className="h-7 text-xs" onClick={addQuickReply}>
                  <Plus className="h-3 w-3 mr-1" />
                  เพิ่ม
                </Button>
              </div>
              {(pattern.quickReplies ?? []).length === 0 && (
                <p className="text-xs text-muted-foreground italic">ยังไม่มี Quick Reply</p>
              )}
              <div className="flex flex-wrap gap-2">
                {(pattern.quickReplies ?? []).map((qr, idx) => (
                  <div key={idx} className="flex items-center gap-1 rounded-full border px-3 py-1">
                    <Input
                      className="h-6 w-24 border-0 p-0 text-xs focus-visible:ring-0"
                      value={qr.label}
                      onChange={(e) => updateQuickReply(idx, { label: e.target.value })}
                      placeholder="ชื่อปุ่ม"
                    />
                    <button onClick={() => removeQuickReply(idx)} className="text-muted-foreground hover:text-destructive">
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Assign to human */}
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <p className="text-sm font-medium">ส่งต่อให้แอดมิน</p>
                <p className="text-xs text-muted-foreground">เปิดสถานะแชทเป็น &quot;กำลังดูแล&quot; หลังส่งข้อความ</p>
              </div>
              <Switch
                checked={pattern.assignToHuman ?? false}
                onCheckedChange={(v) => updatePattern({ assignToHuman: v })}
              />
            </div>

            {/* Save button */}
            <Button className="w-full" onClick={saveSelected} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              บันทึก
            </Button>
          </div>
        )}
      </div>

      {/* Message Type Selector Dialog */}
      <Dialog open={showTypeSelector} onOpenChange={setShowTypeSelector}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>เพิ่มประเภทข้อความ</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3 py-2">
            {MSG_TYPES.map((t) => {
              const Icon = t.icon;
              return (
                <button
                  key={t.value}
                  onClick={() => addMessage(t.value)}
                  className="flex items-center gap-3 rounded-xl border p-3 hover:bg-muted/50 transition-colors text-left"
                >
                  <Icon className="h-5 w-5 text-muted-foreground shrink-0" />
                  <span className="text-sm font-medium">{t.label}</span>
                </button>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>

      {/* Message Editor Dialog */}
      <Dialog open={editingMsgIdx !== null} onOpenChange={(open) => { if (!open) { setEditingMsgIdx(null); setEditingMsg(null); } }}>
        <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>แก้ไขข้อความ — {editingMsg ? msgTypeLabel(editingMsg.type) : ""}</DialogTitle>
          </DialogHeader>
          {editingMsg && (
            <div className="space-y-4 py-2">
              {editingMsg.type === "text" && (
                <>
                  <div className="space-y-1.5">
                    <Label>ข้อความ</Label>
                    <Textarea
                      className="min-h-[100px]"
                      value={editingMsg.text ?? ""}
                      onChange={(e) => setEditingMsg({ ...editingMsg, text: e.target.value })}
                      placeholder="พิมพ์ข้อความ..."
                    />
                  </div>
                  <ButtonEditor
                    buttons={editingMsg.buttons ?? []}
                    onAdd={addMsgButton}
                    onRemove={removeMsgButton}
                    onUpdate={updateMsgButton}
                  />
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
                  <div className="space-y-1.5">
                    <Label>รูปภาพ (URL)</Label>
                    <Input value={editingMsg.cardImageUrl ?? ""} onChange={(e) => setEditingMsg({ ...editingMsg, cardImageUrl: e.target.value })} placeholder="https://..." />
                  </div>
                  <div className="space-y-1.5">
                    <Label>หัวข้อ</Label>
                    <Input value={editingMsg.cardTitle ?? ""} onChange={(e) => setEditingMsg({ ...editingMsg, cardTitle: e.target.value })} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>รายละเอียด</Label>
                    <Textarea value={editingMsg.cardText ?? ""} onChange={(e) => setEditingMsg({ ...editingMsg, cardText: e.target.value })} />
                  </div>
                  <ButtonEditor
                    buttons={editingMsg.cardButtons ?? []}
                    onAdd={addMsgButton}
                    onRemove={removeMsgButton}
                    onUpdate={updateMsgButton}
                  />
                </>
              )}

              {editingMsg.type === "sticker" && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>Package ID</Label>
                    <Input value={editingMsg.stickerPackageId ?? ""} onChange={(e) => setEditingMsg({ ...editingMsg, stickerPackageId: e.target.value })} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Sticker ID</Label>
                    <Input value={editingMsg.stickerId ?? ""} onChange={(e) => setEditingMsg({ ...editingMsg, stickerId: e.target.value })} />
                  </div>
                </div>
              )}

              {editingMsg.type === "file" && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>URL ไฟล์</Label>
                    <Input value={editingMsg.fileUrl ?? ""} onChange={(e) => setEditingMsg({ ...editingMsg, fileUrl: e.target.value })} placeholder="https://..." />
                  </div>
                  <div className="space-y-1.5">
                    <Label>ชื่อไฟล์</Label>
                    <Input value={editingMsg.fileName ?? ""} onChange={(e) => setEditingMsg({ ...editingMsg, fileName: e.target.value })} />
                  </div>
                </div>
              )}

              {editingMsg.type === "video" && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>URL วิดีโอ</Label>
                    <Input value={editingMsg.videoUrl ?? ""} onChange={(e) => setEditingMsg({ ...editingMsg, videoUrl: e.target.value })} placeholder="https://..." />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Thumbnail URL</Label>
                    <Input value={editingMsg.thumbnailUrl ?? ""} onChange={(e) => setEditingMsg({ ...editingMsg, thumbnailUrl: e.target.value })} />
                  </div>
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

      {/* New Pattern Dialog */}
      <Dialog open={showNewDialog} onOpenChange={setShowNewDialog}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>สร้างรูปแบบตอบกลับใหม่</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <Label>ชื่อรูปแบบ</Label>
            <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="เช่น ทักทายลูกค้า" autoFocus />
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

// ─── Button Editor Sub-component ─────────────────────────────────────────────

function ButtonEditor({
  buttons,
  onAdd,
  onRemove,
  onUpdate,
}: {
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
          <Plus className="h-3 w-3 mr-1" />
          เพิ่มปุ่ม
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
          <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={() => onRemove(i)}>
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      ))}
    </div>
  );
}
