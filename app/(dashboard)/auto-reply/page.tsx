"use client";

import { useState } from "react";
import { Plus, Loader2, Bot, MessageSquare, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { SearchInput } from "@/components/ui/search-input";
import { EmptyState } from "@/components/empty-state";
import { useCrud } from "@/hooks/use-crud";
import { cn } from "@/lib/utils";
import { MessageSetEditor } from "./_components/message-set-editor";
import { emptyMessages, getPattern } from "./_types";
import type { MessageSetItem } from "./_types";

function formatTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "เมื่อสักครู่";
  if (mins < 60) return `${mins} นาทีที่แล้ว`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} ชม.ที่แล้ว`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days} วันที่แล้ว`;
  return new Date(dateStr).toLocaleDateString("th-TH", { day: "numeric", month: "short" });
}

function countBubbles(set: MessageSetItem): number {
  return getPattern(set.messages, "_default").messages?.length ?? 0;
}

function hasPlatformOverride(set: MessageSetItem): string[] {
  const platforms: string[] = [];
  if (set.messages.line?.messages?.length) platforms.push("LINE");
  if (set.messages.facebook?.messages?.length) platforms.push("FB");
  if (set.messages.instagram?.messages?.length) platforms.push("IG");
  return platforms;
}

export default function MessageSetsPage() {
  const { items: sets, loading, create, update, remove } = useCrud<MessageSetItem>("/api/message-sets", { toastOnSuccess: false });
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [newName, setNewName] = useState("");

  const effectiveId = selectedId ?? (sets.length > 0 ? sets[0].id : null);
  const selected = sets.find((s) => s.id === effectiveId) ?? null;
  const filtered = sets.filter((s) => s.name.toLowerCase().includes(search.toLowerCase()));

  async function handleCreate() {
    if (!newName.trim()) return;
    const created = await create({ name: newName.trim(), messages: emptyMessages() } as Partial<MessageSetItem>);
    if (created) {
      setSelectedId(created.id);
      setCreateOpen(false);
      setNewName("");
    }
  }

  async function handleDelete(id: string) {
    const ok = await remove(id);
    if (ok && selectedId === id) {
      setSelectedId(sets.find((s) => s.id !== id)?.id ?? null);
    }
  }

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex h-full">
      {/* List */}
      <div className="flex w-[320px] shrink-0 flex-col border-r">
        <div className="space-y-3 border-b p-4">
          <div>
            <h1 className="heading-page">ชุดข้อความ</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              สร้างและจัดการข้อความสำหรับบอทหรือส่งให้ลูกค้า · {sets.length} ชุด
            </p>
          </div>
          <Button className="w-full" onClick={() => setCreateOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />สร้างชุดข้อความ
          </Button>
          <SearchInput value={search} onChange={setSearch} />
        </div>
        <div className="flex-1 overflow-y-auto p-2">
          {filtered.length === 0 ? (
            <EmptyState
              icon={Bot}
              message="ยังไม่มีชุดข้อความ"
              description="สร้างชุดข้อความแรกเพื่อใช้กับบอทหรือส่งให้ลูกค้า"
              action={
                <Button size="sm" onClick={() => setCreateOpen(true)}>
                  <Plus className="mr-1.5 h-3.5 w-3.5" />สร้างชุดข้อความ
                </Button>
              }
              className="py-12 border-0"
            />
          ) : (
            <div className="space-y-1">
              {filtered.map((set) => {
                const bubbles = countBubbles(set);
                const platforms = hasPlatformOverride(set);
                const intents = set._count?.intentLinks ?? 0;
                const isSelected = effectiveId === set.id;

                return (
                  <button
                    key={set.id}
                    onClick={() => setSelectedId(set.id)}
                    className={cn(
                      "flex w-full items-start gap-3 rounded-xl px-3 py-3 text-left transition-all",
                      isSelected
                        ? "bg-primary/8 ring-1 ring-primary/20"
                        : "hover:bg-muted/50"
                    )}
                  >
                    <div className={cn(
                      "mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-colors",
                      isSelected ? "bg-primary/15" : "bg-muted"
                    )}>
                      <MessageSquare className={cn("h-4 w-4", isSelected ? "text-primary" : "text-muted-foreground")} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium">{set.name}</div>
                      <div className="mt-1 flex flex-wrap items-center gap-1.5">
                        <span className="inline-flex items-center gap-1 rounded-md bg-muted px-1.5 py-0.5 text-[11px] font-medium text-muted-foreground">
                          <Layers className="h-3 w-3" />
                          {bubbles} บับเบิ้ล
                        </span>
                        {intents > 0 && (
                          <span className="inline-flex items-center gap-1 rounded-md bg-primary/10 px-1.5 py-0.5 text-[11px] font-medium text-primary">
                            {intents} บอทที่ใช้
                          </span>
                        )}
                        {platforms.map((p) => (
                          <span key={p} className="rounded-md bg-muted px-1.5 py-0.5 text-[11px] font-medium text-muted-foreground">
                            {p}
                          </span>
                        ))}
                      </div>
                      <div className="mt-1 text-[11px] text-muted-foreground/60">
                        อัพเดท {formatTimeAgo(set.updatedAt)}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Editor */}
      <div className="flex-1 overflow-y-auto">
        {selected ? (
          <MessageSetEditor
            set={selected}
            onUpdate={(data) => update(selected.id, data)}
            onDelete={() => handleDelete(selected.id)}
          />
        ) : (
          <EmptyState
            icon={MessageSquare}
            message="เลือกชุดข้อความ"
            description="เลือกชุดข้อความจากรายการด้านซ้ายเพื่อแก้ไข หรือสร้างชุดข้อความใหม่"
            className="h-full border-0"
          />
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
