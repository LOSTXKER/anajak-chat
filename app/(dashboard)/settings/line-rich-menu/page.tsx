"use client";

import { useEffect, useState, useRef } from "react";
import {
  Plus,
  Trash2,
  Loader2,
  Upload,
  ArrowLeft,
  Pencil,
  Copy,
  Image,
} from "lucide-react";

import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { SegmentedControl } from "@/components/ui/segmented-control";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const SIZE_OPTIONS = [
  { value: "full" as const, label: "เต็มหน้าจอ" },
  { value: "half" as const, label: "ครึ่งหน้า" },
] as const;

const DISPLAY_OPTIONS = [
  { value: "show" as const, label: "แสดง" },
  { value: "hide" as const, label: "ซ่อน" },
] as const;

interface RichMenuArea {
  bounds: { x: number; y: number; width: number; height: number };
  action: { type: string; label?: string; text?: string; uri?: string; data?: string };
}

interface RichMenu {
  richMenuId: string;
  name: string;
  chatBarText: string;
  selected: boolean;
  size?: { width: number; height: number };
  areas: RichMenuArea[];
}

type ViewMode = "list" | "editor";

const AREA_LABELS = ["A", "B", "C", "D", "E", "F"];

export default function LineRichMenuPage() {
  const { toast } = useToast();
  const [menus, setMenus] = useState<RichMenu[]>([]);
  const [defaultId, setDefaultId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<ViewMode>("list");
  const topRef = useRef<HTMLDivElement>(null);

  // Editor
  const [editingId, setEditingId] = useState<string | null>(null);
  const [menuName, setMenuName] = useState("");
  const [chatBarText, setChatBarText] = useState("เมนู");
  const [menuSize, setMenuSize] = useState<"full" | "half">("full");
  const [showOnStart, setShowOnStart] = useState(true);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [areas, setAreas] = useState<Array<{ actionType: string; label: string; value: string }>>([]);
  const [saving, setSaving] = useState(false);
  const [applyingId, setApplyingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => { fetchMenus(); }, []);
  useEffect(() => { topRef.current?.scrollIntoView({ behavior: "instant" }); }, [view]);

  async function fetchMenus() {
    setLoading(true);
    try {
      const res = await fetch("/api/channels/line/rich-menu");
      if (res.ok) {
        const data = (await res.json()) as { menus: RichMenu[]; defaultRichMenuId: string | null };
        setMenus(data.menus);
        setDefaultId(data.defaultRichMenuId);
      }
    } finally {
      setLoading(false);
    }
  }

  function initAreas(count: number) {
    return AREA_LABELS.slice(0, count).map((l) => ({ actionType: "message", label: l, value: "" }));
  }

  function openCreate() {
    setEditingId(null);
    setMenuName("");
    setChatBarText("เมนู");
    setMenuSize("full");
    setShowOnStart(true);
    setImageFile(null);
    setImagePreview(null);
    setAreas(initAreas(6));
    setView("editor");
  }

  function openEdit(menu: RichMenu) {
    setEditingId(menu.richMenuId);
    setMenuName(menu.name);
    setChatBarText(menu.chatBarText);

    const isFull = (menu.size?.height ?? 1686) > 900;
    setMenuSize(isFull ? "full" : "half");
    setShowOnStart(menu.selected);
    setImageFile(null);
    setImagePreview(`/api/channels/line/rich-menu/image?id=${menu.richMenuId}`);

    const maxAreas = isFull ? 6 : 3;
    const mapped = menu.areas.slice(0, maxAreas).map((a, i) => ({
      actionType: a.action.type === "uri" ? "uri" : a.action.type === "postback" ? "postback" : "message",
      label: AREA_LABELS[i],
      value: a.action.uri ?? a.action.data ?? a.action.text ?? "",
    }));
    while (mapped.length < maxAreas) {
      mapped.push({ actionType: "message", label: AREA_LABELS[mapped.length], value: "" });
    }
    setAreas(mapped);
    setView("editor");
  }

  function handleSizeChange(size: "full" | "half") {
    setMenuSize(size);
    const count = size === "full" ? 6 : 3;
    setAreas((prev) => {
      const copy = [...prev];
      while (copy.length < count) copy.push({ actionType: "message", label: AREA_LABELS[copy.length], value: "" });
      return copy.slice(0, count);
    });
  }

  async function handleSave() {
    if (!menuName.trim()) { toast({ title: "กรุณาใส่ชื่อ", variant: "destructive" }); return; }
    if (!editingId && !imageFile) { toast({ title: "กรุณาเลือกรูปภาพ", variant: "destructive" }); return; }
    if (editingId && !imageFile) { toast({ title: "LINE API ต้องอัปโหลดรูปใหม่ทุกครั้งที่แก้ไข", variant: "destructive" }); return; }

    setSaving(true);
    const height = menuSize === "full" ? 1686 : 843;
    const areaCount = menuSize === "full" ? 6 : 3;
    const cols = 3;
    const rows = menuSize === "full" ? 2 : 1;
    const cellW = Math.floor(2500 / cols);
    const cellH = Math.floor(height / rows);

    const richMenuAreas: RichMenuArea[] = areas.slice(0, areaCount).map((area, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      return {
        bounds: { x: col * cellW, y: row * cellH, width: cellW, height: cellH },
        action: area.actionType === "uri"
          ? { type: "uri", label: area.label, uri: area.value || "https://example.com" }
          : area.actionType === "postback"
            ? { type: "postback", label: area.label, data: area.value || area.label }
            : { type: "message", label: area.label, text: area.value || area.label },
      };
    });

    const menu = {
      size: { width: 2500 as const, height: height as 1686 | 843 },
      selected: showOnStart,
      name: menuName,
      chatBarText,
      areas: richMenuAreas,
    };

    try {
      if (editingId) {
        await fetch("/api/channels/line/rich-menu", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ richMenuId: editingId }),
        });
      }

      const formData = new FormData();
      formData.append("menu", JSON.stringify(menu));
      formData.append("image", imageFile!);

      const res = await fetch("/api/channels/line/rich-menu", { method: "POST", body: formData });
      if (res.ok) {
        const data = (await res.json()) as { richMenuId: string };
        if (defaultId === editingId) {
          await fetch("/api/channels/line/rich-menu/apply", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ richMenuId: data.richMenuId }),
          });
        }
        toast({ title: "บันทึกสำเร็จ" });
        setView("list");
        fetchMenus();
      } else {
        const err = await res.json();
        toast({ title: "ไม่สำเร็จ", description: (err as { error?: string }).error, variant: "destructive" });
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleApply(richMenuId: string) {
    setApplyingId(richMenuId);
    try {
      const isActive = defaultId === richMenuId;
      const res = await fetch("/api/channels/line/rich-menu/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(isActive ? { remove: true } : { richMenuId }),
      });
      if (res.ok) {
        setDefaultId(isActive ? null : richMenuId);
        toast({ title: isActive ? "ปิด Launch แล้ว" : "Launch สำเร็จ" });
      }
    } finally {
      setApplyingId(null);
    }
  }

  async function handleDelete(richMenuId: string) {
    if (!confirm("ลบ Rich Menu นี้?")) return;
    setDeletingId(richMenuId);
    try {
      const res = await fetch("/api/channels/line/rich-menu", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ richMenuId }),
      });
      if (res.ok) {
        setMenus((prev) => prev.filter((m) => m.richMenuId !== richMenuId));
        if (defaultId === richMenuId) setDefaultId(null);
        toast({ title: "ลบสำเร็จ" });
      }
    } finally {
      setDeletingId(null);
    }
  }

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onload = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  }

  const areaCount = menuSize === "full" ? 6 : 3;
  const visibleAreas = areas.slice(0, areaCount);

  // ─── List View ─────────────────────────────────────────────────────────

  if (view === "list") {
    return (
      <div ref={topRef} className="h-full overflow-y-auto p-6">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="heading-page">Rich Menu</h1>
            <p className="text-sm text-muted-foreground mt-1">สร้างเมนูที่แสดงด้านล่างในห้องแชท LINE</p>
          </div>
          <Button onClick={openCreate} size="sm">
            <Plus className="h-4 w-4 mr-1.5" />
            สร้างริชเมนูใหม่
          </Button>
        </div>

        <div className="mt-6">
          {loading ? (
            <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
          ) : menus.length === 0 ? (
            <EmptyState
              icon={Image}
              message="ยังไม่มี Rich Menu"
              description="สร้าง Rich Menu เพื่อเริ่มใช้งาน"
              action={
                <Button onClick={openCreate} className="rounded-lg">
                  <Plus className="h-4 w-4 mr-1.5" />สร้าง Rich Menu แรก
                </Button>
              }
            />
          ) : (
            <div className="border rounded-xl overflow-hidden shadow-sm">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/20 text-left">
                    <th className="px-5 py-3 text-xs font-medium text-muted-foreground w-28">รูป</th>
                    <th className="px-5 py-3 text-xs font-medium text-muted-foreground">ชื่อ</th>
                    <th className="px-5 py-3 text-xs font-medium text-muted-foreground">ประเภท</th>
                    <th className="px-5 py-3 text-xs font-medium text-muted-foreground">สถานะ</th>
                    <th className="px-5 py-3 text-xs font-medium text-muted-foreground w-28"></th>
                  </tr>
                </thead>
                <tbody>
                  {menus.map((menu) => {
                    const isDefault = menu.richMenuId === defaultId;
                    return (
                      <tr key={menu.richMenuId} className="border-b last:border-b-0 hover:bg-muted/30 transition-colors">
                        <td className="px-5 py-3">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={`/api/channels/line/rich-menu/image?id=${menu.richMenuId}`}
                            alt={menu.name}
                            className="w-24 h-14 rounded-lg border object-cover bg-muted"
                            onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                          />
                        </td>
                        <td className="px-5 py-3">
                          <p className="font-semibold">{menu.name}</p>
                          <p className="text-xs text-muted-foreground">{menu.areas.length} ปุ่ม | แถบ: {menu.chatBarText}</p>
                        </td>
                        <td className="px-5 py-3"><span className="rounded-xl bg-muted px-2 py-0.5 text-xs font-medium">All Friend</span></td>
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-2">
                            <span className={cn("text-xs font-semibold", isDefault ? "text-primary" : "text-muted-foreground")}>
                              {isDefault ? "Launch" : "ปิด"}
                            </span>
                            <Switch checked={isDefault} onCheckedChange={() => handleApply(menu.richMenuId)} disabled={applyingId === menu.richMenuId} />
                          </div>
                        </td>
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-0.5 justify-end">
                            <Button variant="ghost" size="icon-sm" onClick={() => openEdit(menu)}><Pencil className="h-3.5 w-3.5" /></Button>
                            <Button variant="ghost" size="icon-sm" onClick={() => { navigator.clipboard.writeText(menu.richMenuId); toast({ title: "คัดลอก ID" }); }}><Copy className="h-3.5 w-3.5" /></Button>
                            <Button variant="ghost" size="icon-sm" className="text-destructive hover:bg-destructive/10" onClick={() => handleDelete(menu.richMenuId)} disabled={deletingId === menu.richMenuId}>
                              {deletingId === menu.richMenuId ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ─── Editor View ───────────────────────────────────────────────────────

  return (
    <div ref={topRef} className="h-full overflow-y-auto p-6">
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="icon-sm" onClick={() => setView("list")}><ArrowLeft className="h-4 w-4" /></Button>
        <div>
          <h1 className="heading-page">{editingId ? "แก้ไขริชเมนู" : "สร้างริชเมนูใหม่"}</h1>
          <p className="text-sm text-muted-foreground mt-1">ตั้งค่ารูปภาพและปุ่มกดสำหรับริชเมนู</p>
        </div>
      </div>

      <div className="flex gap-8 flex-col lg:flex-row">
        {/* ─── Left: Settings ─── */}
        <div className="flex-1 space-y-6 max-w-xl">

          {/* Card 1: Basic Info */}
          <div className="rounded-2xl border bg-card p-6 space-y-5">
            <h2 className="heading-section">ข้อมูลพื้นฐาน</h2>

            <div className="space-y-1.5">
              <Label>ชื่อ *</Label>
              <Input value={menuName} onChange={(e) => setMenuName(e.target.value.slice(0, 30))} placeholder="Welcome To Anajak T-Shirt" />
              <p className="text-xs text-muted-foreground">{menuName.length}/30 — ชื่อนี้ไว้จัดการภายใน ไม่แสดงให้ผู้ใช้เห็น</p>
            </div>

            <div className="space-y-2">
              <Label>ขนาดเมนู *</Label>
              <SegmentedControl
                options={SIZE_OPTIONS}
                value={menuSize}
                onChange={(v) => handleSizeChange(v as "full" | "half")}
                size="sm"
              />
            </div>

            <div className="space-y-1.5">
              <Label>ป้ายแถบเมนู *</Label>
              <Input value={chatBarText} onChange={(e) => setChatBarText(e.target.value)} placeholder="เมนู" className="max-w-xs" />
            </div>

            <div className="space-y-2">
              <Label>การแสดงเมนูเริ่มต้น *</Label>
              <SegmentedControl
                options={DISPLAY_OPTIONS}
                value={showOnStart ? "show" : "hide"}
                onChange={(v) => setShowOnStart(v === "show")}
                size="sm"
              />
            </div>
          </div>

          {/* Card 2: Template + Upload */}
          <div className="rounded-2xl border bg-card p-6 space-y-4">
            <h2 className="heading-section">เทมเพลตและรูปภาพ</h2>
            <div className="flex gap-5 items-start">
              <div className="space-y-2.5 shrink-0">
                <div className={cn(
                  "grid border rounded-xl overflow-hidden w-36",
                  menuSize === "full" ? "grid-cols-3 grid-rows-2 aspect-[2500/1686]" : "grid-cols-3 grid-rows-1 aspect-[2500/843]"
                )}>
                  {visibleAreas.map((area, i) => (
                    <div key={i} className="border border-border/50 flex items-center justify-center text-xs font-bold text-muted-foreground bg-muted/30">
                      {area.label}
                    </div>
                  ))}
                </div>
                <Button variant="outline" size="sm" className="w-full text-xs" onClick={() => handleSizeChange(menuSize === "full" ? "half" : "full")}>
                  เปลี่ยนเทมเพลต
                </Button>
              </div>

              <div className="space-y-3 flex-1">
                <label className="flex flex-col items-center gap-2 border border-dashed rounded-xl px-4 py-5 cursor-pointer hover:bg-muted/30 transition-colors">
                  <Upload className="h-5 w-5 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground font-medium">อัปโหลดรูปริชเมนู</span>
                  <input type="file" accept="image/jpeg,image/png" className="hidden" onChange={handleImageChange} />
                </label>
                {imageFile && <Badge variant="outline" className="text-xs"><Upload className="h-3.5 w-3.5 mr-1" />{imageFile.name}</Badge>}
                <p className="text-xs text-muted-foreground leading-relaxed">
                  รองรับ: jpg, jpeg, png<br />
                  ขนาดไฟล์: ไม่เกิน 1 MB<br />
                  ขนาดภาพ: 2500 x {menuSize === "full" ? "1686" : "843"} px
                </p>
              </div>
            </div>
          </div>

          {/* Card 3: Area Actions */}
          <div className="rounded-2xl border bg-card p-6 space-y-4">
            <h2 className="heading-section">ตั้งค่าปุ่มกด</h2>
            <div className="space-y-3">
              {visibleAreas.map((area, i) => (
                <div key={i} className="rounded-xl border bg-muted/20 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-xs font-bold text-primary">{area.label}</span>
                    <span className="text-xs text-muted-foreground">0 Click</span>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <Label className="w-16 shrink-0 text-xs">Action</Label>
                      <Select value={area.actionType} onValueChange={(v) => {
                        const u = [...areas]; u[i] = { ...u[i], actionType: v ?? "message" }; setAreas(u);
                      }}>
                        <SelectTrigger size="sm"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="message">Message</SelectItem>
                          <SelectItem value="uri">URL</SelectItem>
                          <SelectItem value="postback">Postback</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <p className="text-xs text-muted-foreground ml-[76px]">
                      {area.actionType === "uri" ? "เมื่อกดจะเปิด URL ที่กำหนด" : area.actionType === "postback" ? "เมื่อกดจะส่ง postback data" : "เมื่อกดจะส่งข้อความ"}
                    </p>
                    <div className="flex items-center gap-3">
                      <Label className="w-16 shrink-0 text-xs">ค่า</Label>
                      <Input className="h-8 text-sm" value={area.value} onChange={(e) => {
                        const u = [...areas]; u[i] = { ...u[i], value: e.target.value }; setAreas(u);
                      }} placeholder={area.actionType === "uri" ? "https://..." : "ข้อความ/data"} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <Button onClick={handleSave} disabled={saving} className="px-8 shadow-sm shadow-primary/25">
            {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            บันทึก
          </Button>
        </div>

        {/* ─── Right: Preview ─── */}
        <div className="lg:w-[340px] shrink-0">
          <h3 className="heading-card mb-3">ตัวอย่างริชเมนู</h3>
          <div className="rounded-2xl border overflow-hidden bg-card shadow-lg shadow-black/5 sticky top-6">
            <div className="bg-muted/60 px-4 py-2 border-b">
              <span className="text-xs font-medium">Your Account</span>
            </div>
            <div className="relative">
              {imagePreview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={imagePreview} alt="Rich Menu Preview" className="w-full" />
              ) : (
                <div className={cn("w-full bg-muted/20 flex items-center justify-center", menuSize === "full" ? "aspect-[2500/1686]" : "aspect-[2500/843]")}>
                  <Image className="h-10 w-10 text-muted-foreground/20" />
                </div>
              )}
              <div className={cn("absolute inset-0 grid", menuSize === "full" ? "grid-cols-3 grid-rows-2" : "grid-cols-3 grid-rows-1")}>
                {visibleAreas.map((area, i) => (
                  <div key={i} className="border border-white/20 flex items-center justify-center">
                    <span className="text-white text-lg font-bold drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)]">{area.label}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-muted/60 px-4 py-2.5 flex items-center justify-center border-t">
              <span className="text-xs font-medium text-muted-foreground">{chatBarText || "เมนู"} Menu</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
