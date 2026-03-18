"use client";

import { useEffect, useState } from "react";
import {
  LayoutGrid,
  Plus,
  Trash2,
  Loader2,
  Upload,
  Check,
  X,
  Star,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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

export default function LineRichMenuPage() {
  const { toast } = useToast();
  const [menus, setMenus] = useState<RichMenu[]>([]);
  const [defaultId, setDefaultId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [applyingId, setApplyingId] = useState<string | null>(null);

  // Create form
  const [menuName, setMenuName] = useState("Main Menu");
  const [chatBarText, setChatBarText] = useState("เมนู");
  const [image, setImage] = useState<File | null>(null);
  const [menuSize, setMenuSize] = useState<"full" | "half">("full");
  const [areas, setAreas] = useState<Array<{
    actionType: string;
    label: string;
    value: string;
  }>>([
    { actionType: "message", label: "สินค้า", value: "สินค้า" },
    { actionType: "message", label: "โปรโมชั่น", value: "โปรโมชั่น" },
    { actionType: "message", label: "ติดต่อเรา", value: "ติดต่อเรา" },
  ]);

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

  async function handleCreate() {
    if (!image) { toast({ title: "กรุณาเลือกรูปภาพ", variant: "destructive" }); return; }
    if (areas.length === 0) { toast({ title: "เพิ่มปุ่มอย่างน้อย 1 ปุ่ม", variant: "destructive" }); return; }

    setCreating(true);
    const height = menuSize === "full" ? 1686 : 843;
    const cols = Math.min(areas.length, 3);
    const rows = Math.ceil(areas.length / cols);
    const cellW = Math.floor(2500 / cols);
    const cellH = Math.floor(height / rows);

    const richMenuAreas: RichMenuArea[] = areas.map((area, i) => {
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

    const menu = {
      size: { width: 2500 as const, height: height as 1686 | 843 },
      selected: false,
      name: menuName,
      chatBarText,
      areas: richMenuAreas,
    };

    const formData = new FormData();
    formData.append("menu", JSON.stringify(menu));
    formData.append("image", image);

    try {
      const res = await fetch("/api/channels/line/rich-menu", {
        method: "POST",
        body: formData,
      });
      if (res.ok) {
        toast({ title: "สร้าง Rich Menu สำเร็จ" });
        setDialogOpen(false);
        fetchMenus();
      } else {
        const data = await res.json();
        toast({ title: "สร้างไม่สำเร็จ", description: (data as { error?: string }).error, variant: "destructive" });
      }
    } finally {
      setCreating(false);
    }
  }

  async function handleApply(richMenuId: string) {
    setApplyingId(richMenuId);
    try {
      const res = await fetch("/api/channels/line/rich-menu/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ richMenuId }),
      });
      if (res.ok) {
        setDefaultId(richMenuId);
        toast({ title: "ตั้งเป็นเมนูเริ่มต้นแล้ว" });
      }
    } finally {
      setApplyingId(null);
    }
  }

  async function handleRemoveDefault() {
    setApplyingId("remove");
    try {
      const res = await fetch("/api/channels/line/rich-menu/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ remove: true }),
      });
      if (res.ok) {
        setDefaultId(null);
        toast({ title: "ยกเลิกเมนูเริ่มต้นแล้ว" });
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

  function addArea() {
    if (areas.length >= 6) { toast({ title: "สูงสุด 6 ปุ่ม", variant: "destructive" }); return; }
    setAreas([...areas, { actionType: "message", label: "", value: "" }]);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">LINE Rich Menu</h1>
          <p className="text-sm text-muted-foreground">จัดการเมนูด้านล่างของ LINE OA</p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          สร้าง Rich Menu
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : menus.length === 0 ? (
        <div className="flex flex-col items-center py-16 text-center">
          <LayoutGrid className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground mb-4">ยังไม่มี Rich Menu</p>
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            สร้าง Rich Menu แรก
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {menus.map((menu) => {
            const isDefault = menu.richMenuId === defaultId;
            return (
              <Card key={menu.richMenuId} className="rounded-xl">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm flex items-center gap-2">
                      {menu.name}
                      {isDefault && (
                        <Badge className="text-[10px]">
                          <Star className="h-3 w-3 mr-0.5" />
                          เมนูเริ่มต้น
                        </Badge>
                      )}
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  <p className="text-xs text-muted-foreground">ข้อความในแถบ: {menu.chatBarText}</p>
                  <p className="text-xs text-muted-foreground">{menu.areas.length} ปุ่ม</p>
                  <div className="flex gap-2">
                    {!isDefault ? (
                      <Button variant="outline" size="sm" className="text-xs flex-1" onClick={() => handleApply(menu.richMenuId)} disabled={applyingId === menu.richMenuId}>
                        {applyingId === menu.richMenuId ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : <Check className="h-3.5 w-3.5 mr-1" />}
                        ตั้งเป็นเริ่มต้น
                      </Button>
                    ) : (
                      <Button variant="outline" size="sm" className="text-xs flex-1" onClick={handleRemoveDefault} disabled={applyingId === "remove"}>
                        <X className="h-3.5 w-3.5 mr-1" />
                        ยกเลิกเริ่มต้น
                      </Button>
                    )}
                    <Button variant="ghost" size="sm" className="text-xs text-destructive" onClick={() => handleDelete(menu.richMenuId)} disabled={deletingId === menu.richMenuId}>
                      {deletingId === menu.richMenuId ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <LayoutGrid className="h-5 w-5" />
              สร้าง Rich Menu
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>ชื่อ</Label>
              <Input value={menuName} onChange={(e) => setMenuName(e.target.value)} placeholder="Main Menu" />
            </div>

            <div className="space-y-1.5">
              <Label>ข้อความในแถบ Chat Bar</Label>
              <Input value={chatBarText} onChange={(e) => setChatBarText(e.target.value)} placeholder="เมนู" />
            </div>

            <div className="space-y-1.5">
              <Label>ขนาด</Label>
              <Select value={menuSize} onValueChange={(v) => setMenuSize(v as "full" | "half")}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="full">เต็ม (2500x1686)</SelectItem>
                  <SelectItem value="half">ครึ่ง (2500x843)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>รูปภาพ Rich Menu (2500x{menuSize === "full" ? "1686" : "843"} px, JPEG/PNG)</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="file"
                  accept="image/jpeg,image/png"
                  onChange={(e) => setImage(e.target.files?.[0] ?? null)}
                  className="text-sm"
                />
                {image && <Badge variant="outline" className="text-xs shrink-0"><Upload className="h-3 w-3 mr-1" />{image.name}</Badge>}
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>ปุ่ม (สูงสุด 6 ปุ่ม — จัดเรียงอัตโนมัติ)</Label>
                <Button variant="outline" size="sm" onClick={addArea} disabled={areas.length >= 6}>
                  <Plus className="h-3.5 w-3.5 mr-1" />
                  เพิ่ม
                </Button>
              </div>
              {areas.map((area, i) => (
                <div key={i} className="flex gap-1.5 items-center">
                  <span className="text-xs text-muted-foreground w-4 shrink-0">{i + 1}</span>
                  <Select value={area.actionType} onValueChange={(v) => {
                    const updated = [...areas];
                    updated[i] = { ...updated[i], actionType: v ?? "message" };
                    setAreas(updated);
                  }}>
                    <SelectTrigger className="h-8 text-xs w-24"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="message">ข้อความ</SelectItem>
                      <SelectItem value="uri">URL</SelectItem>
                      <SelectItem value="postback">Postback</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input className="h-8 text-xs flex-1" placeholder="ชื่อปุ่ม" value={area.label} onChange={(e) => {
                    const updated = [...areas];
                    updated[i] = { ...updated[i], label: e.target.value };
                    setAreas(updated);
                  }} />
                  <Input className="h-8 text-xs flex-1" placeholder={area.actionType === "uri" ? "https://..." : "ข้อความ/data"} value={area.value} onChange={(e) => {
                    const updated = [...areas];
                    updated[i] = { ...updated[i], value: e.target.value };
                    setAreas(updated);
                  }} />
                  <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={() => setAreas(areas.filter((_, j) => j !== i))} disabled={areas.length <= 1}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>ยกเลิก</Button>
            <Button onClick={handleCreate} disabled={creating}>
              {creating && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              สร้าง
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
