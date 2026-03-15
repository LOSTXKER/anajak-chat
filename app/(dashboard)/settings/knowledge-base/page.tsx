"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  BookOpen, Plus, Pencil, Trash2, Upload, Search, Loader2,
  ChevronLeft, ChevronRight, Sparkles, RefreshCw, Tag,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { th } from "date-fns/locale";

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
  const { toast } = useToast();
  const [articles, setArticles] = useState<Article[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState("");
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [showDialog, setShowDialog] = useState(false);
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

  function openNew() { setEditing(EMPTY); setShowDialog(true); }
  function openEdit(a: Article) { setEditing(a); setShowDialog(true); }

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
        toast({ title: isNew ? "สร้างบทความแล้ว" : "บันทึกแล้ว" });
        setShowDialog(false);
        fetchArticles();
      } else {
        const err = await res.json() as { error: string };
        toast({ title: "Error", description: err.error, variant: "destructive" });
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("ลบบทความนี้?")) return;
    const res = await fetch(`/api/knowledge-base/${id}`, { method: "DELETE" });
    if (res.ok) { toast({ title: "ลบแล้ว" }); fetchArticles(); }
  }

  async function handleEmbed(id: string) {
    setEmbedding(id);
    const res = await fetch(`/api/knowledge-base/${id}/embed`, { method: "POST" });
    setEmbedding(null);
    if (res.ok) { toast({ title: "สร้าง embedding แล้ว" }); }
    else { toast({ title: "Error", variant: "destructive" }); }
  }

  async function handleEmbedAll() {
    setEmbeddingAll(true);
    const res = await fetch("/api/knowledge-base/embed-all", { method: "POST" });
    setEmbeddingAll(false);
    if (res.ok) {
      const data = await res.json() as { success: number; failed: number };
      toast({ title: `Embed เสร็จ ${data.success} บทความ (failed: ${data.failed})` });
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
      toast({ title: `Import สำเร็จ ${data.imported} บทความ (ข้าม ${data.skipped})` });
      fetchArticles();
    } else {
      toast({ title: "Import ล้มเหลว", variant: "destructive" });
    }
    e.target.value = "";
  }

  const totalPages = Math.ceil(total / PAGE_SIZE);
  const tagsStr = editing.tags.join(", ");

  return (
    <div className="overflow-auto h-full">
      <div>
        {/* Header */}
        <div className="mb-6 flex items-center justify-between gap-3">
          <div>
            <h1 className="text-lg font-semibold flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              ฐานความรู้
            </h1>
            <p className="text-sm text-muted-foreground">ฐานความรู้สำหรับ AI อ้างอิงในการตอบลูกค้า</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Button variant="outline" size="sm" onClick={handleEmbedAll} disabled={embeddingAll}>
              {embeddingAll ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
              Embed ทั้งหมด
            </Button>
            <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()}>
              <Upload className="mr-2 h-4 w-4" />
              Import CSV
            </Button>
            <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={handleImport} />
            <Button size="sm" onClick={openNew} className="bg-foreground text-background hover:bg-foreground/90">
              <Plus className="mr-2 h-4 w-4" />
              เพิ่มบทความ
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-4 flex flex-wrap gap-2 items-center">
          <div className="flex gap-1">
            {CATEGORIES.map((c) => (
              <button
                key={c.value}
                onClick={() => { setCategory(c.value); setPage(1); }}
                className={cn(
                  "rounded-full px-2.5 py-0.5 text-xs font-medium border transition-colors",
                  category === c.value
                    ? "bg-foreground text-background border-transparent"
                    : "bg-background border-border hover:bg-muted"
                )}
              >
                {c.label}
              </button>
            ))}
          </div>
          <div className="ml-auto flex items-center gap-2">
            <form onSubmit={(e) => { e.preventDefault(); setSearch(searchInput); setPage(1); }}>
              <div className="relative">
                <Search className="absolute left-2.5 top-2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="ค้นหา..."
                  className="pl-8 h-8 w-48"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                />
              </div>
            </form>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={fetchArticles}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Article Table */}
        {loading ? (
          <div className="flex items-center gap-2 py-10 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
            กำลังโหลด...
          </div>
        ) : articles.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16">
            <BookOpen className="h-10 w-10 text-muted-foreground/30" />
            <p className="mt-3 text-sm text-muted-foreground">ยังไม่มีบทความ</p>
            <Button size="sm" className="mt-3" onClick={openNew}><Plus className="mr-2 h-4 w-4" />เพิ่มบทความแรก</Button>
          </div>
        ) : (
          <>
            <div className="rounded-xl border overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="px-3 py-2.5 text-left text-xs text-muted-foreground font-medium">ชื่อบทความ</th>
                    <th className="px-3 py-2.5 text-left text-xs text-muted-foreground font-medium">หมวด</th>
                    <th className="px-3 py-2.5 text-left text-xs text-muted-foreground font-medium">Tags</th>
                    <th className="px-3 py-2.5 text-left text-xs text-muted-foreground font-medium">ใช้งาน</th>
                    <th className="px-3 py-2.5 text-center text-xs text-muted-foreground font-medium w-8">สถานะ</th>
                    <th className="px-3 py-2.5 text-left text-xs text-muted-foreground font-medium">อัปเดต</th>
                    <th className="px-3 py-2.5 w-28"></th>
                  </tr>
                </thead>
                <tbody>
                  {articles.map((a) => (
                    <tr key={a.id} className="border-b last:border-b-0 hover:bg-muted/30 transition-colors">
                      <td className="px-3 py-2.5 font-medium max-w-[220px] truncate">{a.title}</td>
                      <td className="px-3 py-2.5">
                        <span className="rounded-full bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400 px-2 py-0.5 text-[10px] font-medium">
                          {CATEGORIES.find((c) => c.value === a.category)?.label ?? a.category}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-xs text-muted-foreground">
                        {a.tags.slice(0, 2).join(", ")}{a.tags.length > 2 ? ` +${a.tags.length - 2}` : ""}
                      </td>
                      <td className="px-3 py-2.5 text-xs text-muted-foreground">{a.usageCount} ครั้ง</td>
                      <td className="px-3 py-2.5 text-center">
                        <span className={cn("w-2 h-2 rounded-full inline-block", a.isActive ? "bg-green-500" : "bg-gray-300")} />
                      </td>
                      <td className="px-3 py-2.5 text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(a.updatedAt), { addSuffix: true, locale: th })}
                      </td>
                      <td className="px-3 py-2.5">
                        <div className="flex items-center gap-1 justify-end">
                          <Button variant="ghost" size="icon" className="h-7 w-7" title="Embed" onClick={() => handleEmbed(a.id)} disabled={embedding === a.id}>
                            {embedding === a.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(a)}>
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500 hover:text-red-600" onClick={() => handleDelete(a.id)}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="mt-3 flex items-center justify-between text-sm">
                <span className="text-xs text-muted-foreground">{(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, total)} จาก {total}</span>
                <div className="flex items-center gap-1">
                  <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => setPage((p) => Math.max(p - 1, 1))} disabled={page === 1}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="px-2 text-xs">{page}/{totalPages}</span>
                  <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => setPage((p) => Math.min(p + 1, totalPages))} disabled={page === totalPages}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}

        {/* Article Dialog */}
        {showDialog && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="w-full max-w-lg rounded-xl border bg-background shadow-xl p-6 mx-4">
              <h2 className="text-lg font-semibold mb-4">{editing.id ? "แก้ไขบทความ" : "เพิ่มบทความใหม่"}</h2>
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label>ชื่อบทความ</Label>
                  <Input className="rounded-lg" value={editing.title} onChange={(e) => setEditing((prev) => ({ ...prev, title: e.target.value }))} placeholder="เช่น นโยบายการคืนสินค้า" />
                </div>
                <div className="space-y-1.5">
                  <Label>หมวดหมู่</Label>
                  <select
                    className="w-full h-9 rounded-lg border bg-background px-3 text-sm"
                    value={editing.category}
                    onChange={(e) => setEditing((prev) => ({ ...prev, category: e.target.value }))}
                  >
                    {CATEGORIES.filter((c) => c.value).map((c) => (
                      <option key={c.value} value={c.value}>{c.label}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label>เนื้อหา</Label>
                  <Textarea
                    rows={6}
                    value={editing.content}
                    onChange={(e) => setEditing((prev) => ({ ...prev, content: e.target.value }))}
                    placeholder="เนื้อหาที่ AI จะใช้อ้างอิง..."
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="flex items-center gap-1"><Tag className="h-3.5 w-3.5" /> Tags (คั่นด้วยจุลภาค)</Label>
                  <Input
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
                <div className="flex items-center gap-2">
                  <Switch checked={editing.isActive} onCheckedChange={(v) => setEditing((prev) => ({ ...prev, isActive: v }))} />
                  <Label>เปิดใช้งาน</Label>
                </div>
              </div>
              <div className="mt-6 flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowDialog(false)}>ยกเลิก</Button>
                <Button className="bg-foreground text-background hover:bg-foreground/90" onClick={handleSave} disabled={saving || !editing.title || !editing.content}>
                  {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  บันทึก
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
