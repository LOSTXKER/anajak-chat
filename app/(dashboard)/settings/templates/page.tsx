"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, Search, Loader2, MessageSquareText, Zap, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { EmptyState } from "@/components/empty-state";

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

const emptyForm = { name: "", content: "", category: "custom" as Template["category"], shortcut: "" };

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [selected, setSelected] = useState<Template | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => { fetchTemplates(); }, []);

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

  function openNew() {
    setSelected(null);
    setForm(emptyForm);
  }

  function selectTemplate(t: Template) {
    setSelected(t);
    setForm({ name: t.name, content: t.content, category: t.category, shortcut: t.shortcut ?? "" });
  }

  function closeEditor() {
    setSelected(null);
    setForm(emptyForm);
  }

  async function handleSave() {
    if (!form.name.trim() || !form.content.trim()) {
      toast.error("กรุณากรอก ชื่อ และ เนื้อหา");
      return;
    }
    setSaving(true);
    try {
      const payload = { ...form, shortcut: form.shortcut || null };
      let res: Response;
      if (selected) {
        res = await fetch(`/api/templates/${selected.id}`, {
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
        if (selected) {
          setTemplates((prev) => prev.map((t) => (t.id === selected.id ? data : t)));
          toast.success("แก้ไข template สำเร็จ");
        } else {
          setTemplates((prev) => [data, ...prev]);
          toast.success("สร้าง template สำเร็จ");
        }
        closeEditor();
      } else {
        const err = await res.json();
        toast.error("เกิดข้อผิดพลาด", { description: err.error });
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
        if (selected?.id === t.id) closeEditor();
        toast.success("ลบ template แล้ว");
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

  const isEditing = selected !== null || form.name !== "";

  return (
    <div className="flex h-full overflow-hidden">
      {/* Left: Template List */}
      <div className="w-[340px] shrink-0 border-r flex flex-col bg-card">
        <div className="p-4 space-y-3 border-b">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="heading-page">ข้อความด่วน</h1>
              <p className="text-sm text-muted-foreground mt-1">สร้างข้อความสำเร็จรูปเพื่อตอบกลับรวดเร็ว</p>
              <p className="text-xs text-muted-foreground mt-0.5">{templates.length} template</p>
            </div>
          </div>

          <Button size="sm" className="w-full" onClick={openNew}>
            <Plus className="h-4 w-4 mr-2" />
            เพิ่ม Template
          </Button>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="ค้นหา template..."
              className="pl-9 text-sm"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="flex gap-1 flex-wrap">
            {CATEGORIES.map((c) => (
              <button
                key={c.value}
                onClick={() => setCategoryFilter(c.value)}
                className={cn(
                  "rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
                  categoryFilter === c.value
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted"
                )}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-10 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center px-4">
              <MessageSquareText className="h-8 w-8 text-muted-foreground mb-3" />
              <p className="text-sm font-medium">ไม่พบ template</p>
              <p className="text-xs text-muted-foreground mt-1">ลองค้นหาหรือเปลี่ยนหมวดหมู่</p>
            </div>
          ) : (
            <div className="divide-y">
              {filtered.map((t) => (
                <button
                  key={t.id}
                  onClick={() => selectTemplate(t)}
                  className={cn(
                    "w-full text-left px-4 py-3 transition-colors hover:bg-muted/50",
                    selected?.id === t.id && "bg-primary/5 border-l-2 border-l-primary"
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{t.name}</p>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{t.content}</p>
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                          {CATEGORIES.find((c) => c.value === t.category)?.label}
                        </span>
                        {t.shortcut && (
                          <code className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded font-mono">/{t.shortcut}</code>
                        )}
                        <span className="text-xs text-muted-foreground">{t.usageCount} ครั้ง</span>
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Right: Editor */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {!isEditing ? (
          <div className="flex-1 flex items-center justify-center">
            <EmptyState
              icon={MessageSquareText}
              message="เลือก template เพื่อแก้ไข"
              description="เลือกจากรายการทางซ้าย หรือสร้างใหม่"
              action={
                <Button size="sm" className="rounded-lg" onClick={openNew}>
                  <Plus className="h-4 w-4 mr-2" />
                  สร้าง Template ใหม่
                </Button>
              }
            />
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between border-b px-6 py-3">
              <h2 className="heading-card">
                {selected ? "แก้ไข Template" : "Template ใหม่"}
              </h2>
              <div className="flex items-center gap-2">
                {selected && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive"
                    onClick={() => handleDelete(selected)}
                    disabled={deletingId === selected.id}
                  >
                    {deletingId === selected.id ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : <Trash2 className="h-3.5 w-3.5 mr-1" />}
                    ลบ
                  </Button>
                )}
                <Button variant="ghost" size="icon-sm" onClick={closeEditor}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-5">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">ชื่อ Template</Label>
                  <Input
                    className="rounded-lg"
                    placeholder="เช่น ทักทายลูกค้าใหม่"
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">หมวดหมู่</Label>
                    <Select
                      value={form.category}
                      onValueChange={(v) => setForm((f) => ({ ...f, category: v as Template["category"] }))}
                    >
                      <SelectTrigger className="rounded-lg">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {CATEGORIES.filter((c) => c.value !== "all").map((c) => (
                          <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">Shortcut (ไม่บังคับ)</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">/</span>
                      <Input
                        className="pl-6 rounded-lg"
                        placeholder="สวัสดี"
                        value={form.shortcut}
                        onChange={(e) => setForm((f) => ({ ...f, shortcut: e.target.value }))}
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">เนื้อหา</Label>
                  <Textarea
                    placeholder="สวัสดีครับ/ค่ะ {customer_name} ยินดีให้บริการ..."
                    className="min-h-[200px] resize-none rounded-lg text-sm"
                    value={form.content}
                    onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
                  />
                  <p className="text-xs text-muted-foreground">
                    ตัวแปร: {"{customer_name}"}, {"{order_id}"}, {"{channel_name}"}
                  </p>
                </div>

                {/* Preview */}
                {form.content && (
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">ตัวอย่างข้อความ</Label>
                    <div className="rounded-xl border bg-muted/20 p-4">
                      <p className="text-sm whitespace-pre-wrap leading-relaxed">{form.content}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="border-t px-6 py-3 flex justify-end gap-2">
              <Button variant="outline" className="rounded-lg" onClick={closeEditor}>
                ยกเลิก
              </Button>
              <Button className="rounded-lg" onClick={handleSave} disabled={saving || !form.name || !form.content}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {selected ? "บันทึก" : "สร้าง"}
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
