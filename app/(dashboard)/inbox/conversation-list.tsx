"use client";

import { useCallback } from "react";
import { formatDistanceToNow } from "date-fns";
import { th } from "date-fns/locale";
import {
  Facebook,
  Instagram,
  MessageSquare,
  MessageCircle,
  Search,
  RefreshCw,
} from "lucide-react";
import { SkeletonConversation } from "@/components/skeleton";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { Conversation } from "./types";

const PLATFORM_ICONS = {
  facebook: Facebook,
  instagram: Instagram,
  line: MessageSquare,
  whatsapp: MessageCircle,
  web: MessageCircle,
  manual: MessageCircle,
};

const PLATFORM_COLORS = {
  facebook: "text-muted-foreground",
  instagram: "text-muted-foreground",
  line: "text-muted-foreground",
  whatsapp: "text-muted-foreground",
  web: "text-muted-foreground",
  manual: "text-muted-foreground",
};

export type StatusFilter = "all" | "pending" | "open" | "resolved";

const STATUS_TABS: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "ทั้งหมด" },
  { value: "pending", label: "รอรับ" },
  { value: "open", label: "กำลังดูแล" },
  { value: "resolved", label: "เสร็จสิ้น" },
];

const STATUS_BADGE: Record<string, { label: string; className: string }> = {
  pending: { label: "รอรับ", className: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300" },
  open: { label: "กำลังดูแล", className: "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300" },
  resolved: { label: "เสร็จสิ้น", className: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400" },
  closed: { label: "ปิด", className: "bg-zinc-200 text-zinc-700 dark:bg-zinc-700 dark:text-zinc-300" },
};

const LABEL_BADGE: Record<string, { label: string; className: string }> = {
  missed: { label: "ไม่ได้รับ", className: "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300" },
  follow_up: { label: "ติดตาม", className: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300" },
  spam: { label: "สแปม", className: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300" },
  blocked: { label: "บล็อก", className: "bg-zinc-300 text-zinc-900 dark:bg-zinc-600 dark:text-zinc-100" },
};

interface ConversationListProps {
  conversations: Conversation[];
  selectedId: string | null;
  loading: boolean;
  statusFilter: StatusFilter;
  search: string;
  currentUserId: string | null;
  onSelectConversation: (id: string) => void;
  onStatusFilterChange: (status: StatusFilter) => void;
  onSearchChange: (value: string) => void;
  onRefresh: () => void;
}

export function ConversationList({
  conversations,
  selectedId,
  loading,
  statusFilter,
  search,
  currentUserId,
  onSelectConversation,
  onStatusFilterChange,
  onSearchChange,
  onRefresh,
}: ConversationListProps) {
  const getPreview = useCallback((conv: Conversation) => {
    const last = conv.messages[0];
    if (!last) return "ไม่มีข้อความ";
    if (last.contentType === "image") return "📷 รูปภาพ";
    if (last.contentType === "file") return "📎 ไฟล์";
    if (last.contentType === "sticker") return "😊 สติกเกอร์";
    return last.content ?? "";
  }, []);

  return (
    <div className="flex w-72 shrink-0 flex-col border-r bg-background">
      {/* Header */}
      <div className="border-b p-3">
        <div className="mb-2 flex items-center justify-between">
          <h1 className="font-semibold">กล่องข้อความ</h1>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onRefresh}>
            <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
          </Button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="h-8 pl-8 text-sm"
            placeholder="ค้นหาการสนทนา..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>

        {/* Status tabs */}
        <div className="mt-2 flex gap-1 overflow-x-auto">
          {STATUS_TABS.map((tab) => {
            const count = tab.value === "all"
              ? conversations.length
              : conversations.filter((c) => c.status === tab.value).length;
            return (
              <button
                key={tab.value}
                onClick={() => onStatusFilterChange(tab.value)}
                className={cn(
                  "shrink-0 px-1.5 py-1 text-xs transition-colors flex items-center gap-1",
                  statusFilter === tab.value
                    ? "border-b-2 border-foreground text-foreground font-medium"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {tab.label}
                {count > 0 && (
                  <span className={cn(
                    "inline-flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-medium",
                    statusFilter === tab.value
                      ? "bg-foreground text-background"
                      : "bg-muted text-muted-foreground"
                  )}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto p-1.5">
        {loading ? (
          <div className="flex flex-col gap-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <SkeletonConversation key={i} />
            ))}
          </div>
        ) : conversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <MessageSquare className="h-8 w-8 text-muted-foreground/30" />
            <p className="mt-2 text-sm text-muted-foreground">ไม่มีการสนทนา</p>
          </div>
        ) : (
          <div className="flex flex-col gap-1">
            {conversations.map((conv) => {
              const PlatformIcon =
                PLATFORM_ICONS[conv.channel.platform as keyof typeof PLATFORM_ICONS] ??
                MessageCircle;
              const platformColor =
                PLATFORM_COLORS[conv.channel.platform as keyof typeof PLATFORM_COLORS] ??
                "text-gray-600";
              const displayName = conv.contact.displayName ?? conv.contact.platformId;
              const initial = displayName.charAt(0).toUpperCase();
              const preview = getPreview(conv);
              const isSelected = conv.id === selectedId;
              const unread = conv.unreadCount ?? 0;
              const statusInfo = STATUS_BADGE[conv.status] ?? STATUS_BADGE.closed;
              const convLabels = (conv.labels ?? [])
                .map((l) => LABEL_BADGE[l])
                .filter(Boolean);

              return (
                <button
                  key={conv.id}
                  onClick={() => onSelectConversation(conv.id)}
                  className={cn(
                    "w-full rounded-lg p-3 text-left transition-colors",
                    isSelected
                      ? "bg-muted/50"
                      : "hover:bg-muted/30"
                  )}
                >
                  <div className="flex gap-3">
                    <div className="relative shrink-0">
                      <Avatar className="h-9 w-9">
                        <AvatarImage src={conv.contact.avatarUrl ?? undefined} />
                        <AvatarFallback className="text-sm">{initial}</AvatarFallback>
                      </Avatar>
                      <div className="absolute -bottom-0.5 -right-0.5 rounded-full bg-background p-0.5">
                        <PlatformIcon className={cn("h-3 w-3", platformColor)} />
                      </div>
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className={cn("truncate text-sm", unread > 0 ? "font-semibold text-foreground" : "font-medium")}>{displayName}</span>
                        {conv.lastMessageAt && !isNaN(Date.parse(conv.lastMessageAt)) && (
                          <span className="ml-auto shrink-0 text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(conv.lastMessageAt), {
                              addSuffix: false,
                              locale: th,
                            })}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5">
                        <p className={cn("truncate text-xs flex-1", unread > 0 ? "font-medium text-foreground" : "text-muted-foreground")}>{preview}</p>
                        {unread > 0 && (
                          <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-red-500 px-1.5 text-[10px] font-bold text-white">
                            {unread > 99 ? "99+" : unread}
                          </span>
                        )}
                      </div>

                      <div className="mt-1 flex flex-wrap items-center gap-1">
                        <Badge className={cn("h-4 rounded px-1.5 py-0 text-[10px] font-medium border-0", statusInfo.className)}>
                          {statusInfo.label}
                        </Badge>
                        {convLabels.map((lb) => (
                          <Badge key={lb.label} className={cn("h-4 rounded px-1.5 py-0 text-[10px] font-medium border-0", lb.className)}>
                            {lb.label}
                          </Badge>
                        ))}
                        {conv.assignedUser && (
                          <span className="truncate text-[10px] text-muted-foreground">
                            {conv.assignedUser.id === currentUserId ? "ฉัน" : conv.assignedUser.name}
                          </span>
                        )}
                        {conv.sourceAdId && (
                          <Badge variant="outline" className="h-4 px-1 py-0 text-[10px]">
                            Ad
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
