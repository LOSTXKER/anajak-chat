"use client";

import { useEffect, useState } from "react";
import {
  Facebook,
  Instagram,
  MessageSquare,
  MessageCircle,
  Plus,
  Trash2,
  CheckCircle,
  XCircle,
  Loader2,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface Channel {
  id: string;
  platform: "facebook" | "instagram" | "line" | "whatsapp" | "web" | "manual";
  name: string;
  isActive: boolean;
  createdAt: string;
}

const PLATFORM_META = {
  facebook: {
    label: "Facebook Messenger",
    icon: Facebook,
    color: "text-muted-foreground",
    bg: "bg-muted",
    border: "border-border",
    description: "รับข้อความจาก Facebook Page ของคุณ",
  },
  instagram: {
    label: "Instagram DM",
    icon: Instagram,
    color: "text-muted-foreground",
    bg: "bg-muted",
    border: "border-border",
    description: "รับ Direct Messages จาก Instagram Business Account",
  },
  line: {
    label: "LINE Official Account",
    icon: MessageSquare,
    color: "text-muted-foreground",
    bg: "bg-muted",
    border: "border-border",
    description: "รับข้อความจาก LINE OA ด้วย Channel Access Token",
  },
  whatsapp: {
    label: "WhatsApp",
    icon: MessageCircle,
    color: "text-muted-foreground",
    bg: "bg-muted",
    border: "border-border",
    description: "รับข้อความ WhatsApp ผ่าน WhatsApp Business API",
  },
};

const AVAILABLE_PLATFORMS = ["facebook", "instagram", "line"] as const;
type ConnectablePlatform = typeof AVAILABLE_PLATFORMS[number];

export default function ChannelsPage() {
  const { toast } = useToast();
  const [channels, setChannels] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // LINE connect dialog
  const [lineDialogOpen, setLineDialogOpen] = useState(false);
  const [lineForm, setLineForm] = useState({
    channelId: "",
    channelSecret: "",
    channelAccessToken: "",
    name: "",
  });
  const [lineConnecting, setLineConnecting] = useState(false);

  // OAuth redirect loading
  const [oauthLoading, setOauthLoading] = useState<ConnectablePlatform | null>(null);

  useEffect(() => {
    fetchChannels();
    // Handle success/error from OAuth redirect
    const params = new URLSearchParams(window.location.search);
    const success = params.get("success");
    const error = params.get("error");
    if (success) {
      toast({ title: "เชื่อมต่อสำเร็จ", description: getSuccessMessage(success) });
      window.history.replaceState({}, "", "/settings/channels");
    }
    if (error) {
      toast({
        title: "เชื่อมต่อไม่สำเร็จ",
        description: getErrorMessage(error),
        variant: "destructive",
      });
      window.history.replaceState({}, "", "/settings/channels");
    }
  }, [toast]);

  function getSuccessMessage(key: string) {
    const map: Record<string, string> = {
      facebook_connected: "Facebook Page เชื่อมต่อสำเร็จแล้ว",
      instagram_connected: "Instagram Account เชื่อมต่อสำเร็จแล้ว",
    };
    return map[key] ?? "เชื่อมต่อสำเร็จ";
  }

  function getErrorMessage(key: string) {
    const map: Record<string, string> = {
      oauth_failed: "OAuth ล้มเหลว กรุณาลองใหม่",
      token_exchange_failed: "ไม่สามารถแลก token ได้",
      no_pages: "ไม่พบ Facebook Pages ในบัญชีนี้",
      no_instagram_account: "ไม่พบ Instagram Business Account ที่เชื่อมกับ Page นี้",
      pages_fetch_failed: "ดึงข้อมูล Pages ไม่สำเร็จ",
      page_already_connected: "เพจนี้ถูกเชื่อมต่อโดยบัญชีอื่นแล้ว",
    };
    return map[key] ?? "เกิดข้อผิดพลาด กรุณาลองใหม่";
  }

  async function fetchChannels() {
    setLoading(true);
    try {
      const res = await fetch("/api/channels");
      if (res.ok) {
        const data = await res.json();
        setChannels(data);
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleOAuthConnect(platform: ConnectablePlatform) {
    if (platform === "line") {
      setLineDialogOpen(true);
      return;
    }
    setOauthLoading(platform);
    try {
      const res = await fetch(`/api/channels/${platform}/connect`);
      if (res.ok) {
        const { url } = await res.json();
        window.location.href = url;
      } else {
        const data = await res.json();
        toast({ title: "เกิดข้อผิดพลาด", description: data.error, variant: "destructive" });
        setOauthLoading(null);
      }
    } catch {
      toast({ title: "เกิดข้อผิดพลาด", description: "เชื่อมต่อไม่สำเร็จ", variant: "destructive" });
      setOauthLoading(null);
    }
  }

  async function handleLineConnect() {
    setLineConnecting(true);
    try {
      const res = await fetch("/api/channels/line/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(lineForm),
      });
      const data = await res.json();
      if (res.ok) {
        toast({ title: "สำเร็จ", description: `เชื่อมต่อ LINE OA "${data.name}" สำเร็จแล้ว` });
        setLineDialogOpen(false);
        setLineForm({ channelId: "", channelSecret: "", channelAccessToken: "", name: "" });
        fetchChannels();
      } else {
        toast({ title: "เกิดข้อผิดพลาด", description: data.error, variant: "destructive" });
      }
    } finally {
      setLineConnecting(false);
    }
  }

  async function handleDisconnect(channel: Channel) {
    if (!confirm(`ยืนยันการยกเลิกการเชื่อมต่อ "${channel.name}"?`)) return;
    setDeletingId(channel.id);
    try {
      const res = await fetch(`/api/channels/${channel.id}`, { method: "DELETE" });
      if (res.ok) {
        toast({ title: "ยกเลิกการเชื่อมต่อแล้ว" });
        setChannels((prev) => prev.filter((c) => c.id !== channel.id));
      } else {
        const data = await res.json();
        toast({ title: "เกิดข้อผิดพลาด", description: data.error, variant: "destructive" });
      }
    } finally {
      setDeletingId(null);
    }
  }

  const connectedPlatforms = new Set(channels.map((c) => c.platform));

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">ช่องทาง</h1>
        <p className="text-sm text-muted-foreground">
          เชื่อมต่อช่องทางแชทเพื่อรับข้อความทั้งหมดในที่เดียว
        </p>
      </div>

      {/* Connected channels */}
      {channels.length > 0 && (
        <div className="mb-8">
          <h2 className="mb-3 text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            เชื่อมต่อแล้ว
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {channels.map((channel) => {
              const meta = PLATFORM_META[channel.platform as keyof typeof PLATFORM_META];
              if (!meta) return null;
              const Icon = meta.icon;
              return (
                <Card key={channel.id} className="rounded-xl border bg-card hover:shadow-md transition-all duration-200">
                  <CardHeader className="pb-2">
                    <div className="flex items-center gap-3">
                      <div className={`rounded-xl p-2.5 ${meta.bg}`}>
                        <Icon className={`h-5 w-5 ${meta.color}`} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <CardTitle className="text-sm truncate">{channel.name}</CardTitle>
                        <CardDescription className="text-xs">{meta.label}</CardDescription>
                      </div>
                      <span className="bg-emerald-50 text-emerald-700 rounded-full px-2.5 py-0.5 text-xs font-medium flex items-center gap-1 shrink-0">
                        <CheckCircle className="h-3 w-3" />
                        เชื่อมต่อแล้ว
                      </span>
                    </div>
                  </CardHeader>
                  <CardFooter className="pt-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive hover:bg-destructive/10 ml-auto"
                      onClick={() => handleDisconnect(channel)}
                      disabled={deletingId === channel.id}
                    >
                      {deletingId === channel.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4 mr-1" />
                      )}
                      ยกเลิกการเชื่อมต่อ
                    </Button>
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Available platforms */}
      <div>
        <h2 className="mb-3 text-sm font-semibold text-muted-foreground uppercase tracking-wider">
          เพิ่มช่องทาง
        </h2>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {AVAILABLE_PLATFORMS.map((platform) => {
              const meta = PLATFORM_META[platform];
              const Icon = meta.icon;
              const isConnected = connectedPlatforms.has(platform);
              const isLoading = oauthLoading === platform;

              return (
                <Card key={platform} className={cn("rounded-xl border bg-card hover:shadow-md transition-all duration-200", isConnected && "opacity-60")}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center gap-3">
                      <div className={`rounded-xl p-2.5 ${meta.bg}`}>
                        <Icon className={`h-5 w-5 ${meta.color}`} />
                      </div>
                      <div>
                        <CardTitle className="text-sm">{meta.label}</CardTitle>
                        {isConnected && (
                          <span className="mt-1 inline-flex items-center bg-emerald-50 text-emerald-700 rounded-full px-2 py-0.5 text-xs font-medium dark:bg-emerald-950 dark:text-emerald-400">
                            <CheckCircle className="mr-1 h-3 w-3" />
                            เชื่อมต่อแล้ว
                          </span>
                        )}
                      </div>
                    </div>
                    <CardDescription className="text-xs mt-2">
                      {meta.description}
                    </CardDescription>
                  </CardHeader>
                  <CardFooter>
                    <Button
                      size="sm"
                      variant="outline"
                      className={cn("w-full", !isConnected && "border text-foreground")}
                      disabled={isConnected || isLoading}
                      onClick={() => handleOAuthConnect(platform)}
                    >
                      {isLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : isConnected ? (
                        <CheckCircle className="h-4 w-4 mr-2" />
                      ) : platform === "line" ? (
                        <Plus className="h-4 w-4 mr-2" />
                      ) : (
                        <ExternalLink className="h-4 w-4 mr-2" />
                      )}
                      {isConnected ? "เชื่อมต่อแล้ว" : platform === "line" ? "ใส่ Token" : "เชื่อมต่อ"}
                    </Button>
                  </CardFooter>
                </Card>
              );
            })}

            {/* WhatsApp - coming soon */}
            <Card className="rounded-xl border bg-card opacity-50">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-3">
                  <div className={`rounded-xl p-2.5 ${PLATFORM_META.whatsapp.bg}`}>
                    <MessageCircle className={`h-5 w-5 ${PLATFORM_META.whatsapp.color}`} />
                  </div>
                  <div>
                    <CardTitle className="text-sm">{PLATFORM_META.whatsapp.label}</CardTitle>
                    <span className="mt-1 inline-flex bg-gray-100 text-gray-600 rounded-full px-2 py-0.5 text-xs font-medium dark:bg-gray-800 dark:text-gray-400">เร็วๆ นี้</span>
                  </div>
                </div>
                <CardDescription className="text-xs mt-2">
                  {PLATFORM_META.whatsapp.description}
                </CardDescription>
              </CardHeader>
              <CardFooter>
                <Button size="sm" variant="outline" className="w-full" disabled>
                  <XCircle className="h-4 w-4 mr-2" />
                  ยังไม่พร้อมใช้งาน
                </Button>
              </CardFooter>
            </Card>
          </div>
        )}
      </div>

      {/* LINE Connect Dialog */}
      <Dialog open={lineDialogOpen} onOpenChange={setLineDialogOpen}>
        <DialogContent className="sm:max-w-md rounded-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-green-600" />
              เชื่อมต่อ LINE Official Account
            </DialogTitle>
            <DialogDescription>
              กรุณากรอก Channel ID, Channel Secret และ Channel Access Token จาก LINE Developers Console
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="line-name">ชื่อ Channel (ไม่บังคับ)</Label>
              <Input
                id="line-name"
              className="rounded-lg"
              placeholder="เช่น LINE OA ร้านค้า"
                value={lineForm.name}
                onChange={(e) => setLineForm((f) => ({ ...f, name: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="line-channel-id">Channel ID</Label>
              <Input
                id="line-channel-id"
                className="rounded-lg"
                placeholder="1234567890"
                value={lineForm.channelId}
                onChange={(e) => setLineForm((f) => ({ ...f, channelId: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="line-channel-secret">Channel Secret</Label>
              <Input
                id="line-channel-secret"
                className="rounded-lg"
                type="password"
                placeholder="xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                value={lineForm.channelSecret}
                onChange={(e) => setLineForm((f) => ({ ...f, channelSecret: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="line-access-token">Channel Access Token</Label>
              <Input
                id="line-access-token"
                className="rounded-lg"
                type="password"
                placeholder="Channel Access Token จาก LINE Developers"
                value={lineForm.channelAccessToken}
                onChange={(e) => setLineForm((f) => ({ ...f, channelAccessToken: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLineDialogOpen(false)}>
              ยกเลิก
            </Button>
            <Button
              onClick={handleLineConnect}
              disabled={
                lineConnecting ||
                !lineForm.channelId ||
                !lineForm.channelSecret ||
                !lineForm.channelAccessToken
              }
            >
              {lineConnecting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              เชื่อมต่อ
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
