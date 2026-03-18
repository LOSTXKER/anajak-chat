"use client";

import { useState, useEffect } from "react";
import { Plus, Pencil, Trash2, Search, Loader2, MessageSquareText, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface Template {
  id: string;
  name: string;
  content: string;
  category: "greeting" | "pricing" | "shipping" | "closing" | "custom";
  shortcut: string | null;
  usageCount: number;
  isActive: boolean;
  createdAt: string;
}

const CATEGORIES = [
  { value: "all", label: "ทั้งหมด" },
  { value: "greeting", label: "ทักทาย" },
  { value: "pricing", label: "ราคา" },
  { value: "shipping", label: "ขนส่ง" },
  { value: "closing", label: "ปิดการสนทนา" },
  { value: "custom", label: "กำหนดเอง" },
];

const CATEGORY_COLORS: Record<string, string> = {
  greeting: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",
  pricing: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",
  shipping: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",
  closing: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",
  custom: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",
};

const emptyForm = { name: "", content: "", category: "custom" as Template["category"], shortcut: "" };

export default function TemplatesPage() {
  const { toast } = useToast();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Template | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    fetchTemplates();
  }, []);

  async function fetchTemplates() {
    setLoading(true);
    try {
      const res = await fetch("/api/templates?limit=100");
      if (res.ok) {
        const data = await res.json();
        setTemplates(Array.isArray(data) ? data : data.templates ?? []);
      }
    } finally {
      setLoading(false);
    }
  }

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setDialogOpen(true);
  }

  function openEdit(t: Template) {
    setEditing(t);
    setForm({ name: t.name, content: t.content, category: t.category, shortcut: t.shortcut ?? "" });
    setDialogOpen(true);
  }

  async function handleSave() {
    if (!form.name.trim() || !form.content.trim()) {
      toast({ title: "กรุณากรอก ชื่อ และ เนื้อหา", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const payload = { ...form, shortcut: form.shortcut || null };
      let res: Response;
      if (editing) {
        res = await fetch(`/api/templates/${editing.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch("/api/templates", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }
      if (res.ok) {
        const data = await res.json();
        if (editing) {
          setTemplates((prev) => prev.map((t) => (t.id === editing.id ? data : t)));
          toast({ title: "แก้ไข template สำเร็จ" });
        } else {
          setTemplates((prev) => [data, ...prev]);
          toast({ title: "สร้าง template สำเร็จ" });
        }
        setDialogOpen(false);
      } else {
        const err = await res.json();
        toast({ title: "เกิดข้อผิดพลาด", description: err.error, variant: "destructive" });
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(t: Template) {
    if (!confirm(`ลบ template "${t.name}" ?`)) return;
    setDeletingId(t.id);
    try {
      const res = await fetch(`/api/templates/${t.id}`, { method: "DELETE" });
      if (res.ok) {
        setTemplates((prev) => prev.filter((x) => x.id !== t.id));
        toast({ title: "ลบ template แล้ว" });
      }
    } finally {
      setDeletingId(null);
    }
  }

  const filtered = templates.filter((t) => {
    const matchCat = categoryFilter === "all" || t.category === categoryFilter;
    const matchSearch =
      !search ||
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.content.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold">ข้อความด่วน</h1>
          <p className="text-sm text-muted-foreground">
            จัดการ template ข้อความตอบกลับด่วน พิมพ์ / ในแชทเพื่อใช้งาน
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" />
          เพิ่ม Template
        </Button>
      </div>

      {/* Filters */}
      <div className="mb-4 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9 rounded-lg"
            placeholder="ค้นหา template..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.value}
              onClick={() => setCategoryFilter(cat.value)}
              className={cn(
                "rounded-full px-2.5 py-1 text-xs font-medium transition-colors border",
                categoryFilter === cat.value
                  ? "bg-primary text-primary-foreground border-transparent"
                  : "bg-muted text-muted-foreground border-transparent hover:bg-muted/80"
              )}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Template list */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16">
          <MessageSquareText className="h-10 w-10 text-muted-foreground/30" />
          <p className="mt-3 text-sm text-muted-foreground">ยังไม่มี template</p>
          <Button variant="outline" className="mt-3" onClick={openCreate}>
            <Plus className="mr-2 h-4 w-4" />
            สร้าง Template แรก
          </Button>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((t) => (
            <div
              key={t.id}
              className="rounded-lg border bg-card p-4 space-y-2 transition-all"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-medium text-sm truncate">{t.name}</p>
                  {t.shortcut && (
                    <div className="flex items-center gap-1 mt-0.5">
                      <Zap className="h-3 w-3 text-yellow-500" />
                      <code className="bg-muted rounded px-1.5 py-0.5 text-xs font-mono text-muted-foreground">/{t.shortcut}</code>
                    </div>
                  )}
                </div>
                <span className={cn("shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium", CATEGORY_COLORS[t.category])}>
                  {t.category}
                </span>
              </div>

              <p className="text-sm text-muted-foreground line-clamp-3 whitespace-pre-wrap">
                {t.content}
              </p>

              <div className="flex items-center justify-between pt-1">
                <span className="text-xs text-muted-foreground">ใช้ {t.usageCount} ครั้ง</span>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(t)}>
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={() => handleDelete(t)}
                    disabled={deletingId === t.id}
                  >
                    {deletingId === t.id ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Trash2 className="h-3.5 w-3.5" />
                    )}
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg rounded-xl">
          <DialogHeader>
            <DialogTitle>{editing ? "แก้ไข Template" : "สร้าง Template ใหม่"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>ชื่อ Template</Label>
              <Input
                className="rounded-lg"
                placeholder="เช่น ทักทายลูกค้าใหม่"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>หมวดหมู่</Label>
                <Select
                  value={form.category}
                  onValueChange={(v) => setForm((f) => ({ ...f, category: v as Template["category"] }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.filter((c) => c.value !== "all").map((c) => (
                      <SelectItem key={c.value} value={c.value}>
                        {c.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Shortcut (ไม่บังคับ)</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">/</span>
                  <Input
                    className="pl-6"
                    placeholder="สวัสดี"
                    value={form.shortcut}
                    onChange={(e) => setForm((f) => ({ ...f, shortcut: e.target.value }))}
                  />
                </div>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>เนื้อหา</Label>
              <Textarea
                placeholder="สวัสดีครับ/ค่ะ {customer_name} ยินดีให้บริการ..."
                className="min-h-[120px] resize-none"
                value={form.content}
                onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
              />
              <p className="text-xs text-muted-foreground">
                ตัวแปร: {"{customer_name}"}, {"{order_id}"}, {"{channel_name}"}
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>ยกเลิก</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editing ? "บันทึก" : "สร้าง"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
