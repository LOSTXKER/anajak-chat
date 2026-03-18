"use client";

import { useEffect, useState } from "react";
import {
  Plus,
  Trash2,
  Loader2,
  Workflow,
  Power,
  PowerOff,
  ChevronUp,
  ChevronDown,
  MessageSquare,
  Image,
  GitBranch,
  Clock,
  Tag,
  UserPlus,
  Sparkles,
  StopCircle,
  Pause,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

interface FlowTrigger {
  type: "first_message" | "keyword" | "postback";
  keywords?: string[];
  data?: string;
}

interface FlowButton {
  label: string;
  postbackData: string;
}

interface FlowStep {
  type: string;
  content?: string;
  buttons?: FlowButton[];
  imageUrl?: string;
  caption?: string;
  field?: string;
  operator?: string;
  value?: string;
  gotoStep?: number;
  elseStep?: number;
  agentId?: string;
  tag?: string;
  seconds?: number;
}

interface ChatFlow {
  id: string;
  name: string;
  description: string | null;
  isActive: boolean;
  trigger: FlowTrigger;
  steps: FlowStep[];
  channelId: string | null;
  priority: number;
  channel: { id: string; name: string; platform: string } | null;
  _count?: { sessions: number };
  createdAt: string;
}

const STEP_TYPES = [
  { value: "send_message", label: "ส่งข้อความ", icon: MessageSquare },
  { value: "send_image", label: "ส่งรูปภาพ", icon: Image },
  { value: "condition", label: "เงื่อนไข", icon: GitBranch },
  { value: "wait_reply", label: "รอตอบ", icon: Pause },
  { value: "assign_agent", label: "มอบหมายแอดมิน", icon: UserPlus },
  { value: "set_tag", label: "ติดแท็ก", icon: Tag },
  { value: "delay", label: "หน่วงเวลา", icon: Clock },
  { value: "ai_reply", label: "ให้ AI ตอบ", icon: Sparkles },
  { value: "end_flow", label: "จบ flow", icon: StopCircle },
];

const TRIGGER_LABELS: Record<string, string> = {
  first_message: "ข้อความแรก",
  keyword: "คีย์เวิร์ด",
  postback: "กดปุ่ม (Postback)",
};

export default function ChatFlowsPage() {
  const { toast } = useToast();
  const [flows, setFlows] = useState<ChatFlow[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingFlow, setEditingFlow] = useState<ChatFlow | null>(null);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [triggerType, setTriggerType] = useState<FlowTrigger["type"]>("first_message");
  const [keywords, setKeywords] = useState("");
  const [postbackData, setPostbackData] = useState("");
  const [steps, setSteps] = useState<FlowStep[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetchFlows(); }, []);

  async function fetchFlows() {
    setLoading(true);
    try {
      const res = await fetch("/api/chat-flows");
      if (res.ok) setFlows(await res.json());
    } finally {
      setLoading(false);
    }
  }

  function openCreate() {
    setEditingFlow(null);
    setName("");
    setDescription("");
    setTriggerType("first_message");
    setKeywords("");
    setPostbackData("");
    setSteps([{ type: "send_message", content: "" }]);
    setDialogOpen(true);
  }

  function openEdit(flow: ChatFlow) {
    setEditingFlow(flow);
    setName(flow.name);
    setDescription(flow.description ?? "");
    setTriggerType(flow.trigger.type);
    setKeywords(flow.trigger.keywords?.join(", ") ?? "");
    setPostbackData(flow.trigger.data ?? "");
    setSteps(flow.steps.length > 0 ? flow.steps : [{ type: "send_message", content: "" }]);
    setDialogOpen(true);
  }

  async function handleSave() {
    if (!name.trim()) { toast({ title: "กรุณาใส่ชื่อ flow", variant: "destructive" }); return; }
    setSaving(true);

    const trigger: FlowTrigger = { type: triggerType };
    if (triggerType === "keyword") trigger.keywords = keywords.split(",").map((k) => k.trim()).filter(Boolean);
    if (triggerType === "postback") trigger.data = postbackData;

    const body = { name, description: description || undefined, trigger, steps };

    try {
      const url = editingFlow ? `/api/chat-flows/${editingFlow.id}` : "/api/chat-flows";
      const method = editingFlow ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        toast({ title: editingFlow ? "อัปเดตสำเร็จ" : "สร้าง flow สำเร็จ" });
        setDialogOpen(false);
        fetchFlows();
      } else {
        const data = await res.json();
        toast({ title: "เกิดข้อผิดพลาด", description: (data as { error?: string }).error, variant: "destructive" });
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleToggle(flow: ChatFlow) {
    const res = await fetch(`/api/chat-flows/${flow.id}/toggle`, { method: "POST" });
    if (res.ok) {
      const data = (await res.json()) as { isActive: boolean };
      setFlows((prev) => prev.map((f) => (f.id === flow.id ? { ...f, isActive: data.isActive } : f)));
    }
  }

  async function handleDelete(flow: ChatFlow) {
    if (!confirm(`ลบ flow "${flow.name}"?`)) return;
    const res = await fetch(`/api/chat-flows/${flow.id}`, { method: "DELETE" });
    if (res.ok) {
      setFlows((prev) => prev.filter((f) => f.id !== flow.id));
      toast({ title: "ลบสำเร็จ" });
    }
  }

  function addStep() {
    setSteps([...steps, { type: "send_message", content: "" }]);
  }

  function removeStep(idx: number) {
    setSteps(steps.filter((_, i) => i !== idx));
  }

  function updateStep(idx: number, patch: Partial<FlowStep>) {
    setSteps(steps.map((s, i) => (i === idx ? { ...s, ...patch } : s)));
  }

  function moveStep(idx: number, dir: -1 | 1) {
    const newSteps = [...steps];
    const target = idx + dir;
    if (target < 0 || target >= newSteps.length) return;
    [newSteps[idx], newSteps[target]] = [newSteps[target], newSteps[idx]];
    setSteps(newSteps);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Chat Flow</h1>
          <p className="text-sm text-muted-foreground">สร้าง flow อัตโนมัติสำหรับตอบแชทลูกค้า</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4 mr-2" />
          สร้าง Flow
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : flows.length === 0 ? (
        <div className="flex flex-col items-center py-16 text-center">
          <Workflow className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground mb-4">ยังไม่มี flow</p>
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4 mr-2" />
            สร้าง Flow แรก
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {flows.map((flow) => (
            <Card key={flow.id} className="rounded-xl">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm">{flow.name}</CardTitle>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleToggle(flow)}>
                      {flow.isActive ? <Power className="h-4 w-4 text-green-600" /> : <PowerOff className="h-4 w-4 text-muted-foreground" />}
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDelete(flow)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {flow.description && <p className="text-xs text-muted-foreground">{flow.description}</p>}
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant={flow.isActive ? "default" : "outline"} className="text-xs">
                    {flow.isActive ? "เปิดใช้งาน" : "ปิดอยู่"}
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    {TRIGGER_LABELS[flow.trigger.type] ?? flow.trigger.type}
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    {flow.steps.length} steps
                  </Badge>
                  {flow._count?.sessions !== undefined && (
                    <Badge variant="outline" className="text-xs">{flow._count.sessions} sessions</Badge>
                  )}
                </div>
                <Button variant="outline" size="sm" className="text-xs w-full" onClick={() => openEdit(flow)}>
                  แก้ไข
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Workflow className="h-5 w-5" />
              {editingFlow ? "แก้ไข Flow" : "สร้าง Flow ใหม่"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Basic info */}
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>ชื่อ Flow</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="เช่น ทักทายลูกค้าใหม่" />
              </div>
              <div className="space-y-1.5">
                <Label>คำอธิบาย</Label>
                <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="คำอธิบายสั้นๆ" />
              </div>
            </div>

            {/* Trigger */}
            <div className="space-y-2">
              <Label>Trigger — เมื่อไหร่ flow จะเริ่มทำงาน</Label>
              <Select value={triggerType} onValueChange={(v) => setTriggerType(v as FlowTrigger["type"])}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="first_message">ข้อความแรก (ลูกค้าทักมาใหม่)</SelectItem>
                  <SelectItem value="keyword">คีย์เวิร์ดในข้อความ</SelectItem>
                  <SelectItem value="postback">กดปุ่ม (Postback)</SelectItem>
                </SelectContent>
              </Select>
              {triggerType === "keyword" && (
                <Input
                  value={keywords}
                  onChange={(e) => setKeywords(e.target.value)}
                  placeholder="คีย์เวิร์ดคั่นด้วย , เช่น สวัสดี, ราคา, โปรโมชั่น"
                />
              )}
              {triggerType === "postback" && (
                <Input
                  value={postbackData}
                  onChange={(e) => setPostbackData(e.target.value)}
                  placeholder="Postback data เช่น action=view_products"
                />
              )}
            </div>

            {/* Steps */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>ขั้นตอน (Steps)</Label>
                <Button variant="outline" size="sm" onClick={addStep}>
                  <Plus className="h-3.5 w-3.5 mr-1" />
                  เพิ่ม Step
                </Button>
              </div>

              {steps.map((step, idx) => {
                const stepMeta = STEP_TYPES.find((t) => t.value === step.type);
                const Icon = stepMeta?.icon ?? MessageSquare;
                return (
                  <div key={idx} className="rounded-lg border p-3 space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="flex items-center justify-center h-6 w-6 rounded-full bg-accent text-accent-foreground text-xs font-bold shrink-0">{idx + 1}</span>
                      <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
                      <Select value={step.type} onValueChange={(v) => updateStep(idx, { type: v ?? step.type })}>
                        <SelectTrigger className="h-8 text-xs flex-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {STEP_TYPES.map((t) => (
                            <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <div className="flex gap-0.5 shrink-0">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => moveStep(idx, -1)} disabled={idx === 0}>
                          <ChevronUp className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => moveStep(idx, 1)} disabled={idx === steps.length - 1}>
                          <ChevronDown className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => removeStep(idx)} disabled={steps.length <= 1}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>

                    {/* Step-specific config */}
                    {step.type === "send_message" && (
                      <div className="space-y-2">
                        <Textarea
                          className="text-sm min-h-[60px]"
                          placeholder="ข้อความที่ส่งให้ลูกค้า..."
                          value={step.content ?? ""}
                          onChange={(e) => updateStep(idx, { content: e.target.value })}
                        />
                        <div className="space-y-1">
                          <p className="text-xs text-muted-foreground">ปุ่ม (ไม่บังคับ)</p>
                          {(step.buttons ?? []).map((btn, bi) => (
                            <div key={bi} className="flex gap-1">
                              <Input
                                className="h-7 text-xs flex-1"
                                placeholder="ชื่อปุ่ม"
                                value={btn.label}
                                onChange={(e) => {
                                  const btns = [...(step.buttons ?? [])];
                                  btns[bi] = { ...btns[bi], label: e.target.value };
                                  updateStep(idx, { buttons: btns });
                                }}
                              />
                              <Input
                                className="h-7 text-xs flex-1"
                                placeholder="Postback data"
                                value={btn.postbackData}
                                onChange={(e) => {
                                  const btns = [...(step.buttons ?? [])];
                                  btns[bi] = { ...btns[bi], postbackData: e.target.value };
                                  updateStep(idx, { buttons: btns });
                                }}
                              />
                              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => {
                                updateStep(idx, { buttons: (step.buttons ?? []).filter((_, i) => i !== bi) });
                              }}>
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          ))}
                          <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => {
                            updateStep(idx, { buttons: [...(step.buttons ?? []), { label: "", postbackData: "" }] });
                          }}>
                            <Plus className="h-3 w-3 mr-1" />
                            เพิ่มปุ่ม
                          </Button>
                        </div>
                      </div>
                    )}

                    {step.type === "send_image" && (
                      <Input
                        className="text-sm"
                        placeholder="URL รูปภาพ"
                        value={step.imageUrl ?? ""}
                        onChange={(e) => updateStep(idx, { imageUrl: e.target.value })}
                      />
                    )}

                    {step.type === "condition" && (
                      <div className="grid grid-cols-4 gap-1">
                        <Select value={step.field ?? "message"} onValueChange={(v) => updateStep(idx, { field: v ?? "message" })}>
                          <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="message">ข้อความ</SelectItem>
                            <SelectItem value="tag">แท็ก</SelectItem>
                            <SelectItem value="segment">กลุ่มลูกค้า</SelectItem>
                          </SelectContent>
                        </Select>
                        <Select value={step.operator ?? "contains"} onValueChange={(v) => updateStep(idx, { operator: v ?? "contains" })}>
                          <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="contains">มีคำว่า</SelectItem>
                            <SelectItem value="equals">เท่ากับ</SelectItem>
                            <SelectItem value="not_contains">ไม่มีคำว่า</SelectItem>
                          </SelectContent>
                        </Select>
                        <Input className="h-8 text-xs" placeholder="ค่า" value={step.value ?? ""} onChange={(e) => updateStep(idx, { value: e.target.value })} />
                        <div className="flex gap-1">
                          <Input className="h-8 text-xs" placeholder="→ step" type="number" value={step.gotoStep ?? ""} onChange={(e) => updateStep(idx, { gotoStep: parseInt(e.target.value) || 0 })} />
                          <Input className="h-8 text-xs" placeholder="else" type="number" value={step.elseStep ?? ""} onChange={(e) => updateStep(idx, { elseStep: parseInt(e.target.value) || 0 })} />
                        </div>
                      </div>
                    )}

                    {step.type === "set_tag" && (
                      <Input className="text-sm" placeholder="ชื่อแท็ก" value={step.tag ?? ""} onChange={(e) => updateStep(idx, { tag: e.target.value })} />
                    )}

                    {step.type === "delay" && (
                      <div className="flex items-center gap-2">
                        <Input className="w-24 text-sm" type="number" placeholder="วินาที" value={step.seconds ?? ""} onChange={(e) => updateStep(idx, { seconds: parseInt(e.target.value) || 0 })} />
                        <span className="text-xs text-muted-foreground">วินาที (สูงสุด 10)</span>
                      </div>
                    )}

                    {step.type === "assign_agent" && (
                      <Input className="text-sm" placeholder="Agent ID หรือ auto" value={step.agentId ?? "auto"} onChange={(e) => updateStep(idx, { agentId: e.target.value })} />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>ยกเลิก</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              {editingFlow ? "บันทึก" : "สร้าง"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
