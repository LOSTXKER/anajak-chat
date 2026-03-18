"use client";

import { useEffect, useState } from "react";
import {
  LayoutGrid,
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

  // Editor state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [menuName, setMenuName] = useState("");
  const [chatBarText, setChatBarText] = useState("เมนู");
  const [menuSize, setMenuSize] = useState<"full" | "half">("full");
  const [showOnStart, setShowOnStart] = useState(true);
  const [target, setTarget] = useState<"all" | "specific">("all");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [areas, setAreas] = useState<Array<{ actionType: string; label: string; value: string }>>([
    { actionType: "message", label: "A", value: "" },
    { actionType: "message", label: "B", value: "" },
    { actionType: "message", label: "C", value: "" },
    { actionType: "message", label: "D", value: "" },
    { actionType: "message", label: "E", value: "" },
    { actionType: "message", label: "F", value: "" },
  ]);
  const [saving, setSaving] = useState(false);
  const [applyingId, setApplyingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => { fetchMenus(); }, []);

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

  function openCreate() {
    setEditingId(null);
    setMenuName("");
    setChatBarText("เมนู");
    setMenuSize("full");
    setShowOnStart(true);
    setTarget("all");
    setImageFile(null);
    setImagePreview(null);
    setAreas(AREA_LABELS.map((l) => ({ actionType: "message", label: l, value: "" })));
    setView("editor");
  }

  function openEdit(menu: RichMenu) {
    setEditingId(menu.richMenuId);
    setMenuName(menu.name);
    setChatBarText(menu.chatBarText);
    setMenuSize(menu.areas.length > 3 ? "full" : "half");
    setShowOnStart(menu.selected);
    setTarget("all");
    setImagePreview(null);
    setImageFile(null);

    const mapped = menu.areas.map((a, i) => ({
      actionType: a.action.type === "uri" ? "uri" : a.action.type === "postback" ? "postback" : "message",
      label: AREA_LABELS[i] ?? `${i + 1}`,
      value: a.action.uri ?? a.action.data ?? a.action.text ?? "",
    }));
    while (mapped.length < 6) {
      mapped.push({ actionType: "message", label: AREA_LABELS[mapped.length], value: "" });
    }
    setAreas(mapped.slice(0, 6));
    setView("editor");
  }

  async function handleSave() {
    if (!menuName.trim()) { toast({ title: "กรุณาใส่ชื่อ", variant: "destructive" }); return; }
    if (!editingId && !imageFile) { toast({ title: "กรุณาเลือกรูปภาพ", variant: "destructive" }); return; }

    setSaving(true);
    const height = menuSize === "full" ? 1686 : 843;
    const activeAreas = areas.filter((a) => a.value.trim());
    const cols = Math.min(activeAreas.length || 1, 3);
    const rows = Math.ceil((activeAreas.length || 1) / cols);
    const cellW = Math.floor(2500 / cols);
    const cellH = Math.floor(height / rows);

    const richMenuAreas: RichMenuArea[] = activeAreas.map((area, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      return {
        bounds: { x: col * cellW, y: row * cellH, width: cellW, height: cellH },
        action: area.actionType === "uri"
          ? { type: "uri", label: area.label, uri: area.value }
          : area.actionType === "postback"
            ? { type: "postback", label: area.label, data: area.value }
            : { type: "message", label: area.label, text: area.value },
      };
    });

    if (richMenuAreas.length === 0) {
      richMenuAreas.push({
        bounds: { x: 0, y: 0, width: 2500, height },
        action: { type: "message", label: "Menu", text: "menu" },
      });
    }

    const menu = {
      size: { width: 2500 as const, height: height as 1686 | 843 },
      selected: showOnStart,
      name: menuName,
      chatBarText,
      areas: richMenuAreas,
    };

    try {
      if (editingId) {
        // Delete old + create new (LINE API doesn't support edit)
        await fetch("/api/channels/line/rich-menu", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ richMenuId: editingId }),
        });
      }

      if (!imageFile) {
        toast({ title: "กรุณาอัปโหลดรูปภาพใหม่", variant: "destructive" });
        setSaving(false);
        return;
      }

      const formData = new FormData();
      formData.append("menu", JSON.stringify(menu));
      formData.append("image", imageFile);

      const res = await fetch("/api/channels/line/rich-menu", {
        method: "POST",
        body: formData,
      });
      if (res.ok) {
        toast({ title: editingId ? "อัปเดต Rich Menu สำเร็จ" : "สร้าง Rich Menu สำเร็จ" });
        setView("list");
        fetchMenus();
      } else {
        const data = await res.json();
        toast({ title: "ไม่สำเร็จ", description: (data as { error?: string }).error, variant: "destructive" });
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleApply(richMenuId: string) {
    setApplyingId(richMenuId);
    try {
      const res = await fetch("/api/channels/line/rich-menu/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(defaultId === richMenuId ? { remove: true } : { richMenuId }),
      });
      if (res.ok) {
        setDefaultId(defaultId === richMenuId ? null : richMenuId);
        toast({ title: defaultId === richMenuId ? "ยกเลิก Launch แล้ว" : "Launch สำเร็จ" });
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

  // ─── List View ───────────────────────────────────────────────────────────

  if (view === "list") {
    return (
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold">เมนู</h1>
            <Badge variant="outline" className="text-xs">Line</Badge>
          </div>
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4 mr-1.5" />
            สร้างริชเมนูใหม่
          </Button>
        </div>

        <p className="text-sm text-muted-foreground mb-6">
          สร้างเมนูที่แสดงด้านล่างในห้องแชท คุณสามารถใช้เมนูเพื่อเพิ่มปุ่มเรียก ลิ้งค์ข้อมูลข่าวสาร และอีกมาก มาดูกันว่าจะแสดงเมนูที่ไหนหน้าการจัดการนี้เลย
        </p>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : menus.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-center">
            <LayoutGrid className="h-12 w-12 text-muted-foreground/20 mb-4" />
            <p className="text-muted-foreground mb-4">ยังไม่มี Rich Menu</p>
            <Button onClick={openCreate}>
              <Plus className="h-4 w-4 mr-1.5" />
              สร้าง Rich Menu แรก
            </Button>
          </div>
        ) : (
          <div className="border rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/30 text-left">
                  <th className="px-4 py-2.5 text-xs font-medium text-muted-foreground w-24">รูป</th>
                  <th className="px-4 py-2.5 text-xs font-medium text-muted-foreground">ชื่อ</th>
                  <th className="px-4 py-2.5 text-xs font-medium text-muted-foreground">ประเภท</th>
                  <th className="px-4 py-2.5 text-xs font-medium text-muted-foreground">สถานะ</th>
                  <th className="px-4 py-2.5 text-xs font-medium text-muted-foreground">ปุ่ม</th>
                  <th className="px-4 py-2.5 text-xs font-medium text-muted-foreground w-32"></th>
                </tr>
              </thead>
              <tbody>
                {menus.map((menu) => {
                  const isDefault = menu.richMenuId === defaultId;
                  return (
                    <tr key={menu.richMenuId} className="border-b last:border-b-0 hover:bg-muted/20 transition-colors">
                      <td className="px-4 py-3">
                        <div className="w-20 h-12 rounded border bg-muted flex items-center justify-center">
                          <Image className="h-5 w-5 text-muted-foreground/30" />
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-medium">{menu.name}</p>
                        <p className="text-xs text-muted-foreground">แถบ: {menu.chatBarText}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs text-muted-foreground">All Friend</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className={cn("text-xs font-medium", isDefault ? "text-green-600" : "text-muted-foreground")}>
                            {isDefault ? "Launch" : "ปิด"}
                          </span>
                          <Switch
                            checked={isDefault}
                            onCheckedChange={() => handleApply(menu.richMenuId)}
                            disabled={applyingId === menu.richMenuId}
                          />
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs text-muted-foreground">{menu.areas.length} ปุ่ม</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 justify-end">
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(menu)}>
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { navigator.clipboard.writeText(menu.richMenuId); toast({ title: "คัดลอก ID แล้ว" }); }}>
                            <Copy className="h-3.5 w-3.5" />
                          </Button>
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

  // ─── Editor View ─────────────────────────────────────────────────────────

  const cols = menuSize === "half" ? 3 : 3;
  const rows = menuSize === "half" ? 1 : 2;
  const visibleAreas = areas.slice(0, cols * rows);

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setView("list")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-xl font-bold">{editingId ? "แก้ไขริชเมนู" : "สร้างริชเมนูใหม่"}</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr,360px] gap-6">
        {/* Left: Form */}
        <div className="space-y-5">
          {/* Name */}
          <div className="space-y-1.5">
            <Label>ชื่อ *</Label>
            <div className="flex items-center gap-2">
              <Input value={menuName} onChange={(e) => setMenuName(e.target.value)} placeholder="Welcome To Anajak T-Shirt" className="max-w-md" />
              <span className="text-xs text-muted-foreground">{menuName.length}/30</span>
            </div>
            <p className="text-xs text-muted-foreground">ชื่อนี้จะไม่แสดงให้ผู้ใช้เห็น มีไว้สำหรับจัดการภายในเท่านั้น</p>
          </div>

          {/* Size */}
          <div className="space-y-1.5">
            <Label>ข้อมูลพื้นฐาน *</Label>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="radio" name="size" checked={menuSize === "full"} onChange={() => { setMenuSize("full"); }} className="h-4 w-4" />
                <span className="text-sm">เต็มหน้าจอ</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="radio" name="size" checked={menuSize === "half"} onChange={() => { setMenuSize("half"); }} className="h-4 w-4" />
                <span className="text-sm">ครึ่งหน้า</span>
              </label>
            </div>
          </div>

          {/* Chat bar text */}
          <div className="space-y-1.5">
            <Label>ป้ายแถบเมนู *</Label>
            <Input value={chatBarText} onChange={(e) => setChatBarText(e.target.value)} placeholder="เมนู" className="max-w-xs" />
          </div>

          {/* Show on start */}
          <div className="space-y-1.5">
            <Label>การแสดงเมนูเริ่มต้น *</Label>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="radio" name="show" checked={showOnStart} onChange={() => setShowOnStart(true)} className="h-4 w-4" />
                <span className="text-sm">แสดง</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="radio" name="show" checked={!showOnStart} onChange={() => setShowOnStart(false)} className="h-4 w-4" />
                <span className="text-sm">ซ่อน</span>
              </label>
            </div>
          </div>

          {/* Target */}
          <div className="space-y-1.5">
            <Label>เป้าหมาย *</Label>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="radio" name="target" checked={target === "all"} onChange={() => setTarget("all")} className="h-4 w-4" />
                <span className="text-sm">ทุกคน</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="radio" name="target" checked={target === "specific"} onChange={() => setTarget("specific")} className="h-4 w-4" />
                <span className="text-sm">ผู้ใช้เฉพาะที่เลือกแล้ว</span>
              </label>
            </div>
          </div>

          {/* Template selector + upload */}
          <div className="space-y-3">
            <Label>ตั้งค่าการแสดงผล</Label>

            {/* Grid template visual */}
            <div className="flex items-start gap-4">
              <div className="space-y-2">
                <div className={cn(
                  "grid border-2 border-accent rounded-lg overflow-hidden",
                  menuSize === "full" ? "grid-cols-3 grid-rows-2 w-36 h-24" : "grid-cols-3 grid-rows-1 w-36 h-12"
                )}>
                  {visibleAreas.map((area, i) => (
                    <div key={i} className="border border-accent/30 flex items-center justify-center text-xs font-bold text-accent bg-accent/5">
                      {area.label}
                    </div>
                  ))}
                </div>

                <Button variant="outline" size="sm" className="w-full text-xs" onClick={() => setMenuSize(menuSize === "full" ? "half" : "full")}>
                  เปลี่ยนเทมเพลต
                </Button>

                <label className="flex items-center justify-center gap-2 w-full border border-dashed rounded-lg p-3 cursor-pointer hover:bg-muted/30 transition-colors">
                  <Upload className="h-4 w-4 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">อัปโหลดรูปริชเมนู</span>
                  <input type="file" accept="image/jpeg,image/png" className="hidden" onChange={handleImageChange} />
                </label>
                <p className="text-[10px] text-muted-foreground">
                  File Type : jpg, jpeg, png<br />
                  File Size : no more than 1mb<br />
                  Image Size : 2500 x {menuSize === "full" ? "1686" : "843"}
                </p>
              </div>

              {/* Area action configs */}
              <div className="flex-1 space-y-2">
                {visibleAreas.map((area, i) => (
                  <div key={i} className="rounded-lg border p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold">{area.label}</span>
                      <span className="text-[10px] text-muted-foreground">0 Click</span>
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <Label className="text-xs shrink-0 w-12">Action</Label>
                        <Select value={area.actionType} onValueChange={(v) => {
                          const updated = [...areas];
                          updated[i] = { ...updated[i], actionType: v ?? "message" };
                          setAreas(updated);
                        }}>
                          <SelectTrigger className="h-7 text-xs w-28"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="message">Message</SelectItem>
                            <SelectItem value="uri">URL</SelectItem>
                            <SelectItem value="postback">Postback</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <p className="text-[10px] text-muted-foreground">
                        {area.actionType === "uri" ? "When the user presses, will open the URL of the link." :
                          area.actionType === "postback" ? "When the user presses, will send postback data." :
                            "When the user presses, will send a text message."}
                      </p>
                      <Input
                        className="h-8 text-xs"
                        value={area.value}
                        onChange={(e) => {
                          const updated = [...areas];
                          updated[i] = { ...updated[i], value: e.target.value };
                          setAreas(updated);
                        }}
                        placeholder={area.actionType === "uri" ? "https://..." : "ข้อความ/data"}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Save button */}
          <div className="pt-4">
            <Button onClick={handleSave} disabled={saving} className="px-8">
              {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              บันทึก
            </Button>
          </div>
        </div>

        {/* Right: Preview */}
        <div className="hidden lg:block">
          <h3 className="text-sm font-semibold mb-3">ตัวอย่างริชเมนู</h3>
          <div className="rounded-2xl border bg-card overflow-hidden w-full max-w-[320px] shadow-lg">
            {/* Phone header */}
            <div className="bg-muted px-4 py-2 flex items-center gap-2 border-b">
              <span className="text-xs font-medium">Your Account</span>
            </div>

            {/* Image area */}
            <div className="relative">
              {imagePreview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={imagePreview} alt="Rich Menu Preview" className="w-full" />
              ) : (
                <div className={cn(
                  "w-full bg-muted/50",
                  menuSize === "full" ? "aspect-[2500/1686]" : "aspect-[2500/843]"
                )} />
              )}

              {/* Grid overlay */}
              <div className={cn(
                "absolute inset-0 grid",
                menuSize === "full" ? "grid-cols-3 grid-rows-2" : "grid-cols-3 grid-rows-1"
              )}>
                {visibleAreas.map((area, i) => (
                  <div key={i} className="border border-white/30 flex items-center justify-center">
                    <span className="text-white text-lg font-bold drop-shadow-md">{area.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Chat bar */}
            <div className="bg-muted px-4 py-2.5 flex items-center justify-center border-t">
              <span className="text-xs font-medium text-muted-foreground">{chatBarText || "เมนู"} Menu</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
