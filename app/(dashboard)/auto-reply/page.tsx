"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Plus, Trash2, Loader2, Copy, Pencil, Search, Image, FileText,
  MessageSquare, Sticker, Video, GripVertical, X, ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { PageHeader } from "@/components/page-header";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

// ─── Types ───────────────────────────────────────────────────────────────────

interface RichButton { label: string; action: "postback" | "url" | "message"; value: string }

interface AutoReplyMessage {
  type: "text" | "image" | "card" | "sticker" | "file" | "video";
  text?: string; buttons?: RichButton[];
  imageUrl?: string;
  cardTitle?: string; cardText?: string; cardImageUrl?: string; cardButtons?: RichButton[];
  stickerPackageId?: string; stickerId?: string;
  fileUrl?: string; fileName?: string;
  videoUrl?: string; thumbnailUrl?: string;
}

interface QuickReplyItem { label: string; action: "message" | "postback"; value: string }

interface PlatformPattern { messages: AutoReplyMessage[]; quickReplies?: QuickReplyItem[] }

interface PlatformMessages {
  _default: PlatformPattern;
  line?: PlatformPattern;
  facebook?: PlatformPattern;
  instagram?: PlatformPattern;
}

interface MessageSetItem {
  id: string; name: string; messages: PlatformMessages;
  createdAt: string; updatedAt: string;
  _count?: { intents: number };
}

type PlatformKey = "_default" | "line" | "facebook" | "instagram";
const PLATFORMS: { key: PlatformKey; label: string; color: string }[] = [
  { key: "line", label: "Line", color: "text-green-600" },
  { key: "facebook", label: "Facebook", color: "text-blue-600" },
  { key: "instagram", label: "Instagram", color: "text-pink-500" },
];

const MSG_TYPES: { type: AutoReplyMessage["type"]; label: string; icon: typeof MessageSquare }[] = [
  { type: "text", label: "ข้อความ", icon: MessageSquare },
  { type: "image", label: "รูปภาพ", icon: Image },
  { type: "card", label: "การ์ด", icon: FileText },
  { type: "sticker", label: "สติกเกอร์", icon: Sticker },
  { type: "video", label: "วิดีโอ", icon: Video },
];

function emptyMessages(): PlatformMessages {
  return { _default: { messages: [], quickReplies: [] } };
}

function getPattern(msgs: PlatformMessages, platform: PlatformKey): PlatformPattern {
  if (platform === "_default") return msgs._default ?? { messages: [], quickReplies: [] };
  return msgs[platform] ?? msgs._default ?? { messages: [], quickReplies: [] };
}

