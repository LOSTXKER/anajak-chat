"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import {
  Plus, Trash2, Loader2, Power, PowerOff, ChevronUp, ChevronDown, ChevronRight,
  MessageSquare, Image, FileText, Video, Smile, CreditCard,
  Pencil, X, Search, Check, Zap, Hash, Bot,
  Globe, FolderOpen, Copy, Clock,
  Settings2, Activity,
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
import { TooltipProvider } from "@/components/ui/tooltip";
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
  _count?: { sessions: number };
}

interface ActivityEntry {
  id: string; status: string; startedAt: string; completedAt: string | null;
  conversation: { id: string; contact: { displayName: string | null; platform: string }; channel: { name: string } };
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

const TRIGGER_LABELS: Record<string, string> = { first_message: "ข้อความแรก", keyword: "คีย์เวิร์ด", postback: "Postback" };

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

function formatRelativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "เมื่อสักครู่";
  if (mins < 60) return `${mins} นาทีที่แล้ว`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} ชม.ที่แล้ว`;
  const days = Math.floor(hrs / 24);
  return `${days} วันที่แล้ว`;
}

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
  const [triggerOpen, setTriggerOpen] = useState(false);

  const [showTypeSelector, setShowTypeSelector] = useState(false);
  const [editingMsgIdx, setEditingMsgIdx] = useState<number | null>(null);
  const [editingMsg, setEditingMsg] = useState<AutoReplyMessage | null>(null);
  const [keywordInput, setKeywordInput] = useState("");
  const [testQuery, setTestQuery] = useState("");
  const [testResult, setTestResult] = useState<null | { matched: boolean; keyword?: string }>(null);

  // Wizard
  const [wizardOpen, setWizardOpen] = useState(false);
  const [wizardStep, setWizardStep] = useState(0);
  const [wizardName, setWizardName] = useState("");
  const [wizardTriggerType, setWizardTriggerType] = useState<FlowTrigger["type"]>("keyword");
  const [wizardKeywords, setWizardKeywords] = useState<string[]>([]);
  const [wizardKeywordInput, setWizardKeywordInput] = useState("");
  const [wizardPostbackData, setWizardPostbackData] = useState("");

  // Activity
  const [activityLog, setActivityLog] = useState<ActivityEntry[]>([]);
  const [activityLoading, setActivityLoading] = useState(false);

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

  const fetchActivity = useCallback(async (flowId: string) => {
    setActivityLoading(true);
    try {
      const res = await fetch(`/api/chat-flows/${flowId}/activity`);
      if (res.ok) setActivityLog(await res.json());
    } finally { setActivityLoading(false); }
  }, []);

  useEffect(() => { if (selectedId) fetchActivity(selectedId); }, [selectedId, fetchActivity]);

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
    setCollapsedGroups((prev) => { const next = new Set(prev); if (next.has(group)) next.delete(group); else next.add(group); return next; });
  }

  function updateSelected(patch: Partial<ChatFlow>) {
    if (!selectedId) return;
    setFlows((prev) => prev.map((f) => (f.id === selectedId ? { ...f, ...patch } : f)));
  }
  function updatePlatformSteps(newSteps: PlatformSteps) { updateSelected({ steps: newSteps }); }
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
    updatePlatformSteps({ ...platformSteps, [platformTab]: JSON.parse(JSON.stringify(platformSteps._default)) as AutoReplyPattern });
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
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: selected.name, description: selected.description, trigger: selected.trigger, steps: platformSteps }),
      });
      if (res.ok) toast({ title: "บันทึกแล้ว" });
      else toast({ title: "บันทึกไม่สำเร็จ", variant: "destructive" });
    } finally { setSaving(false); }
  }

  async function handleWizardCreate() {
    if (!wizardName.trim()) return;
    const trigger: FlowTrigger = { type: wizardTriggerType };
    if (wizardTriggerType === "keyword") trigger.keywords = wizardKeywords.length > 0 ? wizardKeywords : [wizardName];
    if (wizardTriggerType === "postback") trigger.data = wizardPostbackData;
    const res = await fetch("/api/chat-flows", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: wizardName, trigger, steps: { _default: { messages: [], quickReplies: [] }, assignToHuman: false } }),
    });
    if (res.ok) {
      const flow = (await res.json()) as ChatFlow;
      setFlows((prev) => [{ ...flow, steps: normalizePlatformSteps(flow.steps) }, ...prev]);
      setSelectedId(flow.id);
      setWizardOpen(false);
      resetWizard();
      await fetch(`/api/chat-flows/${flow.id}/toggle`, { method: "POST" });
      setFlows((prev) => prev.map((f) => (f.id === flow.id ? { ...f, isActive: true } : f)));
      toast({ title: "สร้างและเปิดใช้งานแล้ว" });
    }
  }

  function resetWizard() { setWizardStep(0); setWizardName(""); setWizardTriggerType("keyword"); setWizardKeywords([]); setWizardKeywordInput(""); setWizardPostbackData(""); }
  function openWizard() { resetWizard(); setWizardOpen(true); }

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
    const msgs = [...pattern.messages]; msgs.splice(idx + 1, 0, copy);
    updatePattern({ messages: msgs });
  }
  function removeMessage(idx: number) { updatePattern({ messages: pattern.messages.filter((_, i) => i !== idx) }); }
  function moveMessage(idx: number, dir: -1 | 1) {
    const msgs = [...pattern.messages]; const target = idx + dir;
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

  function addKeyword(kw: string) {
    const trimmed = kw.trim();
    if (!trimmed || !selected) return;
    const current = selected.trigger.keywords ?? [];
    if (current.includes(trimmed)) return;
    updateSelected({ trigger: { ...selected.trigger, keywords: [...current, trimmed] } });
    setKeywordInput("");
  }
  function removeKeyword(kw: string) {
    if (!selected) return;
    updateSelected({ trigger: { ...selected.trigger, keywords: (selected.trigger.keywords ?? []).filter((k) => k !== kw) } });
  }
  function runTriggerTest() {
    if (!selected || !testQuery.trim()) { setTestResult(null); return; }
    const trigger = selected.trigger;
    if (trigger.type === "keyword") {
      const match = (trigger.keywords ?? []).find((kw) => testQuery.toLowerCase().includes(kw.toLowerCase()));
      setTestResult(match ? { matched: true, keyword: match } : { matched: false });
    } else if (trigger.type === "first_message") { setTestResult({ matched: true }); }
    else if (trigger.type === "postback") { setTestResult({ matched: testQuery === trigger.data }); }
    else { setTestResult({ matched: false }); }
  }

  function triggerSummaryText(trigger: FlowTrigger): string {
    if (trigger.type === "keyword") {
      const kws = trigger.keywords ?? [];
      if (kws.length === 0) return "ยังไม่มีคีย์เวิร์ด";
      return kws.slice(0, 3).join(", ") + (kws.length > 3 ? ` +${kws.length - 3} อื่นๆ` : "");
    }
    if (trigger.type === "first_message") return "ตอบข้อความแรกจากลูกค้า";
    if (trigger.type === "postback") return trigger.data || "ยังไม่ระบุ postback data";
    return "";
  }

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <TooltipProvider>
    <div className="flex h-full overflow-hidden">
      {/* ─── Left Panel ─── */}
      <div className="flex h-full w-[320px] shrink-0 flex-col border-r bg-card">
        <div className="px-4 py-4 border-b space-y-3">
          <h1 className="text-lg font-bold">ตอบกลับอัตโนมัติ</h1>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input className="pl-9 h-10" placeholder="ค้นหา Flow..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto scrollbar-thin">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              <p className="text-muted-foreground">กำลังโหลด...</p>
            </div>
          ) : Object.keys(groupedFlows).length === 0 ? (
            <EmptyState icon={MessageSquare} message={searchQuery ? "ไม่พบ" : "ยังไม่มี Flow"} className="px-4 py-16" />
          ) : (
            <div className="py-1">
              {Object.entries(groupedFlows).map(([group, gFlows]) => {
                const isCollapsed = collapsedGroups.has(group);
                return (
                  <div key={group}>
                    <button onClick={() => toggleGroup(group)} className="w-full flex items-center gap-2 px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-muted-foreground/70 hover:bg-muted/50 transition-colors">
                      {isCollapsed ? <ChevronRight className="h-4 w-4 shrink-0" /> : <ChevronDown className="h-4 w-4 shrink-0" />}
                      <FolderOpen className="h-4 w-4 shrink-0" />
                      <span className="truncate">{group}</span>
                      <span className="ml-auto text-xs text-muted-foreground/50 tabular-nums">{gFlows.length}</span>
                    </button>
                    {!isCollapsed && (
                      <div className="space-y-0.5 px-2">
                        {gFlows.map((flow) => {
                          const isSelected = selectedId === flow.id;
                          const msgCount = flow.steps._default?.messages?.length ?? 0;
                          const sessionCount = flow._count?.sessions ?? 0;
                          return (
                            <div key={flow.id} role="button" tabIndex={0} onClick={() => setSelectedId(flow.id)} onKeyDown={(e) => { if (e.key === "Enter") setSelectedId(flow.id); }}
                              className={cn("rounded-xl px-3 py-3 cursor-pointer transition-all group", isSelected ? "bg-primary/8 ring-1 ring-primary/20" : "hover:bg-muted/60")}>
                              <div className="flex items-center gap-2.5">
                                <span className={cn("h-2.5 w-2.5 rounded-full shrink-0 ring-2", flow.isActive ? "bg-emerald-500 ring-emerald-500/20" : "bg-muted-foreground/30 ring-muted-foreground/10")} />
                                <span className={cn("flex-1 truncate font-medium", isSelected ? "text-primary" : "")}>{flow.name}</span>
                                <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                                  <button onClick={(e) => { e.stopPropagation(); handleToggle(flow.id); }} className="p-1.5 rounded-lg hover:bg-background"><Power className={cn("h-3.5 w-3.5", flow.isActive ? "text-emerald-500" : "text-muted-foreground")} /></button>
                                  <button onClick={(e) => { e.stopPropagation(); handleDeletePattern(flow.id); }} className="p-1.5 rounded-lg hover:bg-destructive/10"><Trash2 className="h-3.5 w-3.5 text-destructive/60" /></button>
                                </div>
                              </div>
                              <div className="flex items-center gap-2 mt-1.5 pl-5">
                                <span className={cn("text-xs font-medium rounded-md px-2 py-0.5", flow.trigger.type === "keyword" ? "bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400" : flow.trigger.type === "first_message" ? "bg-green-50 text-green-600 dark:bg-green-950/40 dark:text-green-400" : "bg-orange-50 text-orange-600 dark:bg-orange-950/40 dark:text-orange-400")}>
                                  {TRIGGER_LABELS[flow.trigger.type]}
                                </span>
                                {flow.trigger.type === "keyword" && (flow.trigger.keywords ?? []).length > 0 && (
                                  <span className="text-xs text-muted-foreground truncate max-w-[100px]">
                                    {(flow.trigger.keywords ?? []).slice(0, 2).join(", ")}
                                  </span>
                                )}
                                <span className="ml-auto text-xs text-muted-foreground/50 tabular-nums shrink-0">
                                  {msgCount} msg{sessionCount > 0 && <span className="text-emerald-500/70"> · {sessionCount}x</span>}
                                </span>
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
          <Button variant="outline" className="w-full h-10 justify-center gap-2 text-primary font-medium" onClick={openWizard}>
            <Plus className="h-4 w-4" />สร้าง Flow ใหม่
          </Button>
        </div>
      </div>

      {/* ─── Right Panel ─── */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {!selected ? (
          <EmptyState icon={Bot} message="เลือก Flow เพื่อแก้ไข" description="เลือกจากรายการทางซ้าย หรือสร้าง Flow ใหม่"
            action={<Button onClick={openWizard} className="h-10"><Plus className="h-4 w-4 mr-2" />สร้าง Flow ใหม่</Button>}
            className="h-full" />
        ) : (
          <>
            {/* Inactive banner */}
            {!selected.isActive && (
              <div className="bg-amber-50 dark:bg-amber-950/30 border-b border-amber-200 dark:border-amber-800/50 px-6 py-3 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3 text-amber-700 dark:text-amber-400">
                  <PowerOff className="h-5 w-5" />
                  <div>
                    <p className="font-medium">Flow นี้ยังไม่ได้เปิดใช้งาน</p>
                    <p className="text-sm opacity-70">ลูกค้าจะยังไม่ได้รับข้อความตอบกลับ</p>
                  </div>
                </div>
                <Button size="sm" className="bg-amber-600 hover:bg-amber-700 text-white h-9 px-4" onClick={() => handleToggle(selected.id)}>
                  <Power className="h-4 w-4 mr-2" />เปิดใช้งาน
                </Button>
              </div>
            )}

            {/* Header bar */}
            <div className="border-b bg-card px-6 py-4 shrink-0">
              <div className="flex items-center gap-4">
                <Input value={selected.name} onChange={(e) => updateSelected({ name: e.target.value })} className="h-10 font-semibold border bg-background rounded-xl px-4 max-w-[280px] text-base" placeholder="ชื่อ Flow..." />

                {/* Compact trigger summary */}
                <button onClick={() => setTriggerOpen(!triggerOpen)}
                  className={cn("flex items-center gap-2.5 rounded-xl border px-4 py-2.5 transition-all", triggerOpen ? "bg-primary/5 border-primary/20" : "hover:bg-muted/50")}>
                  <Settings2 className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span className="text-sm font-medium">{TRIGGER_LABELS[selected.trigger.type]}</span>
                  <span className="text-sm text-muted-foreground max-w-[220px] truncate">{triggerSummaryText(selected.trigger)}</span>
                  <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform", triggerOpen && "rotate-180")} />
                </button>

                <div className="flex-1" />

                <label className="flex items-center gap-2.5 cursor-pointer">
                  <Switch checked={platformSteps.assignToHuman ?? false} onCheckedChange={(c) => updatePlatformSteps({ ...platformSteps, assignToHuman: c })} />
                  <span className="text-sm text-muted-foreground whitespace-nowrap">ส่งต่อแอดมิน</span>
                </label>
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <Switch checked={selected.isActive} onCheckedChange={() => handleToggle(selected.id)} />
                  <span className={cn("text-sm font-medium whitespace-nowrap", selected.isActive ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground")}>{selected.isActive ? "เปิด" : "ปิด"}</span>
                </label>
                <Button onClick={saveSelected} disabled={saving} className="h-10 px-5">
                  {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Check className="h-4 w-4 mr-2" />}บันทึก
                </Button>
              </div>
            </div>

            {/* Expanded trigger config */}
            {triggerOpen && (
              <div className="border-b bg-muted/10 px-6 py-5 shrink-0">
                <div className="max-w-2xl space-y-4">
                  <div className="flex items-center gap-1.5 rounded-xl border bg-background p-1.5">
                    {([
                      { value: "keyword" as const, label: "คีย์เวิร์ด", icon: Hash },
                      { value: "first_message" as const, label: "ข้อความแรก", icon: MessageSquare },
                      { value: "postback" as const, label: "กดปุ่ม (Postback)", icon: Zap },
                    ]).map((opt) => {
                      const Icon = opt.icon;
                      const active = selected.trigger.type === opt.value;
                      return (
                        <button key={opt.value} onClick={() => updateSelected({ trigger: { ...selected.trigger, type: opt.value } })}
                          className={cn("flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-colors flex-1 justify-center", active ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground hover:bg-muted/50")}>
                          <Icon className="h-4 w-4" />{opt.label}
                        </button>
                      );
                    })}
                  </div>

                  {selected.trigger.type === "keyword" && (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Input value={keywordInput} onChange={(e) => setKeywordInput(e.target.value)} placeholder="พิมพ์คีย์เวิร์ดแล้วกด Enter" className="h-10 flex-1"
                          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addKeyword(keywordInput); } }} />
                        <Button variant="outline" onClick={() => addKeyword(keywordInput)} disabled={!keywordInput.trim()} className="h-10">
                          <Plus className="h-4 w-4 mr-1.5" />เพิ่ม
                        </Button>
                      </div>
                      {(selected.trigger.keywords ?? []).length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {(selected.trigger.keywords ?? []).map((kw) => (
                            <span key={kw} className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 text-primary pl-4 pr-2 py-1.5 font-medium">
                              {kw}<button onClick={() => removeKeyword(kw)} className="p-1 rounded-full hover:bg-primary/20"><X className="h-3.5 w-3.5" /></button>
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">เพิ่มคีย์เวิร์ดที่จะจับคู่กับข้อความของลูกค้า</p>
                      )}
                    </div>
                  )}
                  {selected.trigger.type === "first_message" && (
                    <div className="rounded-xl bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800/30 p-4">
                      <p className="text-blue-700 dark:text-blue-400">Flow จะทำงานเมื่อลูกค้าส่งข้อความแรกเข้ามาในแชท</p>
                      <p className="text-sm text-blue-600/70 dark:text-blue-400/60 mt-1">เหมาะสำหรับข้อความต้อนรับหรือเมนูหลัก</p>
                    </div>
                  )}
                  {selected.trigger.type === "postback" && (
                    <div className="space-y-2">
                      <Label>Postback Data</Label>
                      <Input value={selected.trigger.data ?? ""} onChange={(e) => updateSelected({ trigger: { ...selected.trigger, data: e.target.value } })} placeholder="เช่น action=menu" className="h-10" />
                      <p className="text-sm text-muted-foreground">ค่า data ที่ส่งมาเมื่อลูกค้ากดปุ่ม</p>
                    </div>
                  )}

                  {/* Test panel */}
                  <div className="pt-3 border-t flex items-center gap-3">
                    <span className="text-sm font-medium text-muted-foreground shrink-0">ทดสอบ:</span>
                    <Input value={testQuery} onChange={(e) => { setTestQuery(e.target.value); setTestResult(null); }} placeholder="พิมพ์ข้อความทดสอบ..." className="h-10 flex-1"
                      onKeyDown={(e) => { if (e.key === "Enter") runTriggerTest(); }} />
                    <Button variant="outline" onClick={runTriggerTest} disabled={!testQuery.trim()} className="h-10">ทดสอบ</Button>
                    {testResult !== null && (
                      <span className={cn("text-sm font-medium flex items-center gap-1.5", testResult.matched ? "text-emerald-600" : "text-red-500")}>
                        {testResult.matched ? <><Check className="h-4 w-4" />ตรง{testResult.keyword && ` (${testResult.keyword})`}</> : <><X className="h-4 w-4" />ไม่ตรง</>}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Platform tabs */}
            <div className="border-b bg-card px-6 flex items-center shrink-0">
              {PLATFORM_TABS.map((tab) => {
                const isActive = platformTab === tab.value;
                const hasOvr = !!platformSteps[tab.value];
                return (
                  <button key={tab.value} onClick={() => setPlatformTab(tab.value)}
                    className={cn("flex items-center gap-2.5 px-5 py-3 font-medium border-b-2 transition-colors -mb-px", isActive ? "border-current" : "border-transparent text-muted-foreground hover:text-foreground")}
                    style={isActive ? { color: tab.color } : undefined}>
                    <span className="h-3 w-3 rounded-full shrink-0" style={{ backgroundColor: tab.color }} />
                    {tab.label}
                    {hasOvr && !isActive && <span className="h-2 w-2 rounded-full bg-current opacity-40" />}
                  </button>
                );
              })}
              {platformTab !== "_default" && hasPlatformOverride && (
                <button onClick={removePlatformOverride} className="ml-2 p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"><Trash2 className="h-4 w-4" /></button>
              )}
            </div>

            {/* Message list */}
            <div className="flex-1 overflow-y-auto bg-muted/10 scrollbar-thin">
              {platformTab !== "_default" && !hasPlatformOverride && (
                <div className="mx-6 mt-5 rounded-xl border border-dashed p-4 flex items-center justify-between gap-3" style={{ borderColor: theme.accent + "40" }}>
                  <div className="flex items-center gap-2.5 text-muted-foreground"><Globe className="h-4 w-4" /><span>กำลังใช้ข้อความเริ่มต้น</span></div>
                  <Button variant="outline" onClick={createPlatformOverride} className="h-9">สร้างข้อความเฉพาะ {PLATFORM_TABS.find(t => t.value === platformTab)?.label}</Button>
                </div>
              )}

              <div className="px-6 py-5">
                <div className="flex items-center justify-between mb-4">
                  <span className="font-medium text-muted-foreground">ข้อความ ({pattern.messages.length}/5 บับเบิ้ล)</span>
                  <Button variant="ghost" onClick={() => setShowTypeSelector(true)} className="text-primary font-medium">
                    <Plus className="h-4 w-4 mr-1.5" />เพิ่มข้อความ
                  </Button>
                </div>

                {pattern.messages.length === 0 ? (
                  <div className="rounded-2xl border-2 border-dashed bg-card p-16 flex flex-col items-center justify-center text-center">
                    <Bot className="h-12 w-12 text-muted-foreground/15 mb-4" />
                    <p className="font-medium text-muted-foreground text-lg">ยังไม่มีข้อความ</p>
                    <p className="text-muted-foreground mt-1">เพิ่มข้อความที่บอทจะส่งให้ลูกค้า</p>
                    <Button className="mt-5 h-10" onClick={() => setShowTypeSelector(true)}><Plus className="h-4 w-4 mr-2" />เพิ่มข้อความแรก</Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {pattern.messages.map((msg, idx) => (
                      <MessageCard key={idx} msg={msg} num={idx + 1}
                        onEdit={() => openEditMsg(idx)} onDuplicate={() => duplicateMessage(idx)} onDelete={() => removeMessage(idx)}
                        onMoveUp={() => moveMessage(idx, -1)} onMoveDown={() => moveMessage(idx, 1)}
                        isFirst={idx === 0} isLast={idx === pattern.messages.length - 1} />
                    ))}
                  </div>
                )}

                {/* Quick Replies */}
                <div className="mt-8 pt-5 border-t">
                  <div className="flex items-center justify-between mb-4">
                    <span className="font-medium text-muted-foreground">Quick Reply ({(pattern.quickReplies ?? []).length}/13)</span>
                    <Button variant="ghost" onClick={addQuickReply} className="text-primary font-medium"><Plus className="h-4 w-4 mr-1.5" />เพิ่ม Quick Reply</Button>
                  </div>
                  {(pattern.quickReplies ?? []).length > 0 && (
                    <div className="space-y-2.5">
                      {(pattern.quickReplies ?? []).map((qr, idx) => (
                        <div key={idx} className="flex items-center gap-3">
                          <div className="flex items-center gap-2 rounded-xl border bg-card p-3 flex-1">
                            <Input className="h-9 flex-1 border-0 bg-transparent" value={qr.label} onChange={(e) => updateQuickReply(idx, { label: e.target.value, value: e.target.value })} placeholder="ชื่อปุ่ม Quick Reply" />
                            <button onClick={() => removeQuickReply(idx)} className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive"><Trash2 className="h-4 w-4" /></button>
                          </div>
                          {qr.label && (
                            <span className="rounded-full border-2 px-4 py-1.5 text-sm font-medium shrink-0" style={{ borderColor: theme.accent + "50", color: theme.accent }}>{qr.label}</span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Activity log */}
                <div className="mt-8 pt-5 border-t">
                  <div className="flex items-center gap-2.5 mb-4">
                    <Activity className="h-5 w-5 text-muted-foreground" />
                    <span className="font-medium text-muted-foreground">กิจกรรมล่าสุด</span>
                    {(selected._count?.sessions ?? 0) > 0 && <span className="text-sm text-muted-foreground/60 tabular-nums">({selected._count?.sessions} ครั้งทั้งหมด)</span>}
                  </div>
                  {activityLoading ? (
                    <div className="py-6 flex justify-center"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
                  ) : activityLog.length === 0 ? (
                    <p className="text-muted-foreground py-4">ยังไม่มีกิจกรรม — Trigger ยังไม่เคยทำงาน</p>
                  ) : (
                    <div className="space-y-2">
                      {activityLog.map((entry) => (
                        <div key={entry.id} className="flex items-center gap-3 rounded-xl bg-card border p-3">
                          <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
                          <span className="text-sm text-muted-foreground shrink-0">{formatRelativeTime(entry.startedAt)}</span>
                          <span className="font-medium truncate">{entry.conversation.contact.displayName || "ลูกค้า"}</span>
                          <span className="text-sm text-muted-foreground/60 truncate">{entry.conversation.channel.name}</span>
                          <span className={cn("ml-auto rounded-full px-2.5 py-1 text-xs font-medium shrink-0", entry.status === "completed" ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400" : "bg-muted text-muted-foreground")}>{entry.status === "completed" ? "สำเร็จ" : entry.status}</span>
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

      {/* Message type selector */}
      <Dialog open={showTypeSelector} onOpenChange={setShowTypeSelector}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-lg">เลือกประเภทข้อความ</DialogTitle>
            <p className="text-muted-foreground">
              {platformTab !== "_default" ? `ข้อความที่รองรับบน ${PLATFORM_TABS.find(t => t.value === platformTab)?.label}` : "เลือกประเภทข้อความที่ต้องการเพิ่ม"}
            </p>
          </DialogHeader>
          <div className="grid grid-cols-3 gap-3 py-4">
            {MSG_TYPES.filter((t) => allowedMsgTypes.includes(t.value)).map((t) => {
              const Icon = t.icon;
              return (
                <button key={t.value} onClick={() => addMessage(t.value)} className="flex flex-col items-center gap-3 rounded-2xl border p-5 hover:border-primary/30 hover:shadow-sm transition-all group">
                  <div className={cn("rounded-2xl h-14 w-14 flex items-center justify-center transition-transform group-hover:scale-110", t.bg)}>
                    <Icon className={cn("h-7 w-7", t.color)} />
                  </div>
                  <span className="font-medium">{t.label}</span>
                </button>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>

      {/* Split-view message editor */}
      <Dialog open={editingMsgIdx !== null} onOpenChange={(open) => { if (!open) { setEditingMsgIdx(null); setEditingMsg(null); } }}>
        <DialogContent className="sm:max-w-5xl max-h-[85vh] p-0 overflow-hidden">
          <div className="flex h-[70vh]">
            <div className="flex-1 flex flex-col overflow-hidden border-r">
              <div className="px-6 py-5 border-b shrink-0">
                <DialogTitle className="flex items-center gap-3 text-lg">
                  {editingMsg && (() => { const conf = msgTypeConfig(editingMsg.type); const Icon = conf?.icon ?? MessageSquare; return <div className={cn("rounded-xl h-10 w-10 flex items-center justify-center", conf?.bg ?? "bg-muted")}><Icon className={cn("h-5 w-5", conf?.color ?? "text-muted-foreground")} /></div>; })()}
                  แก้ไข {editingMsg ? msgTypeLabel(editingMsg.type) : ""}
                </DialogTitle>
              </div>
              <div className="flex-1 overflow-y-auto px-6 py-5">
                {editingMsg && (
                  <div className="space-y-5">
                    {editingMsg.type === "text" && (
                      <>
                        <div className="space-y-2">
                          <Label>ข้อความ</Label>
                          <Textarea className="min-h-[180px] text-base" value={editingMsg.text ?? ""} onChange={(e) => setEditingMsg({ ...editingMsg, text: e.target.value })} placeholder="พิมพ์ข้อความ..." />
                          <p className="text-sm text-muted-foreground text-right">{(editingMsg.text ?? "").length} / 1,000</p>
                        </div>
                        <ButtonEditor buttons={editingMsg.buttons ?? []} onAdd={addMsgButton} onRemove={removeMsgButton} onUpdate={updateMsgButton} />
                      </>
                    )}
                    {editingMsg.type === "image" && <div className="space-y-2"><Label>URL รูปภาพ</Label><Input value={editingMsg.imageUrl ?? ""} onChange={(e) => setEditingMsg({ ...editingMsg, imageUrl: e.target.value })} placeholder="https://..." className="h-10" /></div>}
                    {editingMsg.type === "card" && (
                      <>
                        <div className="space-y-2"><Label>รูปภาพ (URL)</Label><Input value={editingMsg.cardImageUrl ?? ""} onChange={(e) => setEditingMsg({ ...editingMsg, cardImageUrl: e.target.value })} placeholder="https://..." className="h-10" /></div>
                        <div className="space-y-2"><Label>หัวข้อ</Label><Input value={editingMsg.cardTitle ?? ""} onChange={(e) => setEditingMsg({ ...editingMsg, cardTitle: e.target.value })} className="h-10" /></div>
                        <div className="space-y-2"><Label>รายละเอียด</Label><Textarea value={editingMsg.cardText ?? ""} onChange={(e) => setEditingMsg({ ...editingMsg, cardText: e.target.value })} /></div>
                        <ButtonEditor buttons={editingMsg.cardButtons ?? []} onAdd={addMsgButton} onRemove={removeMsgButton} onUpdate={updateMsgButton} />
                      </>
                    )}
                    {editingMsg.type === "sticker" && <div className="grid grid-cols-2 gap-4"><div className="space-y-2"><Label>Package ID</Label><Input value={editingMsg.stickerPackageId ?? ""} onChange={(e) => setEditingMsg({ ...editingMsg, stickerPackageId: e.target.value })} className="h-10" /></div><div className="space-y-2"><Label>Sticker ID</Label><Input value={editingMsg.stickerId ?? ""} onChange={(e) => setEditingMsg({ ...editingMsg, stickerId: e.target.value })} className="h-10" /></div></div>}
                    {editingMsg.type === "file" && <div className="grid grid-cols-2 gap-4"><div className="space-y-2"><Label>URL ไฟล์</Label><Input value={editingMsg.fileUrl ?? ""} onChange={(e) => setEditingMsg({ ...editingMsg, fileUrl: e.target.value })} placeholder="https://..." className="h-10" /></div><div className="space-y-2"><Label>ชื่อไฟล์</Label><Input value={editingMsg.fileName ?? ""} onChange={(e) => setEditingMsg({ ...editingMsg, fileName: e.target.value })} className="h-10" /></div></div>}
                    {editingMsg.type === "video" && <div className="grid grid-cols-2 gap-4"><div className="space-y-2"><Label>URL วิดีโอ</Label><Input value={editingMsg.videoUrl ?? ""} onChange={(e) => setEditingMsg({ ...editingMsg, videoUrl: e.target.value })} placeholder="https://..." className="h-10" /></div><div className="space-y-2"><Label>Thumbnail URL</Label><Input value={editingMsg.thumbnailUrl ?? ""} onChange={(e) => setEditingMsg({ ...editingMsg, thumbnailUrl: e.target.value })} className="h-10" /></div></div>}
                  </div>
                )}
              </div>
              <div className="px-6 py-4 border-t flex items-center gap-3 shrink-0">
                <Button onClick={saveEditMsg} className="h-10 px-6">บันทึก</Button>
                <Button variant="ghost" className="h-10" onClick={() => { setEditingMsgIdx(null); setEditingMsg(null); }}>ยกเลิก</Button>
              </div>
            </div>
            <div className="w-[400px] shrink-0 flex flex-col overflow-hidden bg-muted/20">
              <div className="px-5 py-4 border-b shrink-0"><span className="font-semibold">ตัวอย่าง</span></div>
              <div className={cn("flex-1 overflow-y-auto p-6", theme.chatBg)}>
                {editingMsg && (
                  <div className="flex items-end gap-3">
                    <div className={cn("h-9 w-9 rounded-full flex items-center justify-center shrink-0 mb-0.5", theme.avatarBg)}><Bot className={cn("h-4.5 w-4.5", theme.avatarColor)} /></div>
                    <div className="max-w-[300px]"><MessageBubble msg={editingMsg} platform={platformTab} /></div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Flow creation wizard */}
      <Dialog open={wizardOpen} onOpenChange={setWizardOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg">สร้าง Flow ใหม่</DialogTitle>
            <p className="text-muted-foreground">
              {wizardStep === 0 ? "ตั้งชื่อและเลือกประเภท Trigger" : "ตั้งค่า Trigger"}
            </p>
          </DialogHeader>

          {wizardStep === 0 && (
            <div className="space-y-5 py-3">
              <div className="space-y-2">
                <Label>ชื่อ Flow</Label>
                <Input value={wizardName} onChange={(e) => setWizardName(e.target.value)} placeholder="เช่น ทักทายลูกค้า, สอบถามราคา" className="h-10" autoFocus />
              </div>
              <div className="space-y-2">
                <Label>ประเภท Trigger</Label>
                <div className="grid grid-cols-3 gap-3">
                  {([
                    { value: "keyword" as const, label: "คีย์เวิร์ด", icon: Hash, desc: "ตอบเมื่อพบคำที่กำหนด" },
                    { value: "first_message" as const, label: "ข้อความแรก", icon: MessageSquare, desc: "ตอบข้อความแรกของลูกค้า" },
                    { value: "postback" as const, label: "กดปุ่ม", icon: Zap, desc: "ตอบเมื่อกดปุ่มใน Rich Menu" },
                  ]).map((opt) => {
                    const Icon = opt.icon;
                    const active = wizardTriggerType === opt.value;
                    return (
                      <button key={opt.value} onClick={() => setWizardTriggerType(opt.value)}
                        className={cn("flex flex-col items-center gap-2 rounded-2xl border-2 p-4 transition-all text-center", active ? "border-primary bg-primary/5 shadow-sm" : "border-transparent bg-muted/30 hover:bg-muted/50")}>
                        <Icon className={cn("h-6 w-6", active ? "text-primary" : "text-muted-foreground")} />
                        <span className={cn("text-sm font-medium", active ? "text-primary" : "")}>{opt.label}</span>
                        <span className="text-xs text-muted-foreground leading-tight">{opt.desc}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {wizardStep === 1 && (
            <div className="space-y-5 py-3">
              {wizardTriggerType === "keyword" && (
                <div className="space-y-3">
                  <Label>คีย์เวิร์ด</Label>
                  <div className="flex items-center gap-2">
                    <Input value={wizardKeywordInput} onChange={(e) => setWizardKeywordInput(e.target.value)} placeholder="พิมพ์แล้วกด Enter" className="flex-1 h-10"
                      onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); const v = wizardKeywordInput.trim(); if (v && !wizardKeywords.includes(v)) { setWizardKeywords((p) => [...p, v]); setWizardKeywordInput(""); } } }} />
                    <Button variant="outline" className="h-10" onClick={() => { const v = wizardKeywordInput.trim(); if (v && !wizardKeywords.includes(v)) { setWizardKeywords((p) => [...p, v]); setWizardKeywordInput(""); } }} disabled={!wizardKeywordInput.trim()}><Plus className="h-4 w-4" /></Button>
                  </div>
                  {wizardKeywords.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {wizardKeywords.map((kw) => (
                        <span key={kw} className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 text-primary pl-4 pr-2 py-1.5 font-medium">
                          {kw}<button onClick={() => setWizardKeywords((p) => p.filter((k) => k !== kw))} className="p-1 rounded-full hover:bg-primary/20"><X className="h-3.5 w-3.5" /></button>
                        </span>
                      ))}
                    </div>
                  )}
                  <p className="text-sm text-muted-foreground">เพิ่มได้หลายคีย์เวิร์ด ระบบจะตอบเมื่อพบคำใดคำหนึ่ง</p>
                </div>
              )}
              {wizardTriggerType === "first_message" && (
                <div className="rounded-xl bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800/30 p-5">
                  <p className="text-blue-700 dark:text-blue-400">Flow จะทำงานเมื่อลูกค้าส่งข้อความแรกเข้ามา</p>
                  <p className="text-sm text-blue-600/70 dark:text-blue-400/60 mt-1.5">เหมาะสำหรับข้อความต้อนรับหรือเมนูหลัก</p>
                </div>
              )}
              {wizardTriggerType === "postback" && (
                <div className="space-y-2">
                  <Label>Postback Data</Label>
                  <Input value={wizardPostbackData} onChange={(e) => setWizardPostbackData(e.target.value)} placeholder="เช่น action=menu" className="h-10" />
                  <p className="text-sm text-muted-foreground">ค่า data ที่ส่งมาเมื่อลูกค้ากดปุ่ม</p>
                </div>
              )}
            </div>
          )}

          <DialogFooter className="gap-2">
            {wizardStep > 0 && <Button variant="outline" className="h-10" onClick={() => setWizardStep((s) => s - 1)}>ย้อนกลับ</Button>}
            {wizardStep === 0 && <Button className="h-10" onClick={() => setWizardStep(1)} disabled={!wizardName.trim()}>ถัดไป</Button>}
            {wizardStep === 1 && <Button className="h-10" onClick={handleWizardCreate}>สร้างและเปิดใช้งาน</Button>}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
    </TooltipProvider>
  );
}

// ─── MessageCard ──────────────────────────────────────────────────────────────

function MessageCard({ msg, num, onEdit, onDuplicate, onDelete, onMoveUp, onMoveDown, isFirst, isLast }: {
  msg: AutoReplyMessage; num: number;
  onEdit: () => void; onDuplicate: () => void; onDelete: () => void;
  onMoveUp: () => void; onMoveDown: () => void;
  isFirst: boolean; isLast: boolean;
}) {
  const conf = msgTypeConfig(msg.type);
  return (
    <div className="rounded-2xl border bg-card overflow-hidden hover:shadow-md transition-shadow">
      <div className="flex">
        <div className="flex items-center justify-center w-12 shrink-0 bg-muted/30 border-r">
          <span className="text-sm font-bold text-muted-foreground">{num}</span>
        </div>
        <div className="flex-1 min-w-0 p-5 cursor-pointer" onClick={onEdit}>
          {msg.type === "text" && (
            <div>
              <p className="whitespace-pre-wrap leading-relaxed line-clamp-6">{msg.text || <span className="text-muted-foreground italic">คลิกเพื่อเพิ่มข้อความ...</span>}</p>
              {msg.buttons && msg.buttons.length > 0 && (
                <div className="mt-3 space-y-2">{msg.buttons.map((btn, bi) => <div key={bi} className="rounded-xl border text-center font-medium py-2.5 px-4 text-primary">{btn.label || "ปุ่ม"}</div>)}</div>
              )}
            </div>
          )}
          {msg.type === "image" && (msg.imageUrl ? <img src={msg.imageUrl} alt="" className="w-full max-h-44 object-cover rounded-xl" /> : <div className="h-28 rounded-xl bg-muted/30 flex items-center justify-center"><Image className="h-10 w-10 text-muted-foreground/20" /></div>)}
          {msg.type === "card" && (
            <div className="flex gap-4">
              {msg.cardImageUrl ? <img src={msg.cardImageUrl} alt="" className="w-28 h-28 rounded-xl object-cover shrink-0" /> : <div className="w-28 h-28 rounded-xl bg-muted/30 flex items-center justify-center shrink-0"><Image className="h-7 w-7 text-muted-foreground/20" /></div>}
              <div className="min-w-0">
                <p className="font-semibold text-base">{msg.cardTitle || "หัวข้อการ์ด"}</p>
                {msg.cardText && <p className="text-muted-foreground mt-1 line-clamp-2">{msg.cardText}</p>}
                {msg.cardButtons && msg.cardButtons.length > 0 && <div className="mt-2 flex flex-wrap gap-1.5">{msg.cardButtons.map((btn, bi) => <span key={bi} className="text-xs font-medium text-primary bg-primary/8 rounded-md px-2 py-1">{btn.label || "ปุ่ม"}</span>)}</div>}
              </div>
            </div>
          )}
          {msg.type === "sticker" && <div className="flex items-center gap-4"><Smile className="h-14 w-14 text-amber-400" /><span className="text-muted-foreground">สติ๊กเกอร์</span></div>}
          {msg.type === "file" && <div className="flex items-center gap-4"><div className={cn("rounded-xl h-12 w-12 flex items-center justify-center shrink-0", conf?.bg ?? "bg-muted")}><FileText className={cn("h-5 w-5", conf?.color ?? "text-muted-foreground")} /></div><div className="min-w-0"><p className="font-medium truncate">{msg.fileName || "ไฟล์แนบ"}</p><p className="text-sm text-muted-foreground truncate">{msg.fileUrl || "ยังไม่ได้ตั้งค่า"}</p></div></div>}
          {msg.type === "video" && <div className="flex items-center gap-4"><div className={cn("rounded-xl h-12 w-12 flex items-center justify-center shrink-0", conf?.bg ?? "bg-muted")}><Video className={cn("h-5 w-5", conf?.color ?? "text-muted-foreground")} /></div><div className="min-w-0"><p className="font-medium">วิดีโอ</p><p className="text-sm text-muted-foreground truncate">{msg.videoUrl || "ยังไม่ได้ตั้งค่า"}</p></div></div>}
        </div>
        <div className="flex flex-col items-center justify-center gap-1 px-3 border-l bg-muted/20 shrink-0">
          <button onClick={onDuplicate} className="p-2 rounded-lg hover:bg-background text-muted-foreground hover:text-foreground transition-colors"><Copy className="h-4 w-4" /></button>
          <button onClick={onEdit} className="p-2 rounded-lg hover:bg-background text-muted-foreground hover:text-foreground transition-colors"><Pencil className="h-4 w-4" /></button>
          <button onClick={onDelete} className="p-2 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"><Trash2 className="h-4 w-4" /></button>
          {!isFirst && <button onClick={onMoveUp} className="p-2 rounded-lg hover:bg-background text-muted-foreground hover:text-foreground transition-colors"><ChevronUp className="h-4 w-4" /></button>}
          {!isLast && <button onClick={onMoveDown} className="p-2 rounded-lg hover:bg-background text-muted-foreground hover:text-foreground transition-colors"><ChevronDown className="h-4 w-4" /></button>}
        </div>
      </div>
    </div>
  );
}

// ─── MessageBubble ────────────────────────────────────────────────────────────

function MessageBubble({ msg, platform }: { msg: AutoReplyMessage; platform: PlatformKey }) {
  const isLine = platform === "line";
  const isFb = platform === "facebook";
  const isIg = platform === "instagram";
  const isSocial = isFb || isIg;
  const btnColor = isFb ? "text-[#0084FF]" : isIg ? "text-[#0095F6]" : "";
  const dividerColor = isFb ? "border-[#E4E6EB]" : "border-[#DBDBDB]";
  const socialBubbleBg = isFb ? "bg-[#E4E6EB] dark:bg-[#3A3B3C]" : "bg-[#EFEFEF] dark:bg-[#3A3B3C]";
  const maxW = 300;
  const emptyText = <span className="text-gray-400 italic">ข้อความ...</span>;

  if (msg.type === "text") {
    const hasButtons = !!(msg.buttons?.length);
    if (isLine && hasButtons) return <div className="rounded-xl bg-white shadow-sm overflow-hidden" style={{ maxWidth: maxW }}><div className="p-3.5"><p className="text-gray-900 whitespace-pre-wrap">{msg.text || emptyText}</p></div><div className="px-3.5 pb-3.5 space-y-2">{msg.buttons!.map((btn, i) => <div key={i} className="w-full rounded-lg bg-[#06C755] text-white text-center font-semibold py-2.5">{btn.label || "ปุ่ม"}</div>)}</div></div>;
    if (isSocial && hasButtons) return <div style={{ maxWidth: maxW }}><div className={cn("rounded-2xl rounded-bl-md px-4 py-3", socialBubbleBg)}><p className="text-gray-900 dark:text-gray-100 whitespace-pre-wrap">{msg.text || emptyText}</p></div><div className={cn("mt-1 rounded-xl border bg-white dark:bg-gray-900 overflow-hidden", dividerColor)}>{msg.buttons!.map((btn, i) => <div key={i} className={cn("border-t first:border-t-0 text-center py-2.5 font-medium", dividerColor, btnColor)}>{btn.label || "ปุ่ม"}</div>)}</div></div>;
    if (isLine) return <div className="rounded-2xl bg-white shadow-sm px-4 py-3" style={{ maxWidth: maxW }}><p className="text-gray-900 whitespace-pre-wrap">{msg.text || emptyText}</p></div>;
    if (isSocial) return <div className={cn("rounded-2xl rounded-bl-md px-4 py-3", socialBubbleBg)} style={{ maxWidth: maxW }}><p className="text-gray-900 dark:text-gray-100 whitespace-pre-wrap">{msg.text || emptyText}</p></div>;
    return <div className="rounded-2xl rounded-bl-md bg-card border shadow-sm px-4 py-3" style={{ maxWidth: maxW }}><p className="whitespace-pre-wrap">{msg.text || emptyText}</p>{hasButtons && <div className="mt-2 space-y-2 border-t pt-2">{msg.buttons!.map((btn, bi) => <div key={bi} className="w-full rounded-lg bg-primary text-primary-foreground text-center text-sm font-semibold py-2.5">{btn.label || "ปุ่ม"}</div>)}</div>}</div>;
  }
  if (msg.type === "image") {
    const wrapper = isLine ? "rounded-2xl bg-white shadow-sm overflow-hidden" : isSocial ? "rounded-2xl overflow-hidden" : "rounded-2xl rounded-bl-md bg-card border shadow-sm overflow-hidden";
    return <div className={wrapper} style={{ maxWidth: maxW }}>{msg.imageUrl ? <img src={msg.imageUrl} alt="" className="w-full max-h-48 object-cover" /> : <div className="p-8 flex flex-col items-center justify-center bg-muted/20"><Image className="h-10 w-10 text-muted-foreground/25" /></div>}</div>;
  }
  if (msg.type === "card") {
    const hasImage = !!msg.cardImageUrl; const hasButtons = !!(msg.cardButtons?.length);
    if (isLine) return <div className="rounded-xl bg-white shadow-sm overflow-hidden" style={{ maxWidth: maxW }}>{hasImage ? <img src={msg.cardImageUrl} alt="" className="w-full object-cover" style={{ aspectRatio: "20/13" }} /> : <div className="w-full bg-gray-100 flex items-center justify-center" style={{ aspectRatio: "20/13" }}><Image className="h-7 w-7 text-gray-300" /></div>}<div className="p-3.5 space-y-1"><p className="font-bold text-gray-900">{msg.cardTitle || "หัวข้อ"}</p>{msg.cardText && <p className="text-sm text-gray-600">{msg.cardText}</p>}</div>{hasButtons && <div className="px-3.5 pb-3.5 space-y-2">{msg.cardButtons!.map((btn, i) => <div key={i} className="w-full rounded-lg bg-[#06C755] text-white text-center font-semibold py-2.5">{btn.label || "ปุ่ม"}</div>)}</div>}</div>;
    if (isSocial) { const cb = isFb ? "border-[#E4E6EB]" : "border-[#DBDBDB]"; return <div className={cn("rounded-xl border bg-white dark:bg-gray-900 overflow-hidden", cb)} style={{ maxWidth: maxW }}>{hasImage ? <img src={msg.cardImageUrl} alt="" className="w-full object-cover" style={{ aspectRatio: "1.91/1" }} /> : <div className="w-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center" style={{ aspectRatio: "1.91/1" }}><Image className="h-7 w-7 text-gray-300" /></div>}<div className="px-3.5 pt-3 pb-2.5"><p className="font-bold">{msg.cardTitle || "หัวข้อ"}</p>{msg.cardText && <p className="text-sm text-gray-500 mt-0.5">{msg.cardText}</p>}</div>{hasButtons && msg.cardButtons!.map((btn, i) => <div key={i} className={cn("border-t text-center py-2.5 font-medium", cb, btnColor)}>{btn.label || "ปุ่ม"}</div>)}</div>; }
    return <div className="rounded-2xl rounded-bl-md bg-card border shadow-sm overflow-hidden" style={{ maxWidth: maxW }}>{hasImage ? <img src={msg.cardImageUrl} alt="" className="w-full h-36 object-cover" /> : <div className="w-full h-28 bg-muted/20 flex items-center justify-center"><Image className="h-7 w-7 text-muted-foreground/25" /></div>}<div className="px-3.5 py-3 space-y-1"><p className="font-bold">{msg.cardTitle || "หัวข้อ"}</p>{msg.cardText && <p className="text-sm text-muted-foreground">{msg.cardText}</p>}{hasButtons && <div className="pt-2 space-y-1.5">{msg.cardButtons!.map((btn, bi) => <div key={bi} className="w-full rounded-lg bg-primary text-primary-foreground text-center text-sm font-semibold py-2">{btn.label || "ปุ่ม"}</div>)}</div>}</div></div>;
  }
  if (msg.type === "sticker") { const w = isLine ? "rounded-2xl bg-white shadow-sm" : "rounded-2xl rounded-bl-md bg-card border shadow-sm"; return <div className={cn("p-5 flex items-center justify-center", w)} style={{ maxWidth: maxW }}><Smile className="h-16 w-16 text-amber-400" /></div>; }
  if (msg.type === "file") { const c2 = msgTypeConfig("file"); const w = isLine ? "rounded-2xl bg-white shadow-sm" : "rounded-2xl rounded-bl-md bg-card border shadow-sm"; return <div className={cn("p-3.5 flex items-center gap-3", w)} style={{ maxWidth: maxW }}><div className={cn("rounded-xl h-10 w-10 flex items-center justify-center shrink-0", c2?.bg ?? "bg-muted")}><FileText className={cn("h-5 w-5", c2?.color ?? "text-muted-foreground")} /></div><div className="min-w-0"><p className="font-medium truncate">{msg.fileName || "ไฟล์"}</p></div></div>; }
  if (msg.type === "video") { const c2 = msgTypeConfig("video"); const w = isLine ? "rounded-2xl bg-white shadow-sm" : "rounded-2xl rounded-bl-md bg-card border shadow-sm"; return <div className={cn("p-3.5 flex items-center gap-3", w)} style={{ maxWidth: maxW }}><div className={cn("rounded-xl h-10 w-10 flex items-center justify-center shrink-0", c2?.bg ?? "bg-muted")}><Video className={cn("h-5 w-5", c2?.color ?? "text-muted-foreground")} /></div><div className="min-w-0"><p className="font-medium">วิดีโอ</p></div></div>; }
  return null;
}

// ─── ButtonEditor ─────────────────────────────────────────────────────────────

function ButtonEditor({ buttons, onAdd, onRemove, onUpdate }: {
  buttons: RichButton[]; onAdd: () => void; onRemove: (idx: number) => void; onUpdate: (idx: number, patch: Partial<RichButton>) => void;
}) {
  return (
    <div className="space-y-3 rounded-2xl bg-muted/30 p-5">
      <div className="flex items-center justify-between">
        <Label>ปุ่มกด ({buttons.length}/3)</Label>
        <Button variant="outline" size="sm" onClick={onAdd} disabled={buttons.length >= 3} className="h-9"><Plus className="h-4 w-4 mr-1.5" />เพิ่มปุ่ม</Button>
      </div>
      {buttons.length === 0 && <p className="text-muted-foreground text-center py-3">ยังไม่มีปุ่ม</p>}
      {buttons.map((btn, i) => (
        <div key={i} className="flex gap-2 items-center rounded-xl bg-background border p-3">
          <Input className="h-9 flex-1 border-0 bg-transparent" placeholder="ชื่อปุ่ม" value={btn.label} onChange={(e) => onUpdate(i, { label: e.target.value })} />
          <Select value={btn.action} onValueChange={(v) => onUpdate(i, { action: (v ?? "message") as RichButton["action"] })}>
            <SelectTrigger className="h-9 w-28 border-0 bg-muted/50"><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="message">ข้อความ</SelectItem><SelectItem value="postback">Postback</SelectItem><SelectItem value="url">URL</SelectItem></SelectContent>
          </Select>
          <Input className="h-9 flex-1 border-0 bg-transparent" placeholder="ค่า" value={btn.value} onChange={(e) => onUpdate(i, { value: e.target.value })} />
          <Button variant="ghost" size="icon-sm" className="shrink-0 text-destructive/70 hover:text-destructive hover:bg-destructive/10" onClick={() => onRemove(i)}><Trash2 className="h-4 w-4" /></Button>
        </div>
      ))}
    </div>
  );
}
