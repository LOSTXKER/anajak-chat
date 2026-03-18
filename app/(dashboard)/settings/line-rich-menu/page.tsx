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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

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
      <div ref={topRef}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold">เมนู</h1>
            <Badge variant="outline" className="text-xs">Line</Badge>
          </div>
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4 mr-1.5" />
            สร้างริชเมนูใหม่
          </Button>
        </div>
        <p className="text-sm text-muted-foreground mb-6">สร้างเมนูที่แสดงด้านล่างในห้องแชท LINE ผู้ใช้สามารถกดปุ่มเพื่อส่งข้อความ เปิดลิ้งก์ หรือเรียก action ต่างๆ</p>

        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
        ) : menus.length === 0 ? (
          <div className="flex flex-col items-center py-16">
            <Image className="h-12 w-12 text-muted-foreground/20 mb-4" />
            <p className="text-muted-foreground mb-4">ยังไม่มี Rich Menu</p>
            <Button onClick={openCreate}><Plus className="h-4 w-4 mr-1.5" />สร้าง Rich Menu แรก</Button>
          </div>
        ) : (
          <div className="border rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/30 text-left">
                  <th className="px-4 py-2.5 text-xs font-medium text-muted-foreground w-28">รูป</th>
                  <th className="px-4 py-2.5 text-xs font-medium text-muted-foreground">ชื่อ</th>
                  <th className="px-4 py-2.5 text-xs font-medium text-muted-foreground">ประเภท</th>
                  <th className="px-4 py-2.5 text-xs font-medium text-muted-foreground">สถานะ</th>
                  <th className="px-4 py-2.5 text-xs font-medium text-muted-foreground w-28"></th>
                </tr>
              </thead>
              <tbody>
                {menus.map((menu) => {
                  const isDefault = menu.richMenuId === defaultId;
                  return (
                    <tr key={menu.richMenuId} className="border-b last:border-b-0 hover:bg-muted/20 transition-colors">
                      <td className="px-4 py-3">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={`/api/channels/line/rich-menu/image?id=${menu.richMenuId}`}
                          alt={menu.name}
                          className="w-24 h-14 rounded border object-cover bg-muted"
                          onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                        />
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-medium">{menu.name}</p>
                        <p className="text-xs text-muted-foreground">{menu.areas.length} ปุ่ม | แถบ: {menu.chatBarText}</p>
                      </td>
                      <td className="px-4 py-3"><span className="text-xs">All Friend</span></td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className={cn("text-xs font-medium", isDefault ? "text-green-600" : "text-muted-foreground")}>
                            {isDefault ? "Launch" : "ปิด"}
                          </span>
                          <Switch checked={isDefault} onCheckedChange={() => handleApply(menu.richMenuId)} disabled={applyingId === menu.richMenuId} />
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 justify-end">
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(menu)}><Pencil className="h-3.5 w-3.5" /></Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { navigator.clipboard.writeText(menu.richMenuId); toast({ title: "คัดลอก ID" }); }}><Copy className="h-3.5 w-3.5" /></Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDelete(menu.richMenuId)} disabled={deletingId === menu.richMenuId}>
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
    );
  }

  // ─── Editor View ───────────────────────────────────────────────────────

  return (
    <div ref={topRef}>
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setView("list")}><ArrowLeft className="h-4 w-4" /></Button>
        <div>
          <h1 className="text-lg font-bold">{editingId ? "แก้ไขริชเมนู" : "สร้างริชเมนูใหม่"}</h1>
          <p className="text-xs text-muted-foreground">Setting menu</p>
        </div>
      </div>

      <div className="flex gap-8 flex-col lg:flex-row">
        {/* ─── Left: Settings ─── */}
        <div className="flex-1 space-y-5 max-w-xl">
          <div className="space-y-1.5">
            <Label>ชื่อ *</Label>
            <Input value={menuName} onChange={(e) => setMenuName(e.target.value.slice(0, 30))} placeholder="Welcome To Anajak T-Shirt" />
            <p className="text-xs text-muted-foreground">{menuName.length}/30 — ชื่อนี้ไว้จัดการภายใน ไม่แสดงให้ผู้ใช้เห็น</p>
          </div>

          <div className="space-y-1.5">
            <Label>ข้อมูลพื้นฐาน *</Label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="radio" name="size" checked={menuSize === "full"} onChange={() => handleSizeChange("full")} className="h-4 w-4 accent-accent" />
                <span className="text-sm">เต็มหน้าจอ</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="radio" name="size" checked={menuSize === "half"} onChange={() => handleSizeChange("half")} className="h-4 w-4 accent-accent" />
                <span className="text-sm">ครึ่งหน้า</span>
              </label>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>ป้ายแถบเมนู *</Label>
            <Input value={chatBarText} onChange={(e) => setChatBarText(e.target.value)} placeholder="เมนู" className="max-w-xs" />
          </div>

          <div className="space-y-1.5">
            <Label>การแสดงเมนูเริ่มต้น *</Label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="radio" name="show" checked={showOnStart} onChange={() => setShowOnStart(true)} className="h-4 w-4 accent-accent" />
                <span className="text-sm">แสดง</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="radio" name="show" checked={!showOnStart} onChange={() => setShowOnStart(false)} className="h-4 w-4 accent-accent" />
                <span className="text-sm">ซ่อน</span>
              </label>
            </div>
          </div>

          {/* Template + Upload */}
          <div className="space-y-3">
            <Label>เลือกเทมเพลต</Label>
            <div className="flex gap-4 items-start">
              {/* Grid template */}
              <div className="space-y-2 shrink-0">
                <div className={cn(
                  "grid border-2 border-accent rounded-lg overflow-hidden w-40",
                  menuSize === "full" ? "grid-cols-3 grid-rows-2 aspect-[2500/1686]" : "grid-cols-3 grid-rows-1 aspect-[2500/843]"
                )}>
                  {visibleAreas.map((area, i) => (
                    <div key={i} className="border border-accent/30 flex items-center justify-center text-sm font-bold text-accent bg-accent/5">
                      {area.label}
                    </div>
                  ))}
                </div>
                <Button variant="outline" size="sm" className="w-full text-xs" onClick={() => handleSizeChange(menuSize === "full" ? "half" : "full")}>
                  เปลี่ยนเทมเพลต
                </Button>
              </div>

              {/* Upload */}
              <div className="space-y-2">
                <label className="flex flex-col items-center gap-2 border-2 border-dashed rounded-xl p-4 cursor-pointer hover:bg-muted/30 transition-colors w-full">
                  <Upload className="h-6 w-6 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground font-medium">อัปโหลดรูปริชเมนู</span>
                  <input type="file" accept="image/jpeg,image/png" className="hidden" onChange={handleImageChange} />
                </label>
                {imageFile && <Badge variant="outline" className="text-xs"><Upload className="h-3 w-3 mr-1" />{imageFile.name}</Badge>}
                <p className="text-[10px] text-muted-foreground leading-relaxed">
                  รองรับ: jpg, jpeg, png<br />
                  ขนาดไฟล์: ไม่เกิน 1 MB<br />
                  ขนาดภาพ: 2500 x {menuSize === "full" ? "1686" : "843"} px
                </p>
              </div>
            </div>
          </div>

          {/* Area actions */}
          <div className="space-y-3">
            <Label>ตั้งค่าการแสดงผล</Label>
            <div className="space-y-2">
              {visibleAreas.map((area, i) => (
                <div key={i} className="rounded-xl border p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-bold bg-accent/10 text-accent rounded-md px-2 py-0.5">{area.label}</span>
                    <span className="text-[10px] text-muted-foreground">0 Click</span>
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium w-14 shrink-0">Action</span>
                      <Select value={area.actionType} onValueChange={(v) => {
                        const u = [...areas]; u[i] = { ...u[i], actionType: v ?? "message" }; setAreas(u);
                      }}>
                        <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="message">Message</SelectItem>
                          <SelectItem value="uri">URL</SelectItem>
                          <SelectItem value="postback">Postback</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <p className="text-[10px] text-muted-foreground pl-16">
                      {area.actionType === "uri" ? "เมื่อกดจะเปิด URL ที่กำหนด" : area.actionType === "postback" ? "เมื่อกดจะส่ง postback data" : "เมื่อกดจะส่งข้อความ"}
                    </p>
                    <div className="flex items-center gap-2">
                      <span className="text-xs w-14 shrink-0" />
                      <Input className="h-8 text-xs" value={area.value} onChange={(e) => {
                        const u = [...areas]; u[i] = { ...u[i], value: e.target.value }; setAreas(u);
                      }} placeholder={area.actionType === "uri" ? "https://..." : "ข้อความ/data"} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <Button onClick={handleSave} disabled={saving} className="px-8">
            {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            บันทึก
          </Button>
        </div>

        {/* ─── Right: Preview ─── */}
        <div className="lg:w-[340px] shrink-0">
          <h3 className="text-sm font-semibold mb-3">ตัวอย่างริชเมนู</h3>
          <div className="rounded-2xl border overflow-hidden shadow-lg bg-card sticky top-4">
            <div className="bg-muted px-4 py-2 border-b">
              <span className="text-xs font-medium">Your Account</span>
            </div>
            <div className="relative">
              {imagePreview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={imagePreview} alt="Rich Menu Preview" className="w-full" />
              ) : (
                <div className={cn("w-full bg-muted/30 flex items-center justify-center", menuSize === "full" ? "aspect-[2500/1686]" : "aspect-[2500/843]")}>
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
            <div className="bg-muted px-4 py-2.5 flex items-center justify-center border-t">
              <span className="text-xs font-medium text-muted-foreground">{chatBarText || "เมนู"} Menu</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
