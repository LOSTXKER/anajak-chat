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

const PLATFORM_BADGE_STYLES: Record<string, string> = {
  line: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",
  facebook: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",
  instagram: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",
  whatsapp: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",
  web: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",
  manual: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",
};

type StatusFilter = "all" | "pending" | "open" | "expired" | "follow_up" | "resolved";

const STATUS_TABS: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "ทั้งหมด" },
  { value: "pending", label: "รอรับ" },
  { value: "open", label: "กำลังดูแล" },
  { value: "expired", label: "หมดอายุ" },
  { value: "follow_up", label: "ติดตาม" },
  { value: "resolved", label: "เสร็จสิ้น" },
];

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-500",
  open: "bg-green-500",
  expired: "bg-red-500",
  resolved: "bg-gray-400",
  follow_up: "bg-blue-500",
  missed: "bg-orange-500",
  spam: "bg-zinc-500",
  blocked: "bg-zinc-800",
  closed: "bg-gray-300",
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
              const platformBadge =
                PLATFORM_BADGE_STYLES[conv.channel.platform] ?? PLATFORM_BADGE_STYLES.web;
              const displayName = conv.contact.displayName ?? conv.contact.platformId;
              const initial = displayName.charAt(0).toUpperCase();
              const preview = getPreview(conv);
              const isSelected = conv.id === selectedId;
              const unread = conv.unreadCount ?? 0;

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
                    {/* Avatar with platform badge */}
                    <div className="relative shrink-0">
                      <Avatar className="h-9 w-9">
                        <AvatarImage src={conv.contact.avatarUrl ?? undefined} />
                        <AvatarFallback className="text-sm">{initial}</AvatarFallback>
                      </Avatar>
                      <div
                        className={cn(
                          "absolute -bottom-0.5 -right-0.5 rounded-full bg-background p-0.5"
                        )}
                      >
                        <PlatformIcon className={cn("h-3 w-3", platformColor)} />
                      </div>
                    </div>

                    {/* Content */}
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

                      <div className="mt-1 flex items-center gap-1.5">
                        <span
                          className={cn(
                            "h-1.5 w-1.5 rounded-full",
                            STATUS_COLORS[conv.status] ?? "bg-gray-400"
                          )}
                        />
                        <Badge
                          className={cn(
                            "h-4 rounded-full px-1.5 py-0 text-[10px] font-medium border-0",
                            platformBadge
                          )}
                        >
                          {conv.channel.platform}
                        </Badge>
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
                        {conv.contact.tags.slice(0, 2).map((tag) => (
                          <Badge
                            key={tag}
                            variant="secondary"
                            className="h-4 px-1 py-0 text-[10px]"
                          >
                            {tag}
                          </Badge>
                        ))}
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
