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
  SlidersHorizontal,
  Inbox,
  MessagesSquare,
} from "lucide-react";
import { SkeletonConversation } from "@/components/skeleton";
import { EmptyState } from "@/components/empty-state";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { FilterDropdown } from "@/components/ui/filter-dropdown";
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

export type MainTab = "all" | "inbox";
export type StatusFilter = "all" | "pending" | "open" | "resolved" | "closed";
export type LabelFilter = "" | "missed" | "follow_up" | "spam" | "blocked";
export type ChannelFilter = "" | "facebook" | "instagram" | "line" | "whatsapp" | "web";

const STATUS_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "สถานะทั้งหมด" },
  { value: "pending", label: "รอรับ" },
  { value: "open", label: "กำลังดูแล" },
  { value: "resolved", label: "เสร็จสิ้น" },
  { value: "closed", label: "ปิด" },
];

const LABEL_OPTIONS: { value: LabelFilter; label: string }[] = [
  { value: "", label: "ป้ายทั้งหมด" },
  { value: "missed", label: "ไม่ได้รับ" },
  { value: "follow_up", label: "ติดตาม" },
  { value: "spam", label: "สแปม" },
  { value: "blocked", label: "บล็อก" },
];

const CHANNEL_OPTIONS: { value: ChannelFilter; label: string }[] = [
  { value: "", label: "ช่องทั้งหมด" },
  { value: "facebook", label: "Facebook" },
  { value: "instagram", label: "Instagram" },
  { value: "line", label: "LINE" },
  { value: "whatsapp", label: "WhatsApp" },
  { value: "web", label: "Web" },
];


interface ConversationListProps {
  conversations: Conversation[];
  selectedId: string | null;
  loading: boolean;
  mainTab: MainTab;
  statusFilter: StatusFilter;
  labelFilter: LabelFilter;
  channelFilter: ChannelFilter;
  search: string;
  currentUserId: string | null;
  onSelectConversation: (id: string) => void;
  onMainTabChange: (tab: MainTab) => void;
  onStatusFilterChange: (status: StatusFilter) => void;
  onLabelFilterChange: (label: LabelFilter) => void;
  onChannelFilterChange: (channel: ChannelFilter) => void;
  onSearchChange: (value: string) => void;
  onRefresh: () => void;
}


export function ConversationList({
  conversations,
  selectedId,
  loading,
  mainTab,
  statusFilter,
  labelFilter,
  channelFilter,
  search,
  currentUserId,
  onSelectConversation,
  onMainTabChange,
  onStatusFilterChange,
  onLabelFilterChange,
  onChannelFilterChange,
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

  const inboxCount = conversations.filter(
    (c) => c.assignedUser?.id === currentUserId
  ).length;

  const hasActiveFilter = statusFilter !== "all" || labelFilter !== "" || channelFilter !== "";

  return (
    <div className="flex w-full lg:w-72 shrink-0 flex-col border-r">
      {/* Main tabs */}
      <div className="flex border-b" role="tablist">
        <button
          role="tab"
          aria-selected={mainTab === "all"}
          onClick={() => onMainTabChange("all")}
          className={cn(
            "flex flex-1 items-center justify-center gap-1.5 py-2.5 text-sm font-medium transition-colors",
            mainTab === "all"
              ? "border-b-2 border-accent text-foreground"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <MessagesSquare className="h-4 w-4" />
          แชททั้งหมด
        </button>
        <button
          role="tab"
          aria-selected={mainTab === "inbox"}
          onClick={() => onMainTabChange("inbox")}
          className={cn(
            "flex flex-1 items-center justify-center gap-1.5 py-2.5 text-sm font-medium transition-colors relative",
            mainTab === "inbox"
              ? "border-b-2 border-accent text-foreground"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Inbox className="h-4 w-4" />
          อินบ็อกซ์
          {inboxCount > 0 && (
            <span className="inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[10px] font-bold text-accent-foreground">
              {inboxCount}
            </span>
          )}
        </button>
      </div>

      {/* Search + Filters */}
      <div className="border-b p-3 space-y-2">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="h-8 pl-8 text-sm"
              placeholder="ค้นหา..."
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
            />
          </div>
          <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={onRefresh} aria-label="รีเฟรช">
            <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
          </Button>
        </div>

        <div className="flex items-center gap-1 flex-wrap">
          <SlidersHorizontal className="h-3 w-3 text-muted-foreground shrink-0" />
          <FilterDropdown
            value={statusFilter}
            options={STATUS_OPTIONS}
            onChange={onStatusFilterChange}
          />
          <FilterDropdown
            value={channelFilter}
            options={CHANNEL_OPTIONS}
            onChange={onChannelFilterChange}
          />
          <FilterDropdown
            value={labelFilter}
            options={LABEL_OPTIONS}
            onChange={onLabelFilterChange}
          />
          {hasActiveFilter && (
            <button
              onClick={() => {
                onStatusFilterChange("all");
                onLabelFilterChange("");
                onChannelFilterChange("");
              }}
              className="text-[10px] text-muted-foreground hover:text-foreground ml-auto"
            >
              ล้าง
            </button>
          )}
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
          <EmptyState
            icon={MessageSquare}
            message={mainTab === "inbox" ? "ไม่มีแชทในอินบ็อกซ์" : "ไม่มีการสนทนา"}
            className="border-0 py-12"
          />
        ) : (
          <div className="flex flex-col gap-1">
            {conversations.map((conv) => {
              const PlatformIcon =
                PLATFORM_ICONS[conv.channel.platform as keyof typeof PLATFORM_ICONS] ??
                MessageCircle;
              const platformColor =
                PLATFORM_COLORS[conv.channel.platform as keyof typeof PLATFORM_COLORS] ??
                "text-muted-foreground";
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
                    "w-full rounded-lg p-2.5 text-left transition-colors",
                    isSelected
                      ? "bg-accent/10"
                      : "hover:bg-muted/30"
                  )}
                >
                  <div className="flex gap-2.5">
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
                          <span className="ml-auto shrink-0 text-[11px] text-muted-foreground">
                            {formatDistanceToNow(new Date(conv.lastMessageAt), {
                              addSuffix: false,
                              locale: th,
                            })}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5 mt-0.5">
                        <p className={cn("truncate text-xs flex-1", unread > 0 ? "text-foreground" : "text-muted-foreground")}>{preview}</p>
                        {unread > 0 && (
                          <span className="h-2 w-2 shrink-0 rounded-full bg-accent" />
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
