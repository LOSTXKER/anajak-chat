"use client";

import { useEffect, useState, useCallback, useMemo, type ReactNode } from "react";
import {
  Plus, Trash2, Loader2, Power, PowerOff, ChevronUp, ChevronDown, ChevronLeft, ChevronRight,
  MessageSquare, Image, FileText, Video, Smile, CreditCard,
  Pencil, X, Search, Check, Zap, Hash, ArrowRight, Bot,
  Monitor, Smartphone, Globe, FolderOpen, Copy,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from "@/components/ui/select";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { EmptyState } from "@/components/empty-state";

// ─── Types ────────────────────────────────────────────────────────────────────

interface RichButton { label: string; action: "postback" | "url" | "message"; value: string }

interface AutoReplyMessage {
  type: "text" | "image" | "card" | "sticker" | "file" | "video";
  text?: string; buttons?: RichButton[]; imageUrl?: string;
  cardTitle?: string; cardText?: string; cardImageUrl?: string; cardButtons?: RichButton[];
  stickerPackageId?: string; stickerId?: string;
  fileUrl?: string; fileName?: string; videoUrl?: string; thumbnailUrl?: string;
}

interface QuickReplyItem { label: string; action: "message" | "postback"; value: string }
interface AutoReplyPattern { messages: AutoReplyMessage[]; quickReplies?: QuickReplyItem[] }
type PlatformKey = "_default" | "line" | "facebook" | "instagram";

interface PlatformSteps {
  _default: AutoReplyPattern;
  line?: AutoReplyPattern;
  facebook?: AutoReplyPattern;
  instagram?: AutoReplyPattern;
  assignToHuman?: boolean;
}

interface FlowTrigger { type: "first_message" | "keyword" | "postback"; keywords?: string[]; data?: string }

interface ChatFlow {
  id: string; name: string; description: string | null; isActive: boolean;
  trigger: FlowTrigger; steps: PlatformSteps; priority: number; createdAt: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const MSG_TYPES = [
  { value: "text", label: "ข้อความ", icon: MessageSquare, color: "text-blue-500", bg: "bg-blue-50 dark:bg-blue-950/30" },
  { value: "image", label: "รูปภาพ", icon: Image, color: "text-emerald-500", bg: "bg-emerald-50 dark:bg-emerald-950/30" },
  { value: "card", label: "การ์ดเมสเสจ", icon: CreditCard, color: "text-purple-500", bg: "bg-purple-50 dark:bg-purple-950/30" },
  { value: "sticker", label: "สติ๊กเกอร์", icon: Smile, color: "text-amber-500", bg: "bg-amber-50 dark:bg-amber-950/30" },
  { value: "file", label: "แนบไฟล์", icon: FileText, color: "text-red-500", bg: "bg-red-50 dark:bg-red-950/30" },
  { value: "video", label: "วิดีโอ", icon: Video, color: "text-pink-500", bg: "bg-pink-50 dark:bg-pink-950/30" },
] as const;

const TRIGGER_LABELS: Record<string, string> = { first_message: "ข้อความแรก", keyword: "คีย์เวิร์ด", postback: "กดปุ่ม" };

const PLATFORM_MSG_TYPES: Record<PlatformKey, string[]> = {
  _default: ["text", "image", "card", "sticker", "file", "video"],
  line: ["text", "image", "card", "sticker", "file", "video"],
  facebook: ["text", "image", "card"],
  instagram: ["text", "image", "card"],
};

const PLATFORM_TABS: { value: PlatformKey; label: string; color: string }[] = [
  { value: "line", label: "Line", color: "#06C755" },
  { value: "facebook", label: "Facebook", color: "#0084FF" },
  { value: "instagram", label: "Instagram", color: "#DD2A7B" },
];

const PLATFORM_THEMES: Record<PlatformKey, {
  chatBg: string; accent: string; avatarBg: string; avatarColor: string; name: string;
}> = {
  _default: { chatBg: "chat-messages-bg", accent: "#3b82f6", avatarBg: "bg-primary/10", avatarColor: "text-primary", name: "Bot" },
  line: { chatBg: "bg-[#B5C7D3]", accent: "#06C755", avatarBg: "bg-[#06C755]", avatarColor: "text-white", name: "LINE" },
  facebook: { chatBg: "bg-white dark:bg-gray-950", accent: "#0084FF", avatarBg: "bg-[#0084FF]", avatarColor: "text-white", name: "Messenger" },
  instagram: { chatBg: "bg-white dark:bg-gray-950", accent: "#DD2A7B", avatarBg: "bg-gradient-to-tr from-[#F58529] via-[#DD2A7B] to-[#8134AF]", avatarColor: "text-white", name: "Instagram" },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function normalizePlatformSteps(raw: unknown): PlatformSteps {
  if (raw && typeof raw === "object") {
    const obj = raw as Record<string, unknown>;
    if ("_default" in obj && typeof obj._default === "object") return obj as unknown as PlatformSteps;
    if ("messages" in obj) {
      const legacy = obj as unknown as AutoReplyPattern & { assignToHuman?: boolean };
      return { _default: { messages: legacy.messages ?? [], quickReplies: legacy.quickReplies }, assignToHuman: legacy.assignToHuman };
    }
  }
  return { _default: { messages: [], quickReplies: [] }, assignToHuman: false };
}

const msgTypeLabel = (type: string) => MSG_TYPES.find((t) => t.value === type)?.label ?? type;
const msgTypeConfig = (type: string) => MSG_TYPES.find((t) => t.value === type);

// ─── Main Component ───────────────────────────────────────────────────────────

export default function AutoReplyPage() {
  const { toast } = useToast();
  const [flows, setFlows] = useState<ChatFlow[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [platformTab, setPlatformTab] = useState<PlatformKey>("line");
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());

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
        setFlows(data.map((f) => ({ ...f, steps: normalizePlatformSteps(f.steps) })));
      }
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchFlows(); }, [fetchFlows]);

  const selected = flows.find((f) => f.id === selectedId) ?? null;
  const platformSteps: PlatformSteps = selected ? selected.steps : { _default: { messages: [], quickReplies: [] }, assignToHuman: false };
  const hasPlatformOverride = platformTab !== "_default" && !!platformSteps[platformTab];
  const pattern: AutoReplyPattern = (platformTab !== "_default" && platformSteps[platformTab]) ? platformSteps[platformTab]! : platformSteps._default;
  const theme = PLATFORM_THEMES[platformTab];

  const groupedFlows = useMemo(() => {
    const groups: Record<string, ChatFlow[]> = {};
    const list = searchQuery ? flows.filter((f) => f.name.toLowerCase().includes(searchQuery.toLowerCase())) : flows;
    for (const flow of list) {
      const group = flow.description || "ทั่วไป";
      if (!groups[group]) groups[group] = [];
      groups[group].push(flow);
    }
    return groups;
  }, [flows, searchQuery]);

  function toggleGroup(group: string) {
    setCollapsedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(group)) next.delete(group); else next.add(group);
      return next;
    });
  }

  function updateSelected(patch: Partial<ChatFlow>) {
    if (!selectedId) return;
    setFlows((prev) => prev.map((f) => (f.id === selectedId ? { ...f, ...patch } : f)));
  }

  function updatePlatformSteps(newSteps: PlatformSteps) {
    updateSelected({ steps: newSteps });
  }

  function updatePattern(patch: Partial<AutoReplyPattern>) {
    if (!selected) return;
    const key = platformTab;
    let current: AutoReplyPattern;
    if (key !== "_default" && !platformSteps[key]) {
      current = JSON.parse(JSON.stringify(platformSteps._default));
    } else {
      current = key !== "_default" && platformSteps[key] ? platformSteps[key]! : platformSteps._default;
    }
    const updated = { ...current, ...patch };
    const newSteps = { ...platformSteps };
    if (key === "_default") { newSteps._default = updated; } else { (newSteps as Record<string, unknown>)[key] = updated; }
    updatePlatformSteps(newSteps as PlatformSteps);
  }

  function createPlatformOverride() {
    if (platformTab === "_default") return;
    const copy = JSON.parse(JSON.stringify(platformSteps._default)) as AutoReplyPattern;
    updatePlatformSteps({ ...platformSteps, [platformTab]: copy });
  }

  function removePlatformOverride() {
    if (platformTab === "_default") return;
    const newSteps = { ...platformSteps };
    delete (newSteps as Record<string, unknown>)[platformTab];
    updatePlatformSteps(newSteps as PlatformSteps);
  }

  async function saveSelected() {
    if (!selected) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/chat-flows/${selected.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: selected.name, description: selected.description, trigger: selected.trigger, steps: platformSteps }),
      });
      if (res.ok) toast({ title: "บันทึกแล้ว" });
      else toast({ title: "บันทึกไม่สำเร็จ", variant: "destructive" });
    } finally { setSaving(false); }
  }

  async function handleCreatePattern() {
    if (!newName.trim()) return;
    const res = await fetch("/api/chat-flows", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: newName,
        trigger: { type: "keyword", keywords: [newName] },
        steps: { _default: { messages: [], quickReplies: [] }, assignToHuman: false },
      }),
    });
    if (res.ok) {
      const flow = (await res.json()) as ChatFlow;
      setFlows((prev) => [{ ...flow, steps: normalizePlatformSteps(flow.steps) }, ...prev]);
      setSelectedId(flow.id);
      setShowNewDialog(false);
      setNewName("");
    }
  }

  async function handleDeletePattern(id: string) {
    if (!confirm("ลบรูปแบบนี้?")) return;
    const res = await fetch(`/api/chat-flows/${id}`, { method: "DELETE" });
    if (res.ok) { setFlows((prev) => prev.filter((f) => f.id !== id)); if (selectedId === id) setSelectedId(null); }
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

  function duplicateMessage(idx: number) {
    const copy = JSON.parse(JSON.stringify(pattern.messages[idx])) as AutoReplyMessage;
    const msgs = [...pattern.messages];
    msgs.splice(idx + 1, 0, copy);
    updatePattern({ messages: msgs });
  }

  function removeMessage(idx: number) { updatePattern({ messages: pattern.messages.filter((_, i) => i !== idx) }); }

  function moveMessage(idx: number, dir: -1 | 1) {
    const msgs = [...pattern.messages];
    const target = idx + dir;
    if (target < 0 || target >= msgs.length) return;
    [msgs[idx], msgs[target]] = [msgs[target], msgs[idx]];
    updatePattern({ messages: msgs });
  }

  function openEditMsg(idx: number) { setEditingMsgIdx(idx); setEditingMsg(JSON.parse(JSON.stringify(pattern.messages[idx]))); }

  function saveEditMsg() {
    if (editingMsgIdx === null || !editingMsg) return;
    const msgs = [...pattern.messages]; msgs[editingMsgIdx] = editingMsg;
    updatePattern({ messages: msgs }); setEditingMsgIdx(null); setEditingMsg(null);
  }

  function addQuickReply() { updatePattern({ quickReplies: [...(pattern.quickReplies ?? []), { label: "", action: "message", value: "" }] }); }
  function removeQuickReply(idx: number) { updatePattern({ quickReplies: (pattern.quickReplies ?? []).filter((_, i) => i !== idx) }); }
  function updateQuickReply(idx: number, patch: Partial<QuickReplyItem>) {
    const qrs = [...(pattern.quickReplies ?? [])]; qrs[idx] = { ...qrs[idx], ...patch }; updatePattern({ quickReplies: qrs });
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
    const btns = [...((editingMsg[field] as RichButton[]) ?? [])]; btns[idx] = { ...btns[idx], ...patch };
    setEditingMsg({ ...editingMsg, [field]: btns });
  }

  const allowedMsgTypes = PLATFORM_MSG_TYPES[platformTab];

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <TooltipProvider>
    <div className="flex h-full overflow-hidden">
      {/* ─── Left Panel: Tree/Folder Flow List ─── */}
      <div className="flex h-full w-[300px] shrink-0 flex-col border-r bg-card">
        <div className="p-3 border-b space-y-2">
          <div className="flex items-center justify-between">
            <h1 className="text-base font-bold">รูปแบบการตอบกลับอัตโนมัติ</h1>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input className="pl-8 h-8 text-sm" placeholder="Search" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
            </div>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /><p className="text-sm text-muted-foreground">กำลังโหลด...</p></div>
          ) : Object.keys(groupedFlows).length === 0 ? (
            <EmptyState icon={MessageSquare} message={searchQuery ? "ไม่พบ" : "ยังไม่มีรูปแบบ"} className="px-4 py-12" />
          ) : (
            <div className="py-1">
              {Object.entries(groupedFlows).map(([group, gFlows]) => {
                const isCollapsed = collapsedGroups.has(group);
                return (
                  <div key={group}>
                    <button onClick={() => toggleGroup(group)} className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-muted-foreground hover:bg-muted/50 transition-colors">
                      {isCollapsed ? <ChevronRight className="h-3.5 w-3.5 shrink-0" /> : <ChevronDown className="h-3.5 w-3.5 shrink-0" />}
                      <FolderOpen className="h-3.5 w-3.5 shrink-0" />
                      <span className="truncate">{group}</span>
                      <span className="ml-auto text-[10px] text-muted-foreground/60 tabular-nums">{gFlows.length}</span>
                    </button>
                    {!isCollapsed && (
                      <div className="space-y-px">
                        {gFlows.map((flow) => {
                          const isSelected = selectedId === flow.id;
                          const msgCount = flow.steps._default?.messages?.length ?? 0;
                          return (
                            <div key={flow.id} role="button" tabIndex={0} onClick={() => setSelectedId(flow.id)} onKeyDown={(e) => { if (e.key === "Enter") setSelectedId(flow.id); }}
                              className={cn("w-full flex items-center gap-2.5 pl-10 pr-3 py-2 text-sm cursor-pointer transition-colors group", isSelected ? "bg-primary/8 text-primary font-medium" : "text-foreground hover:bg-muted/50")}>
                              <span className="flex-1 truncate">{flow.name}</span>
                              <span className="text-[10px] text-muted-foreground tabular-nums shrink-0">{msgCount}</span>
                              {!flow.isActive && <PowerOff className="h-3 w-3 text-muted-foreground/40 shrink-0" />}
                              <div className="flex items-center gap-0.5 md:opacity-0 md:group-hover:opacity-100 transition-opacity shrink-0">
                                <button onClick={(e) => { e.stopPropagation(); handleToggle(flow.id); }} className="p-1 rounded hover:bg-background transition-colors">
                                  {flow.isActive ? <Power className="h-3 w-3 text-emerald-500" /> : <Power className="h-3 w-3 text-muted-foreground" />}
                                </button>
                                <button onClick={(e) => { e.stopPropagation(); handleDeletePattern(flow.id); }} className="p-1 rounded hover:bg-destructive/10 transition-colors">
                                  <Trash2 className="h-3 w-3 text-destructive/60" />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
        <div className="p-3 border-t">
          <Button variant="outline" className="w-full justify-start text-primary" size="sm" onClick={() => { setNewName(""); setShowNewDialog(true); }}>
            <Plus className="h-3.5 w-3.5 mr-2" />เพิ่มรูปแบบข้อความ
          </Button>
        </div>
      </div>

      {/* ─── Right Panel ─── */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {!selected ? (
          <EmptyState icon={MessageSquare} message="เลือกรูปแบบเพื่อแก้ไข" description="เลือกรูปแบบจากรายการทางซ้าย หรือสร้างใหม่"
            action={<Button variant="outline" onClick={() => { setNewName(""); setShowNewDialog(true); }}><Plus className="h-4 w-4 mr-2" />สร้างรูปแบบใหม่</Button>}
            className="h-full" />
        ) : (
          <>
            {/* ── Settings header ── */}
            <div className="border-b bg-card px-6 py-4 shrink-0 space-y-3">
              <div className="flex items-center gap-3">
                <Input value={selected.name} onChange={(e) => updateSelected({ name: e.target.value })} className="h-9 text-sm font-semibold border bg-background rounded-lg px-3 max-w-[280px]" placeholder="ชื่อ flow..." />
                <div className="flex-1" />
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <Switch checked={platformSteps.assignToHuman ?? false} onCheckedChange={(checked) => updatePlatformSteps({ ...platformSteps, assignToHuman: checked })} size="sm" />
                    <span className="text-xs text-muted-foreground">ส่งต่อให้แอดมิน</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <Switch checked={selected.isActive} onCheckedChange={() => handleToggle(selected.id)} size="sm" />
                    <span className={cn("text-xs font-medium", selected.isActive ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground")}>{selected.isActive ? "เปิดใช้งาน" : "ปิดใช้งาน"}</span>
                  </label>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground shrink-0"><Zap className="h-3.5 w-3.5" /><span>Trigger:</span></div>
                <Select value={selected.trigger.type} onValueChange={(v) => updateSelected({ trigger: { ...selected.trigger, type: (v ?? "keyword") as FlowTrigger["type"] } })}>
                  <SelectTrigger className="h-8 w-[120px] text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="first_message">ข้อความแรก</SelectItem>
                    <SelectItem value="keyword">คีย์เวิร์ด</SelectItem>
                    <SelectItem value="postback">กดปุ่ม</SelectItem>
                  </SelectContent>
                </Select>
                {selected.trigger.type === "keyword" && (
                  <Input value={selected.trigger.keywords?.join(", ") ?? ""} onChange={(e) => updateSelected({ trigger: { ...selected.trigger, keywords: e.target.value.split(",").map((k) => k.trim()).filter(Boolean) } })} placeholder="คีย์เวิร์ดคั่นด้วย ," className="h-8 w-[200px] text-xs" />
                )}
                {selected.trigger.type === "postback" && (
                  <Input value={selected.trigger.data ?? ""} onChange={(e) => updateSelected({ trigger: { ...selected.trigger, data: e.target.value } })} placeholder="Postback data" className="h-8 w-[200px] text-xs" />
                )}
                <div className="flex-1" />
                <Button onClick={saveSelected} disabled={saving} size="sm">
                  {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> : <Check className="h-3.5 w-3.5 mr-1.5" />}บันทึก
                </Button>
              </div>
            </div>

            {/* ── Platform tabs ── */}
            <div className="border-b bg-card px-6 flex items-center gap-0 shrink-0">
              {PLATFORM_TABS.map((tab) => {
                const isActive = platformTab === tab.value;
                const hasOvr = !!platformSteps[tab.value];
                return (
                  <button key={tab.value} onClick={() => setPlatformTab(tab.value)}
                    className={cn("flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px", isActive ? "border-current" : "border-transparent text-muted-foreground hover:text-foreground")}
                    style={isActive ? { color: tab.color } : undefined}>
                    <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: tab.color }} />
                    {tab.label}
                    {hasOvr && !isActive && <span className="h-1.5 w-1.5 rounded-full bg-current opacity-40" />}
                  </button>
                );
              })}
              {platformTab !== "_default" && hasPlatformOverride && (
                <button onClick={removePlatformOverride} className="ml-2 p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors">
                  <Trash2 className="h-3 w-3" />
                </button>
              )}
            </div>

            {/* ── Message list (list-card layout) ── */}
            <div className="flex-1 overflow-y-auto bg-muted/10">
              {/* Override banner */}
              {platformTab !== "_default" && !hasPlatformOverride && (
                <div className="mx-6 mt-4 rounded-lg border border-dashed p-3 flex items-center justify-between gap-2" style={{ borderColor: theme.accent + "40" }}>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Globe className="h-3.5 w-3.5" />
                    <span>กำลังใช้ข้อความเริ่มต้น</span>
                  </div>
                  <Button size="sm" variant="outline" onClick={createPlatformOverride} className="text-xs h-7">
                    สร้างข้อความเฉพาะ {PLATFORM_TABS.find(t => t.value === platformTab)?.label}
                  </Button>
                </div>
              )}

              <div className="px-6 py-4">
                {/* Message counter and add button */}
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-muted-foreground">ข้อความ ( {pattern.messages.length}/5 บับเบิ้ล )</span>
                  <button onClick={() => setShowTypeSelector(true)} className="text-sm font-medium text-primary hover:text-primary/80 flex items-center gap-1 transition-colors">
                    <Plus className="h-4 w-4" />เพิ่มประเภทข้อความ
                  </button>
                </div>

                {pattern.messages.length === 0 ? (
                  <div className="rounded-xl border border-dashed bg-card p-12 flex flex-col items-center justify-center text-center">
                    <Bot className="h-10 w-10 text-muted-foreground/20 mb-3" />
                    <p className="text-sm font-medium text-muted-foreground">ยังไม่มีข้อความ</p>
                    <p className="text-xs text-muted-foreground/70 mt-1">เพิ่มข้อความที่บอทจะส่งให้ลูกค้า</p>
                    <Button size="sm" className="mt-4" onClick={() => setShowTypeSelector(true)}>
                      <Plus className="h-3.5 w-3.5 mr-1.5" />เพิ่มข้อความแรก
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {pattern.messages.map((msg, idx) => (
                      <MessageCard key={idx} msg={msg} idx={idx}
                        onEdit={() => openEditMsg(idx)}
                        onDuplicate={() => duplicateMessage(idx)}
                        onDelete={() => removeMessage(idx)}
                        onMoveUp={() => moveMessage(idx, -1)}
                        onMoveDown={() => moveMessage(idx, 1)}
                        isFirst={idx === 0}
                        isLast={idx === pattern.messages.length - 1}
                      />
                    ))}
                  </div>
                )}

                {/* Quick Reply section */}
                <div className="mt-6 pt-4 border-t">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium text-muted-foreground">Quick Reply ( {(pattern.quickReplies ?? []).length}/13 บับเบิ้ล )</span>
                    <button onClick={addQuickReply} className="text-sm font-medium text-primary hover:text-primary/80 flex items-center gap-1 transition-colors">
                      <Plus className="h-4 w-4" />เพิ่ม Quick reply
                    </button>
                  </div>
                  {(pattern.quickReplies ?? []).length > 0 && (
                    <div className="space-y-2">
                      {(pattern.quickReplies ?? []).map((qr, idx) => (
                        <div key={idx} className="flex items-center gap-2 rounded-lg border bg-card p-2">
                          <Input className="h-8 text-sm flex-1 border-0 bg-transparent" value={qr.label} onChange={(e) => updateQuickReply(idx, { label: e.target.value, value: e.target.value })} placeholder="ชื่อปุ่ม Quick Reply" />
                          <button onClick={() => removeQuickReply(idx)} className="p-1.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"><Trash2 className="h-3.5 w-3.5" /></button>
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

      <Dialog open={showTypeSelector} onOpenChange={setShowTypeSelector}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>เลือกประเภทข้อความ</DialogTitle>
            <p className="text-sm text-muted-foreground">
              {platformTab !== "_default" ? `ข้อความที่รองรับบน ${PLATFORM_TABS.find(t => t.value === platformTab)?.label}` : "เลือกประเภทข้อความที่ต้องการเพิ่ม"}
            </p>
          </DialogHeader>
          <div className="grid grid-cols-3 gap-3 py-3">
            {MSG_TYPES.filter((t) => allowedMsgTypes.includes(t.value)).map((t) => {
              const Icon = t.icon;
              return (
                <button key={t.value} onClick={() => addMessage(t.value)} className="flex flex-col items-center gap-2.5 rounded-xl border p-4 hover:border-primary/30 hover:shadow-sm transition-all group">
                  <div className={cn("rounded-xl h-12 w-12 flex items-center justify-center transition-transform group-hover:scale-110", t.bg)}>
                    <Icon className={cn("h-6 w-6", t.color)} />
                  </div>
                  <span className="text-xs font-medium">{t.label}</span>
                </button>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Split-view message editor ── */}
      <Dialog open={editingMsgIdx !== null} onOpenChange={(open) => { if (!open) { setEditingMsgIdx(null); setEditingMsg(null); } }}>
        <DialogContent className="sm:max-w-5xl max-h-[85vh] p-0 overflow-hidden">
          <div className="flex h-[70vh]">
            {/* Left: Editor form */}
            <div className="flex-1 flex flex-col overflow-hidden border-r">
              <div className="px-6 py-4 border-b shrink-0">
                <DialogTitle className="flex items-center gap-2 text-base">
                  {editingMsg && (() => {
                    const conf = msgTypeConfig(editingMsg.type);
                    const Icon = conf?.icon ?? MessageSquare;
                    return <div className={cn("rounded-lg h-8 w-8 flex items-center justify-center", conf?.bg ?? "bg-muted")}><Icon className={cn("h-4 w-4", conf?.color ?? "text-muted-foreground")} /></div>;
                  })()}
                  แก้ไขประเภทข้อความ
                </DialogTitle>
                <p className="text-xs text-muted-foreground mt-1">{editingMsg ? msgTypeLabel(editingMsg.type) : ""}</p>
              </div>
              <div className="flex-1 overflow-y-auto px-6 py-4">
                {editingMsg && (
                  <div className="space-y-4">
                    {editingMsg.type === "text" && (
                      <>
                        <div className="space-y-1.5">
                          <Label className="text-xs font-medium">Text</Label>
                          <Textarea className="min-h-[160px]" value={editingMsg.text ?? ""} onChange={(e) => setEditingMsg({ ...editingMsg, text: e.target.value })} placeholder="พิมพ์ข้อความ..." />
                          <p className="text-[10px] text-muted-foreground text-right">{(editingMsg.text ?? "").length} / 1,000</p>
                        </div>
                        <ButtonEditor buttons={editingMsg.buttons ?? []} onAdd={addMsgButton} onRemove={removeMsgButton} onUpdate={updateMsgButton} />
                      </>
                    )}
                    {editingMsg.type === "image" && <div className="space-y-1.5"><Label className="text-xs font-medium">URL รูปภาพ</Label><Input value={editingMsg.imageUrl ?? ""} onChange={(e) => setEditingMsg({ ...editingMsg, imageUrl: e.target.value })} placeholder="https://..." /></div>}
                    {editingMsg.type === "card" && (
                      <>
                        <div className="space-y-1.5"><Label className="text-xs font-medium">รูปภาพ (URL)</Label><Input value={editingMsg.cardImageUrl ?? ""} onChange={(e) => setEditingMsg({ ...editingMsg, cardImageUrl: e.target.value })} placeholder="https://..." /></div>
                        <div className="space-y-1.5"><Label className="text-xs font-medium">หัวข้อ</Label><Input value={editingMsg.cardTitle ?? ""} onChange={(e) => setEditingMsg({ ...editingMsg, cardTitle: e.target.value })} /></div>
                        <div className="space-y-1.5"><Label className="text-xs font-medium">รายละเอียด</Label><Textarea value={editingMsg.cardText ?? ""} onChange={(e) => setEditingMsg({ ...editingMsg, cardText: e.target.value })} /></div>
                        <ButtonEditor buttons={editingMsg.cardButtons ?? []} onAdd={addMsgButton} onRemove={removeMsgButton} onUpdate={updateMsgButton} />
                      </>
                    )}
                    {editingMsg.type === "sticker" && (
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5"><Label className="text-xs font-medium">Package ID</Label><Input value={editingMsg.stickerPackageId ?? ""} onChange={(e) => setEditingMsg({ ...editingMsg, stickerPackageId: e.target.value })} /></div>
                        <div className="space-y-1.5"><Label className="text-xs font-medium">Sticker ID</Label><Input value={editingMsg.stickerId ?? ""} onChange={(e) => setEditingMsg({ ...editingMsg, stickerId: e.target.value })} /></div>
                      </div>
                    )}
                    {editingMsg.type === "file" && (
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5"><Label className="text-xs font-medium">URL ไฟล์</Label><Input value={editingMsg.fileUrl ?? ""} onChange={(e) => setEditingMsg({ ...editingMsg, fileUrl: e.target.value })} placeholder="https://..." /></div>
                        <div className="space-y-1.5"><Label className="text-xs font-medium">ชื่อไฟล์</Label><Input value={editingMsg.fileName ?? ""} onChange={(e) => setEditingMsg({ ...editingMsg, fileName: e.target.value })} /></div>
                      </div>
                    )}
                    {editingMsg.type === "video" && (
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5"><Label className="text-xs font-medium">URL วิดีโอ</Label><Input value={editingMsg.videoUrl ?? ""} onChange={(e) => setEditingMsg({ ...editingMsg, videoUrl: e.target.value })} placeholder="https://..." /></div>
                        <div className="space-y-1.5"><Label className="text-xs font-medium">Thumbnail URL</Label><Input value={editingMsg.thumbnailUrl ?? ""} onChange={(e) => setEditingMsg({ ...editingMsg, thumbnailUrl: e.target.value })} /></div>
                      </div>
                    )}
                  </div>
                )}
              </div>
              <div className="px-6 py-3 border-t flex items-center gap-2 shrink-0">
                <Button onClick={saveEditMsg}>Submit</Button>
                <Button variant="ghost" onClick={() => { setEditingMsgIdx(null); setEditingMsg(null); }}>Cancel</Button>
              </div>
            </div>

            {/* Right: Live preview */}
            <div className="w-[380px] shrink-0 flex flex-col overflow-hidden bg-muted/20">
              <div className="px-4 py-3 border-b flex items-center justify-between shrink-0">
                <span className="text-sm font-semibold">Example</span>
              </div>
              <div className={cn("flex-1 overflow-y-auto p-6", theme.chatBg)}>
                {editingMsg && (
                  <div className="flex items-end gap-2.5">
                    <div className={cn("h-8 w-8 rounded-full flex items-center justify-center shrink-0 mb-0.5", theme.avatarBg)}>
                      <Bot className={cn("h-4 w-4", theme.avatarColor)} />
                    </div>
                    <div className="max-w-[280px]">
                      <MessageBubble msg={editingMsg} platform={platformTab} />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showNewDialog} onOpenChange={setShowNewDialog}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>สร้างรูปแบบตอบกลับใหม่</DialogTitle>
            <p className="text-sm text-muted-foreground">ตั้งชื่อรูปแบบเพื่อจัดการได้ง่าย</p>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <Label className="text-xs font-medium">ชื่อรูปแบบ</Label>
            <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="เช่น ทักทายลูกค้า" autoFocus onKeyDown={(e) => { if (e.key === "Enter") handleCreatePattern(); }} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewDialog(false)}>ยกเลิก</Button>
            <Button onClick={handleCreatePattern} disabled={!newName.trim()}>สร้าง</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
    </TooltipProvider>
  );
}

// ─── MessageCard (list-card layout) ───────────────────────────────────────────

function MessageCard({ msg, idx, onEdit, onDuplicate, onDelete, onMoveUp, onMoveDown, isFirst, isLast }: {
  msg: AutoReplyMessage; idx: number;
  onEdit: () => void; onDuplicate: () => void; onDelete: () => void;
  onMoveUp: () => void; onMoveDown: () => void;
  isFirst: boolean; isLast: boolean;
}) {
  const conf = msgTypeConfig(msg.type);

  return (
    <div className="rounded-xl border bg-card overflow-hidden hover:shadow-sm transition-shadow">
      <div className="flex">
        {/* Content area */}
        <div className="flex-1 min-w-0 p-4 cursor-pointer" onClick={onEdit}>
          {msg.type === "text" && (
            <div>
              <p className="text-sm whitespace-pre-wrap leading-relaxed line-clamp-6">{msg.text || <span className="text-muted-foreground italic">คลิกเพื่อเพิ่มข้อความ...</span>}</p>
              {msg.buttons && msg.buttons.length > 0 && (
                <div className="mt-3 space-y-1.5">
                  {msg.buttons.map((btn, bi) => (
                    <div key={bi} className="rounded-lg border text-center text-sm font-medium py-2 px-3 text-primary">{btn.label || "ปุ่ม"}</div>
                  ))}
                </div>
              )}
            </div>
          )}
          {msg.type === "image" && (
            msg.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={msg.imageUrl} alt="" className="w-full max-h-40 object-cover rounded-lg" />
            ) : (
              <div className="h-24 rounded-lg bg-muted/30 flex items-center justify-center"><Image className="h-8 w-8 text-muted-foreground/20" /></div>
            )
          )}
          {msg.type === "card" && (
            <div className="flex gap-3">
              {msg.cardImageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={msg.cardImageUrl} alt="" className="w-24 h-24 rounded-lg object-cover shrink-0" />
              ) : (
                <div className="w-24 h-24 rounded-lg bg-muted/30 flex items-center justify-center shrink-0"><Image className="h-6 w-6 text-muted-foreground/20" /></div>
              )}
              <div className="min-w-0">
                <p className="font-semibold text-sm">{msg.cardTitle || "หัวข้อการ์ด"}</p>
                {msg.cardText && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{msg.cardText}</p>}
                {msg.cardButtons && msg.cardButtons.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {msg.cardButtons.map((btn, bi) => (
                      <span key={bi} className="text-[10px] font-medium text-primary bg-primary/8 rounded px-1.5 py-0.5">{btn.label || "ปุ่ม"}</span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
          {msg.type === "sticker" && (
            <div className="flex items-center gap-3"><Smile className="h-12 w-12 text-amber-400" /><span className="text-sm text-muted-foreground">สติ๊กเกอร์</span></div>
          )}
          {msg.type === "file" && (
            <div className="flex items-center gap-3">
              <div className={cn("rounded-lg h-10 w-10 flex items-center justify-center shrink-0", conf?.bg ?? "bg-muted")}><FileText className={cn("h-4.5 w-4.5", conf?.color ?? "text-muted-foreground")} /></div>
              <div className="min-w-0"><p className="text-sm font-medium truncate">{msg.fileName || "ไฟล์แนบ"}</p><p className="text-[11px] text-muted-foreground truncate">{msg.fileUrl || "ยังไม่ได้ตั้งค่า"}</p></div>
            </div>
          )}
          {msg.type === "video" && (
            <div className="flex items-center gap-3">
              <div className={cn("rounded-lg h-10 w-10 flex items-center justify-center shrink-0", conf?.bg ?? "bg-muted")}><Video className={cn("h-4.5 w-4.5", conf?.color ?? "text-muted-foreground")} /></div>
              <div className="min-w-0"><p className="text-sm font-medium">วิดีโอ</p><p className="text-[11px] text-muted-foreground truncate">{msg.videoUrl || "ยังไม่ได้ตั้งค่า"}</p></div>
            </div>
          )}
        </div>

        {/* Actions column */}
        <div className="flex flex-col items-center justify-center gap-0.5 px-2 border-l bg-muted/20 shrink-0">
          <button onClick={onDuplicate} className="p-1.5 rounded-md hover:bg-background text-muted-foreground hover:text-foreground transition-colors"><Copy className="h-3.5 w-3.5" /></button>
          <button onClick={onEdit} className="p-1.5 rounded-md hover:bg-background text-muted-foreground hover:text-foreground transition-colors"><Pencil className="h-3.5 w-3.5" /></button>
          <button onClick={onDelete} className="p-1.5 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"><Trash2 className="h-3.5 w-3.5" /></button>
          {!isFirst && <button onClick={onMoveUp} className="p-1.5 rounded-md hover:bg-background text-muted-foreground hover:text-foreground transition-colors"><ChevronUp className="h-3.5 w-3.5" /></button>}
          {!isLast && <button onClick={onMoveDown} className="p-1.5 rounded-md hover:bg-background text-muted-foreground hover:text-foreground transition-colors"><ChevronDown className="h-3.5 w-3.5" /></button>}
        </div>
      </div>
    </div>
  );
}

// ─── MessageBubble (for preview) ──────────────────────────────────────────────

function MessageBubble({ msg, platform }: { msg: AutoReplyMessage; platform: PlatformKey }) {
  const isLine = platform === "line";
  const isFb = platform === "facebook";
  const isIg = platform === "instagram";
  const isSocial = isFb || isIg;
  const btnColor = isFb ? "text-[#0084FF]" : isIg ? "text-[#0095F6]" : "";
  const dividerColor = isFb ? "border-[#E4E6EB]" : "border-[#DBDBDB]";
  const socialBubbleBg = isFb ? "bg-[#E4E6EB] dark:bg-[#3A3B3C]" : "bg-[#EFEFEF] dark:bg-[#3A3B3C]";
  const maxW = 280;
  const emptyText = <span className="text-gray-400 italic text-sm">ข้อความ...</span>;

  if (msg.type === "text") {
    const hasButtons = !!(msg.buttons?.length);
    if (isLine && hasButtons) {
      return (
        <div className="rounded-xl bg-white shadow-sm overflow-hidden" style={{ maxWidth: maxW }}>
          <div className="p-3"><p className="text-sm text-gray-900 whitespace-pre-wrap">{msg.text || emptyText}</p></div>
          <div className="px-3 pb-3 space-y-1.5">{msg.buttons!.map((btn, i) => <div key={i} className="w-full rounded-lg bg-[#06C755] text-white text-center text-sm font-semibold py-2">{btn.label || "ปุ่ม"}</div>)}</div>
        </div>
      );
    }
    if (isSocial && hasButtons) {
      return (
        <div style={{ maxWidth: maxW }}>
          <div className={cn("rounded-2xl rounded-bl-md px-3 py-2.5", socialBubbleBg)}><p className="text-sm text-gray-900 dark:text-gray-100 whitespace-pre-wrap">{msg.text || emptyText}</p></div>
          <div className={cn("mt-1 rounded-xl border bg-white dark:bg-gray-900 overflow-hidden", dividerColor)}>
            {msg.buttons!.map((btn, i) => <div key={i} className={cn("border-t first:border-t-0 text-center py-2 text-sm font-medium", dividerColor, btnColor)}>{btn.label || "ปุ่ม"}</div>)}
          </div>
        </div>
      );
    }
    if (isLine) return <div className="rounded-2xl bg-white shadow-sm px-3 py-2.5 overflow-hidden" style={{ maxWidth: maxW }}><p className="text-sm text-gray-900 whitespace-pre-wrap">{msg.text || emptyText}</p></div>;
    if (isSocial) return <div className={cn("rounded-2xl rounded-bl-md px-3 py-2.5 overflow-hidden", socialBubbleBg)} style={{ maxWidth: maxW }}><p className="text-sm text-gray-900 dark:text-gray-100 whitespace-pre-wrap">{msg.text || emptyText}</p></div>;
    return (
      <div className="rounded-2xl rounded-bl-md bg-card border shadow-sm px-3 py-2.5 overflow-hidden" style={{ maxWidth: maxW }}>
        <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.text || <span className="text-muted-foreground italic">ข้อความ...</span>}</p>
        {hasButtons && <div className="mt-2 space-y-1.5 border-t pt-2">{msg.buttons!.map((btn, bi) => <div key={bi} className="w-full rounded-lg bg-primary text-primary-foreground text-center text-xs font-semibold py-2">{btn.label || "ปุ่ม"}</div>)}</div>}
      </div>
    );
  }

  if (msg.type === "image") {
    const wrapper = isLine ? "rounded-2xl bg-white shadow-sm overflow-hidden" : isSocial ? "rounded-2xl overflow-hidden" : "rounded-2xl rounded-bl-md bg-card border shadow-sm overflow-hidden";
    return (
      <div className={wrapper} style={{ maxWidth: maxW }}>
        {msg.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={msg.imageUrl} alt="" className="w-full max-h-44 object-cover" />
        ) : (
          <div className="p-6 flex flex-col items-center justify-center bg-muted/20"><Image className="h-8 w-8 text-muted-foreground/25 mb-1" /><span className="text-xs text-muted-foreground">รูปภาพ</span></div>
        )}
      </div>
    );
  }

  if (msg.type === "card") {
    const hasImage = !!msg.cardImageUrl;
    const hasButtons = !!(msg.cardButtons?.length);
    if (isLine) {
      return (
        <div className="rounded-xl bg-white shadow-sm overflow-hidden" style={{ maxWidth: maxW }}>
          {hasImage ? <img src={msg.cardImageUrl} alt="" className="w-full object-cover" style={{ aspectRatio: "20/13" }} /> : <div className="w-full bg-gray-100 flex items-center justify-center" style={{ aspectRatio: "20/13" }}><Image className="h-6 w-6 text-gray-300" /></div>}
          <div className="p-3 space-y-0.5"><p className="font-bold text-sm text-gray-900">{msg.cardTitle || "หัวข้อ"}</p>{msg.cardText && <p className="text-xs text-gray-600">{msg.cardText}</p>}</div>
          {hasButtons && <div className="px-3 pb-3 space-y-1.5">{msg.cardButtons!.map((btn, i) => <div key={i} className="w-full rounded-lg bg-[#06C755] text-white text-center text-sm font-semibold py-2">{btn.label || "ปุ่ม"}</div>)}</div>}
        </div>
      );
    }
    if (isSocial) {
      const cardBorder = isFb ? "border-[#E4E6EB]" : "border-[#DBDBDB]";
      return (
        <div className={cn("rounded-xl border bg-white dark:bg-gray-900 overflow-hidden", cardBorder)} style={{ maxWidth: maxW }}>
          {hasImage ? <img src={msg.cardImageUrl} alt="" className="w-full object-cover" style={{ aspectRatio: "1.91/1" }} /> : <div className="w-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center" style={{ aspectRatio: "1.91/1" }}><Image className="h-6 w-6 text-gray-300" /></div>}
          <div className="px-3 pt-2.5 pb-2"><p className="font-bold text-sm">{msg.cardTitle || "หัวข้อ"}</p>{msg.cardText && <p className="text-xs text-gray-500 mt-0.5">{msg.cardText}</p>}</div>
          {hasButtons && msg.cardButtons!.map((btn, i) => <div key={i} className={cn("border-t text-center py-2 text-sm font-medium", cardBorder, btnColor)}>{btn.label || "ปุ่ม"}</div>)}
        </div>
      );
    }
    return (
      <div className="rounded-2xl rounded-bl-md bg-card border shadow-sm overflow-hidden" style={{ maxWidth: maxW }}>
        {hasImage ? <img src={msg.cardImageUrl} alt="" className="w-full h-32 object-cover" /> : <div className="w-full h-24 bg-muted/20 flex items-center justify-center"><Image className="h-6 w-6 text-muted-foreground/25" /></div>}
        <div className="px-3 py-2.5 space-y-1"><p className="font-bold text-sm">{msg.cardTitle || "หัวข้อ"}</p>{msg.cardText && <p className="text-xs text-muted-foreground">{msg.cardText}</p>}
          {hasButtons && <div className="pt-1.5 space-y-1">{msg.cardButtons!.map((btn, bi) => <div key={bi} className="w-full rounded-lg bg-primary text-primary-foreground text-center text-xs font-semibold py-1.5">{btn.label || "ปุ่ม"}</div>)}</div>}
        </div>
      </div>
    );
  }

  if (msg.type === "sticker") {
    const wrapper = isLine ? "rounded-2xl bg-white shadow-sm" : "rounded-2xl rounded-bl-md bg-card border shadow-sm";
    return <div className={cn("p-4 flex items-center justify-center", wrapper)} style={{ maxWidth: maxW }}><Smile className="h-14 w-14 text-amber-400" /></div>;
  }

  if (msg.type === "file") {
    const conf = msgTypeConfig("file");
    const wrapper = isLine ? "rounded-2xl bg-white shadow-sm" : "rounded-2xl rounded-bl-md bg-card border shadow-sm";
    return <div className={cn("p-3 flex items-center gap-3", wrapper)} style={{ maxWidth: maxW }}><div className={cn("rounded-lg h-9 w-9 flex items-center justify-center shrink-0", conf?.bg ?? "bg-muted")}><FileText className={cn("h-4 w-4", conf?.color ?? "text-muted-foreground")} /></div><div className="min-w-0"><p className="text-sm font-medium truncate">{msg.fileName || "ไฟล์"}</p></div></div>;
  }

  if (msg.type === "video") {
    const conf = msgTypeConfig("video");
    const wrapper = isLine ? "rounded-2xl bg-white shadow-sm" : "rounded-2xl rounded-bl-md bg-card border shadow-sm";
    return <div className={cn("p-3 flex items-center gap-3", wrapper)} style={{ maxWidth: maxW }}><div className={cn("rounded-lg h-9 w-9 flex items-center justify-center shrink-0", conf?.bg ?? "bg-muted")}><Video className={cn("h-4 w-4", conf?.color ?? "text-muted-foreground")} /></div><div className="min-w-0"><p className="text-sm font-medium">วิดีโอ</p></div></div>;
  }

  return null;
}

// ─── ButtonEditor ─────────────────────────────────────────────────────────────

function ButtonEditor({ buttons, onAdd, onRemove, onUpdate }: {
  buttons: RichButton[]; onAdd: () => void; onRemove: (idx: number) => void; onUpdate: (idx: number, patch: Partial<RichButton>) => void;
}) {
  return (
    <div className="space-y-3 rounded-xl bg-muted/30 p-4">
      <div className="flex items-center justify-between">
        <Label className="text-xs font-medium">ปุ่มกด ({buttons.length}/3)</Label>
        <Button variant="outline" size="xs" onClick={onAdd} disabled={buttons.length >= 3}><Plus className="h-3.5 w-3.5 mr-1" />Add Button</Button>
      </div>
      {buttons.length === 0 && <p className="text-xs text-muted-foreground text-center py-2">ยังไม่มีปุ่ม</p>}
      {buttons.map((btn, i) => (
        <div key={i} className="flex gap-2 items-center rounded-lg bg-background border p-2">
          <Input className="h-8 text-xs flex-1 border-0 bg-transparent" placeholder="ชื่อปุ่ม" value={btn.label} onChange={(e) => onUpdate(i, { label: e.target.value })} />
          <Select value={btn.action} onValueChange={(v) => onUpdate(i, { action: (v ?? "message") as RichButton["action"] })}>
            <SelectTrigger className="h-8 text-xs w-24 border-0 bg-muted/50"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="message">ข้อความ</SelectItem>
              <SelectItem value="postback">Postback</SelectItem>
              <SelectItem value="url">URL</SelectItem>
            </SelectContent>
          </Select>
          <Input className="h-8 text-xs flex-1 border-0 bg-transparent" placeholder="ค่า" value={btn.value} onChange={(e) => onUpdate(i, { value: e.target.value })} />
          <Button variant="ghost" size="icon-sm" className="shrink-0 text-destructive/70 hover:text-destructive hover:bg-destructive/10" onClick={() => onRemove(i)}><Trash2 className="h-3.5 w-3.5" /></Button>
        </div>
      ))}
    </div>
  );
}
