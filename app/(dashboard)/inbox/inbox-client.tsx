"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { MessageSquare, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/empty-state";
import { cn } from "@/lib/utils";
import { ConversationList } from "./conversation-list";
import type { MainTab, StatusFilter, LabelFilter, ChannelFilter } from "./conversation-list";
import { ChatView } from "./chat-view";
import { createClient } from "@/lib/supabase/client";
import type { Conversation } from "./types";

export default function InboxPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [mainTab, setMainTab] = useState<MainTab>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [labelFilter, setLabelFilter] = useState<LabelFilter>("");
  const [channelFilter, setChannelFilter] = useState<ChannelFilter>("");
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const mainTabRef = useRef(mainTab);
  const statusFilterRef = useRef(statusFilter);
  const labelFilterRef = useRef(labelFilter);
  const channelFilterRef = useRef(channelFilter);
  const searchRef = useRef(search);
  const currentUserIdRef = useRef(currentUserId);

  mainTabRef.current = mainTab;
  statusFilterRef.current = statusFilter;
  labelFilterRef.current = labelFilter;
  channelFilterRef.current = channelFilter;
  searchRef.current = search;
  currentUserIdRef.current = currentUserId;

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      setCurrentUserId(data.user?.id ?? null);
    });
  }, []);

  const fetchConversations = useCallback(
    async (opts: {
      search: string;
      status: StatusFilter;
      label: LabelFilter;
      channel: ChannelFilter;
      tab: MainTab;
      userId: string | null;
    }) => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (opts.status !== "all") params.set("status", opts.status);
        if (opts.label) params.set("label", opts.label);
        if (opts.channel) params.set("platform", opts.channel);
        if (opts.search) params.set("search", opts.search);
        if (opts.tab === "inbox" && opts.userId) params.set("assignedTo", opts.userId);

        const res = await fetch(`/api/conversations?${params}`);
        if (res.ok) {
          const data = await res.json();
          setConversations(data.conversations);
        }
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const refetch = useCallback(() => {
    fetchConversations({
      search: searchRef.current,
      status: statusFilterRef.current,
      label: labelFilterRef.current,
      channel: channelFilterRef.current,
      tab: mainTabRef.current,
      userId: currentUserIdRef.current,
    });
  }, [fetchConversations]);

  useEffect(() => {
    if (currentUserId !== null || mainTab !== "inbox") {
      refetch();
    }
  }, [mainTab, statusFilter, labelFilter, channelFilter, currentUserId, refetch]);

  useEffect(() => {
    const supabase = createClient();

    const channel = supabase
      .channel("inbox-conversations")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "conversations" },
        () => {
          refetch();
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "conversations" },
        (payload) => {
          const updated = payload.new as Record<string, unknown>;
          const id = updated.id as string;
          const status = updated.status as string | undefined;
          const labels = updated.labels as string[] | undefined;
          const assignedTo = updated.assigned_to as string | null | undefined;
          const rawDate = updated.last_message_at as string | null;
          const normalized = rawDate
            ? rawDate.endsWith("Z") || rawDate.includes("+")
              ? rawDate
              : rawDate + "Z"
            : null;
          const lastMessageAt =
            normalized && !isNaN(Date.parse(normalized))
              ? new Date(normalized).toISOString()
              : null;

          setConversations((prev) => {
            const exists = prev.find((c) => c.id === id);
            if (!exists) return prev;
            return prev.map((c) =>
              c.id === id
                ? {
                    ...c,
                    ...(lastMessageAt && { lastMessageAt }),
                    ...(status && { status: status as Conversation["status"] }),
                    ...(labels && { labels }),
                    ...(assignedTo !== undefined && {
                      assignedUser: assignedTo
                        ? c.assignedUser?.id === assignedTo
                          ? c.assignedUser
                          : { id: assignedTo, name: assignedTo, avatarUrl: null }
                        : null,
                    }),
                  }
                : c
            );
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [refetch]);

  function handleSearchChange(value: string) {
    setSearch(value);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => {
      fetchConversations({
        search: value,
        status: statusFilter,
        label: labelFilter,
        channel: channelFilter,
        tab: mainTab,
        userId: currentUserId,
      });
    }, 400);
  }

  function handleConversationUpdate(updated: Partial<Conversation> & { id: string }) {
    setConversations((prev) =>
      prev.map((c) => (c.id === updated.id ? { ...c, ...updated } : c))
    );
  }

  const handleNewMessage = useCallback((conversationId: string) => {
    setConversations((prev) =>
      prev.map((c) =>
        c.id === conversationId ? { ...c, lastMessageAt: new Date().toISOString() } : c
      )
    );
  }, []);

  const selected = conversations.find((c) => c.id === selectedId) ?? null;

  return (
    <div className="flex h-full overflow-hidden">
      {/* Conversation list - full width on mobile when no conversation selected, fixed width on desktop */}
      <div className={cn(
        "shrink-0 lg:block",
        selected ? "hidden lg:block" : "w-full lg:w-auto"
      )}>
        <ConversationList
          conversations={conversations}
          selectedId={selectedId}
          loading={loading}
          mainTab={mainTab}
          statusFilter={statusFilter}
          labelFilter={labelFilter}
          channelFilter={channelFilter}
          search={search}
          currentUserId={currentUserId}
          onSelectConversation={(id) => {
            setSelectedId(id);
            setConversations((prev) =>
              prev.map((c) => (c.id === id ? { ...c, unreadCount: 0 } : c))
            );
          }}
          onMainTabChange={setMainTab}
          onStatusFilterChange={setStatusFilter}
          onLabelFilterChange={setLabelFilter}
          onChannelFilterChange={setChannelFilter}
          onSearchChange={handleSearchChange}
          onRefresh={refetch}
        />
      </div>
      {/* Chat area - full width on mobile when conversation selected */}
      <div className={cn(
        "flex-1 overflow-hidden",
        selected ? "block" : "hidden lg:block"
      )}>
        {selected ? (
          <div className="flex h-full flex-col">
            {/* Mobile back button */}
            <div className="flex items-center gap-2 border-b px-3 py-2 lg:hidden">
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setSelectedId(null)}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm font-medium truncate">
                {selected.contact.displayName ?? selected.contact.platformId}
              </span>
            </div>
            <div className="flex-1 overflow-hidden">
              <ChatView
                key={selected.id}
                conversation={selected}
                onConversationUpdate={handleConversationUpdate}
                onNewMessage={handleNewMessage}
              />
            </div>
          </div>
        ) : (
          <div className="flex h-full items-center justify-center">
            <EmptyState
              icon={MessageSquare}
              message="เลือกการสนทนาเพื่อเริ่มแชท"
              description="คลิกที่การสนทนาทางซ้ายเพื่อเปิดแชท"
              className="border-0"
            />
          </div>
        )}
      </div>
    </div>
  );
}