function setPattern(msgs: PlatformMessages, platform: PlatformKey, pattern: PlatformPattern): PlatformMessages {
  return { ...msgs, [platform]: pattern };
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function MessageSetsPage() {
  const [sets, setSets] = useState<MessageSetItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [newName, setNewName] = useState("");

  const selected = sets.find((s) => s.id === selectedId) ?? null;

  const fetchSets = useCallback(async () => {
    const res = await fetch("/api/message-sets");
    if (res.ok) {
      const data = await res.json();
      setSets(data);
      if (data.length > 0 && !selectedId) setSelectedId(data[0].id);
    }
    setLoading(false);
  }, [selectedId]);

  useEffect(() => { fetchSets(); }, [fetchSets]);

  const handleCreate = async () => {
    if (!newName.trim()) return;
    const res = await fetch("/api/message-sets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName.trim(), messages: emptyMessages() }),
    });
    if (res.ok) {
      const created = await res.json();
      setSets((prev) => [created, ...prev]);
      setSelectedId(created.id);
      setCreateOpen(false);
      setNewName("");
      toast.success("สร้างชุดข้อความสำเร็จ");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("ลบชุดข้อความนี้?")) return;
    const res = await fetch(`/api/message-sets/${id}`, { method: "DELETE" });
    if (res.ok) {
      setSets((prev) => prev.filter((s) => s.id !== id));
      if (selectedId === id) setSelectedId(sets.find((s) => s.id !== id)?.id ?? null);
      toast.success("ลบสำเร็จ");
    } else {
      const err = await res.json().catch(() => null);
      toast.error(err?.error ?? "ลบไม่ได้");
    }
  };

  const handleUpdate = async (id: string, data: Partial<MessageSetItem>) => {
    const res = await fetch(`/api/message-sets/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (res.ok) {
      const updated = await res.json();
      setSets((prev) => prev.map((s) => (s.id === id ? { ...s, ...updated } : s)));
    }
  };

  const filtered = sets.filter((s) => s.name.toLowerCase().includes(search.toLowerCase()));

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
      <div className="w-[300px] border-r flex flex-col shrink-0">
        <div className="p-4 space-y-3 border-b">
          <PageHeader title="ชุดข้อความตอบกลับ" subtitle="สร้างและจัดการชุดข้อความสำหรับใช้กับอินเทนต์" />
          <Button className="w-full" onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />สร้างชุดข้อความ
          </Button>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input className="pl-9" placeholder="ค้นหา..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {filtered.length === 0 ? (
            <p className="p-4 text-sm text-muted-foreground text-center">ไม่มีชุดข้อความ</p>
          ) : filtered.map((set) => (
            <button
              key={set.id}
              onClick={() => setSelectedId(set.id)}
              className={cn(
                "w-full text-left px-4 py-3 border-b transition-colors hover:bg-accent/50",
                selectedId === set.id && "bg-accent"
              )}
            >
              <div className="font-medium truncate">{set.name}</div>
              <div className="text-xs text-muted-foreground mt-0.5">
                {set._count?.intents ?? 0} อินเทนต์ที่ใช้
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Right Panel */}
      <div className="flex-1 overflow-y-auto">
        {selected ? (
          <MessageSetEditor
            set={selected}
            onUpdate={(data) => handleUpdate(selected.id, data)}
            onDelete={() => handleDelete(selected.id)}
          />
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            เลือกชุดข้อความจากรายการด้านซ้าย
          </div>
        )}
      </div>

      {/* Create Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>สร้างชุดข้อความใหม่</DialogTitle></DialogHeader>
          <Input placeholder="ชื่อชุดข้อความ" value={newName} onChange={(e) => setNewName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleCreate()} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>ยกเลิก</Button>
            <Button onClick={handleCreate} disabled={!newName.trim()}>สร้าง</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Message Set Editor ─────────────────────────────────────────────────────

function MessageSetEditor({ set, onUpdate, onDelete }: {
  set: MessageSetItem;
  onUpdate: (data: Partial<MessageSetItem>) => void;
  onDelete: () => void;
}) {
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

  const save = () => {
    onUpdate({ name, messages });
    setDirty(false);
    toast.success("บันทึกสำเร็จ");
  };

  const updateMessages = (newMsgs: AutoReplyMessage[]) => {
    const updated = setPattern(messages, platform, { ...pattern, messages: newMsgs });
    setMessages(updated);
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

  const deleteMessage = (idx: number) => {
    updateMessages(msgList.filter((_, i) => i !== idx));
    if (editingIdx === idx) setEditingIdx(null);
  };

  const duplicateMessage = (idx: number) => {
    const copy = JSON.parse(JSON.stringify(msgList[idx]));
    const newList = [...msgList];
    newList.splice(idx + 1, 0, copy);
    updateMessages(newList);
  };

  const updateMessage = (idx: number, msg: AutoReplyMessage) => {
    const newList = [...msgList];
    newList[idx] = msg;
    updateMessages(newList);
  };

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex-1">
          <Input
            className="text-lg font-semibold h-11"
            value={name}
            onChange={(e) => { setName(e.target.value); setDirty(true); }}
            placeholder="ชื่อชุดข้อความ"
          />
        </div>
        <Button onClick={save} disabled={!dirty}>บันทึก</Button>
        <Button variant="outline" size="icon" onClick={onDelete} className="text-destructive hover:text-destructive">
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      <div className="text-xs text-muted-foreground">
        Message ID: {set.id}
      </div>

      {/* Platform Tabs */}
      <div className="flex items-center gap-1 border-b">
        <button
          onClick={() => setPlatform("_default")}
          className={cn("px-4 py-2 text-sm font-medium border-b-2 transition-colors",
            platform === "_default" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
          )}
        >
          ค่าเริ่มต้น
        </button>
        {PLATFORMS.map((p) => (
          <button
            key={p.key}
            onClick={() => setPlatform(p.key)}
            className={cn("px-4 py-2 text-sm font-medium border-b-2 transition-colors",
              platform === p.key ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            <span className={platform === p.key ? p.color : ""}>{p.label}</span>
          </button>
        ))}
      </div>

      {/* Messages */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="heading-section">ข้อความ ({msgList.length}/5 บับเบิ้ล)</h3>
          <div className="relative">
            <Button size="sm" variant="ghost" onClick={() => setAddTypeOpen(!addTypeOpen)} disabled={msgList.length >= 5} className="text-primary">
              <Plus className="h-4 w-4 mr-1" />เพิ่มข้อความ
              <ChevronDown className="h-3 w-3 ml-1" />
            </Button>
            {addTypeOpen && (
              <div className="absolute right-0 top-full mt-1 z-50 bg-popover border rounded-xl shadow-lg p-1 min-w-[160px]">
                {MSG_TYPES.map((t) => (
                  <button
                    key={t.type}
                    onClick={() => addMessage(t.type)}
                    className="flex items-center gap-2 px-3 py-2 w-full text-left text-sm rounded-lg hover:bg-accent transition-colors"
                  >
                    <t.icon className="h-4 w-4" />{t.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {msgList.length === 0 ? (
          <div className="border-2 border-dashed rounded-2xl p-8 text-center text-muted-foreground">
            ยังไม่มีข้อความ กด "+ เพิ่มข้อความ" เพื่อเริ่มสร้าง
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
                onChange={(m) => updateMessage(idx, m)}
                onDelete={() => deleteMessage(idx)}
                onDuplicate={() => duplicateMessage(idx)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Quick Replies */}
      <QuickReplySection
        items={pattern.quickReplies ?? []}
        onChange={(qr) => {
          const updated = setPattern(messages, platform, { ...pattern, quickReplies: qr });
          setMessages(updated);
          setDirty(true);
        }}
      />
    </div>
  );
}

// ─── Message Card ────────────────────────────────────────────────────────────

function MessageCard({ msg, num, isEditing, onEdit, onChange, onDelete, onDuplicate }: {
  msg: AutoReplyMessage; num: number; isEditing: boolean;
  onEdit: () => void; onChange: (m: AutoReplyMessage) => void;
  onDelete: () => void; onDuplicate: () => void;
}) {
  const TypeIcon = MSG_TYPES.find((t) => t.type === msg.type)?.icon ?? MessageSquare;
  const typeName = MSG_TYPES.find((t) => t.type === msg.type)?.label ?? msg.type;

  const preview = msg.type === "text" ? msg.text
    : msg.type === "card" ? msg.cardTitle
    : msg.type === "image" ? msg.imageUrl
    : msg.type === "sticker" ? `${msg.stickerPackageId}/${msg.stickerId}`
    : msg.type === "video" ? msg.videoUrl
    : "";

  return (
    <div className="border rounded-2xl overflow-hidden bg-card">
      {/* Summary bar */}
      <div className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-accent/30 transition-colors" onClick={onEdit}>
        <GripVertical className="h-4 w-4 text-muted-foreground/40 shrink-0" />
        <span className="w-7 h-7 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center shrink-0">{num}</span>
        <TypeIcon className="h-4 w-4 text-muted-foreground shrink-0" />
        <div className="flex-1 min-w-0">
          <span className="text-sm font-medium">{typeName}</span>
          {preview && <span className="text-sm text-muted-foreground ml-2 truncate">— {typeof preview === "string" ? preview.slice(0, 60) : ""}</span>}
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); onDuplicate(); }}>
            <Copy className="h-3.5 w-3.5" />
          </Button>
          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); onEdit(); }}>
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={(e) => { e.stopPropagation(); onDelete(); }}>
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Editor */}
      {isEditing && (
        <div className="px-4 pb-4 pt-2 border-t space-y-3">
          <MessageEditor msg={msg} onChange={onChange} />
        </div>
      )}
    </div>
  );
}

// ─── Message Editor (inline) ─────────────────────────────────────────────────

function MessageEditor({ msg, onChange }: { msg: AutoReplyMessage; onChange: (m: AutoReplyMessage) => void }) {
  const update = (patch: Partial<AutoReplyMessage>) => onChange({ ...msg, ...patch });

  switch (msg.type) {
    case "text":
      return (
        <div className="space-y-3">
          <Textarea rows={3} placeholder="ข้อความ..." value={msg.text ?? ""} onChange={(e) => update({ text: e.target.value })} />
          <ButtonsEditor buttons={msg.buttons ?? []} onChange={(buttons) => update({ buttons })} />
        </div>
      );
    case "image":
      return <Input placeholder="URL รูปภาพ" value={msg.imageUrl ?? ""} onChange={(e) => update({ imageUrl: e.target.value })} />;
    case "card":
      return (
        <div className="space-y-3">
          <Input placeholder="หัวข้อการ์ด" value={msg.cardTitle ?? ""} onChange={(e) => update({ cardTitle: e.target.value })} />
          <Textarea rows={2} placeholder="รายละเอียดการ์ด" value={msg.cardText ?? ""} onChange={(e) => update({ cardText: e.target.value })} />
          <Input placeholder="URL รูปภาพการ์ด (ไม่บังคับ)" value={msg.cardImageUrl ?? ""} onChange={(e) => update({ cardImageUrl: e.target.value })} />
          <ButtonsEditor buttons={msg.cardButtons ?? []} onChange={(cardButtons) => update({ cardButtons })} />
        </div>
      );
    case "sticker":
      return (
        <div className="flex gap-3">
          <Input placeholder="Package ID" value={msg.stickerPackageId ?? ""} onChange={(e) => update({ stickerPackageId: e.target.value })} />
          <Input placeholder="Sticker ID" value={msg.stickerId ?? ""} onChange={(e) => update({ stickerId: e.target.value })} />
        </div>
      );
    case "video":
      return (
        <div className="space-y-3">
          <Input placeholder="URL วิดีโอ" value={msg.videoUrl ?? ""} onChange={(e) => update({ videoUrl: e.target.value })} />
          <Input placeholder="URL รูปปก (ไม่บังคับ)" value={msg.thumbnailUrl ?? ""} onChange={(e) => update({ thumbnailUrl: e.target.value })} />
        </div>
      );
    default:
      return null;
  }
}

// ─── Buttons Editor ──────────────────────────────────────────────────────────

function ButtonsEditor({ buttons, onChange }: { buttons: RichButton[]; onChange: (b: RichButton[]) => void }) {
  const add = () => onChange([...buttons, { label: "", action: "message", value: "" }]);
  const remove = (idx: number) => onChange(buttons.filter((_, i) => i !== idx));
  const update = (idx: number, patch: Partial<RichButton>) => {
    const newButtons = [...buttons];
    newButtons[idx] = { ...newButtons[idx], ...patch };
    onChange(newButtons);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-muted-foreground">ปุ่ม ({buttons.length})</span>
        <Button size="sm" variant="ghost" onClick={add} className="text-primary h-7 text-xs">
          <Plus className="h-3 w-3 mr-1" />เพิ่มปุ่ม
        </Button>
      </div>
      {buttons.map((btn, idx) => (
        <div key={idx} className="flex items-center gap-2">
          <Input className="flex-1" placeholder="Label" value={btn.label} onChange={(e) => update(idx, { label: e.target.value })} />
          <Select value={btn.action} onValueChange={(v) => update(idx, { action: v as RichButton["action"] })}>
            <SelectTrigger className="w-[120px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="message">Message</SelectItem>
              <SelectItem value="postback">Postback</SelectItem>
              <SelectItem value="url">URL</SelectItem>
            </SelectContent>
          </Select>
          <Input className="flex-1" placeholder="Value" value={btn.value} onChange={(e) => update(idx, { value: e.target.value })} />
          <Button size="icon" variant="ghost" className="h-8 w-8 shrink-0 text-destructive" onClick={() => remove(idx)}>
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      ))}
    </div>
  );
}

// ─── Quick Reply Section ─────────────────────────────────────────────────────

function QuickReplySection({ items, onChange }: { items: QuickReplyItem[]; onChange: (items: QuickReplyItem[]) => void }) {
  const add = () => onChange([...items, { label: "", action: "message", value: "" }]);
  const remove = (idx: number) => onChange(items.filter((_, i) => i !== idx));
  const update = (idx: number, patch: Partial<QuickReplyItem>) => {
    const newItems = [...items];
    newItems[idx] = { ...newItems[idx], ...patch };
    onChange(newItems);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="heading-section">Quick Reply ({items.length}/13)</h3>
        <Button size="sm" variant="ghost" onClick={add} disabled={items.length >= 13} className="text-primary">
          <Plus className="h-4 w-4 mr-1" />เพิ่ม Quick Reply
        </Button>
      </div>
      {items.length > 0 && (
        <div className="space-y-2">
          {items.map((item, idx) => (
            <div key={idx} className="flex items-center gap-2 bg-card border rounded-xl p-2">
              <Input className="flex-1" placeholder="Label" value={item.label} onChange={(e) => update(idx, { label: e.target.value })} />
              <Select value={item.action} onValueChange={(v) => update(idx, { action: v as "message" | "postback" })}>
                <SelectTrigger className="w-[120px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="message">Message</SelectItem>
                  <SelectItem value="postback">Postback</SelectItem>
                </SelectContent>
              </Select>
              <Input className="flex-1" placeholder="Value" value={item.value} onChange={(e) => update(idx, { value: e.target.value })} />
              <Button size="icon" variant="ghost" className="h-8 w-8 shrink-0 text-destructive" onClick={() => remove(idx)}>
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
