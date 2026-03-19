"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  BookOpen, Plus, Trash2, Upload, Search, Loader2,
  ChevronLeft, ChevronRight, Sparkles, RefreshCw, Tag, X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { th } from "date-fns/locale";
import { EmptyState } from "@/components/empty-state";

interface Article {
  id: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  isActive: boolean;
  usageCount: number;
  createdAt: string;
  updatedAt: string;
}

const CATEGORIES = [
  { value: "", label: "ทั้งหมด" },
  { value: "faq", label: "FAQ" },
  { value: "product", label: "สินค้า" },
  { value: "policy", label: "นโยบาย" },
  { value: "promotion", label: "โปรโมชั่น" },
  { value: "store_info", label: "ข้อมูลร้าน" },
  { value: "other", label: "อื่นๆ" },
];

const PAGE_SIZE = 20;
const EMPTY: Article = { id: "", title: "", content: "", category: "faq", tags: [], isActive: true, usageCount: 0, createdAt: "", updatedAt: "" };

export default function KnowledgeBasePage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState("");
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [selected, setSelected] = useState<Article | null>(null);
  const [editing, setEditing] = useState<Article>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [embedding, setEmbedding] = useState<string | null>(null);
  const [embeddingAll, setEmbeddingAll] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const fetchArticles = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: String(PAGE_SIZE), activeOnly: "false" });
    if (category) params.set("category", category);
    if (search) params.set("q", search);
    const res = await fetch(`/api/knowledge-base?${params}`);
    if (res.ok) {
      const data = await res.json() as { articles: Article[]; total: number };
      setArticles(data.articles);
      setTotal(data.total);
    }
    setLoading(false);
  }, [page, category, search]);

  useEffect(() => { fetchArticles(); }, [fetchArticles]);

  function openNew() {
    setSelected(null);
    setEditing(EMPTY);
  }

  function selectArticle(a: Article) {
    setSelected(a);
    setEditing({ ...a });
  }

  async function handleSave() {
    setSaving(true);
    try {
      const isNew = !editing.id;
      const res = await fetch(isNew ? "/api/knowledge-base" : `/api/knowledge-base/${editing.id}`, {
        method: isNew ? "POST" : "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: editing.title,
          content: editing.content,
          category: editing.category,
          tags: editing.tags,
          isActive: editing.isActive,
        }),
      });
      if (res.ok) {
        toast.success(isNew ? "สร้างบทความแล้ว" : "บันทึกแล้ว");
        setSelected(null);
        setEditing(EMPTY);
        fetchArticles();
      } else {
        const err = await res.json() as { error: string };
        toast.error("เกิดข้อผิดพลาด", { description: err.error });
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("ลบบทความนี้?")) return;
    const res = await fetch(`/api/knowledge-base/${id}`, { method: "DELETE" });
    if (res.ok) {
      toast.success("ลบแล้ว");
      if (selected?.id === id) { setSelected(null); setEditing(EMPTY); }
      fetchArticles();
    }
  }

  async function handleEmbed(id: string) {
    setEmbedding(id);
    const res = await fetch(`/api/knowledge-base/${id}/embed`, { method: "POST" });
    setEmbedding(null);
    if (res.ok) toast.success("สร้าง embedding แล้ว");
    else toast.error("เกิดข้อผิดพลาด");
  }

  async function handleEmbedAll() {
    setEmbeddingAll(true);
    const res = await fetch("/api/knowledge-base/embed-all", { method: "POST" });
    setEmbeddingAll(false);
    if (res.ok) {
      const data = await res.json() as { success: number; failed: number };
      toast.success(`Embed เสร็จ ${data.success} บทความ (failed: ${data.failed})`);
    }
  }

  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/knowledge-base/import", { method: "POST", body: fd });
    if (res.ok) {
      const data = await res.json() as { imported: number; skipped: number };
      toast.success(`Import สำเร็จ ${data.imported} บทความ (ข้าม ${data.skipped})`);
      fetchArticles();
    } else {
      toast.error("Import ล้มเหลว");
    }
    e.target.value = "";
  }

  const totalPages = Math.ceil(total / PAGE_SIZE);
  const isEditing = selected !== null || editing.title !== "";
  const tagsStr = editing.tags.join(", ");

  return (
    <div className="flex h-full overflow-hidden">
      {/* Left: Article List */}
      <div className="w-[340px] shrink-0 border-r flex flex-col bg-card">
        <div className="p-4 space-y-3 border-b">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="heading-page">ฐานความรู้</h1>
              <p className="text-sm text-muted-foreground mt-1">จัดการบทความสำหรับ AI ใช้ตอบคำถาม</p>
              <p className="text-xs text-muted-foreground mt-0.5">{total} บทความ</p>
            </div>
            <div className="flex items-center gap-1">
              <Button variant="outline" size="sm" onClick={handleEmbedAll} disabled={embeddingAll}>
                {embeddingAll ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
              </Button>
              <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()}>
                <Upload className="h-3.5 w-3.5" />
              </Button>
              <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={handleImport} />
            </div>
          </div>

          <Button size="sm" className="w-full" onClick={openNew}>
            <Plus className="h-4 w-4 mr-2" />
            เพิ่มบทความ
          </Button>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="ค้นหาบทความ..."
              className="pl-9 text-sm"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") { setSearch(searchInput); setPage(1); } }}
            />
          </div>

          <div className="flex gap-1 flex-wrap">
            {CATEGORIES.map((c) => (
              <button
                key={c.value}
                onClick={() => { setCategory(c.value); setPage(1); }}
                className={cn(
                  "rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
                  category === c.value
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
          ) : articles.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center px-4">
              <BookOpen className="h-8 w-8 text-muted-foreground mb-3" />
              <p className="text-sm font-medium">ไม่พบบทความ</p>
              <p className="text-xs text-muted-foreground mt-1">ลองเปลี่ยนหมวดหมู่หรือค้นหาใหม่</p>
            </div>
          ) : (
            <div className="divide-y">
              {articles.map((a) => (
                <button
                  key={a.id}
                  onClick={() => selectArticle(a)}
                  className={cn(
                    "w-full text-left px-4 py-3 transition-colors hover:bg-muted/50",
                    selected?.id === a.id && "bg-primary/5 border-l-2 border-l-primary"
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className={cn("h-1.5 w-1.5 rounded-full shrink-0", a.isActive ? "bg-primary" : "bg-muted-foreground/30")} />
                        <p className="text-sm font-medium truncate">{a.title}</p>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{a.content}</p>
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                          {CATEGORIES.find((c) => c.value === a.category)?.label}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(a.updatedAt), { addSuffix: true, locale: th })}
                        </span>
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {totalPages > 1 && (
          <div className="border-t px-4 py-2 flex items-center justify-between">
            <span className="text-xs text-muted-foreground">{page}/{totalPages}</span>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon-sm" onClick={() => setPage((p) => Math.max(p - 1, 1))} disabled={page === 1}>
                <ChevronLeft className="h-3.5 w-3.5" />
              </Button>
              <Button variant="ghost" size="icon-sm" onClick={() => setPage((p) => Math.min(p + 1, totalPages))} disabled={page === totalPages}>
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Right: Editor */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {!isEditing ? (
          <div className="flex-1 flex items-center justify-center">
            <EmptyState
              icon={BookOpen}
              message="เลือกบทความเพื่อแก้ไข"
              description="เลือกจากรายการทางซ้าย หรือสร้างบทความใหม่"
              action={
                <Button size="sm" className="rounded-lg" onClick={openNew}>
                  <Plus className="h-4 w-4 mr-2" />
                  สร้างบทความใหม่
                </Button>
              }
            />
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between border-b px-6 py-3">
              <h2 className="heading-card">
                {editing.id ? "แก้ไขบทความ" : "บทความใหม่"}
              </h2>
              <div className="flex items-center gap-2">
                {editing.id && (
                  <>
                    <Button variant="ghost" size="sm" onClick={() => handleEmbed(editing.id)} disabled={embedding === editing.id}>
                      {embedding === editing.id ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : <Sparkles className="h-3.5 w-3.5 mr-1" />}
                      Embed
                    </Button>
                    <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => handleDelete(editing.id)}>
                      <Trash2 className="h-3.5 w-3.5 mr-1" />
                      ลบ
                    </Button>
                  </>
                )}
                <Button variant="ghost" size="icon-sm" onClick={() => { setSelected(null); setEditing(EMPTY); }}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-5">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">ชื่อบทความ</Label>
                  <Input
                    className="rounded-lg"
                    value={editing.title}
                    onChange={(e) => setEditing((prev) => ({ ...prev, title: e.target.value }))}
                    placeholder="เช่น นโยบายการคืนสินค้า"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">หมวดหมู่</Label>
                    <select
                      className="w-full border bg-background px-3 text-sm"
                      value={editing.category}
                      onChange={(e) => setEditing((prev) => ({ ...prev, category: e.target.value }))}
                    >
                      {CATEGORIES.filter((c) => c.value).map((c) => (
                        <option key={c.value} value={c.value}>{c.label}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium flex items-center gap-1">
                      <Tag className="h-3.5 w-3.5" /> Tags
                    </Label>
                    <Input
                      className="rounded-lg"
                      value={tagsStr}
                      onChange={(e) =>
                        setEditing((prev) => ({
                          ...prev,
                          tags: e.target.value.split(",").map((t) => t.trim()).filter(Boolean),
                        }))
                      }
                      placeholder="คืนสินค้า, นโยบาย, refund"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">เนื้อหา</Label>
                  <Textarea
                    className="min-h-[300px] rounded-lg"
                    value={editing.content}
                    onChange={(e) => setEditing((prev) => ({ ...prev, content: e.target.value }))}
                    placeholder="เนื้อหาที่ AI จะใช้อ้างอิง..."
                  />
                </div>

                <div className="flex items-center gap-2">
                  <Switch
                    checked={editing.isActive}
                    onCheckedChange={(v) => setEditing((prev) => ({ ...prev, isActive: v }))}
                  />
                  <Label className="text-sm">เปิดใช้งาน</Label>
                </div>
              </div>
            </div>

            <div className="border-t px-6 py-3 flex justify-end gap-2">
              <Button variant="outline" className="rounded-lg" onClick={() => { setSelected(null); setEditing(EMPTY); }}>
                ยกเลิก
              </Button>
              <Button className="rounded-lg" onClick={handleSave} disabled={saving || !editing.title || !editing.content}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                บันทึก
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
