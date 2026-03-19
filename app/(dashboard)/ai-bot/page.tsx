"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Plus, Trash2, Loader2, Search, Power, PowerOff, Clock,
  AlertTriangle, X, ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { PageHeader } from "@/components/page-header";
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
          <PageHeader title="อินเทนต์" subtitle="ตั้งกฎ trigger และเชื่อมกับชุดข้อความ" />
          <Button className="w-full" onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />สร้างอินเทนต์
          </Button>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input className="pl-9" placeholder="ค้นหา..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {filtered.length === 0 ? (
            <p className="p-4 text-sm text-muted-foreground text-center">ไม่มีอินเทนต์</p>
          ) : filtered.map((intent) => (
            <button
              key={intent.id}
              onClick={() => setSelectedId(intent.id)}
              className={cn(
                "w-full text-left px-4 py-3 border-b transition-colors hover:bg-accent/50 flex items-center gap-3",
                selectedId === intent.id && "bg-accent"
              )}
            >
              <div className={cn("w-2 h-2 rounded-full shrink-0", intent.isActive ? "bg-emerald-500" : "bg-muted-foreground/30")} />
              <div className="flex-1 min-w-0">
                <div className="font-medium truncate">{intent.name}</div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  {TRIGGER_LABELS[intent.triggerType] ?? intent.triggerType}
                  {intent.keywords.length > 0 && ` · ${intent.keywords.length} คีย์เวิร์ด`}
                </div>
              </div>
              {!intent.isActive && (
                <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />
              )}
            </button>
          ))}
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
          <div className="flex items-center justify-center h-full text-muted-foreground">
            เลือกอินเทนต์จากรายการด้านซ้าย
          </div>
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

  useEffect(() => {
    setName(intent.name);
    setTriggerType(intent.triggerType);
    setKeywords(intent.keywords);
    setPostbackData(intent.postbackData ?? "");
    setMessageSetId(intent.messageSetId);
    setDirty(false);
    // Fetch activity
    fetch(`/api/bot-intents/${intent.id}/activity`).then((r) => r.ok ? r.json() : []).then(setActivity);
  }, [intent.id, intent.name, intent.triggerType, intent.keywords, intent.postbackData, intent.messageSetId]);

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

  return (
    <div className="p-6 space-y-8 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="flex-1 space-y-1">
          <div className="flex items-center gap-3">
            <label className="text-sm font-medium text-muted-foreground">ชื่ออินเทนต์ *</label>
          </div>
          <Input
            className="text-lg font-semibold h-11"
            value={name}
            onChange={(e) => { setName(e.target.value); setDirty(true); }}
          />
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <span className="text-sm text-muted-foreground">สถานะการใช้งาน</span>
          <div className="flex items-center gap-2 cursor-pointer" onClick={onToggle}>
            <Switch checked={intent.isActive} />
            <span className={cn("text-sm font-medium", intent.isActive ? "text-emerald-600" : "text-muted-foreground")}>
              {intent.isActive ? "On" : "Off"}
            </span>
          </div>
        </div>
      </div>

      {/* Trigger Type */}
      <div className="space-y-4">
        <h3 className="heading-section">เทรนบอท</h3>
        <p className="text-sm text-muted-foreground">เมื่อผู้ใช้ส่งข้อความ ที่ตรงกับคีย์เวิร์ดที่กำหนดไว้ บอทจะส่งข้อความตอบกลับอัตโนมัติ</p>

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
                placeholder="เพิ่มคีย์เวิร์ดบอท"
                value={kwInput}
                onChange={(e) => setKwInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addKeyword()}
              />
              <Button onClick={addKeyword} disabled={!kwInput.trim()}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            {keywords.length > 0 && (
              <div className="border rounded-xl overflow-hidden">
                <div className="px-4 py-2 bg-muted/50 text-xs text-muted-foreground flex justify-between">
                  <span>แสดง {keywords.length} จาก {keywords.length} รายการ</span>
                </div>
                {keywords.map((kw) => (
                  <div key={kw} className="flex items-center justify-between px-4 py-2.5 border-t">
                    <span className="text-sm font-medium">/{kw}</span>
                    <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => removeKeyword(kw)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ))}
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
      </div>

      {/* Linked Message Set */}
      <div className="space-y-4">
        <h3 className="heading-section">ข้อความตอบกลับ</h3>
        <p className="text-sm text-muted-foreground">
          ข้อความที่บอทจะนำมาใช้ตอบกลับ เพื่อส่งไปยังผู้ใช้งาน
        </p>

        <Select value={messageSetId} onValueChange={(v) => { setMessageSetId(v ?? ""); setDirty(true); }}>
          <SelectTrigger className="w-full"><SelectValue placeholder="เลือกชุดข้อความ" /></SelectTrigger>
          <SelectContent>
            {messageSets.map((ms) => (
              <SelectItem key={ms.id} value={ms.id}>{ms.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {messageSetId && (
          <div className="border rounded-xl overflow-hidden">
            <table className="w-full">
              <thead><tr className="bg-muted/50 text-xs text-muted-foreground">
                <th className="text-left px-4 py-2 font-medium">ชื่อ</th>
                <th className="text-left px-4 py-2 font-medium">ประเภท</th>
                <th className="text-left px-4 py-2 font-medium">แอ็กชัน</th>
              </tr></thead>
              <tbody>
                <tr className="border-t">
                  <td className="px-4 py-3 text-sm font-medium">
                    {messageSets.find((ms) => ms.id === messageSetId)?.name ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">Message</td>
                  <td className="px-4 py-3">
                    <a href="/auto-reply" className="text-primary text-sm hover:underline inline-flex items-center gap-1">
                      แก้ไข <ChevronRight className="h-3 w-3" />
                    </a>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Save / Delete */}
      <div className="flex items-center gap-3 pt-2">
        <Button onClick={save} disabled={!dirty}>บันทึก</Button>
        <Button variant="outline" className="text-destructive" onClick={onDelete}>
          <Trash2 className="h-4 w-4 mr-2" />ลบอินเทนต์
        </Button>
      </div>

      {/* Activity Log */}
      {activity.length > 0 && (
        <div className="space-y-3 pt-4 border-t">
          <h3 className="heading-section flex items-center gap-2">
            <Clock className="h-4 w-4" />กิจกรรมล่าสุด
          </h3>
          <div className="space-y-2">
            {activity.map((entry) => (
              <div key={entry.id} className="rounded-xl bg-card border p-3 space-y-1">
                <div className="flex items-center gap-3">
                  <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span className="text-sm text-muted-foreground shrink-0">{formatRelativeTime(entry.startedAt)}</span>
                  <span className="font-medium truncate">{entry.conversation.contact.displayName || "ลูกค้า"}</span>
                  <span className="text-sm text-muted-foreground/60 truncate">{entry.conversation.channel.name}</span>
                  <span className="text-xs text-muted-foreground/50 shrink-0">{entry.sentCount}/{entry.totalMessages} sent</span>
                  <span className={cn("ml-auto rounded-full px-2.5 py-1 text-xs font-medium shrink-0",
                    entry.status === "completed" ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400"
                    : entry.status === "failed" ? "bg-red-50 text-red-600 dark:bg-red-950/30 dark:text-red-400"
                    : "bg-muted text-muted-foreground"
                  )}>{entry.status === "completed" ? "สำเร็จ" : entry.status === "failed" ? "ส่งไม่สำเร็จ" : entry.status}</span>
                </div>
                {entry.errors.length > 0 && (
                  <div className="pl-7 text-xs text-red-500">{entry.errors.join(", ")}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
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
              <p className="text-sm text-muted-foreground">ยังไม่มีชุดข้อความ กรุณาสร้างที่หน้า "ชุดข้อความตอบกลับ" ก่อน</p>
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
